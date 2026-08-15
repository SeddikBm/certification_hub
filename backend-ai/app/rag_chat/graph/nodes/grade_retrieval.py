"""
Node + conditional edge: grade_retrieval_node / route_by_retrieval_grade.

The explicit Corrective-RAG evaluator: separated from vector_search_node
on purpose, so "did retrieval succeed" is its own testable, mockable
concern rather than implicit logic buried in the search agent.

Deliberately threshold-based on the reranker score, not an extra LLM call:
the reranker's score is already a calibrated relevance judgment (that's
its whole job), so grading on it is free — no added latency/cost on top of
what vector_search_node already computed. Escalates to the live scraper
AT MOST once — never a retry loop.
"""

from __future__ import annotations

import logging
from typing import Literal

from app.core.config import settings
from app.rag_chat.schemas.state import GraphState

logger = logging.getLogger(__name__)


def grade_retrieval_node(state: GraphState) -> dict:
    chunks = state.get("vector_chunks", [])
    best_score = chunks[0].score if chunks else 0.0
    sufficient = best_score >= settings.RETRIEVAL_GRADE_MIN_SCORE

    reason = (
        f"Top reranked score {best_score:.2f} >= {settings.RETRIEVAL_GRADE_MIN_SCORE:.2f}"
        if sufficient
        else f"Top reranked score {best_score:.2f} below {settings.RETRIEVAL_GRADE_MIN_SCORE:.2f} threshold"
    )
    logger.info("[GRADE] %s -> sufficient=%s", reason, sufficient)

    reasons = state.get("reasons", [])
    return {
        "retrieval_sufficient": sufficient,
        "retrieval_grade_reason": reason,
        "reasons": [*reasons, f"[GRADE] {reason}"],
    }


def route_by_retrieval_grade(state: GraphState) -> Literal["web_scrape", "generate"]:
    return "generate" if state.get("retrieval_sufficient") else "web_scrape"
