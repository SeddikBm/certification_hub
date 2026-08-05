from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.enums import Decision, SourceType
from app.schemas.validation import FieldScores, ParsedCertificate, ValidationResponse

client = TestClient(app)

_FORM_DATA = {
    "assignment_id": 1,
    "expected_name": "Karim Alaoui",
    "expected_certification_title": "AZ-204",
}


def _fake_pdf() -> bytes:
    return b"%PDF-1.4 minimal fake content for HTTP-layer tests"


def test_health_check_requires_no_auth():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_validate_missing_api_key_header_is_422():
    resp = client.post(
        "/api/v1/validate",
        files={"file": ("cert.pdf", _fake_pdf(), "application/pdf")},
        data=_FORM_DATA,
    )
    assert resp.status_code == 422


def test_validate_wrong_api_key_is_401():
    resp = client.post(
        "/api/v1/validate",
        headers={"X-API-Key": "wrong-key"},
        files={"file": ("cert.pdf", _fake_pdf(), "application/pdf")},
        data=_FORM_DATA,
    )
    assert resp.status_code == 401


def test_validate_rejects_unsupported_content_type():
    resp = client.post(
        "/api/v1/validate",
        headers={"X-API-Key": "test-key"},
        files={"file": ("cert.txt", b"hello world", "text/plain")},
        data=_FORM_DATA,
    )
    assert resp.status_code == 400


def test_validate_happy_path(monkeypatch):
    fake_response = ValidationResponse(
        assignment_id=1,
        decision=Decision.APPROVED,
        source=SourceType.WEB_VERIFIED,
        scores=FieldScores(name_score=1, title_score=1, date_score=1, overall_score=1),
        extracted=ParsedCertificate(holder_name="Karim Alaoui", certification_title="AZ-204"),
        detected_urls=["https://learn.microsoft.com/verify/xyz"],
        reasons=["Name and title confirmed on the issuer's official site."],
        requires_manual_review=False,
    )
    monkeypatch.setattr("app.api.routes.validation.run_validation", lambda **kwargs: fake_response)

    resp = client.post(
        "/api/v1/validate",
        headers={"X-API-Key": "test-key"},
        files={"file": ("cert.pdf", _fake_pdf(), "application/pdf")},
        data=_FORM_DATA,
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["decision"] == "APPROVED"
    assert body["requires_manual_review"] is False


def test_validate_internal_error_degrades_to_pending_review(monkeypatch):
    def _boom(**kwargs):
        raise RuntimeError("Groq API unreachable")

    monkeypatch.setattr("app.api.routes.validation.run_validation", _boom)

    resp = client.post(
        "/api/v1/validate",
        headers={"X-API-Key": "test-key"},
        files={"file": ("cert.pdf", _fake_pdf(), "application/pdf")},
        data={**_FORM_DATA, "assignment_id": 7},
    )

    assert resp.status_code == 200  # never a 500 — always routed to a human
    body = resp.json()
    assert body["decision"] == "PENDING_REVIEW"
    assert body["requires_manual_review"] is True
    assert body["assignment_id"] == 7


def test_validate_error_reason_names_the_failing_exception_type(monkeypatch):
    """
    The whole point of tagging errors by origin: the reason string in the
    JSON response itself should say *what kind* of failure happened
    (LLMParsingError, DocumentExtractionError, ...), not just "something
    went wrong" — visible without needing server log access.
    """
    from app.exceptions import LLMParsingError

    def _boom(**kwargs):
        raise LLMParsingError("Groq call failed: connection timeout")

    monkeypatch.setattr("app.api.routes.validation.run_validation", _boom)

    resp = client.post(
        "/api/v1/validate",
        headers={"X-API-Key": "test-key"},
        files={"file": ("cert.pdf", _fake_pdf(), "application/pdf")},
        data=_FORM_DATA,
    )

    assert resp.status_code == 200
    reasons_text = " ".join(resp.json()["reasons"])
    assert "LLMParsingError" in reasons_text
    assert "connection timeout" in reasons_text
