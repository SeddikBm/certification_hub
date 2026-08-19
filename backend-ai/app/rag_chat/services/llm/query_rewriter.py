"""Query rewriting — turns a raw, possibly context-dependent question into
a self-contained search query, before it ever reaches retrieval."""

from __future__ import annotations

from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import RagChatError
from app.services.llm.groq_client import GroqChatClient

import logging

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Tu es un expert en reformulation de requêtes pour un système RAG sur les certifications informatiques.
À partir de l'historique récent de la conversation (s'il existe) et de la dernière question de l'utilisateur, reformule la dernière question en une requête AUTONOME, EXPLICITE et COMPLÈTE.

Règles :
- Résous toute référence contextuelle ou anaphore ("le plus cher", "celle-là", "et pour AWS ?", "pourquoi ?", "combien ?") en utilisant l'historique.
- Si la question est déjà autonome ou qu'il n'y a pas d'historique, conserve son sens exact.
- Réponds UNIQUEMENT avec la requête reformulée en français, sans explication, sans préambule ni guillemets."""


class QueryRewriter:
    def __init__(self, client: GroqChatClient | None = None) -> None:
        self._client = client or GroqChatClient()

    def rewrite(self, question: str, history: list[dict] | None = None) -> str:
        if not history:
            user_msg = question
        else:
            hist_str = "\n".join(f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-4:])
            user_msg = f"Historique de la conversation :\n{hist_str}\n\nQuestion à reformuler de façon autonome :\n{question}"
        try:
            rewritten = self._client.chat(
                system=_SYSTEM_PROMPT,
                user=user_msg,
                model=settings.RAG_LLM_MODEL,
            )
        except Exception as exc:
            logger.warning("[REWRITE] Failed (%s). Using original question.", exc)
            return question

        rewritten = rewritten.strip().strip('"').strip("'")
        return rewritten or question
