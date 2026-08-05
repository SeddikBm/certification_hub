"""
Tests for early_match_node / route_by_early_match.

Includes the actual calibration data (2026-08-03/04) that
EARLY_REJECT_NAME_THRESHOLD and EARLY_REJECT_TITLE_THRESHOLD are set
against — real field pairs, not made up numbers. If score_name_field or
score_title_field's underlying algorithm ever changes, these are what to
re-run to make sure the "different" and "same, with OCR noise" clusters
still sit on the correct sides of each threshold with a comfortable margin.

Each parametrized case isolates the field under test — the other two
fields are set to a clean, matching baseline — so a name-threshold test
failure can't actually be a title bug in disguise, and vice versa.
"""

from __future__ import annotations

from datetime import date

import pytest

from app.graph.nodes.early_match import early_match_node, route_by_early_match
from app.schemas.validation import ExpectedInfo, ParsedCertificate

BASELINE_TITLE = "AZ-204"
BASELINE_DATE = date(2026, 2, 1)
BASELINE_NOT_BEFORE = date(2026, 1, 1)


def _state(
    expected_name,
    found_name,
    expected_title=BASELINE_TITLE,
    found_title=BASELINE_TITLE,
    found_date=BASELINE_DATE,
):
    return {
        "expected": ExpectedInfo(
            assignment_id=1,
            expected_name=expected_name,
            expected_certification_title=expected_title,
            expected_not_before=BASELINE_NOT_BEFORE,
        ),
        "parsed": ParsedCertificate(
            holder_name=found_name, certification_title=found_title, issue_date=found_date
        ),
    }


# --- Name calibration (unchanged from the original name-only gate) ------------

DIFFERENT_PEOPLE = [
    ("Youssef Bennani", "Seddik Boumhamdi"),
    ("Karim Alaoui", "Youssef Bennani"),
    ("Sara El Amrani", "Mehdi Tazi"),
    ("John Smith", "Fatima Zahra"),
    ("Ahmed Chraibi", "Nadia Berrada"),
]

SAME_PERSON_WITH_OCR_NOISE = [
    ("Karim Alaoui", "Karim Alaoul"),
    ("Karim Alaoui", "Kraim Alaoui"),
    ("Seddik Boumhamdi", "Seddik Bournhamdi"),
    ("Karim Alaoui", "Alaoui Karim"),
]


@pytest.mark.parametrize("expected_name,found_name", DIFFERENT_PEOPLE)
def test_early_reject_fires_for_genuinely_different_people(expected_name, found_name):
    result = early_match_node(_state(expected_name, found_name))
    assert result["early_reject"] is True
    assert "does not resemble the expected" in result["early_reject_reason"]


@pytest.mark.parametrize("expected_name,found_name", SAME_PERSON_WITH_OCR_NOISE)
def test_early_reject_does_not_fire_on_realistic_name_ocr_noise(expected_name, found_name):
    result = early_match_node(_state(expected_name, found_name))
    assert result["early_reject"] is False, (
        f"{expected_name!r} vs {found_name!r} scored {result['early_name_score']:.3f}"
    )


# --- Title calibration (new: strict, but still tolerant of OCR noise) ---------

DIFFERENT_TITLES = [
    ("AZ-204", "AZ-900"),
    ("AWS Certified Solutions Architect", "AWS Certified Cloud Practitioner"),
    ("Python for Data Science, AI & Development", "CCNA - Cisco Certified Network Associate"),
    ("AZ-204", "Python for Data Science, AI & Development"),
    ("CompTIA Security+", "CompTIA Network+"),
]

SAME_TITLE_WITH_OCR_NOISE = [
    ("AZ-204", "AZ-2O4"),  # 0 vs O
    ("AWS Certified Solutions Architect", "AWS Certified Solufions Architect"),  # t/f
    ("Python for Data Science, AI & Development", "Python for Data Science, AI and Development"),
    ("CCNA - Cisco Certified Network Associate", "CCNA - Cisco Certified Networl( Associate"),
]


@pytest.mark.parametrize("expected_title,found_title", DIFFERENT_TITLES)
def test_early_reject_fires_for_a_genuinely_different_certification(expected_title, found_title):
    result = early_match_node(_state("Karim Alaoui", "Karim Alaoui", expected_title, found_title))
    assert result["early_reject"] is True
    assert "different training" in result["early_reject_reason"]


@pytest.mark.parametrize("expected_title,found_title", SAME_TITLE_WITH_OCR_NOISE)
def test_early_reject_does_not_fire_on_realistic_title_ocr_noise(expected_title, found_title):
    result = early_match_node(_state("Karim Alaoui", "Karim Alaoui", expected_title, found_title))
    assert result["early_reject"] is False, (
        f"{expected_title!r} vs {found_title!r} scored {result['early_title_score']:.3f}"
    )


def test_real_certificate_wrong_training_is_caught_by_the_title_floor():
    """
    The scenario that motivated adding title to this gate: a genuine,
    correctly-named certificate — just for the wrong course. Name matches
    perfectly; only the title gives it away.
    """
    result = early_match_node(
        _state(
            "Seddik Boumhamdi",
            "Seddik Boumhamdi",
            expected_title="AZ-204",
            found_title="Python for Data Science, AI & Development",
        )
    )
    assert result["early_name_score"] == 1.0
    assert result["early_reject"] is True
    assert "different training" in result["early_reject_reason"]


# --- Date ------------------------------------------------------------------------


def test_early_reject_fires_when_certificate_predates_assignment():
    result = early_match_node(
        _state(
            "Karim Alaoui",
            "Karim Alaoui",
            found_date=date(2024, 1, 1),  # well before BASELINE_NOT_BEFORE
        )
    )
    assert result["early_reject"] is True
    assert "predates the assignment" in result["early_reject_reason"]


# --- Missing data ------------------------------------------------------------------


def test_early_reject_fires_when_name_could_not_be_extracted_at_all():
    result = early_match_node(_state("Karim Alaoui", None))
    assert result["early_reject"] is True
    assert result["early_name_score"] == 0.0


def test_route_by_early_match():
    assert route_by_early_match({"early_reject": True}) == "fuzzy_match"
    assert route_by_early_match({"early_reject": False}) == "detect_trusted_url"
