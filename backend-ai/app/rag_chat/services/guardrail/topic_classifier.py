"""
Topic guardrail — LLM binary classifier with multi-turn context support.
"""
from __future__ import annotations

import logging

from app.core.config import settings
from app.services.llm.groq_client import GroqChatClient

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Tu es un classificateur binaire pour un assistant IA dédié aux certifications informatiques professionnelles (cloud, cybersécurité, agilité, DevOps, data, développement, etc.) chez Devoteam Maroc.

EST DANS LE PÉRIMÈTRE (on_topic=true) :
- Certifications, formations, examens, fournisseurs (AWS, Azure, GCP, Scrum, ISTQB, Cisco, PMI...)
- Coût, durée, validité, prérequis, format d'examen, comparatifs
- Catalogue de certifications, squads et leurs certifications
- Statut personnel de l'utilisateur (mes certifs, mon squad, mes validations, le plus cher, le moins cher)
- URLs officielles d'examens ou de formations
- Questions d'aide ou clarifications sur les certifications

HORS PÉRIMÈTRE (on_topic=false) :
- Météo, actualité politique, sport, cuisine
- Conversations générales sans rapport avec l'informatique ou les certifications

Réponds UNIQUEMENT avec un objet JSON : {"on_topic": true} ou {"on_topic": false}"""


class TopicClassifier:
    def __init__(self, client: GroqChatClient | None = None) -> None:
        self._client = client or GroqChatClient()

    def classify(self, question: str, history: list[dict] | None = None) -> tuple[bool, float]:
        """Returns (on_topic, score). Score is 1.0/0.0 (binary LLM decision)."""
        # Fast rule: if follow-up and history exists
        if history and len(question.strip().split()) <= 6:
            logger.info("[GUARDRAIL] Short follow-up in active session -> on_topic=True")
            return True, 1.0

        user_content = question
        if history:
            hist_str = "\n".join(f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-2:])
            user_content = f"Historique récent :\n{hist_str}\n\nQuestion actuelle à classifier :\n{question}"

        try:
            data = self._client.chat_json(
                system=_SYSTEM_PROMPT, user=user_content, model=settings.RAG_LLM_MODEL
            )
            on_topic = bool(data.get("on_topic", True))
        except Exception as exc:
            logger.warning("[GUARDRAIL] LLM failed (%s). Defaulting on_topic=True.", exc)
            on_topic = True
        score = 1.0 if on_topic else 0.0
        logger.info("[GUARDRAIL] on_topic=%s (LLM)", on_topic)
        return on_topic, score
