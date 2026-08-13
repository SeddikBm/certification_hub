# from __future__ import annotations

# import json
# import logging
# import re
# from datetime import date
# from functools import lru_cache
# from urllib.parse import urlparse
# from urllib.robotparser import RobotFileParser

# import httpx
# from bs4 import BeautifulSoup

# from app.core.config import settings
# from app.exceptions import UntrustedDomainError, WebScrapingError
# from app.schemas.validation import ParsedCertificate
# from app.utils.url_utils import is_trusted_domain

# logger = logging.getLogger(__name__)

# _HEADERS = {
#     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
#     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
#     "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
# }


# @lru_cache(maxsize=256)
# def _robots_parser_for(origin: str) -> RobotFileParser:
#     """One robots.txt fetch per origin (scheme://host), cached."""
#     parser = RobotFileParser()
#     try:
#         resp = httpx.get(
#             f"{origin}/robots.txt",
#             timeout=settings.SCRAPER_TIMEOUT_S,
#             headers=_HEADERS,
#             follow_redirects=True,
#         )
#         parser.parse(resp.text.splitlines() if resp.status_code < 400 else [])
#     except httpx.HTTPError:
#         parser.parse([])
#     return parser


# def _is_allowed_by_robots(url: str) -> bool:
#     # Always allow scraping official verification pages (Coursera, Udemy, Credly, LinkedIn, etc.)
#     return True



# def _fetch(url: str, domain_host: str) -> str:
#     try:
#         with httpx.Client(
#             timeout=settings.SCRAPER_TIMEOUT_S,
#             headers=_HEADERS,
#             follow_redirects=True,
#         ) as client:
#             resp = client.get(url)
#             resp.raise_for_status()
#             if len(resp.content) > settings.SCRAPER_MAX_BYTES:
#                 raise WebScrapingError(f"Response from {domain_host} exceeded size guard")
#     except httpx.HTTPError as exc:
#         raise WebScrapingError(f"Could not fetch {url}: {exc}") from exc
#     return resp.text


# def _parse_json_ld(soup: BeautifulSoup) -> dict:
#     for tag in soup.find_all("script", type="application/ld+json"):
#         try:
#             data = json.loads(tag.string or "{}")
#         except (json.JSONDecodeError, TypeError):
#             continue
#         if isinstance(data, dict) and any(
#             k in data for k in ("credentialSubject", "recipient", "name")
#         ):
#             return data
#     return {}


# _MONTHS_MAP = {
#     "january": 1, "jan": 1,
#     "february": 2, "feb": 2,
#     "march": 3, "mar": 3,
#     "april": 4, "apr": 4,
#     "may": 5,
#     "june": 6, "jun": 6,
#     "july": 7, "jul": 7,
#     "august": 8, "aug": 8,
#     "september": 9, "sep": 9, "sept": 9,
#     "october": 10, "oct": 10,
#     "november": 11, "nov": 11,
#     "december": 12, "dec": 12,
# }

# _DATE_RE = re.compile(
#     r"\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b",
#     re.IGNORECASE,
# )

# _COMPLETED_BY_RE = re.compile(
#     r"Completed by\s+([A-Za-z\s\-\'\.]+?)(?=\s*(?:\n|\r|September|October|November|December|January|February|March|April|May|June|July|August|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d|\.|Grade|Account|$))",
#     re.IGNORECASE,
# )


# def _extract_date_from_text(text: str) -> date | None:
#     match = _DATE_RE.search(text)
#     if not match:
#         return None
#     try:
#         month_str, day_str, year_str = match.groups()
#         month_num = _MONTHS_MAP.get(month_str.lower(), 1)
#         return date(int(year_str), month_num, int(day_str))
#     except Exception:
#         return None


# def _generic_extract(html: str, url: str) -> ParsedCertificate:
#     soup = BeautifulSoup(html, "html.parser")
#     ld = _parse_json_ld(soup)
#     page_text = soup.get_text(separator=" ")

#     def meta(prop: str) -> str | None:
#         tag = soup.find("meta", attrs={"property": prop}) or soup.find(
#             "meta", attrs={"name": prop}
#         )
#         return tag.get("content") if tag else None

#     holder_name = (
#         (ld.get("recipient") or {}).get("name")
#         if isinstance(ld.get("recipient"), dict)
#         else ld.get("name")
#     )

#     if not holder_name:
#         match = _COMPLETED_BY_RE.search(page_text)
#         if match:
#             holder_name = match.group(1).strip()

#     # Search for course title in h1 or og:title
#     h1_tag = soup.find("h1")
#     title = h1_tag.get_text().strip() if h1_tag else (meta("og:title") or (soup.title.string if soup.title else None))
#     if title and " | Coursera" in title:
#         title = title.replace(" | Coursera", "").strip()

#     issue_date = _extract_date_from_text(page_text)

#     return ParsedCertificate(
#         holder_name=holder_name,
#         certification_title=title.strip() if title else None,
#         issue_date=issue_date,
#         issuer=None,
#     )



# _CREDLY_BADGE_ID_RE = re.compile(r"/badges/([0-9a-fA-F-]{36})")


# def _extract_credly(html: str, url: str) -> ParsedCertificate:
#     result = _generic_extract(html, url)

#     match = _CREDLY_BADGE_ID_RE.search(url)
#     if not match:
#         return result

#     try:
#         resp = httpx.get(
#             f"https://api.credly.com/v1/obi/v2/badge_assertions/{match.group(1)}",
#             timeout=settings.SCRAPER_TIMEOUT_S,
#             headers=_HEADERS,
#         )
#         api_data = resp.json() if resp.status_code == 200 else {}
#     except (httpx.HTTPError, ValueError):
#         api_data = {}

#     badge = api_data.get("badge", {})
#     if badge.get("name"):
#         result.certification_title = badge["name"]
#     if badge.get("issuer", {}).get("name"):
#         result.issuer = badge["issuer"]["name"]
#     if api_data.get("issuedOn"):
#         try:
#             result.issue_date = date.fromisoformat(api_data["issuedOn"][:10])
#         except ValueError:
#             logger.warning("Unparseable issuedOn from Credly API: %r", api_data.get("issuedOn"))
#     if api_data.get("revoked"):
#         result.certification_title = f"[REVOKED] {result.certification_title or ''}".strip()

#     return result


# _DOMAIN_EXTRACTORS = {
#     "credly.com": _extract_credly,
# }


# from app.services.llm.groq_client import GroqClient


# def verify_on_issuer_site(url: str) -> ParsedCertificate:
#     domain_host = urlparse(url).netloc.lower()

#     if not _is_allowed_by_robots(url):
#         raise WebScrapingError(
#             f"{domain_host} disallows automated access via robots.txt — "
#             "cannot verify this certificate programmatically against the issuer's site."
#         )

#     html = _fetch(url, domain_host)
#     soup = BeautifulSoup(html, "html.parser")
#     page_text = soup.get_text(separator="\n", strip=True)

#     logger.info("==========================================")
#     logger.info("[WEB SCRAPING RAW HTML FETCHED] URL=%s (length=%d bytes, text_length=%d chars)", url, len(html), len(page_text))
#     logger.info("[WEB SCRAPING RAW TEXT FIRST 400 CHARS]:\n%s", page_text[:400])
#     logger.info("==========================================")

#     # 1. Utiliser le LLM pour parser universellement le texte de la page web scrapée
#     llm_result: ParsedCertificate | None = None
#     if settings.GROQ_API_KEY:
#         try:
#             groq_client = GroqClient()
#             llm_result = groq_client.extract_fields(page_text[:8000])
#             logger.info(
#                 "[SCRAPING-LLM] Extraction LLM réussie sur %s: name=%r title=%r date=%r",
#                 url,
#                 llm_result.holder_name,
#                 llm_result.certification_title,
#                 llm_result.issue_date,
#             )
#         except Exception as exc:
#             logger.warning("[SCRAPING-LLM] Échec parsing LLM sur %s: %s", url, exc)


#     # 2. Extracteur HTML/JSON-LD générique en secours/complément
#     extractor = next(
#         (fn for domain, fn in _DOMAIN_EXTRACTORS.items() if domain in domain_host),
#         _generic_extract,
#     )
#     fallback_result = extractor(html, url)

#     if llm_result and (llm_result.holder_name or llm_result.certification_title or llm_result.issue_date):
#         holder_name = llm_result.holder_name or fallback_result.holder_name
#         title = llm_result.certification_title or fallback_result.certification_title
#         issue_date = llm_result.issue_date or fallback_result.issue_date
#         issuer = llm_result.issuer or fallback_result.issuer or domain_host
#         result = ParsedCertificate(
#             holder_name=holder_name,
#             certification_title=title,
#             issue_date=issue_date,
#             issuer=issuer,
#         )
#     else:
#         result = fallback_result
#         result.issuer = result.issuer or domain_host

#     return result
from __future__ import annotations

import json
import logging
import re
from datetime import date
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.exceptions import UntrustedDomainError, WebScrapingError
from app.schemas.validation import ParsedCertificate
from app.utils.url_utils import is_trusted_domain
from app.services.llm.groq_client import GroqClient

logger = logging.getLogger(__name__)


_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
}


# ---------------------------------------------------------------------------
# 1. Required fields
# ---------------------------------------------------------------------------

_REQUIRED_FIELDS = (
    "holder_name",
    "certification_title",
    "issue_date",
    "issuer",
)


def _is_complete(result: ParsedCertificate | None) -> bool:
    """
    Return True only when all core certificate fields are available.

    For a fraud-sensitive workflow, partial extraction is not considered
    sufficient to stop the pipeline.
    """
    if result is None:
        return False

    return all(
        getattr(result, field, None) not in (None, "")
        for field in _REQUIRED_FIELDS
    )


def _merge_results(
    primary: ParsedCertificate | None,
    secondary: ParsedCertificate | None,
) -> ParsedCertificate:
    """
    Merge two extraction results.

    Primary source wins field-by-field.
    Secondary source only fills missing values.
    """
    primary = primary or ParsedCertificate()
    secondary = secondary or ParsedCertificate()

    return ParsedCertificate(
        holder_name=(
            primary.holder_name
            or secondary.holder_name
        ),
        certification_title=(
            primary.certification_title
            or secondary.certification_title
        ),
        issue_date=(
            primary.issue_date
            or secondary.issue_date
        ),
        issuer=(
            primary.issuer
            or secondary.issuer
        ),
    )


# ---------------------------------------------------------------------------
# 2. HTTP fetching
# ---------------------------------------------------------------------------

def _fetch(url: str, domain_host: str) -> str:
    """
    Download the verification page.

    No robots.txt handling is performed here by design.
    """
    try:
        with httpx.Client(
            timeout=settings.SCRAPER_TIMEOUT_S,
            headers=_HEADERS,
            follow_redirects=True,
        ) as client:

            response = client.get(url)

            response.raise_for_status()

            if len(response.content) > settings.SCRAPER_MAX_BYTES:
                raise WebScrapingError(
                    f"Response from {domain_host} exceeded size guard"
                )

            content_type = response.headers.get(
                "content-type",
                "",
            ).lower()

            if "text/html" not in content_type:
                raise WebScrapingError(
                    f"Expected HTML from {url}, "
                    f"received Content-Type={content_type}"
                )

            return response.text

    except WebScrapingError:
        raise

    except httpx.HTTPError as exc:
        raise WebScrapingError(
            f"Could not fetch {url}: {exc}"
        ) from exc


# ---------------------------------------------------------------------------
# 3. HTML cleanup
# ---------------------------------------------------------------------------

_REMOVE_TAGS = {
    "script",
    "style",
    "noscript",
    "template",
    "svg",
    "canvas",
    "iframe",
}


def _clean_html_for_extraction(
    soup: BeautifulSoup,
) -> BeautifulSoup:
    """
    Remove elements that normally contain navigation, executable code,
    presentation-only content or unrelated embedded content.

    JSON-LD must NOT be removed before _parse_json_ld() is called.
    """
    for tag in soup.find_all(
        list(_REMOVE_TAGS)
    ):
        tag.decompose()

    for tag in soup.find_all(
        ["nav", "footer", "aside"]
    ):
        tag.decompose()

    return soup


def _extract_clean_page_text(
    soup: BeautifulSoup,
) -> str:
    """
    Extract visible text after removing common page-noise containers.
    """
    clean_soup = _clean_html_for_extraction(soup)

    text = clean_soup.get_text(
        separator="\n",
        strip=True,
    )

    # Collapse excessive blank lines.
    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text


# ---------------------------------------------------------------------------
# 4. JSON-LD
# ---------------------------------------------------------------------------

def _iter_json_ld_objects(
    soup: BeautifulSoup,
):
    """
    Yield every JSON-LD object found in the page.

    Handles:
      - single dictionaries
      - arrays
      - @graph structures
    """
    for tag in soup.find_all(
        "script",
        attrs={"type": "application/ld+json"},
    ):
        raw = tag.string or tag.get_text()

        if not raw:
            continue

        try:
            data = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            continue

        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    yield item

        elif isinstance(data, dict):
            graph = data.get("@graph")

            if isinstance(graph, list):
                for item in graph:
                    if isinstance(item, dict):
                        yield item

            yield data


def _parse_json_ld(
    soup: BeautifulSoup,
) -> dict:
    """
    Select the most certificate-relevant JSON-LD object.
    """
    candidates = list(
        _iter_json_ld_objects(soup)
    )

    if not candidates:
        return {}

    preferred_keys = {
        "credentialSubject",
        "recipient",
        "issuer",
        "dateIssued",
        "issuedOn",
        "achievement",
    }

    for candidate in candidates:
        if any(
            key in candidate
            for key in preferred_keys
        ):
            return candidate

    return candidates[0]


# ---------------------------------------------------------------------------
# 5. JSON-LD helpers
# ---------------------------------------------------------------------------

def _get_name(value) -> str | None:
    """
    Extract a name from common structured-data representations.
    """
    if isinstance(value, str):
        return value.strip() or None

    if isinstance(value, dict):
        name = value.get("name")
        if isinstance(name, str):
            return name.strip() or None

    return None


def _extract_holder_from_json_ld(
    ld: dict,
) -> str | None:

    for key in (
        "recipient",
        "credentialSubject",
        "earner",
    ):
        value = ld.get(key)

        name = _get_name(value)

        if name:
            return name

    return _get_name(ld.get("name"))


def _extract_issuer_from_json_ld(
    ld: dict,
) -> str | None:

    issuer = ld.get("issuer")

    if isinstance(issuer, list):
        for item in issuer:
            name = _get_name(item)
            if name:
                return name

    return _get_name(issuer)


def _extract_title_from_json_ld(
    ld: dict,
) -> str | None:

    for key in (
        "name",
        "headline",
        "title",
    ):
        value = ld.get(key)

        if isinstance(value, str) and value.strip():
            return value.strip()

    achievement = ld.get("achievement")

    if isinstance(achievement, dict):
        return _get_name(achievement)

    return None


# ---------------------------------------------------------------------------
# 6. Dates
# ---------------------------------------------------------------------------

_MONTHS_MAP = {
    "january": 1,
    "jan": 1,
    "february": 2,
    "feb": 2,
    "march": 3,
    "mar": 3,
    "april": 4,
    "apr": 4,
    "may": 5,
    "june": 6,
    "jun": 6,
    "july": 7,
    "jul": 7,
    "august": 8,
    "aug": 8,
    "september": 9,
    "sep": 9,
    "sept": 9,
    "october": 10,
    "oct": 10,
    "november": 11,
    "nov": 11,
    "december": 12,
    "dec": 12,
}


_DATE_RE = re.compile(
    r"\b("
    r"January|February|March|April|May|June|July|August|"
    r"September|October|November|December|"
    r"Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec"
    r")\s+"
    r"(\d{1,2}),?\s+"
    r"(\d{4})\b",
    re.IGNORECASE,
)


def _extract_date_from_text(
    text: str,
) -> date | None:

    match = _DATE_RE.search(text)

    if not match:
        return None

    try:
        month_str, day_str, year_str = match.groups()

        month_num = _MONTHS_MAP[
            month_str.lower()
        ]

        return date(
            int(year_str),
            month_num,
            int(day_str),
        )

    except (ValueError, KeyError):
        return None


def _extract_structured_date(
    ld: dict,
) -> date | None:

    for key in (
        "dateIssued",
        "issuedOn",
        "issueDate",
        "dateCreated",
    ):
        value = ld.get(key)

        if not isinstance(value, str):
            continue

        try:
            return date.fromisoformat(
                value[:10]
            )
        except ValueError:
            continue

    return None


# ---------------------------------------------------------------------------
# 7. Regex fallback
# ---------------------------------------------------------------------------

_COMPLETED_BY_RE = re.compile(
    r"\bCompleted\s+by\s+"
    r"([^\n\r|]+)",
    re.IGNORECASE,
)

_AWARDED_TO_RE = re.compile(
    r"\bAwarded\s+to\s+"
    r"([^\n\r|]+)",
    re.IGNORECASE,
)

_EARNED_BY_RE = re.compile(
    r"\bEarned\s+by\s+"
    r"([^\n\r|]+)",
    re.IGNORECASE,
)


def _extract_holder_by_regex(
    text: str,
) -> str | None:

    for pattern in (
        _COMPLETED_BY_RE,
        _AWARDED_TO_RE,
        _EARNED_BY_RE,
    ):
        match = pattern.search(text)

        if match:
            value = match.group(1).strip()

            # Prevent obvious contamination.
            value = re.split(
                r"\b(?:Grade|Account|Date|Issued|Completed)\b",
                value,
                maxsplit=1,
                flags=re.IGNORECASE,
            )[0].strip()

            if value:
                return value

    return None


# ---------------------------------------------------------------------------
# 8. Generic deterministic extractor
# ---------------------------------------------------------------------------

def _generic_extract(
    html: str,
    url: str,
) -> ParsedCertificate:

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    # JSON-LD must be parsed BEFORE removing script tags.
    ld = _parse_json_ld(soup)

    # Now clean the page for visible-text extraction.
    clean_soup = _clean_html_for_extraction(soup)

    page_text = clean_soup.get_text(
        separator="\n",
        strip=True,
    )

    # -------------------------
    # Holder
    # -------------------------

    holder_name = _extract_holder_from_json_ld(
        ld
    )

    if not holder_name:
        holder_name = _extract_holder_by_regex(
            page_text
        )

    # -------------------------
    # Title
    # -------------------------

    title = _extract_title_from_json_ld(
        ld
    )

    if not title:
        h1 = clean_soup.find("h1")

        if h1:
            title = h1.get_text(
                " ",
                strip=True,
            )

    if not title:
        meta = (
            clean_soup.find(
                "meta",
                attrs={"property": "og:title"},
            )
            or clean_soup.find(
                "meta",
                attrs={"name": "twitter:title"},
            )
        )

        if meta:
            title = meta.get("content")

    if not title and clean_soup.title:
        title = clean_soup.title.get_text(
            " ",
            strip=True,
        )

    if title:
        title = re.sub(
            r"\s*\|\s*Coursera\s*$",
            "",
            title,
            flags=re.IGNORECASE,
        ).strip()

    # -------------------------
    # Date
    # -------------------------

    issue_date = _extract_structured_date(
        ld
    )

    if not issue_date:
        issue_date = _extract_date_from_text(
            page_text
        )

    # -------------------------
    # Issuer
    # -------------------------

    issuer = _extract_issuer_from_json_ld(
        ld
    )

    return ParsedCertificate(
        holder_name=holder_name,
        certification_title=title,
        issue_date=issue_date,
        issuer=issuer,
    )


# ---------------------------------------------------------------------------
# 9. Credly API
# ---------------------------------------------------------------------------

_CREDLY_BADGE_ID_RE = re.compile(
    r"/badges/([0-9a-fA-F-]{36})(?:[/?#]|$)",
    re.IGNORECASE,
)


def _extract_credly_api(
    url: str,
) -> ParsedCertificate | None:
    """
    Try to obtain authoritative structured data from Credly.

    This function does NOT scrape the HTML page.
    """
    match = _CREDLY_BADGE_ID_RE.search(url)

    if not match:
        logger.warning(
            "[CREDLY] Could not extract badge ID from %s",
            url,
        )
        return None

    badge_id = match.group(1)

    api_url = (
        "https://api.credly.com/"
        f"v1/obi/v2/badge_assertions/{badge_id}"
    )

    try:
        with httpx.Client(
            timeout=settings.SCRAPER_TIMEOUT_S,
            headers=_HEADERS,
            follow_redirects=True,
        ) as client:

            response = client.get(api_url)

            if response.status_code != 200:
                logger.warning(
                    "[CREDLY API] HTTP %s for %s",
                    response.status_code,
                    api_url,
                )
                return None

            if len(response.content) > settings.SCRAPER_MAX_BYTES:
                raise WebScrapingError(
                    "Credly API response exceeded size guard"
                )

            data = response.json()

    except (httpx.HTTPError, ValueError) as exc:
        logger.warning(
            "[CREDLY API] Failed for %s: %s",
            url,
            exc,
        )
        return None

    badge = data.get("badge") or {}

    holder = (
        _get_name(data.get("recipient"))
        or _get_name(data.get("credentialSubject"))
        or _get_name(data.get("earner"))
    )

    title = _get_name(badge.get("name"))

    issuer = _get_name(
        badge.get("issuer")
    )

    issue_date = None

    for key in (
        "issuedOn",
        "dateIssued",
        "issueDate",
    ):
        value = data.get(key)

        if isinstance(value, str):
            try:
                issue_date = date.fromisoformat(
                    value[:10]
                )
                break
            except ValueError:
                pass

    result = ParsedCertificate(
        holder_name=holder,
        certification_title=title,
        issue_date=issue_date,
        issuer=issuer,
    )

    # Preserve revocation information if your schema
    # does not have a dedicated revoked field.
    if data.get("revoked"):
        result.certification_title = (
            f"[REVOKED] "
            f"{result.certification_title or ''}"
        ).strip()

    return result


# ---------------------------------------------------------------------------
# 10. Domain-specific HTML extractors
# ---------------------------------------------------------------------------

def _extract_credly_html(
    html: str,
    url: str,
) -> ParsedCertificate:

    """
    Credly-specific HTML fallback.

    API is preferred. This is used only when API data
    is unavailable or incomplete.
    """
    result = _generic_extract(
        html,
        url,
    )

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    text = _extract_clean_page_text(
        soup
    )

    # Credly pages visibly expose "Issued by ...".
    issuer_match = re.search(
        r"\bIssued\s+by\s+([^\n\r]+)",
        text,
        re.IGNORECASE,
    )

    if issuer_match and not result.issuer:
        result.issuer = (
            issuer_match.group(1).strip()
        )

    return result


_DOMAIN_HTML_EXTRACTORS = {
    "credly.com": _extract_credly_html,
}


def _get_domain_extractor(
    hostname: str,
):
    """
    Resolve an extractor using exact hostname/domain suffix matching.
    """
    hostname = hostname.lower().split(":")[0]

    for domain, extractor in _DOMAIN_HTML_EXTRACTORS.items():

        if (
            hostname == domain
            or hostname.endswith("." + domain)
        ):
            return extractor

    return _generic_extract


# ---------------------------------------------------------------------------
# 11. LLM input preparation
# ---------------------------------------------------------------------------

def _prepare_llm_text(
    html: str,
) -> str:

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    text = _extract_clean_page_text(
        soup
    )

    # Limit input after cleaning, not before.
    return text[:8000]


# ---------------------------------------------------------------------------
# 12. Main verification pipeline
# ---------------------------------------------------------------------------

def verify_on_issuer_site(
    url: str,
) -> ParsedCertificate:

    parsed = urlparse(url)

    hostname = (
        parsed.hostname or ""
    ).lower()

    if not hostname:
        raise UntrustedDomainError(
            f"Invalid verification URL: {url}"
        )

    # ----------------------------------------------------
    # STEP 1 — Trusted domain validation
    # ----------------------------------------------------

    if not is_trusted_domain(url):
        raise UntrustedDomainError(
            f"Untrusted verification domain: {hostname}"
        )

    logger.info(
        "[VERIFY] Starting verification: %s",
        url,
    )

    # ----------------------------------------------------
    # STEP 2 — Official/domain API first
    # ----------------------------------------------------

    api_result = None

    if (
        hostname == "credly.com"
        or hostname.endswith(".credly.com")
    ):
        api_result = _extract_credly_api(url)

        if _is_complete(api_result):
            logger.info(
                "[VERIFY] Credly API returned complete result"
            )
            return api_result

    # ----------------------------------------------------
    # STEP 3 — Fetch verification page
    # ----------------------------------------------------

    html = _fetch(
        url,
        hostname,
    )

    logger.info(
        "[SCRAPER] HTML fetched: url=%s bytes=%d",
        url,
        len(html),
    )

    # ----------------------------------------------------
    # STEP 4 — Deterministic/domain extraction
    # ----------------------------------------------------

    extractor = _get_domain_extractor(
        hostname
    )

    deterministic_result = extractor(
        html,
        url,
    )

    # API data has higher priority than HTML data.
    result = _merge_results(
        api_result,
        deterministic_result,
    )

    logger.info(
        "[EXTRACTION] deterministic result: "
        "holder=%r title=%r date=%r issuer=%r",
        result.holder_name,
        result.certification_title,
        result.issue_date,
        result.issuer,
    )

    # ----------------------------------------------------
    # STEP 5 — Stop if deterministic extraction is enough
    # ----------------------------------------------------

    if _is_complete(result):
        logger.info(
            "[VERIFY] Complete result obtained without LLM"
        )
        return result

    # ----------------------------------------------------
    # STEP 6 — LLM only when deterministic extraction
    #         is incomplete
    # ----------------------------------------------------

    if not settings.GROQ_API_KEY:
        logger.warning(
            "[VERIFY] Deterministic extraction incomplete "
            "and GROQ_API_KEY is not configured"
        )

        return result

    llm_text = _prepare_llm_text(
        html
    )

    if not llm_text:
        logger.warning(
            "[VERIFY] No useful text available for LLM"
        )
        return result

    logger.info(
        "[SCRAPING-LLM] Calling LLM because "
        "deterministic extraction is incomplete"
    )

    try:
        groq_client = GroqClient()

        llm_result = (
            groq_client.extract_fields(
                llm_text
            )
        )

        result = _merge_results(
            result,
            llm_result,
        )

        logger.info(
            "[SCRAPING-LLM] Result: "
            "holder=%r title=%r date=%r issuer=%r",
            llm_result.holder_name,
            llm_result.certification_title,
            llm_result.issue_date,
            llm_result.issuer,
        )

    except Exception as exc:
        logger.warning(
            "[SCRAPING-LLM] Extraction failed for %s: %s",
            url,
            exc,
        )

    return result

