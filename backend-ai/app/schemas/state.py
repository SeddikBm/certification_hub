"""
Graph state definition.

LangGraph passes a single mutable "state" dict between nodes. Each node
returns only the keys it changed, and LangGraph merges them in. We use a
TypedDict (not a Pydantic model) because that's what `StateGraph` expects
natively — Pydantic objects still live *inside* it (ExpectedInfo,
ParsedCertificate, FieldScores) for validation/typing where it matters.
"""

from __future__ import annotations

from typing import TypedDict

from app.schemas.enums import Decision, SourceType
from app.schemas.validation import ExpectedInfo, FieldScores, ParsedCertificate


class GraphState(TypedDict, total=False):
    # --- input ---------------------------------------------------------
    file_bytes: bytes
    file_name: str
    mime_type: str
    expected: ExpectedInfo

    # --- after scan_node -------------------------------------------------
    raw_text: str
    used_ocr: bool
    detected_urls: list[str]

    # --- after parse_node --------------------------------------------------
    parsed: ParsedCertificate

    # --- after early_match_node ---------------------------------------------
    # Cheap, network-free sanity check run right after parsing: does the
    # document even claim to belong to the expected person, for the
    # expected certification, at a plausible date? If any of the three
    # clearly fails, there's no point spending a network call to verify a
    # certificate that's already disqualified — see early_match_node.
    early_name_score: float
    early_title_score: float
    early_date_score: float
    early_reject: bool
    early_reject_reason: str | None

    # --- after detect_trusted_url_node --------------------------------------
    trusted_url: str | None

    # --- after scrape_node -------------------------------------------------
    scraped: ParsedCertificate | None
    scrape_error: str | None

    # --- after fuzzy_match_node --------------------------------------------
    source: SourceType
    scores: FieldScores

    # --- after evaluate_node -------------------------------------------------
    decision: Decision
    reasons: list[str]
