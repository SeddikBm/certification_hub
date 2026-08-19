"""
Live web-scraping fallback (Agent Web Scraper — "temps réel").

Only ever called when the Retrieval Grader decides the cached/embedded
knowledge base is insufficient. It uses the trusted issuer-domain allowlist
shared by the application.
"""

from __future__ import annotations

import logging

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.rag_chat.exceptions import ScrapingError
from app.utils.url_utils import is_trusted_domain

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def fetch_live_content(url: str) -> str:
    """Returns readable plain text extracted from the page, or raises ScrapingError."""
    if not is_trusted_domain(url):
        raise ScrapingError(f"'{url}' is not a valid URL")

    try:
        with httpx.Client(timeout=settings.SCRAPER_TIMEOUT_S, headers=_HEADERS, follow_redirects=True) as client:
            resp = client.get(url)
            resp.raise_for_status()
            if len(resp.content) > settings.SCRAPER_MAX_BYTES:
                raise ScrapingError(f"Response from {url} exceeded size guard")
    except httpx.HTTPError as exc:
        raise ScrapingError(f"Could not fetch {url}: {exc}") from exc

    return _extract_readable_text(resp.text)


def _extract_readable_text(html: str, max_chars: int = 6000) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = " ".join(soup.get_text(separator=" ").split())
    return text[:max_chars]
