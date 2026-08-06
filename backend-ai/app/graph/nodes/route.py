"""
Node + conditional edge: "URL Officielle détectée ?"

Split into two pieces because LangGraph conditional-edge functions should
be pure / side-effect-free routers — they just read state and return a
node name. Any actual state mutation (picking *which* URL counts as
trusted) belongs in a normal node that runs first.
"""

from __future__ import annotations

import logging
from typing import Literal

from app.core.config import settings
from app.schemas.state import GraphState
from app.utils.url_utils import first_trusted_url

logger = logging.getLogger(__name__)


def detect_url_node(state: GraphState) -> dict:
    candidates = state.get("detected_urls", [])
    trusted_url = first_trusted_url(candidates)

    if trusted_url:
        logger.info("[ROUTE] URL officielle détectée: %s -> passage à l'agent Web Scraper", trusted_url)
    else:
        logger.info("[ROUTE] Aucune URL officielle détectée -> passage à PENDING_APPROVAL")

    return {"trusted_url": trusted_url}


def route_by_url(state: GraphState) -> Literal["scrape", "pending_approval_outcome"]:
    return "scrape" if state.get("trusted_url") else "pending_approval_outcome"

