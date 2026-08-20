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
    logger.info("=" * 80)
    logger.info("[INGESTION][START] Ingesting '%s' (code=%s, id=%s)", certification_title, code, certification_id)
    logger.info("[INGESTION][INPUTS] official_url=%s | exam_provider_url=%s", official_url or "N/A", exam_provider_url or "N/A")
    try:
        metadata_context = metadata_context.strip() or (
            f"Nom de la certification : {certification_title}\n"
            f"Code : {code or 'Non renseigné'}\n"
            f"Lien formation : {official_url or 'Non renseigné'}\n"
            f"Portail officiel examen : {exam_provider_url or 'Non renseigné'}"
        )
        
        # --- STEP 1: Web Scraping ---
        logger.info("[INGESTION][STEP 1/5 - SCRAPE] Scraping official URLs...")
        content_a = _safe_scrape(official_url, "official_url")
        content_b = _safe_scrape(exam_provider_url, "exam_provider_url")
        logger.info("[INGESTION][SCRAPE-RESULT] official_url chars=%d | exam_provider_url chars=%d",
                    len(content_a), len(content_b))

        # --- STEP 2: Section Summarization ---
        logger.info("[INGESTION][STEP 2/5 - SUMMARIZE] Structuring content into canonical RAG sections via LLM...")
        sections = SyllabusSummarizer().summarize_sections(
            certification_title, content_a, content_b, metadata_context=metadata_context
        )
        logger.info("[INGESTION][SECTIONS-RESULT] Extracted %d sections: %s",
                    len(sections), [s.title for s in sections])

        # --- STEP 3: Chunking ---
        logger.info("[INGESTION][STEP 3/5 - CHUNKING] Generating contextualized chunks from sections...")
        chunks = chunk_sections(certification_title, sections)
        if not chunks:
            raise RagChatError("Section extraction produced no usable chunks.")
        
        logger.info("[INGESTION][CHUNKS-SUMMARY] Generated %d chunk(s) for '%s':", len(chunks), certification_title)
        for number, chunk in enumerate(chunks, 1):
            logger.info("--------------------------------------------------------------------------------")
            logger.info("[INGESTION][CHUNK %d/%d] Section: '%s' | Size: %d chars",
                        number, len(chunks), chunk.section, len(chunk.text))
            logger.info("[INGESTION][CHUNK %d/%d TEXT]:\n%s", number, len(chunks), chunk.text)
        logger.info("--------------------------------------------------------------------------------")

        # --- STEP 4: Embedding ---
        logger.info("[INGESTION][STEP 4/5 - EMBEDDING] Computing dense vector embeddings via OpenRouter (%s)...",
                    settings.EMBEDDING_MODEL)
        embeddings = get_embedding_engine().embed_dense([c.text for c in chunks])
        dim = len(embeddings[0]) if embeddings else 0
        logger.info("[INGESTION][EMBED-RESULT] Successfully computed %d dense vectors (dim=%d)", len(embeddings), dim)

        # --- STEP 5: Database Storage ---
        primary_url = exam_provider_url or official_url
        logger.info("[INGESTION][STEP 5/5 - STORAGE] Persisting %d chunks in PostgreSQL 'certification_chunks'...", len(chunks))
        _store_chunks(certification_id, code, certification_title, primary_url, chunks, embeddings)
        logger.info("[INGESTION][STORAGE-RESULT] Saved %d chunk(s) to DB for '%s' (id=%s).",
                    len(chunks), certification_title, certification_id)

    except Exception as exc:  # noqa: BLE001
        logger.error("[INGESTION][FAILED] cert_id=%s title='%s': %s", certification_id, certification_title, exc, exc_info=True)
        _mark_dead_letter(certification_id, official_url or exam_provider_url, f"{type(exc).__name__}: {exc}")
        logger.info("=" * 80)
        return False

    logger.info("[INGESTION][SUCCESS] Completed '%s' (%d chunks indexed)", certification_title, len(chunks))
    logger.info("=" * 80)
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
    logger.debug("[INGESTION][DB] Connecting to DB to store chunks...")
    with psycopg.connect(settings.RAG_DB_DSN_WRITE) as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM certification_chunks WHERE certification_id = %s::uuid", (certification_id,))
        for i, (chunk, vector) in enumerate(zip(chunks, embeddings, strict=True)):
            logger.debug("[INGESTION][DB] Inserting chunk %d", i + 1)
            cur.execute("""
                INSERT INTO certification_chunks
                    (certification_id, certification_code, certification_title, section, chunk_text, source_url, embedding)
                VALUES (%s::uuid, %s, %s, %s, %s, %s, %s::vector)
            """, (certification_id, code, certification_title, chunk.section, chunk.text, source_url, vector))
        conn.commit()
    logger.debug("[INGESTION][DB] Transaction committed successfully.")


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
