"""Ingestion-time syllabus summarization (Moteur LLM)."""

from __future__ import annotations

from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import RagChatError
from app.services.llm.groq_client import GroqChatClient

_SYSTEM_PROMPT = """Tu résumes une page de syllabus de certification \
informatique en Markdown structuré, prêt à être indexé pour de la recherche.

Structure attendue (utilise ces titres de section, omets celles qui ne \
s'appliquent pas) :
# <Nom de la certification>
## Description
## Compétences évaluées
## Prérequis
## Format de l'examen

Ne mentionne rien qui n'est pas présent dans le texte source. Ignore la \
navigation, les avis, et tout contenu publicitaire non pertinent au \
contenu pédagogique.
"""


class SyllabusSummarizer:
    def __init__(self, client: GroqChatClient | None = None) -> None:
        self._client = client or GroqChatClient()

    def summarize(self, certification_title: str, raw_text: str) -> str:
        user = f"Certification : {certification_title}\n\nTexte source :\n{raw_text[:12000]}"
        try:
            return self._client.chat(system=_SYSTEM_PROMPT, user=user, model=settings.RAG_LLM_MODEL).strip()
        except LLMCallError as exc:
            raise RagChatError(str(exc)) from exc
