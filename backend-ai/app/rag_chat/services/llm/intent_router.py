"""Intent router — the "Superviseur IA" that decides ANALYTIQUE vs CONSEIL."""
from __future__ import annotations

import logging
import re
from app.core.config import settings
from app.rag_chat.schemas.enums import Intent
from app.services.llm.nvidia_client import NvidiaChatClient

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Tu es le superviseur IA chargé de router la question de l'utilisateur vers la bonne modalité de traitement.
Classe la question suivante dans l'une de ces deux catégories :

- "ANALYTIQUE" : La question porte sur des données directes, précises ou structurées stockées dans la base de données SQL. 
  Exemples :
  * Filtrage précis / clause WHERE sur les attributs : fournisseur/provider (Oracle, Microsoft, AWS...), prix/coût en MAD ou USD, catégorie, niveau de difficulté (FOUNDATIONAL, INTERMEDIATE, ADVANCED, EXPERT), priorité (MANDATORY, HIGH, NORMAL), code certification, lien officiel, validité.
  * Jointure ou filtrage par Squad affectée (ex: certifications recommandées pour la squad Java, Cloud, etc.).
  * Statuts ou assignations d'utilisateurs (mes certifications, certifications validées, assignations).
  * Agrégations, comptages ou classements directs (combien de certifications, liste par provider, la plus chère, total).

- "CONSEIL" : La question porte sur le contenu sémantique, la pédagogie, le syllabus, la compréhension ou des recommandations générales.
  Exemples :
  * Explications de concepts ou compétences évaluées ("que contient le module X ?", "qu'est-ce qu'on apprend dans CKA ?").
  * Prérequis généraux, conseils de préparation, astuces pour réussir l'examen, format des questions.
  * Orientation professionnelle ou choix d'une certification selon un profil de carrière sans filtre SQL strict.

Réponds UNIQUEMENT avec un objet JSON : {"intent": "ANALYTIQUE"} ou {"intent": "CONSEIL"}"""


class IntentRouter:
    def __init__(self, client: NvidiaChatClient | None = None) -> None:
        self._client = client or NvidiaChatClient()

    def route(self, question: str) -> Intent:
        # LLM intent classification
        try:
            data = self._client.chat_json(
                system=_SYSTEM_PROMPT,
                user=question,
                model=settings.RAG_LLM_MODEL,
            )
            raw_intent = str(data.get("intent", "")).upper()
            if raw_intent in (Intent.ANALYTIQUE.value, Intent.CONSEIL.value):
                logger.info("[ROUTER] LLM classified intent: %s for query: %r", raw_intent, question)
                return Intent(raw_intent)
        except Exception as exc:
            logger.warning("[ROUTER] LLM call failed (%s). Defaulting to CONSEIL.", exc)

        # Fallback default
        return Intent.CONSEIL
