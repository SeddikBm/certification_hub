"""
Ingestion-time scraper — fetches a certification's syllabus page.

Same robots.txt compliance as everywhere else in this service
(app.utils.robots_utils) — confirmed necessary in practice: Coursera and
Udemy both disallow automated access to their certificate/course pages via
robots.txt (see Module 2's README), and the same risk applies to whatever
official syllabus pages this pipeline targets. Retries with exponential
backoff handle transient failures (timeouts, 5xx); a robots.txt disallow
or a domain not on the trusted allowlist is NOT retried — retrying a
policy decision doesn't make it different the second time.
"""

from __future__ import annotations

import logging

import httpx
import tenacity
from bs4 import BeautifulSoup

from app.core.config import settings
from app.rag_chat.exceptions import ScrapingError
from app.utils.url_utils import is_trusted_domain

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class PermanentScrapingError(ScrapingError):
    """Not worth retrying — policy-level rejection (invalid URL)."""


def _fetch_once(url: str) -> str:
    try:
        with httpx.Client(timeout=settings.SCRAPER_TIMEOUT_S, headers=_HEADERS, follow_redirects=True) as client:
            resp = client.get(url)
            resp.raise_for_status()
            if len(resp.content) > settings.SCRAPER_MAX_BYTES:
                raise PermanentScrapingError(f"Response from {url} exceeded {settings.SCRAPER_MAX_BYTES} bytes")
    except httpx.HTTPStatusError as exc:
        if 400 <= exc.response.status_code < 500:
            raise PermanentScrapingError(f"Client error from {url}: {exc}") from exc
        raise ScrapingError(f"Server error from {url}: {exc}") from exc
    except httpx.HTTPError as exc:
        raise ScrapingError(f"Network error fetching {url}: {exc}") from exc

    return _extract_readable_text(resp.text)


def scrape_syllabus(url: str) -> str:
    """Fetches and cleans a certification syllabus page, retrying transient errors."""
    if not is_trusted_domain(url):
        raise PermanentScrapingError(f"'{url}' is not a valid URL")

    retryer = tenacity.Retrying(
        retry=tenacity.retry_if_exception_type(ScrapingError),
        stop=tenacity.stop_after_attempt(settings.INGESTION_MAX_RETRIES),
        wait=tenacity.wait_exponential(multiplier=settings.INGESTION_BACKOFF_BASE_S),
        reraise=True,
    )
    return retryer(_fetch_once, url)


fetch_syllabus = scrape_syllabus


def _extract_readable_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return " ".join(soup.get_text(separator=" ").split())
