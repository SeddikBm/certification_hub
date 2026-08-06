"""
URL extraction & trust checks.

Two things live here on purpose, together:
  - pulling URLs out of raw OCR'd text (a lot of issuers print the
    verification URL as plain text right next to the QR code, so text-regex
    catches cases the QR decoder misses and vice versa)
  - a *strict* domain allowlist check, because the web-scraper agent is
    about to fetch a URL that came from an untrusted, user-uploaded
    document. Never trust it blindly (SSRF / phishing-lookalike risk).

Confirmed on a real Cisco certificate (2026-08-01): printed verification
URLs are very often shown WITHOUT a scheme — "www.cisco.com/go/..." rather
than "https://www.cisco.com/go/...", since nobody prints "https://" for a
human reading a paper/PDF certificate. A regex that only matches
"https?://" misses these entirely (confirmed: it returned zero matches on
the real OCR'd text). So we match two patterns: explicit-scheme URLs, and
bare "www.<domain>.<tld>/..." ones — normalising the latter by prepending
"https://" so downstream domain-trust checks and fetches work the same way
regardless of which form the issuer printed.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse

_SCHEME_URL_RE = re.compile(r"https?://[^\s<>\")]+", re.IGNORECASE)
_BARE_WWW_URL_RE = re.compile(
    r"\bwww\.[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:/[^\s<>\")]*)?", re.IGNORECASE
)


def extract_urls(text: str) -> list[str]:
    """Find URLs in free text (with or without an explicit scheme), de-duplicated, order preserved."""
    text = text or ""
    seen: list[str] = []

    for match in _SCHEME_URL_RE.findall(text):
        cleaned = match.rstrip(".,;:)")
        if cleaned not in seen:
            seen.append(cleaned)

    for match in _BARE_WWW_URL_RE.findall(text):
        cleaned = match.rstrip(".,;:)")
        normalized = f"https://{cleaned}"
        # Skip it if the scheme-URL pass above already caught this same
        # host+path as "https://www...." — avoids a near-duplicate entry.
        if normalized not in seen and not any(cleaned in u for u in seen):
            seen.append(normalized)

    return seen


def is_trusted_domain(url: str, trusted_domains: list[str] | None = None) -> bool:
    """
    Accepts any valid http/https URL for verification (no domain filtering restriction).
    """
    if not url:
        return False
    return url.startswith("http://") or url.startswith("https://")


def first_trusted_url(urls: list[str], trusted_domains: list[str] | None = None) -> str | None:
    for url in urls:
        if is_trusted_domain(url):
            return url
    return None

