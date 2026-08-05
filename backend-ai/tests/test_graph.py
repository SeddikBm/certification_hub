"""
Full-pipeline tests.

We never hit real OCR, Groq, or the network here — only the three I/O
boundaries are mocked (document extraction, LLM parsing, web scraping),
which is exactly the seam the code was designed around (OCREngine,
GroqClient, verify_on_issuer_site). Everything in between (routing,
fuzzy scoring, the decision table) runs for real, so these tests catch
regressions in the actual business logic, not in third-party services.
"""

from __future__ import annotations

import pytest

from app.graph.builder import build_validation_graph
from app.schemas.enums import Decision, SourceType
from app.schemas.state import GraphState
from app.services.llm.groq_client import GroqClient
from app.utils.pdf_utils import ExtractionResult


def _run_graph(state: GraphState):
    return build_validation_graph().invoke(state)


@pytest.fixture
def base_state(expected_info) -> GraphState:
    return {
        "file_bytes": b"%PDF-fake",
        "file_name": "cert.pdf",
        "mime_type": "application/pdf",
        "expected": expected_info,
    }


def test_approved_when_web_verified_and_high_score(monkeypatch, base_state, matching_certificate):
    monkeypatch.setattr(
        "app.graph.nodes.scan.extract_document",
        lambda *a, **k: ExtractionResult(
            native_text=(
                "Certificate confirming completion, verify at "
                "https://learn.microsoft.com/verify/xyz — Karim Alaoui, AZ-204"
            ),
            page_images=[],
        ),
    )
    monkeypatch.setattr(GroqClient, "extract_fields", lambda self, text: matching_certificate)
    monkeypatch.setattr("app.graph.nodes.scrape.verify_on_issuer_site", lambda url: matching_certificate)

    result = _run_graph(base_state)

    assert result["decision"] == Decision.APPROVED
    assert result["source"] == SourceType.WEB_VERIFIED
    assert result["scores"].overall_score >= 0.95


def test_pending_review_when_no_verification_link_even_with_good_score(
    monkeypatch, base_state, matching_certificate
):
    monkeypatch.setattr(
        "app.graph.nodes.scan.extract_document",
        lambda *a, **k: ExtractionResult(
            native_text="Certificate with no verification link at all — Karim Alaoui, AZ-204",
            page_images=[],
        ),
    )
    monkeypatch.setattr(GroqClient, "extract_fields", lambda self, text: matching_certificate)

    result = _run_graph(base_state)

    # This is the diagram's "Score moyen OU OCR seul" branch: a good score
    # alone must never be enough to auto-approve without web proof.
    assert result["decision"] == Decision.PENDING_REVIEW
    assert result["source"] == SourceType.TEXT_ONLY


def test_rejected_when_names_and_titles_do_not_match(monkeypatch, base_state, mismatched_certificate):
    def _scrape_should_never_be_called(url):
        raise AssertionError(
            "a clearly-different name should be caught by early_match_node "
            "before scraping is ever attempted"
        )

    monkeypatch.setattr(
        "app.graph.nodes.scan.extract_document",
        lambda *a, **k: ExtractionResult(
            native_text="Certificate, verify at https://learn.microsoft.com/verify/xyz",
            page_images=[],
        ),
    )
    monkeypatch.setattr(GroqClient, "extract_fields", lambda self, text: mismatched_certificate)
    monkeypatch.setattr("app.graph.nodes.scrape.verify_on_issuer_site", _scrape_should_never_be_called)

    result = _run_graph(base_state)

    assert result["decision"] == Decision.REJECTED
    assert result["early_reject"] is True
    assert any("Web verification was skipped" in r for r in result["reasons"])


def test_early_match_does_not_skip_scraping_on_a_near_match(
    monkeypatch, base_state, matching_certificate
):
    """
    The early gate must stay out of the way for the common case: a name
    that's an OCR-noisy but genuine match should still go on to attempt
    web verification, not get rejected on the cheap check alone.
    """
    monkeypatch.setattr(
        "app.graph.nodes.scan.extract_document",
        lambda *a, **k: ExtractionResult(
            native_text=(
                "Certificate confirming completion, verify at "
                "https://learn.microsoft.com/verify/xyz — Karim Alaoui, AZ-204"
            ),
            page_images=[],
        ),
    )
    monkeypatch.setattr(GroqClient, "extract_fields", lambda self, text: matching_certificate)
    monkeypatch.setattr("app.graph.nodes.scrape.verify_on_issuer_site", lambda url: matching_certificate)

    result = _run_graph(base_state)

    assert result["early_reject"] is False
    assert result["decision"] == Decision.APPROVED
    assert result["source"] == SourceType.WEB_VERIFIED


def test_rejected_when_certificate_predates_assignment(monkeypatch, base_state, matching_certificate):
    from datetime import date

    early_cert = matching_certificate.model_copy(update={"issue_date": date(2024, 1, 1)})

    monkeypatch.setattr(
        "app.graph.nodes.scan.extract_document",
        lambda *a, **k: ExtractionResult(
            native_text="Certificate, verify at https://learn.microsoft.com/verify/xyz",
            page_images=[],
        ),
    )
    monkeypatch.setattr(GroqClient, "extract_fields", lambda self, text: early_cert)
    monkeypatch.setattr("app.graph.nodes.scrape.verify_on_issuer_site", lambda url: early_cert)

    result = _run_graph(base_state)

    assert result["decision"] == Decision.REJECTED
    assert result["scores"].date_score == 0.0


def test_rejected_for_a_real_certificate_of_the_wrong_training(
    monkeypatch, base_state, right_person_wrong_training_certificate
):
    """
    The scenario that motivated adding a strict title check to the early
    gate: the right person, a genuinely real and verifiable certificate —
    just not the one this assignment expects. Web-verifying it would only
    confirm that someone's real Coursera certificate is real, which proves
    nothing about the AZ-204 this assignment actually needs — so scraping
    must never be attempted, and the outcome must be a hard REJECTED, not
    a diluted PENDING_REVIEW from an otherwise-good name/date average.
    """

    def _scrape_should_never_be_called(url):
        raise AssertionError(
            "a real certificate for the wrong training must be caught by the "
            "early title floor before scraping is ever attempted"
        )

    monkeypatch.setattr(
        "app.graph.nodes.scan.extract_document",
        lambda *a, **k: ExtractionResult(
            native_text="Certificate, verify at https://coursera.org/verify/xyz",
            page_images=[],
        ),
    )
    monkeypatch.setattr(
        GroqClient, "extract_fields", lambda self, text: right_person_wrong_training_certificate
    )
    monkeypatch.setattr("app.graph.nodes.scrape.verify_on_issuer_site", _scrape_should_never_be_called)

    result = _run_graph(base_state)

    assert result["early_reject"] is True
    assert result["early_name_score"] == 1.0  # it really is the right person
    assert result["decision"] == Decision.REJECTED
    assert any("different training" in r for r in result["reasons"])
