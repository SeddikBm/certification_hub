"""Node + conditional edge: route_node / route_by_intent — "Superviseur IA"."""

from __future__ import annotations

import logging
from typing import Literal

from app.rag_chat.exceptions import RagChatError
from app.rag_chat.schemas.enums import Intent
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.llm.intent_router import IntentRouter

logger = logging.getLogger(__name__)


def route_node(state: GraphState) -> dict:
    reasons = state.get("reasons", [])
    try:
        intent = IntentRouter().route(state["rewritten_query"])
    except RagChatError as exc:
        # No safe silent default: fall back to CONSEIL (the vector agent),
        # since a semantic search returning "not very relevant" results is a
        # softer failure than a Text-to-SQL agent guessing at a query it
        # misunderstood. Logged loudly either way.
        logger.warning("[ROUTE] Intent classification failed, defaulting to CONSEIL: %s", exc)
        intent = Intent.CONSEIL
        reasons = [*reasons, f"[ROUTE] Classification failed, defaulted to CONSEIL: {exc}"]

    logger.info("[ROUTE] intent=%s", intent.value)
    reasons = [*reasons, f"[ROUTE] intent={intent.value}"]
    return {"intent": intent, "reasons": reasons}


def route_by_intent(state: GraphState) -> Literal["text_to_sql", "vector_search"]:
    return "text_to_sql" if state["intent"] == Intent.ANALYTIQUE else "vector_search"
