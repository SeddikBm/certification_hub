"""
Ingestion pipeline orchestration.

    scrape -> summarize (LLM) -> chunk (structure-aware + contextualized)
    -> embed (BGE-M3) -> store (pgvector)

Assumed tracking table (adapt to your real schema):

    CREATE TABLE ingestion_jobs (
        id SERIAL PRIMARY KEY,
        certification_id INT NOT NULL,
        source_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',   -- pending | success | dead_letter
        attempt_count INT NOT NULL DEFAULT 0,
        last_error TEXT,
        last_attempted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now()
    );

Every failure — scraping, summarization, embedding, storage — lands the
job in 'dead_letter' with the reason recorded, rather than disappearing
silently. A human (or a follow-up manual import) picks it up from there;
this function is never responsible for infinite retries within a single
run, only tenacity's bounded retry inside fetch_syllabus.
"""

from __future__ import annotations

import logging

import psycopg

from app.core.config import settings
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.ingestion.chunker import chunk_syllabus
from app.rag_chat.ingestion.scraper import fetch_syllabus
from app.rag_chat.ingestion.summarizer import SyllabusSummarizer
from app.rag_chat.services.embeddings.factory import get_embedding_engine

logger = logging.getLogger(__name__)


def ingest_certification(certification_id: int, certification_title: str, source_url: str) -> bool:
    """Returns True on success. Never raises — every failure is caught,
    logged, and recorded as dead_letter for manual follow-up."""
    logger.info("[INGESTION] Starting for certification_id=%s (%s)", certification_id, source_url)

    try:
        raw_text = fetch_syllabus(source_url)
        summary_markdown = SyllabusSummarizer().summarize(certification_title, raw_text)
        chunks = chunk_syllabus(certification_title, summary_markdown)
        if not chunks:
            raise RagChatError("Summarization produced no usable content to chunk")

        embeddings = get_embedding_engine().embed_dense([c.text for c in chunks])
        _store_chunks(certification_id, certification_title, source_url, chunks, embeddings)
    except Exception as exc:  # noqa: BLE001 — intentional: every stage's failure lands here
        logger.error("[INGESTION] Failed for certification_id=%s: %s", certification_id, exc)
        _mark_dead_letter(certification_id, source_url, reason=f"{type(exc).__name__}: {exc}")
        return False

    logger.info("[INGESTION] Success: certification_id=%s, %d chunk(s) stored", certification_id, len(chunks))
    _mark_success(certification_id, source_url)
    return True


def _store_chunks(certification_id, certification_title, source_url, chunks, embeddings) -> None:
    with psycopg.connect(settings.RAG_DB_DSN_WRITE) as conn, conn.cursor() as cur:
        # Replace any previous chunks for this certification (a re-ingestion
        # / periodic refresh should not just append duplicates).
        cur.execute("DELETE FROM certification_chunks WHERE certification_id = %s", (certification_id,))
        for chunk, vector in zip(chunks, embeddings, strict=True):
            cur.execute(
                """
                INSERT INTO certification_chunks
                    (certification_id, certification_title, section, chunk_text, source_url, embedding)
                VALUES (%s, %s, %s, %s, %s, %s::vector)
                """,
                (certification_id, certification_title, chunk.section, chunk.text, source_url, vector),
            )
        conn.commit()


def _mark_success(certification_id: int, source_url: str) -> None:
    _upsert_job_status(certification_id, source_url, status="success", last_error=None)


def _mark_dead_letter(certification_id: int, source_url: str, reason: str) -> None:
    logger.error(
        "[INGESTION] certification_id=%s moved to dead_letter — needs manual review: %s",
        certification_id,
        reason,
    )
    _upsert_job_status(certification_id, source_url, status="dead_letter", last_error=reason)


def _upsert_job_status(certification_id: int, source_url: str, status: str, last_error: str | None) -> None:
    try:
        with psycopg.connect(settings.RAG_DB_DSN_WRITE) as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ingestion_jobs (certification_id, source_url, status, attempt_count, last_error, last_attempted_at)
                VALUES (%s, %s, %s, 1, %s, now())
                ON CONFLICT (certification_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    attempt_count = ingestion_jobs.attempt_count + 1,
                    last_error = EXCLUDED.last_error,
                    last_attempted_at = now()
                """,
                (certification_id, source_url, status, last_error),
            )
            conn.commit()
    except psycopg.Error as exc:
        # Tracking the tracker failing is not worth crashing the pipeline
        # over — log loudly, the ingestion result itself was already handled.
        logger.error("[INGESTION] Could not update ingestion_jobs status: %s", exc)
