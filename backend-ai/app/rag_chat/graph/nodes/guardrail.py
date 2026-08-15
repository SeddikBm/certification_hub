"""
Node: guardrail_node — "Garde-fou thématique".

First node in the graph, on purpose: an off-topic question should never
reach the router, the SQL guardrail, or any retrieval agent — cheapest
possible short-circuit, before any LLM call or DB/vector query happens.
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.rag_chat.schemas.enums import RetrievalSource
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.guardrail.topic_classifier import TopicClassifier

logger = logging.getLogger(__name__)


def guardrail_node(state: GraphState) -> dict:
    on_topic, score = TopicClassifier().classify(state["message"])

    reasons = state.get("reasons", [])
    if not on_topic:
        reasons = [*reasons, f"[GUARDRAIL] Off-topic (similarity={score:.2f}) — redirected without further processing."]
    else:
        reasons = [*reasons, f"[GUARDRAIL] On-topic (similarity={score:.2f})."]

    return {"on_topic": on_topic, "guardrail_score": score, "reasons": reasons}


def route_by_guardrail(state: GraphState):
    return "rewrite" if state.get("on_topic") else "off_topic_response"


def off_topic_response_node(state: GraphState) -> dict:
    """Terminal node for the off-topic branch — the canned redirect, nothing else runs."""
    return {
        "source": RetrievalSource.NONE,
        "answer": settings.GUARDRAIL_REDIRECT_MESSAGE,
        "grounded": True,  # trivially true: it's a fixed, non-generated message
    }
