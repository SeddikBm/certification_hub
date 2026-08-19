"""Intent router — the "Superviseur IA" that decides ANALYTIQUE vs CONSEIL."""
from __future__ import annotations

import logging
import re
from app.core.config import settings
from app.rag_chat.schemas.enums import Intent
from app.services.llm.groq_client import GroqChatClient

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Classe la question suivante dans l'une de ces deux catégories :

- "ANALYTIQUE" : une question factuelle, un comptage, un classement (le plus cher, le moins cher, le plus long), un regroupement ou un filtre sur les données de la base : nombre de certifications, prix, coûts, durées, providers, catégories, squads, statuts, assignations ou validations.
- "CONSEIL" : une question de contenu, de syllabus ou de recommandation générale sur les certifications : prérequis, compétences évaluées, format d'examen, conseils d'orientation, préparation.

Réponds UNIQUEMENT avec un objet JSON : {"intent": "ANALYTIQUE"} ou {"intent": "CONSEIL"}"""

_ANALYTICAL_KEYWORDS = [
    r"\bcombien\b", r"\bnombre\b", r"\bplus cher\b", r"\bplus ch[eè]re\b", r"\bmoins cher\b",
    r"\bco[uû]t\b", r"\bprix\b", r"\btotal\b", r"\bmoyenne\b", r"\bcombien de\b",
    r"\bliste des\b", r"\btoutes les\b", r"\btous les\b", r"\bstatut\b", r"\bvalid[eé]e?s?\b",
    r"\bassign\b", r"\bqui a\b", r"\bmes certif\b", r"\bma squad\b", r"\bnotre squad\b",
]


class IntentRouter:
    def __init__(self, client: GroqChatClient | None = None) -> None:
        self._client = client or GroqChatClient()

    def route(self, question: str) -> Intent:
        # 1. Quick regex heuristics for obvious analytical questions
        q_lower = question.lower()
        for pattern in _ANALYTICAL_KEYWORDS:
            if re.search(pattern, q_lower):
                logger.info("[ROUTER] Analytical keyword pattern %r matched -> ANALYTIQUE", pattern)
                return Intent.ANALYTIQUE

        # 2. LLM classification
        try:
            data = self._client.chat_json(
                system=_SYSTEM_PROMPT,
                user=question,
                model=settings.RAG_LLM_MODEL,
            )
            raw_intent = str(data.get("intent", "")).upper()
            if raw_intent in (Intent.ANALYTIQUE.value, Intent.CONSEIL.value):
                return Intent(raw_intent)
        except Exception as exc:
            logger.warning("[ROUTER] LLM call failed (%s). Defaulting based on context.", exc)

        # 3. Fallback: if questions contains "quel" / "qu'est-ce", usually CONSEIL
        return Intent.CONSEIL
