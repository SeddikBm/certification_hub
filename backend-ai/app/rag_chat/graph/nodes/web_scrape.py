"""
Node: web_scrape_node — "Agent Web Scraper (Extraction Temps Réel Contextuelle)".

Only reached when grade_retrieval_node judged the cached knowledge base
insufficient. Tries the official URL of the top-ranked (even if
insufficient) candidate, if there is one. Never fails the whole request —
on any error, generate_node downstream just proceeds with whatever it has
(possibly nothing beyond the original, insufficient chunks), and the
groundedness checker is the final safety net against an answer that
overstates what's actually known.
"""

from __future__ import annotations

import logging

from app.rag_chat.exceptions import ScrapingError
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.scraper.web_scraper import fetch_live_content

logger = logging.getLogger(__name__)


def web_scrape_node(state: GraphState) -> dict:
    chunks = state.get("vector_chunks", [])
    reasons = state.get("reasons", [])

    url = _official_url_for(chunks)
    if not url:
        logger.info("[SCRAPING] No official URL available for the top candidate — skipping.")
        return {
            "scraped_content": None,
            "scrape_error": "No official source URL was available to fetch.",
            "reasons": [*reasons, "[SCRAPING] Skipped: no official URL available."],
        }

    logger.info("[SCRAPING] Fetching live content: %s", url)
    try:
        content = fetch_live_content(url)
    except ScrapingError as exc:
        logger.warning("[SCRAPING] Failed for %s: %s", url, exc)
        return {
            "scraped_content": None,
            "scrape_error": str(exc),
            "reasons": [*reasons, f"[SCRAPING] Failed: {exc}"],
        }

    logger.info("[SCRAPING] Retrieved %d chars from %s", len(content), url)
    return {
        "scraped_content": content,
        "scrape_error": None,
        "reasons": [*reasons, f"[SCRAPING] Retrieved live content from {url}"],
    }


def _official_url_for(chunks) -> str | None:
    return chunks[0].source_url if chunks else None
