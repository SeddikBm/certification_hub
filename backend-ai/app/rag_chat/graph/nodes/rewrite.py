"""Node: rewrite_node — "Reformulation de requête"."""

from __future__ import annotations

import logging

from app.rag_chat.exceptions import RagChatError
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.llm.query_rewriter import QueryRewriter

logger = logging.getLogger(__name__)


def rewrite_node(state: GraphState) -> dict:
    message = state["message"]
    history = state.get("history", [])
    reasons = state.get("reasons", [])

    try:
        rewritten = QueryRewriter().rewrite(message, history=history)
    except Exception as exc:
        logger.warning("[REWRITE] Failed, falling back to the raw message: %s", exc)
        rewritten = message
        reasons = [*reasons, f"[REWRITE] Failed, used the original question: {exc}"]

    logger.info("[REWRITE] %r -> %r", message, rewritten)
    return {"rewritten_query": rewritten, "reasons": reasons}
