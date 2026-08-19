"""
Ingestion pipeline — scrape both official_url + exam_provider_url, merge, chunk, embed, store.
Never raises — failures land in dead_letter.
"""
from __future__ import annotations
import logging
import psycopg
from app.core.config import settings
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.ingestion.chunker import chunk_sections
from app.rag_chat.ingestion.scraper import scrape_syllabus
from app.rag_chat.ingestion.summarizer import SyllabusSummarizer
from app.rag_chat.services.embeddings.factory import get_embedding_engine

logger = logging.getLogger(__name__)


def ingest_certification(
    certification_id: str,
    certification_title: str,
    official_url: str = "",
    exam_provider_url: str = "",
    code: str = "",
    metadata_context: str = "",
) -> bool:
    logger.info("[INGESTION] cert_id=%s title=%s official=%s exam=%s",
                certification_id, certification_title, official_url, exam_provider_url)
    try:
        metadata_context = metadata_context.strip() or (
            f"Nom de la certification : {certification_title}\n"
            f"Code : {code or 'Non renseigné'}\n"
            f"Lien formation : {official_url or 'Non renseigné'}\n"
            f"Portail officiel examen : {exam_provider_url or 'Non renseigné'}"
        )
        content_a = _safe_scrape(official_url, "official_url")
        content_b = _safe_scrape(exam_provider_url, "exam_provider_url")
        logger.info("[INGESTION][SCRAPE] cert_id=%s official_chars=%d exam_chars=%d",
                    certification_id, len(content_a), len(content_b))
        sections = SyllabusSummarizer().summarize_sections(
            certification_title, content_a, content_b, metadata_context=metadata_context
        )
        logger.info("[INGESTION][SECTIONS] cert_id=%s count=%d names=%s",
                    certification_id, len(sections), [section.title for section in sections])
        chunks = chunk_sections(certification_title, sections)
        if not chunks:
            raise RagChatError("Section extraction produced no usable chunks.")
        for number, chunk in enumerate(chunks, 1):
            logger.info("[INGESTION][CHUNK] cert_id=%s chunk=%d section=%r chars=%d preview=%r",
                        certification_id, number, chunk.section, len(chunk.text), chunk.text[:180])
        embeddings = get_embedding_engine().embed_dense([c.text for c in chunks])
        logger.info("[INGESTION][EMBED] cert_id=%s vectors=%d dimensions=%d",
                    certification_id, len(embeddings), len(embeddings[0]) if embeddings else 0)
        primary_url = exam_provider_url or official_url
        _store_chunks(certification_id, code, certification_title, primary_url, chunks, embeddings)
    except Exception as exc:  # noqa: BLE001
        logger.error("[INGESTION] Failed cert_id=%s: %s", certification_id, exc)
        _mark_dead_letter(certification_id, official_url or exam_provider_url, f"{type(exc).__name__}: {exc}")
        return False
    logger.info("[INGESTION] Success cert_id=%s, %d chunk(s)", certification_id, len(chunks))
    _mark_success(certification_id, official_url or exam_provider_url)
    return True


def _safe_scrape(url: str, label: str) -> str:
    if not url or not url.startswith("http"):
        return ""
    try:
        return scrape_syllabus(url)
    except Exception as exc:
        logger.warning("[INGESTION] %s scrape failed (%s): %s", label, url, exc)
        return ""


def _store_chunks(certification_id, code, certification_title, source_url, chunks, embeddings) -> None:
    with psycopg.connect(settings.RAG_DB_DSN_WRITE) as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM certification_chunks WHERE certification_id = %s::uuid", (certification_id,))
        for chunk, vector in zip(chunks, embeddings, strict=True):
            cur.execute("""
                INSERT INTO certification_chunks
                    (certification_id, certification_code, certification_title, section, chunk_text, source_url, embedding)
                VALUES (%s::uuid, %s, %s, %s, %s, %s, %s::halfvec)
            """, (certification_id, code, certification_title, chunk.section, chunk.text, source_url, vector))
        conn.commit()


def _mark_success(certification_id: str, source_url: str) -> None:
    _upsert_job(certification_id, source_url, "success", None)


def _mark_dead_letter(certification_id: str, source_url: str, reason: str) -> None:
    logger.error("[INGESTION] dead_letter cert_id=%s: %s", certification_id, reason)
    _upsert_job(certification_id, source_url, "dead_letter", reason)


def _upsert_job(certification_id: str, source_url: str, status: str, last_error: str | None) -> None:
    try:
        with psycopg.connect(settings.RAG_DB_DSN_WRITE) as conn, conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS ingestion_jobs (
                    certification_id UUID PRIMARY KEY,
                    source_url TEXT,
                    status TEXT,
                    attempt_count INT DEFAULT 1,
                    last_error TEXT,
                    last_attempted_at TIMESTAMPTZ DEFAULT now()
                );
            """)
            cur.execute("""
                INSERT INTO ingestion_jobs (certification_id, source_url, status, attempt_count, last_error, last_attempted_at)
                VALUES (%s::uuid, %s, %s, 1, %s, now())
                ON CONFLICT (certification_id) DO UPDATE SET
                    status=EXCLUDED.status,
                    attempt_count=ingestion_jobs.attempt_count+1,
                    last_error=EXCLUDED.last_error,
                    last_attempted_at=now()
            """, (certification_id, source_url, status, last_error))
            conn.commit()
    except psycopg.Error as exc:
        logger.error("[INGESTION] Could not update ingestion_jobs: %s", exc)
