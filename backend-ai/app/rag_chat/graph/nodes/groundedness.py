"""
Node + conditional edge: groundedness_node / route_by_groundedness.

Last gate before the response is returned. Bounded retry: at most
GROUNDEDNESS_MAX_RETRIES regenerations (default 1) — this must never
become a loop that silently doubles or triples response latency.
"""

from __future__ import annotations

import logging
from typing import Literal

from app.core.config import settings
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.llm.groundedness_checker import GroundednessChecker

logger = logging.getLogger(__name__)


def groundedness_node(state: GraphState) -> dict:
    reasons = state.get("reasons", [])

    # The off-topic canned message never goes through this check (see
    # off_topic_response_node, which already sets grounded=True) — this
    # node only ever runs on a genuinely generated answer.
    context = _reconstruct_context_text(state)

    try:
        grounded, reason = GroundednessChecker().check(state["answer"], context)
    except RagChatError as exc:
        # Fail closed but don't block the response: flag it as ungrounded
        # (so the API layer can annotate it) rather than crashing the request.
        logger.warning("[GROUNDEDNESS] Check itself failed: %s", exc)
        return {
            "grounded": False,
            "groundedness_reason": f"Groundedness check failed: {exc}",
            "reasons": [*reasons, f"[GROUNDEDNESS] Check failed: {exc}"],
        }

    logger.info("[GROUNDEDNESS] grounded=%s reason=%s", grounded, reason)
    return {
        "grounded": grounded,
        "groundedness_reason": reason,
        "reasons": [*reasons, f"[GROUNDEDNESS] grounded={grounded}" + (f" ({reason})" if reason else "")],
    }


def route_by_groundedness(state: GraphState) -> Literal["regenerate", "done"]:
    already_retried = state.get("generation_attempts", 0) >= 1 + settings.GROUNDEDNESS_MAX_RETRIES
    if state.get("grounded") or already_retried:
        return "done"
    return "regenerate"


def _reconstruct_context_text(state: GraphState) -> str:
    # Mirrors generate_node._build_context but only needs the text, not the
    # source classification — kept separate rather than importing a private
    # helper across node modules.
    parts: list[str] = []
    if state.get("sql_rows"):
        parts.append("\n".join(str(row) for row in state["sql_rows"]))
    for chunk in state.get("vector_chunks") or []:
        parts.append(chunk.text)
    if state.get("scraped_content"):
        parts.append(state["scraped_content"])
    return "\n\n".join(parts)
