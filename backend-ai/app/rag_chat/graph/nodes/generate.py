"""Node: generate_node — "Générateur de Réponse (Synthèse & Mise en forme)"."""

from __future__ import annotations

import logging

from app.rag_chat.exceptions import ResponseGenerationError
from app.rag_chat.schemas.enums import RetrievalSource
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.llm.response_generator import ResponseGenerator

logger = logging.getLogger(__name__)


def generate_node(state: GraphState) -> dict:
    reasons = state.get("reasons", [])
    context, source = _build_context(state)

    try:
        answer = ResponseGenerator().generate(state["message"], context)
    except ResponseGenerationError as exc:
        logger.error("[GENERATE] Failed: %s", exc)
        return {
            "source": source,
            "answer": "Je rencontre un problème technique pour répondre à cette question. Réessayez dans un instant.",
            "generation_attempts": 1,
            "reasons": [*reasons, f"[GENERATE] Failed: {exc}"],
        }

    logger.info("[GENERATE] source=%s answer_len=%d", source.value, len(answer))
    return {
        "source": source,
        "answer": answer,
        "generation_attempts": 1,
        "reasons": [*reasons, f"[GENERATE] source={source.value}"],
    }


def regenerate_node(state: GraphState) -> dict:
    """
    Reached at most once (see groundedness.route_by_groundedness, bounded by
    GROUNDEDNESS_MAX_RETRIES) — re-generates with a stricter prompt after an
    ungrounded first attempt. Never loops further than that.
    """
    reasons = state.get("reasons", [])
    context, source = _build_context(state)

    try:
        answer = ResponseGenerator().generate(state["message"], context, strict_retry=True)
    except ResponseGenerationError as exc:
        logger.error("[GENERATE] Retry failed: %s", exc)
        return {
            "source": source,
            "answer": "Je ne trouve pas suffisamment d'information fiable pour répondre avec certitude à cette question.",
            "generation_attempts": state.get("generation_attempts", 1) + 1,
            "reasons": [*reasons, f"[GENERATE] Retry failed: {exc}"],
        }

    logger.info("[GENERATE] Retry (strict) produced a new answer, len=%d", len(answer))
    return {
        "source": source,
        "answer": answer,
        "generation_attempts": state.get("generation_attempts", 1) + 1,
        "reasons": [*reasons, "[GENERATE] Regenerated with a stricter, context-only prompt"],
    }


def _build_context(state: GraphState) -> tuple[str, RetrievalSource]:
    """Assembles whatever context is available into one string, and reports
    which source(s) actually contributed — SQL rows, vector chunks, and/or
    live-scraped content aren't mutually exclusive at this point."""
    parts: list[str] = []

    if state.get("sql_rows"):
        parts.append("Données de la base :\n" + "\n".join(str(row) for row in state["sql_rows"]))

    chunks = state.get("vector_chunks") or []
    if chunks:
        parts.append(
            "Extraits de syllabus :\n"
            + "\n\n".join(f"[{c.certification_title} — {c.section or 'général'}]\n{c.text}" for c in chunks)
        )

    if state.get("scraped_content"):
        parts.append("Contenu récupéré en direct :\n" + state["scraped_content"])

    if state.get("scraped_content"):
        source = RetrievalSource.VECTOR_STORE_PLUS_LIVE_SCRAPE
    elif chunks:
        source = RetrievalSource.VECTOR_STORE
    elif state.get("sql_rows") is not None:
        source = RetrievalSource.SQL
    else:
        source = RetrievalSource.NONE

    return "\n\n".join(parts), source
