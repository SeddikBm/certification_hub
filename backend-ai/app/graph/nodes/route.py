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


def detect_trusted_url_node(state: GraphState) -> dict:
    candidates = state.get("detected_urls", [])
    trusted_url = first_trusted_url(candidates, settings.TRUSTED_ISSUER_DOMAINS)

    if trusted_url:
        logger.info("[ROUTE] Trusted URL found: %s -> will attempt web verification", trusted_url)
    else:
        logger.info(
            "[ROUTE] No trusted URL among %d candidate(s) (%s) -> skipping to fuzzy match, "
            "source will be TEXT_ONLY",
            len(candidates),
            candidates,
        )

    return {"trusted_url": trusted_url}


def route_by_url(state: GraphState) -> Literal["scrape", "fuzzy_match"]:
    return "scrape" if state.get("trusted_url") else "fuzzy_match"
