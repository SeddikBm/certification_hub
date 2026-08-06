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

    # --- after compare_bdd_node --------------------------------------------
    scores: FieldScores
    bdd_conform: bool

    # --- after detect_url_node ---------------------------------------------
    trusted_url: str | None

    # --- after scrape_node -------------------------------------------------
    scraped: ParsedCertificate | None
    scrape_error: str | None

    # --- after compare_site_node -------------------------------------------
    site_conform: bool

    # --- final outcome ------------------------------------------------------
    source: SourceType
    decision: Decision
    reasons: list[str]

