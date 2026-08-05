from app.utils.url_utils import extract_urls, first_trusted_url, is_trusted_domain

TRUSTED = ["credly.com", "learn.microsoft.com"]


def test_extract_urls_finds_plain_and_trailing_punctuation():
    text = "Verify at https://www.credly.com/badges/abc123. Also see (https://learn.microsoft.com/x)."
    urls = extract_urls(text)
    assert urls == [
        "https://www.credly.com/badges/abc123",
        "https://learn.microsoft.com/x",
    ]


def test_extract_urls_catches_schemeless_printed_urls():
    # Confirmed on a real Cisco certificate: the printed verification URL
    # has no http(s):// prefix at all — a scheme-only regex misses it entirely.
    text = "Validate this certificate's authenticity at www.cisco.com/go/verifycertificate"
    assert extract_urls(text) == ["https://www.cisco.com/go/verifycertificate"]


def test_extract_urls_does_not_duplicate_when_both_forms_present():
    text = "See https://www.credly.com/badges/x or www.credly.com/badges/x"
    assert extract_urls(text) == ["https://www.credly.com/badges/x"]


def test_extract_urls_deduplicates():
    text = "https://credly.com/a https://credly.com/a"
    assert extract_urls(text) == ["https://credly.com/a"]


def test_trusted_exact_and_subdomain_match():
    assert is_trusted_domain("https://credly.com/badges/1", TRUSTED)
    assert is_trusted_domain("https://www.credly.com/badges/1", TRUSTED)
    assert is_trusted_domain("https://verify.credly.com/badges/1", TRUSTED)


def test_untrusted_lookalike_domains_are_rejected():
    # These are the exact attacks a naive "in" / substring check would miss.
    assert not is_trusted_domain("https://credly.com.evil.com/badges/1", TRUSTED)
    assert not is_trusted_domain("https://notcredly.com/badges/1", TRUSTED)
    assert not is_trusted_domain("https://credly.com.au/badges/1", TRUSTED)


def test_first_trusted_url_returns_first_match_only():
    urls = ["https://evil.com/x", "https://credly.com/y", "https://credly.com/z"]
    assert first_trusted_url(urls, TRUSTED) == "https://credly.com/y"


def test_first_trusted_url_returns_none_when_nothing_matches():
    assert first_trusted_url(["https://evil.com/x"], TRUSTED) is None
