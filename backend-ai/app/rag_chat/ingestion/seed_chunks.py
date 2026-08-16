"""
Seed script: Generates structured syllabus chunks and embeddings for all certifications
currently in the database and saves them into the `certification_chunks` table.
"""

from __future__ import annotations

import logging
import psycopg

from app.core.config import settings
from app.rag_chat.services.embeddings.factory import get_embedding_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_certification_chunks():
    logger.info("Connecting to database: %s", settings.RAG_DB_DSN_WRITE)
    emb_engine = get_embedding_engine()

    with psycopg.connect(settings.RAG_DB_DSN_WRITE) as conn:
        with conn.cursor() as cur:
            # 1. Fetch all certifications
            cur.execute("""
                SELECT id, code, name, provider, difficulty, priority, exam_cost_usd, 
                       validity_months, official_url, exam_provider_url, metadata
                FROM certifications
            """)
            certs = cur.fetchall()
            logger.info("Found %d certifications in database.", len(certs))

            # 2. Prepare chunks
            chunks_to_insert = []
            for row in certs:
                cid, code, name, provider, diff, prio, cost_usd, val_m, official_url, exam_url, meta = row
                meta = meta or {}
                
                prep_hours = meta.get("preparation_hours", "N/A")
                price_mad = meta.get("price_mad", (cost_usd * 10 if cost_usd else "N/A"))
                domain = meta.get("squad_domain", "Informatique")
                level = meta.get("level", diff or "Standard")
                squads_aff = meta.get("squads_affected", "Tous")

                # Chunk 1: Overview & Profiling
                overview_text = (
                    f"Certification {name} ({code}) par l'éditeur {provider}.\n"
                    f"Domaine : {domain}. Niveau : {level} (Difficulté : {diff}).\n"
                    f"Priorité dans le plan de formation : {prio}.\n"
                    f"Squads cibles : {squads_aff}.\n"
                    f"Objectif : Valider les compétences professionnelles en {domain} et technologies {provider}."
                )

                # Chunk 2: Logistics, Examen & Coût
                validity_str = f"{val_m} mois ({val_m // 12} ans)" if val_m else "Validité permanente (sans expiration)"
                logistics_text = (
                    f"Modalités et examen pour la certification {name} ({code}) :\n"
                    f"- Éditeur / Provider : {provider}\n"
                    f"- Temps de préparation recommandé : {prep_hours} heures de formation.\n"
                    f"- Coût d'examen officiel : {cost_usd} USD (environ {price_mad} MAD).\n"
                    f"- Durée de validité : {validity_str}.\n"
                    f"- Lien formation / Udemy : {official_url or 'N/A'}\n"
                    f"- Portail officiel de l'examen : {exam_url or 'N/A'}"
                )

                chunks_to_insert.append({
                    "cert_id": str(cid),
                    "code": code,
                    "title": name,
                    "section": "Présentation & Profil",
                    "text": overview_text,
                    "source_url": official_url or exam_url,
                })

                chunks_to_insert.append({
                    "cert_id": str(cid),
                    "code": code,
                    "title": name,
                    "section": "Modalités, Préparation & Coût",
                    "text": logistics_text,
                    "source_url": exam_url or official_url,
                })

            logger.info("Computing embeddings for %d chunks...", len(chunks_to_insert))
            texts = [c["text"] for c in chunks_to_insert]
            vectors = emb_engine.embed_dense(texts)

            # 3. Clean existing and insert
            cur.execute("DELETE FROM certification_chunks")
            logger.info("Inserting %d chunks into certification_chunks...", len(chunks_to_insert))

            for chunk, vec in zip(chunks_to_insert, vectors, strict=True):
                cur.execute("""
                    INSERT INTO certification_chunks 
                    (certification_id, certification_code, certification_title, section, chunk_text, source_url, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    chunk["cert_id"],
                    chunk["code"],
                    chunk["title"],
                    chunk["section"],
                    chunk["text"],
                    chunk["source_url"],
                    vec,
                ))

        conn.commit()
    logger.info("Seeding completed successfully!")


if __name__ == "__main__":
    seed_certification_chunks()
