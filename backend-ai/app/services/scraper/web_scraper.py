"""
Web verification agent.

Given a URL already confirmed to be on the trusted-issuer allowlist (see
app.utils.url_utils.is_trusted_domain — checked again here, defense in
depth), fetch the page and pull out the name/title the *issuer* actually
publishes. This is the "vraies données officielles" step: whatever this
returns outranks the OCR/LLM reading of the uploaded file, because the
issuer's own site can't be tampered with by whoever edited the PDF.

Two extraction strategies, not one per issuer:
  - Credly (credly.com) — AWS, Google Cloud, CompTIA, PMI, Cisco all issue
    badges here. Gets a dedicated extractor that also calls Credly's public
    Open Badges API for structured title/issuer/date/revocation data.
  - Everything else trusted (Coursera, Udemy, Microsoft Learn, ...) — the
    generic Open Graph / JSON-LD meta-tag reader. No per-domain path
    patterns to maintain (Coursera uses /verify/*, Udemy uses
    /certificate/*, Microsoft uses its own domain entirely) — the domain
    allowlist is what does the trust decision, this extractor doesn't need
    to know or care about the path shape.

On robots.txt: coursera.org and udemy.com both disallow automated access
to their certificate pages (confirmed 2026-07-31). httpx does not enforce
robots.txt on its own — nothing stops the code from fetching the page
anyway — but doing so means ignoring a site's explicitly stated crawl
policy, which is a real compliance/ToS question, not just a technicality.
`RESPECT_ROBOTS_TXT` (see core/config.py) makes that an explicit, logged,
opt-in decision instead of a silent default. When it's left on (the
default) and a site disallows access, that's treated exactly like any
other WebScrapingError — the graph already degrades gracefully to
source=TEXT_ONLY / PENDING_REVIEW for that.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import date
from functools import lru_cache
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.exceptions import UntrustedDomainError, WebScrapingError
from app.schemas.validation import ParsedCertificate
from app.utils.url_utils import is_trusted_domain

logger = logging.getLogger(__name__)

_HEADERS = {"User-Agent": "CertificationHub-Verifier/1.0 (+internal validation bot)"}


@lru_cache(maxsize=256)
def _robots_parser_for(origin: str) -> RobotFileParser:
    """One robots.txt fetch per origin (scheme://host), cached."""
    parser = RobotFileParser()
    try:
        resp = httpx.get(
            f"{origin}/robots.txt",
            timeout=settings.SCRAPER_TIMEOUT_S,
            headers=_HEADERS,
            follow_redirects=True,
        )
        # No robots.txt (404) or inaccessible => conventionally "allow all".
        parser.parse(resp.text.splitlines() if resp.status_code < 400 else [])
    except httpx.HTTPError:
        parser.parse([])
    return parser


def _is_allowed_by_robots(url: str) -> bool:
    if not settings.RESPECT_ROBOTS_TXT:
        # Deliberately logged, not a silent no-op: flipping this setting is
        # a decision made on purpose, not something that should look like
        # the check silently passed.
        logger.warning(
            "RESPECT_ROBOTS_TXT is disabled — fetching %s regardless of the "
            "issuer's stated crawl policy.",
            url,
        )
        return True

    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    return _robots_parser_for(origin).can_fetch(_HEADERS["User-Agent"], url)


def _fetch(url: str, domain_host: str) -> str:
    try:
        with httpx.Client(
            timeout=settings.SCRAPER_TIMEOUT_S,
            headers=_HEADERS,
            follow_redirects=True,
        ) as client:
            resp = client.get(url)
            resp.raise_for_status()
            if len(resp.content) > settings.SCRAPER_MAX_BYTES:
                raise WebScrapingError(f"Response from {domain_host} exceeded size guard")
    except httpx.HTTPError as exc:
        raise WebScrapingError(f"Could not fetch {url}: {exc}") from exc
    return resp.text


def _parse_json_ld(soup: BeautifulSoup) -> dict:
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "{}")
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(data, dict) and any(
            k in data for k in ("credentialSubject", "recipient", "name")
        ):
            return data
    return {}


def _generic_extract(html: str, url: str) -> ParsedCertificate:  # noqa: ARG001 (url kept for a uniform extractor signature)
    soup = BeautifulSoup(html, "html.parser")
    ld = _parse_json_ld(soup)

    def meta(prop: str) -> str | None:
        tag = soup.find("meta", attrs={"property": prop}) or soup.find(
            "meta", attrs={"name": prop}
        )
        return tag.get("content") if tag else None

    holder_name = (
        (ld.get("recipient") or {}).get("name")
        if isinstance(ld.get("recipient"), dict)
        else ld.get("name")
    )
    title = meta("og:title") or (soup.title.string if soup.title else None)

    return ParsedCertificate(
        holder_name=holder_name,
        certification_title=title.strip() if title else None,
        issuer=None,  # filled in by the caller, which knows the source domain
    )


_CREDLY_BADGE_ID_RE = re.compile(r"/badges/([0-9a-fA-F-]{36})")


def _extract_credly(html: str, url: str) -> ParsedCertificate:
    """
    Supplements the generic HTML read (still what supplies the holder's
    name — Credly's anonymous API returns a privacy-preserving SHA-256 hash
    there, not a plaintext name) with Credly's public Open Badges API for
    the badge title, issuer, issue date, and revocation status.
    """
    result = _generic_extract(html, url)

    match = _CREDLY_BADGE_ID_RE.search(url)
    if not match:
        return result

    try:
        resp = httpx.get(
            f"https://api.credly.com/v1/obi/v2/badge_assertions/{match.group(1)}",
            timeout=settings.SCRAPER_TIMEOUT_S,
            headers=_HEADERS,
        )
        api_data = resp.json() if resp.status_code == 200 else {}
    except (httpx.HTTPError, ValueError):
        api_data = {}

    badge = api_data.get("badge", {})
    if badge.get("name"):
        result.certification_title = badge["name"]
    if badge.get("issuer", {}).get("name"):
        result.issuer = badge["issuer"]["name"]
    if api_data.get("issuedOn"):
        try:
            result.issue_date = date.fromisoformat(api_data["issuedOn"][:10])
        except ValueError:
            logger.warning("Unparseable issuedOn from Credly API: %r", api_data.get("issuedOn"))
    if api_data.get("revoked"):
        result.certification_title = f"[REVOKED] {result.certification_title or ''}".strip()

    return result


# Keyed by the trusted domain string from settings.TRUSTED_ISSUER_DOMAINS.
# Anything not listed here falls back to _generic_extract — that's the
# common case (Coursera, Udemy, Microsoft Learn, ...), not the exception.
_DOMAIN_EXTRACTORS = {
    "credly.com": _extract_credly,
}


def verify_on_issuer_site(url: str) -> ParsedCertificate:
    domain_host = urlparse(url).netloc.lower()

    if not is_trusted_domain(url, settings.TRUSTED_ISSUER_DOMAINS):
        raise UntrustedDomainError(f"'{domain_host}' is not on the trusted issuer allowlist")

    if not _is_allowed_by_robots(url):
        raise WebScrapingError(
            f"{domain_host} disallows automated access via robots.txt — "
            "cannot verify this certificate programmatically against the issuer's site."
        )

    html = _fetch(url, domain_host)

    extractor = next(
        (fn for domain, fn in _DOMAIN_EXTRACTORS.items() if domain in domain_host),
        _generic_extract,
    )
    result = extractor(html, url)
    result.issuer = result.issuer or domain_host
    return result
