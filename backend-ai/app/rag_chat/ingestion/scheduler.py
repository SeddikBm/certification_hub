"""
Periodic refresh (Rafraîchissement périodique).

Without this, embeddings only ever reflect the syllabus content at initial
ingestion time — issuers revise exam syllabi regularly, and nothing else
in this pipeline would ever notice. In-process APScheduler is enough here
(this pipeline's throughput doesn't need a separate task-queue service);
swap for Celery/RQ if ingestion volume ever grows enough to need
distributing across multiple workers.
"""

from __future__ import annotations

import logging

import psycopg
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings
from app.rag_chat.ingestion.pipeline import ingest_certification

logger = logging.getLogger(__name__)


def refresh_stale_certifications() -> None:
    """Re-runs ingestion for every certification whose chunks are older
    than INGESTION_REFRESH_INTERVAL_DAYS, or that never succeeded."""
    try:
        with psycopg.connect(settings.RAG_DB_DSN) as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT c.id, c.title, c.source_url
                FROM certifications c
                LEFT JOIN ingestion_jobs j ON j.certification_id = c.id
                WHERE j.status IS DISTINCT FROM 'success'
                   OR j.last_attempted_at < now() - (%s || ' days')::interval
                """,
                (settings.INGESTION_REFRESH_INTERVAL_DAYS,),
            )
            stale = cur.fetchall()
    except psycopg.Error as exc:
        logger.error("[REFRESH] Could not list stale certifications: %s", exc)
        return

    logger.info("[REFRESH] %d certification(s) due for re-ingestion", len(stale))
    for certification_id, title, source_url in stale:
        ingest_certification(certification_id, title, source_url)


def start_refresh_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        refresh_stale_certifications,
        trigger=IntervalTrigger(days=settings.INGESTION_REFRESH_INTERVAL_DAYS),
        id="refresh_stale_certifications",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "[REFRESH] Scheduler started (every %d day(s))", settings.INGESTION_REFRESH_INTERVAL_DAYS
    )
    return scheduler
