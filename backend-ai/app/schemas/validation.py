"""
Public data contracts.

These are what Spring Boot actually sees over HTTP — step 4 ("Envoie
Fichier + Infos Attendues") and step 6 ("Retourne Résultat JSON") in the
architecture diagram. Keep this file backwards-compatible; it's the
contract the Java side codes against.
"""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import Decision, SourceType


class ExpectedInfo(BaseModel):
    """
    "Infos Attendues" — what Spring Boot already knows from the
    `assignments` table and expects the certificate to confirm.
    """

    assignment_id: int
    expected_name: str = Field(..., description="e.g. 'Alaoui'")
    expected_certification_title: str = Field(..., description="e.g. 'AZ-204'")
    expected_not_before: date | None = Field(
        default=None,
        description="Assignment start date — a cert issued before this is suspicious.",
    )


class ParsedCertificate(BaseModel):
    """Structured view of a certificate, whether from OCR+LLM or from the web."""

    holder_name: str | None = None
    certification_title: str | None = None
    issue_date: date | None = None
    issuer: str | None = None


class FieldScores(BaseModel):
    name_score: float = Field(ge=0.0, le=1.0)
    title_score: float = Field(ge=0.0, le=1.0)
    date_score: float = Field(ge=0.0, le=1.0)
    overall_score: float = Field(ge=0.0, le=1.0)


class ValidationResponse(BaseModel):
    assignment_id: int
    decision: Decision
    source: SourceType
    scores: FieldScores
    extracted: ParsedCertificate
    detected_urls: list[str] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)
    requires_manual_review: bool

    model_config = ConfigDict(use_enum_values=True)
