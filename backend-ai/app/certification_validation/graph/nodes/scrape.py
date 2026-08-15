"""
Node: scrape_node — "Agent Web Scraper, Extrait le vrai nom sur le site officiel".

Never allowed to fail the whole request: if the issuer site is down, rate
limits us, or changes its markup, we degrade to the OCR/LLM reading
(source stays TEXT_ONLY) rather than losing the submission. The evaluate
node is what ultimately decides that "no web proof" caps the outcome at
PENDING_REVIEW rather than auto-REJECTED — a scraping hiccup should never
by itself read as fraud.
"""

from __future__ import annotations

import logging

from app.exceptions import UntrustedDomainError, WebScrapingError
from app.schemas.state import GraphState
from app.services.scraper.web_scraper import verify_on_issuer_site

logger = logging.getLogger(__name__)


def scrape_node(state: GraphState) -> dict:
    url = state["trusted_url"]
    logger.info("[SCRAPING] Verifying against issuer site: %s", url)

    try:
        scraped = verify_on_issuer_site(url)
    except (WebScrapingError, UntrustedDomainError) as exc:
        logger.warning("[SCRAPING] Verification failed for %s: %s", url, exc)
        return {"scraped": None, "scrape_error": str(exc)}
    except Exception as exc:  # noqa: BLE001 — intentional: see module docstring
        logger.error("[SCRAPING] Unexpected error verifying %s: %s", url, exc)
        return {"scraped": None, "scrape_error": f"Unexpected scraping error: {exc}"}

    logger.info(
        "[SCRAPING] Verified: name=%r title=%r issuer=%r",
        scraped.holder_name,
        scraped.certification_title,
        scraped.issuer,
    )
    return {"scraped": scraped, "scrape_error": None}
