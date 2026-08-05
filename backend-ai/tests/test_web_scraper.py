"""
Tests for the web verification agent.

Covers the gates a URL must clear, in order, before we trust whatever it
says: (1) it's on our allowlist, (2) the site's own robots.txt allows us
to fetch it (unless explicitly disabled), (3) the fetch actually succeeds
and contains recognisable data. No real network access — httpx calls are
monkeypatched at each point.
"""

from __future__ import annotations

import json
from datetime import date

import httpx
import pytest

from app.exceptions import UntrustedDomainError, WebScrapingError
from app.services.scraper import web_scraper
from app.services.scraper.web_scraper import verify_on_issuer_site


@pytest.fixture(autouse=True)
def _isolate_robots_cache():
    """The robots.txt parser cache is per-process — clear it between tests
    so one test's monkeypatched response can't leak into another."""
    web_scraper._robots_parser_for.cache_clear()
    yield
    web_scraper._robots_parser_for.cache_clear()


def _fake_response(status_code=200, text="", content=b""):
    class _Resp:
        def __init__(self):
            self.status_code = status_code
            self.text = text
            self.content = content or text.encode()

        def raise_for_status(self):
            if self.status_code >= 400:
                raise httpx.HTTPStatusError("error", request=None, response=self)

        def json(self):
            return json.loads(self.text)

    return _Resp()


def test_untrusted_domain_is_rejected_before_any_network_call(monkeypatch):
    def _boom(*args, **kwargs):
        raise AssertionError("should never reach the network for an untrusted domain")

    monkeypatch.setattr(httpx, "get", _boom)
    with pytest.raises(UntrustedDomainError):
        verify_on_issuer_site("https://evil.com/fake-cert")


def test_robots_disallowed_blocks_the_scrape_without_fetching_the_page(monkeypatch):
    """Reproduces what we actually confirmed for coursera.org: robots.txt
    disallows /verify/*. The page itself must never be requested once
    robots.txt says no — unless RESPECT_ROBOTS_TXT is explicitly off."""
    robots_txt = "User-agent: *\nDisallow: /verify/\n"

    def fake_get(url, **kwargs):
        assert url.endswith("/robots.txt")
        return _fake_response(200, text=robots_txt)

    def fake_client_get(*args, **kwargs):
        raise AssertionError("page fetch must not happen when robots.txt disallows it")

    monkeypatch.setattr(httpx, "get", fake_get)
    monkeypatch.setattr(httpx.Client, "get", fake_client_get)

    with pytest.raises(WebScrapingError, match="robots.txt"):
        verify_on_issuer_site("https://coursera.org/verify/6OGLBB1GDF6R")


def test_respect_robots_txt_false_is_an_explicit_opt_out(monkeypatch):
    """Flipping RESPECT_ROBOTS_TXT off must actually skip the check — it's
    a deliberate, documented escape hatch (see config.py/README), never the
    default (conftest's _test_settings resets it to True for every other test)."""
    from app.core.config import settings

    settings.RESPECT_ROBOTS_TXT = False

    def fake_get(url, **kwargs):
        raise AssertionError("robots.txt must not even be fetched when the check is disabled")

    def fake_client_get(self, url, **kwargs):
        html = '<html><head><meta property="og:title" content="AZ-204" /></head></html>'
        return _fake_response(200, text=html)

    monkeypatch.setattr(httpx, "get", fake_get)
    monkeypatch.setattr(httpx.Client, "get", fake_client_get)

    result = verify_on_issuer_site("https://coursera.org/verify/anything")
    assert result.certification_title == "AZ-204"


def test_robots_allowed_but_missing_defaults_to_allow(monkeypatch):
    """A 404 on /robots.txt conventionally means 'no restrictions', not 'block everything'."""

    def fake_get(url, **kwargs):
        return _fake_response(404)

    def fake_client_get(self, url, **kwargs):
        html = (
            "<html><head>"
            '<meta property="og:title" content="AZ-204" />'
            "</head><body></body></html>"
        )
        return _fake_response(200, text=html)

    monkeypatch.setattr(httpx, "get", fake_get)
    monkeypatch.setattr(httpx.Client, "get", fake_client_get)

    result = verify_on_issuer_site("https://credly.com/badges/abc123")
    assert result.certification_title == "AZ-204"
    assert result.issuer == "credly.com"


def test_generic_extractor_reads_json_ld_recipient_name(monkeypatch):
    def fake_get(url, **kwargs):
        return _fake_response(404)  # no robots.txt => allowed

    def fake_client_get(self, url, **kwargs):
        html = """
        <html><head>
        <script type="application/ld+json">
        {"recipient": {"name": "Karim Alaoui"}, "name": "irrelevant top-level name"}
        </script>
        <meta property="og:title" content="AZ-204" />
        </head><body></body></html>
        """
        return _fake_response(200, text=html)

    monkeypatch.setattr(httpx, "get", fake_get)
    monkeypatch.setattr(httpx.Client, "get", fake_client_get)

    result = verify_on_issuer_site("https://credly.com/badges/abc123")
    assert result.holder_name == "Karim Alaoui"
    assert result.certification_title == "AZ-204"


def test_credly_extractor_supplements_html_with_the_public_open_badges_api(monkeypatch):
    """
    Credly badge URLs go through _extract_credly: name still comes from the
    HTML page (Open Badges anonymously hashes the recipient identity in the
    API — see module docstring), but title/issuer/date/revocation come from
    the confirmed-real api.credly.com endpoint when available.
    """
    badge_uuid = "12345678-1234-1234-1234-123456789012"
    html = """
    <html><head>
    <script type="application/ld+json">
    {"recipient": {"name": "Karim Alaoui"}}
    </script>
    </head><body></body></html>
    """

    def fake_get(url, **kwargs):
        if url.endswith("/robots.txt"):
            return _fake_response(404)
        if "api.credly.com" in url:
            return _fake_response(
                200,
                text=json.dumps(
                    {
                        "badge": {"name": "AWS Certified Solutions Architect", "issuer": {"name": "AWS"}},
                        "issuedOn": "2026-02-17T00:00:00Z",
                        "revoked": False,
                    }
                ),
            )
        raise AssertionError(f"unexpected httpx.get call: {url}")

    def fake_client_get(self, url, **kwargs):
        return _fake_response(200, text=html)

    monkeypatch.setattr(httpx, "get", fake_get)
    monkeypatch.setattr(httpx.Client, "get", fake_client_get)

    result = verify_on_issuer_site(f"https://www.credly.com/badges/{badge_uuid}/public_url")

    assert result.holder_name == "Karim Alaoui"  # from HTML, not the hashed API field
    assert result.certification_title == "AWS Certified Solutions Architect"  # from the API
    assert result.issuer == "AWS"
    assert result.issue_date == date(2026, 2, 17)


def test_credly_extractor_flags_a_revoked_badge(monkeypatch):
    badge_uuid = "12345678-1234-1234-1234-123456789012"

    def fake_get(url, **kwargs):
        if url.endswith("/robots.txt"):
            return _fake_response(404)
        if "api.credly.com" in url:
            return _fake_response(
                200,
                text=json.dumps({"badge": {"name": "AZ-204", "issuer": {}}, "revoked": True}),
            )
        raise AssertionError(f"unexpected httpx.get call: {url}")

    def fake_client_get(self, url, **kwargs):
        return _fake_response(200, text="<html></html>")

    monkeypatch.setattr(httpx, "get", fake_get)
    monkeypatch.setattr(httpx.Client, "get", fake_client_get)

    result = verify_on_issuer_site(f"https://credly.com/badges/{badge_uuid}")
    assert "REVOKED" in result.certification_title


def test_oversized_response_is_rejected(monkeypatch):
    from app.core.config import settings

    def fake_get(url, **kwargs):
        return _fake_response(404)

    def fake_client_get(self, url, **kwargs):
        return _fake_response(200, content=b"x" * (settings.SCRAPER_MAX_BYTES + 1))

    monkeypatch.setattr(httpx, "get", fake_get)
    monkeypatch.setattr(httpx.Client, "get", fake_client_get)

    with pytest.raises(WebScrapingError, match="size guard"):
        verify_on_issuer_site("https://credly.com/badges/abc123")
