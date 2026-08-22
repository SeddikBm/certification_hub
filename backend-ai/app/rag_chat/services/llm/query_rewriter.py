"""Query rewriting — turns a raw, possibly context-dependent question into
a self-contained search query, before it ever reaches retrieval."""

from __future__ import annotations

from app.core.config import settings
from app.exceptions import LLMCallError
from app.rag_chat.exceptions import RagChatError
from app.services.llm.nvidia_client import NvidiaChatClient

import logging

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """Tu es un expert en reformulation de requêtes pour un assistant intelligent sur les certifications informatiques.
À partir de l'historique de la conversation et de la dernière question de l'utilisateur, reformule la question en une requête TOTALEMENT AUTONOME, EXPLICITE et PRÉCISE.

RÈGLES :
1. Résous toutes les références contextuelles, pronoms et anaphores ("ces derniers", "celle-là", "combien ça coûte ?", "le total de leur prix", "et pour AWS ?") en insérant les noms exacts des certifications, squads ou providers mentionnés dans l'historique.
2. Si la question est déjà autonome ou si l'historique est vide, conserve fidèlement son sens.
3. Ne réponds JAMAIS à la question, reformule-la uniquement.
4. Réponds UNIQUEMENT avec la requête reformulée en français, sans aucun préambule, sans guillemets ni explications.

EXEMPLES :
Historique :
user: Donne-moi les certifications de la squad Data
assistant: Voici les certifications de la squad Data : AWS Certified Data Engineer (DEA-C01), Databricks Certified Data Engineer Associate, Confluent Certified Developer.
Question : Quel est le prix total de ces derniers ?
Reformulation : Quel est le prix total en MAD des certifications de la squad Data (AWS Certified Data Engineer DEA-C01, Databricks Certified Data Engineer Associate, Confluent Certified Developer) ?

Historique :
user: Parle-moi de la certification AZ-204
assistant: La certification Developing Solutions for Microsoft Azure (AZ-204) est destinée aux développeurs cloud.
Question : Combien coûte l'examen ?
Reformulation : Combien coûte l'examen de la certification Microsoft Azure AZ-204 en MAD ?"""


class QueryRewriter:
    def __init__(self, client: NvidiaChatClient | None = None) -> None:
        self._client = client or NvidiaChatClient()

    def rewrite(self, question: str, history: list[dict] | None = None) -> str:
        # If there is no previous conversation history, the question needs no anaphora resolution
        if not history:
            return question.strip()

        # Format up to the last 20 conversation turns (user & assistant) without artificial truncation
        hist_lines = []
        for h in history[-20:]:
            role = h.get("role", "user")
            content = (h.get("content") or "").strip()
            if content:
                hist_lines.append(f"{role}: {content}")

        if not hist_lines:
            return question.strip()

        hist_str = "\n".join(hist_lines)
        user_msg = f"Historique de la conversation :\n{hist_str}\n\nQuestion de l'utilisateur à reformuler de façon autonome :\n{question}"
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
        logger.info("[REWRITE] '%s' -> '%s'", question, rewritten)
        return rewritten or question
