"""Seed certification_chunks with full scraping & multi-section ingestion pipeline on first startup."""
from __future__ import annotations
import logging
import psycopg
from app.core.config import settings
from app.rag_chat.ingestion.pipeline import ingest_certification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_certification_chunks() -> None:
    logger.info("[SEED] Starting full scraping & ingestion pipeline for all certifications...")
    with psycopg.connect(settings.RAG_DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, code, name, provider, difficulty, priority,
                       exam_cost_usd, training_cost_usd, validity_months,
                       official_url, exam_provider_url, metadata
                FROM certifications WHERE deleted_at IS NULL
                ORDER BY name
            """)
            certs = cur.fetchall()

    logger.info("[SEED] Found %d certifications to ingest.", len(certs))
    if len(certs) != 53:
        logger.warning("[SEED] Expected the initial 53 certifications, found %d active rows.", len(certs))
    success_count = 0

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

        logger.info("[SEED] [%d/%d] Ingesting %s (%s)...", idx, len(certs), name, code)
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

    logger.info("[SEED] Ingestion completed: %d/%d certifications successfully ingested.", success_count, len(certs))


if __name__ == "__main__":
    seed_certification_chunks()
