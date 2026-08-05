"""
OPT-IN integration tests against REAL issuer sites — never part of the
default test run (see pyproject.toml: `addopts = "-m 'not live'"`, and the
`live` marker below). This is a real mechanism, not just a comment saying
"don't run this in CI": `pytest` and `pytest tests/` both skip these
automatically. They only run if you explicitly ask for them.

Why this exists: to actually test scraping Coursera/Udemy for real, you
need (a) real internet access — this sandbox's own network egress doesn't
reach coursera.org/udemy.com at all, and Claude's own web_fetch tool always
honors robots.txt regardless of this app's config — and (b) a deliberate
choice about RESPECT_ROBOTS_TXT, made on your machine, by you. Neither of
those things can happen inside this conversation; they can only happen
here, on your own machine, when you choose to run this file.

How to run (only once you've made that choice for yourself):

    RESPECT_ROBOTS_TXT=false pytest tests/test_live_scraper.py -m live -v -s

The `-s` flag shows print() output so you can eyeball the result — these
tests intentionally don't assert hard equality on scraped fields, since
real pages change over time; they just confirm the pipeline reaches the
site and gets *something* back.

Realistic expectations, so you're not surprised: turning off
RESPECT_ROBOTS_TXT does not guarantee success. Sites that publish a
restrictive robots.txt often also run active bot detection (Cloudflare,
rate limiting, CAPTCHA) that has nothing to do with robots.txt and won't
be affected by this flag at all. If a run below fails with an HTTP 403 or
a captcha-looking HTML blob instead of certificate data, that's what's
happening — no amount of retrying the same request will fix it.
"""

from __future__ import annotations

import pytest

from app.services.scraper.web_scraper import verify_on_issuer_site

pytestmark = pytest.mark.live

# Add your own certificate's verify/badge URL(s) here — one line each.
# These three are simply the examples already used earlier in this
# project's history (Coursera and Udemy are hardcoded example IDs — Credly
# badge IDs are per-badge, so replace it with a real one you want to check).
LIVE_URLS = {
    "coursera": "https://coursera.org/verify/6OGLBB1GDF6R",
    "udemy": "https://www.udemy.com/certificate/UC-00000000-0000-0000-0000-000000000000/",
    "credly": "https://www.credly.com/badges/00000000-0000-0000-0000-000000000000",
}


@pytest.mark.parametrize("label,url", LIVE_URLS.items())
def test_live_verify(label, url):
    result = verify_on_issuer_site(url)
    print(f"\n--- {label} live result ---")
    print(result)
    assert result is not None  # loose on purpose — read the printed output with -s
