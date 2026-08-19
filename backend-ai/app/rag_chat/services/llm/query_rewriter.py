"""Query rewriting — turns a raw, possibly context-dependent question into
a self-contained search query, before it ever reaches retrieval."""

from __future__ import annotations

from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.services.llm.openrouter_client import OpenRouterChatClient

_SYSTEM_PROMPT = """Reformule la question suivante en une requête de \
recherche autonome et explicite, adaptée à une recherche documentaire sur \
des certifications informatiques (cloud, agilité, cybersécurité, etc.).

Règles :
- Résous toute référence implicite ("celle-là", "la même mais...") à partir \
du contexte fourni, s'il y en a.
- N'ajoute aucune information qui n'est pas déjà présente ou clairement \
impliquée par la question.
- Réponds uniquement avec la requête reformulée, sans préambule ni guillemets.
"""


class QueryRewriter:
    def __init__(self, client: OpenRouterChatClient | None = None) -> None:
        self._client = client or OpenRouterChatClient()

    def rewrite(self, question: str) -> str:
        try:
            rewritten = self._client.chat(
                system=_SYSTEM_PROMPT,
                user=question,
                model=settings.RAG_LLM_MODEL,
            )
        except LLMCallError as exc:
            # Rewriting is an optimisation, not a hard requirement — degrade
            # to the original question rather than failing the whole request.
            raise RagChatError(str(exc)) from exc

        rewritten = rewritten.strip().strip('"')
        return rewritten or question
