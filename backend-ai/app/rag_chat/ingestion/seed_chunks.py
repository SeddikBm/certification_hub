"""Seed certification_chunks with full scraping & multi-section ingestion pipeline on first startup."""
from __future__ import annotations
import logging
import psycopg
from app.core.config import settings
from app.rag_chat.ingestion.pipeline import ingest_certification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_certification_chunks(force_all: bool = False) -> None:
    import time
    start_time = time.time()
    logger.info("=" * 80)
    logger.info("[SEED] Checking catalogue ingestion status (force_all=%s)...", force_all)
    with psycopg.connect(settings.RAG_DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT count(DISTINCT certification_id) FROM certification_chunks")
            already_indexed = cur.fetchone()[0]

            if force_all:
                cur.execute("""
                    SELECT id, code, name, provider, difficulty, priority,
                           exam_cost_usd, training_cost_usd, validity_months,
                           official_url, exam_provider_url, metadata
                    FROM certifications WHERE deleted_at IS NULL
                    ORDER BY name
                """)
            else:
                cur.execute("""
                    SELECT id, code, name, provider, difficulty, priority,
                           exam_cost_usd, training_cost_usd, validity_months,
                           official_url, exam_provider_url, metadata
                    FROM certifications 
                    WHERE deleted_at IS NULL
                      AND id NOT IN (SELECT DISTINCT certification_id FROM certification_chunks)
                    ORDER BY name
                """)
            certs = cur.fetchall()

    if not certs:
        logger.info("[SEED] All certifications are already indexed in certification_chunks (%d distinct certs). Nothing to do.", already_indexed)
        return

    logger.info("[SEED] Found %d missing certifications to ingest (%d already indexed).", len(certs), already_indexed)

    success_count = 0
    failure_count = 0

    for idx, row in enumerate(certs, 1):
        (cid, code, name, provider, diff, prio,
         cost_usd, train_cost_usd, val_m,
         official_url, exam_url, meta) = row
        meta = meta or {}
        prep_hours = meta.get("preparation_hours", "N/A")
        price_mad  = meta.get("price_mad") or (round(float(cost_usd) * 10.5, 0) if cost_usd else "N/A")
        domain     = meta.get("squad_domain", "Informatique")
        level      = meta.get("level", diff or "Standard")
        squads_aff = meta.get("squads_affected", "Tous")
        category   = meta.get("category", "NON_CLASSEE")
        validity_str = (f"{val_m} mois ({val_m // 12} ans)" if val_m else "Validité permanente")

        metadata_context = (
            f"Code : {code} | Provider : {provider} | Difficulté : {diff} | Priorité : {prio}\n"
            f"Domaine : {domain} | Niveau : {level} | Squads cibles : {squads_aff}\n"
            f"Catégorie catalogue : {category}\n"
            f"Préparation recommandée : {prep_hours} heures\n"
            f"Coût examen : {cost_usd} USD (≈ {price_mad} MAD) | Coût formation : {train_cost_usd} USD\n"
            f"Validité : {validity_str}\n"
            f"Lien formation : {official_url or 'N/A'}\n"
            f"Portail officiel examen : {exam_url or 'N/A'}"
        )

        logger.info("\n>>> [SEED PROGRESS: %d/%d (%.1f%%)] Processing: '%s' (Code: %s, Provider: %s) <<<",
                    idx, len(certs), (idx / len(certs)) * 100, name, code, provider)

        try:
            ok = ingest_certification(
                certification_id=str(cid),
                certification_title=name,
                official_url=official_url or "",
                exam_provider_url=exam_url or "",
                code=code or "",
                metadata_context=metadata_context,
            )
            if ok:
                success_count += 1
            else:
                failure_count += 1
        except Exception as exc:
            logger.error("[SEED] Error ingesting '%s' (%s): %s", name, cid, exc, exc_info=True)
            failure_count += 1

    elapsed_s = time.time() - start_time
    # Get total chunk count from DB
    total_chunks = 0
    try:
        with psycopg.connect(settings.RAG_DB_DSN) as conn, conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM certification_chunks")
            total_chunks = cur.fetchone()[0]
    except Exception as exc:
        logger.warning("[SEED] Could not count total chunks: %s", exc)

    logger.info("=" * 80)
    logger.info("[SEED FINISHED] Ingested %d/%d certifications successfully (%d failed).",
                success_count, len(certs), failure_count)
    logger.info("[SEED FINISHED] Total chunks in 'certification_chunks': %d chunks.", total_chunks)
    logger.info("[SEED FINISHED] Total ingestion time: %.1fs (%.1fs/cert).", elapsed_s, elapsed_s / max(1, len(certs)))
    logger.info("=" * 80)


if __name__ == "__main__":
    seed_certification_chunks()
