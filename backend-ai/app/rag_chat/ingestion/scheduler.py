"""Periodic refresh — fixed column names (name, official_url, exam_provider_url)."""
from __future__ import annotations
import logging
import psycopg
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.core.config import settings
from app.rag_chat.ingestion.pipeline import ingest_certification

logger = logging.getLogger(__name__)


def refresh_stale_certifications() -> None:
    try:
        with psycopg.connect(settings.RAG_DB_DSN) as conn, conn.cursor() as cur:
            cur.execute("""
                SELECT c.id, c.name, c.official_url, c.exam_provider_url
                FROM certifications c
                LEFT JOIN ingestion_jobs j ON j.certification_id = c.id
                WHERE c.deleted_at IS NULL
                  AND (j.status IS DISTINCT FROM 'success'
                       OR j.last_attempted_at < now() - (%s || ' days')::interval)
            """, (settings.INGESTION_REFRESH_INTERVAL_DAYS,))
            stale = cur.fetchall()
    except psycopg.Error as exc:
        logger.error("[REFRESH] Could not list stale certifications: %s", exc)
        return
    logger.info("[REFRESH] %d certification(s) due for re-ingestion", len(stale))
    for cert_id, name, official_url, exam_provider_url in stale:
        ingest_certification(str(cert_id), name, official_url or "", exam_provider_url or "")


def start_refresh_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        refresh_stale_certifications,
        trigger=IntervalTrigger(days=settings.INGESTION_REFRESH_INTERVAL_DAYS),
        id="refresh_stale_certifications", replace_existing=True,
    )
    scheduler.start()
    logger.info("[REFRESH] Scheduler started (every %d days)", settings.INGESTION_REFRESH_INTERVAL_DAYS)
    return scheduler
