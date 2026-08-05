from __future__ import annotations

from datetime import date

import pytest

from app.core.config import settings
from app.schemas.validation import ExpectedInfo, ParsedCertificate


@pytest.fixture(autouse=True)
def _test_settings():
    """Force predictable settings for every test, regardless of local .env."""
    settings.API_KEY = "test-key"
    settings.GROQ_API_KEY = "dummy"
    settings.SCORE_THRESHOLD_APPROVE = 0.95
    settings.SCORE_THRESHOLD_REJECT = 0.60
    settings.RESPECT_ROBOTS_TXT = True
    yield settings


@pytest.fixture
def expected_info() -> ExpectedInfo:
    return ExpectedInfo(
        assignment_id=42,
        expected_name="Karim Alaoui",
        expected_certification_title="AZ-204",
        expected_not_before=date(2026, 1, 1),
    )


@pytest.fixture
def matching_certificate() -> ParsedCertificate:
    return ParsedCertificate(
        holder_name="Karim Alaoui",
        certification_title="AZ-204",
        issue_date=date(2026, 2, 1),
        issuer="learn.microsoft.com",
    )


@pytest.fixture
def mismatched_certificate() -> ParsedCertificate:
    return ParsedCertificate(
        holder_name="Youssef Bennani",
        certification_title="AZ-900",
        issue_date=date(2025, 6, 1),
        issuer="learn.microsoft.com",
    )


@pytest.fixture
def right_person_wrong_training_certificate() -> ParsedCertificate:
    """A genuine, correctly-named certificate — just not the one assigned."""
    return ParsedCertificate(
        holder_name="Karim Alaoui",
        certification_title="Python for Data Science, AI & Development",
        issue_date=date(2026, 2, 1),
        issuer="coursera.org",
    )
