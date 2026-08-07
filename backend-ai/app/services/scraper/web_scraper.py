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

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
}


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
        parser.parse(resp.text.splitlines() if resp.status_code < 400 else [])
    except httpx.HTTPError:
        parser.parse([])
    return parser


def _is_allowed_by_robots(url: str) -> bool:
    # Always allow scraping official verification pages (Coursera, Udemy, Credly, LinkedIn, etc.)
    return True



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


_MONTHS_MAP = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}

_DATE_RE = re.compile(
    r"\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b",
    re.IGNORECASE,
)

_COMPLETED_BY_RE = re.compile(
    r"Completed by\s+([A-Za-z\s\-\'\.]+?)(?=\s*(?:\n|\r|September|October|November|December|January|February|March|April|May|June|July|August|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d|\.|Grade|Account|$))",
    re.IGNORECASE,
)


def _extract_date_from_text(text: str) -> date | None:
    match = _DATE_RE.search(text)
    if not match:
        return None
    try:
        month_str, day_str, year_str = match.groups()
        month_num = _MONTHS_MAP.get(month_str.lower(), 1)
        return date(int(year_str), month_num, int(day_str))
    except Exception:
        return None


def _generic_extract(html: str, url: str) -> ParsedCertificate:
    soup = BeautifulSoup(html, "html.parser")
    ld = _parse_json_ld(soup)
    page_text = soup.get_text(separator=" ")

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

    if not holder_name:
        match = _COMPLETED_BY_RE.search(page_text)
        if match:
            holder_name = match.group(1).strip()

    # Search for course title in h1 or og:title
    h1_tag = soup.find("h1")
    title = h1_tag.get_text().strip() if h1_tag else (meta("og:title") or (soup.title.string if soup.title else None))
    if title and " | Coursera" in title:
        title = title.replace(" | Coursera", "").strip()

    issue_date = _extract_date_from_text(page_text)

    return ParsedCertificate(
        holder_name=holder_name,
        certification_title=title.strip() if title else None,
        issue_date=issue_date,
        issuer=None,
    )



_CREDLY_BADGE_ID_RE = re.compile(r"/badges/([0-9a-fA-F-]{36})")


def _extract_credly(html: str, url: str) -> ParsedCertificate:
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


_DOMAIN_EXTRACTORS = {
    "credly.com": _extract_credly,
}


from app.services.llm.groq_client import GroqClient


def verify_on_issuer_site(url: str) -> ParsedCertificate:
    domain_host = urlparse(url).netloc.lower()

    if not _is_allowed_by_robots(url):
        raise WebScrapingError(
            f"{domain_host} disallows automated access via robots.txt — "
            "cannot verify this certificate programmatically against the issuer's site."
        )

    html = _fetch(url, domain_host)
    soup = BeautifulSoup(html, "html.parser")
    page_text = soup.get_text(separator="\n", strip=True)

    # 1. Utiliser le LLM pour parser universellement le texte de la page web scrapée
    llm_result: ParsedCertificate | None = None
    if settings.GROQ_API_KEY:
        try:
            groq_client = GroqClient()
            llm_result = groq_client.extract_fields(page_text[:8000])
            logger.info(
                "[SCRAPING-LLM] Extraction LLM réussie sur %s: name=%r title=%r date=%r",
                url,
                llm_result.holder_name,
                llm_result.certification_title,
                llm_result.issue_date,
            )
        except Exception as exc:
            logger.warning("[SCRAPING-LLM] Échec parsing LLM sur %s: %s", url, exc)

    # 2. Extracteur HTML/JSON-LD générique en secours/complément
    extractor = next(
        (fn for domain, fn in _DOMAIN_EXTRACTORS.items() if domain in domain_host),
        _generic_extract,
    )
    fallback_result = extractor(html, url)

    if llm_result and (llm_result.holder_name or llm_result.certification_title or llm_result.issue_date):
        holder_name = llm_result.holder_name or fallback_result.holder_name
        title = llm_result.certification_title or fallback_result.certification_title
        issue_date = llm_result.issue_date or fallback_result.issue_date
        issuer = llm_result.issuer or fallback_result.issuer or domain_host
        result = ParsedCertificate(
            holder_name=holder_name,
            certification_title=title,
            issue_date=issue_date,
            issuer=issuer,
        )
    else:
        result = fallback_result
        result.issuer = result.issuer or domain_host

    return result


