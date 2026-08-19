"""
Topic guardrail — LLM binary classifier (replaces embedding cosine approach).
One small LLM call, far more robust than cosine similarity.
Fails open (on_topic=True) if the LLM call itself errors.
"""
from __future__ import annotations
import logging
from app.core.config import settings
from app.rag_chat.services.llm.openrouter_client import OpenRouterChatClient

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Tu es un classificateur binaire pour un assistant IA dédié aux certifications informatiques professionnelles (cloud, cybersécurité, agilité, DevOps, data, développement, etc.) chez Devoteam Maroc.

EST DANS LE PÉRIMÈTRE (on_topic=true) :
- Certifications, formations, examens, fournisseurs (AWS, Azure, GCP, Scrum, ISTQB, Cisco, PMI...)
- Coût, durée, validité, prérequis, format d'examen
- Catalogue de certifications, squads et leurs certifications
- Statut personnel de l'utilisateur (mes certifs, mon squad, mes validations)
- Conseils, comparaisons entre certifications
- URLs officielles d'examens ou de formations

HORS PÉRIMÈTRE (on_topic=false) :
- Météo, actualité, politique, sport, cuisine
- Questions personnelles sans lien avec les certifications
- Conversations générales sans rapport avec l'informatique professionnel

Réponds UNIQUEMENT avec un objet JSON : {"on_topic": true} ou {"on_topic": false}"""


class TopicClassifier:
    def __init__(self, client: OpenRouterChatClient | None = None) -> None:
        self._client = client or OpenRouterChatClient()

    def classify(self, question: str) -> tuple[bool, float]:
        """Returns (on_topic, score). Score is 1.0/0.0 (binary LLM decision)."""
        try:
            data = self._client.chat_json(
                system=_SYSTEM_PROMPT, user=question, model=settings.RAG_LLM_MODEL)
            on_topic = bool(data.get("on_topic", True))
        except Exception as exc:
            logger.warning("[GUARDRAIL] LLM failed (%s). Defaulting on_topic=True.", exc)
            on_topic = True
        score = 1.0 if on_topic else 0.0
        logger.info("[GUARDRAIL] on_topic=%s (LLM)", on_topic)
        return on_topic, score
