from __future__ import annotations
import json, logging, threading, uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from app.api.routes import chat, health, ingestion, validation
from app.core.config import settings
from app.core.logging import new_request_id, setup_logging

setup_logging(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)
initial_ingestion_complete = threading.Event()


def _apply_ddl_idempotent() -> None:
    """Create the NOTIFY trigger + ivfflat index idempotently at startup.

    The trigger fires NOTIFY certif_changed with the row id and operation as
    JSON payload whenever a certification is inserted or updated — the
    _listen_for_changes daemon picks this up and re-ingests the affected row.

    Flyway owns the chunk schema and its HNSW index. This routine only keeps
    the change notification trigger aligned with the AI service.
    """
    try:
        import psycopg
        with psycopg.connect(settings.RAG_DB_DSN_WRITE, autocommit=True) as conn:
            # 1) Trigger function — CREATE OR REPLACE so it always reflects latest logic
            conn.execute("""
                CREATE OR REPLACE FUNCTION notify_certif_changed()
                RETURNS trigger LANGUAGE plpgsql AS $$
                BEGIN
                    PERFORM pg_notify(
                        'certif_changed',
                        json_build_object(
                            'id',        NEW.id,
                            'operation', TG_OP
                        )::text
                    );
                    RETURN NEW;
                END;
                $$;
            """)
            # 2) Trigger itself — drop-and-recreate pattern (idempotent)
            conn.execute("""
                DROP TRIGGER IF EXISTS trg_certif_changed ON certifications;
                CREATE TRIGGER trg_certif_changed
                    AFTER INSERT OR UPDATE ON certifications
                    FOR EACH ROW EXECUTE FUNCTION notify_certif_changed();
            """)
            logger.info("[DDL] certif_changed trigger applied.")
    except Exception as exc:
        logger.warning("[DDL] Could not apply idempotent DDL (non-fatal): %s", exc)


def _check_and_seed() -> None:
    _apply_ddl_idempotent()
    try:
        import psycopg
        with psycopg.connect(settings.RAG_DB_DSN) as conn, conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM certification_chunks")
            if cur.fetchone()[0] == 0:
                logger.info("certification_chunks is empty. Seeding...")
                from app.rag_chat.ingestion.seed_chunks import seed_certification_chunks
                seed_certification_chunks()
    except Exception as exc:
        logger.warning("Could not auto-seed on startup: %s", exc)
    finally:
        # Initial ingestion has priority. Only then should INSERT/UPDATE
        # notifications switch the service to incremental maintenance.
        initial_ingestion_complete.set()


def _listen_for_changes() -> None:
    """Daemon: LISTENs on 'certif_changed' and re-ingests changed certification."""
    import psycopg, time
    initial_ingestion_complete.wait()
    logger.info("[NOTIFY] Initial ingestion complete; incremental listener starting.")
    while True:
        try:
            logger.info("[NOTIFY] Connecting to LISTEN certif_changed...")
            with psycopg.connect(settings.RAG_DB_DSN, autocommit=True) as conn:
                conn.execute("LISTEN certif_changed")
                logger.info("[NOTIFY] Listening on certif_changed.")
                for notify in conn.notifies():
                    try:
                        payload = json.loads(notify.payload)
                        cert_id = payload.get("id")
                        op = payload.get("operation", "?")
                        logger.info("[NOTIFY] %s cert_id=%s — re-ingesting...", op, cert_id)
                        _reingest_one(cert_id)
                    except Exception as exc:
                        logger.error("[NOTIFY] Error processing notification: %s", exc)
        except Exception as exc:
            logger.error("[NOTIFY] Connection lost (%s). Reconnecting in 10s...", exc)
            time.sleep(10)


def _reingest_one(cert_id: str) -> None:
    try:
        import psycopg
        with psycopg.connect(settings.RAG_DB_DSN) as conn, conn.cursor() as cur:
            cur.execute(
                "SELECT name, official_url, exam_provider_url FROM certifications WHERE id=%s::uuid",
                (cert_id,))
            row = cur.fetchone()
        if not row:
            logger.warning("[NOTIFY] cert_id=%s not found — skipping.", cert_id)
            return
        name, official_url, exam_provider_url = row
        from app.rag_chat.ingestion.pipeline import ingest_certification
        ingest_certification(cert_id, name, official_url or "", exam_provider_url or "")
    except Exception as exc:
        logger.error("[NOTIFY] Re-ingestion failed cert_id=%s: %s", cert_id, exc)


def _warmup_models() -> None:
    """Preload embedding & reranker models in background at startup so first request isn't blocked."""
    try:
        logger.info("[WARMUP] Preloading embedding model (%s)...", settings.EMBEDDING_MODEL)
        from app.rag_chat.services.embeddings.factory import get_embedding_engine
        get_embedding_engine().embed_dense(["warmup query"])
        logger.info("[WARMUP] Embedding model ready.")
    except Exception as exc:
        logger.warning("[WARMUP] Embedding model warmup failed: %s", exc)

    try:
        logger.info("[WARMUP] Preloading reranker model (%s)...", settings.RERANKER_MODEL)
        from app.rag_chat.services.reranker.bge_reranker import get_reranker_engine
        get_reranker_engine().score("warmup", ["candidate"])
        logger.info("[WARMUP] Reranker model ready.")
    except Exception as exc:
        logger.warning("[WARMUP] Reranker model warmup failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s (env=%s, ocr=%s, model=%s)",
                settings.APP_NAME, settings.ENV, settings.OCR_ENGINE, settings.GROQ_PARSER_MODEL)
    threading.Thread(target=_warmup_models, daemon=True).start()
    threading.Thread(target=_check_and_seed, daemon=True).start()
    threading.Thread(target=_listen_for_changes, daemon=True).start()
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    app = FastAPI(
        title="CertificationHub — Moteur de Validation IA",
        description="Microservice FastAPI — validation IA + RAG certifications.",
        version="2.0.0",
        lifespan=lifespan,
    )

    @app.middleware("http")
    async def add_request_id(request: Request, call_next):
        new_request_id()
        response = await call_next(request)
        response.headers["X-Request-ID"] = uuid.uuid4().hex[:12]
        return response

    app.include_router(health.router)
    app.include_router(validation.router)
    app.include_router(ingestion.router)
    app.include_router(chat.router)
    return app


app = create_app()
