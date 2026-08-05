from __future__ import annotations

from enum import Enum


class Decision(str, Enum):
    APPROVED = "APPROVED"
    PENDING_REVIEW = "PENDING_REVIEW"
    REJECTED = "REJECTED"


class SourceType(str, Enum):
    """Where the comparison data ultimately came from."""

    WEB_VERIFIED = "WEB_VERIFIED"  # confirmed against the issuer's own site
    TEXT_ONLY = "TEXT_ONLY"  # OCR/LLM parse of the document only, no proof
    NONE = "NONE"  # extraction failed / nothing usable found
