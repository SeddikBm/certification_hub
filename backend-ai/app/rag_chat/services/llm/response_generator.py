"""Response generator (Générateur de Réponse — synthèse & mise en forme)."""

from __future__ import annotations

from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import ResponseGenerationError
from app.services.llm.groq_client import GroqChatClient

_SYSTEM_PROMPT = """Tu es l'assistant CertificationHub, dédié à aider les \
collaborateurs sur leurs certifications informatiques.

Règles strictes :
- Réponds UNIQUEMENT à partir du contexte fourni ci-dessous. N'invente \
aucune information (dates, scores, contenu de syllabus) qui n'y figure pas.
- Si le contexte ne suffit pas à répondre complètement, dis-le explicitement \
plutôt que de compléter par une supposition.
- Ton clair, concis, professionnel. Pas de préambule inutile.
"""

_RETRY_SUFFIX = """

IMPORTANT — ta réponse précédente contenait des affirmations non soutenues \
par le contexte. Cette fois, ne réponds QUE ce qui est explicitement \
présent dans le contexte ci-dessous. Dis "je ne sais pas" pour tout le reste."""


class ResponseGenerator:
    def __init__(self, client: GroqChatClient | None = None) -> None:
        self._client = client or GroqChatClient()

    def generate(self, question: str, context: str, strict_retry: bool = False) -> str:
        system = _SYSTEM_PROMPT + (_RETRY_SUFFIX if strict_retry else "")
        user = f"Contexte :\n{context}\n\nQuestion : {question}"
        try:
            return self._client.chat(system=system, user=user, model=settings.RAG_LLM_MODEL).strip()
        except LLMCallError as exc:
            raise ResponseGenerationError(str(exc)) from exc
