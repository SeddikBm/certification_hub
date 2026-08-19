"""Intent router — the "Superviseur IA" that decides ANALYTIQUE vs CONSEIL."""

from __future__ import annotations

from app.core.config import settings
from app.exceptions import LLMCallError, LLMResponseParsingError
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.schemas.enums import Intent
from app.rag_chat.services.llm.openrouter_client import OpenRouterChatClient

_SYSTEM_PROMPT = """Classe la question suivante dans l'une de ces deux \
catégories, en réfléchissant à ce que l'utilisateur veut vraiment savoir :

- "ANALYTIQUE" : une question factuelle, un comptage, un regroupement ou un \
filtre sur les données du catalogue ou de l'utilisateur : catégories, providers, \
prix, statuts, dates, certifications personnelles ou de squad.
- "CONSEIL" : une question de conseil ou d'information générale sur les \
certifications elles-mêmes — laquelle choisir, ce qu'elle couvre, sa \
difficulté, sa pertinence pour un métier.

Réponds UNIQUEMENT avec un objet JSON : {"intent": "ANALYTIQUE"|"CONSEIL"}
"""


class IntentRouter:
    def __init__(self, client: OpenRouterChatClient | None = None) -> None:
        self._client = client or OpenRouterChatClient()

    def route(self, question: str) -> Intent:
        try:
            data = self._client.chat_json(
                system=_SYSTEM_PROMPT,
                user=question,
                model=settings.RAG_LLM_MODEL,
            )
        except (LLMCallError, LLMResponseParsingError) as exc:
            # No safe silent default here — a misrouted question is better
            # surfaced than guessed. The caller decides how to degrade.
            raise RagChatError(str(exc)) from exc

        raw_intent = str(data.get("intent", "")).upper()
        if raw_intent not in (Intent.ANALYTIQUE.value, Intent.CONSEIL.value):
            raise RagChatError(f"Router returned an unrecognised intent: {raw_intent!r}")

        return Intent(raw_intent)
