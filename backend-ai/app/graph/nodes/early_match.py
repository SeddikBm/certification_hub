"""
Node + conditional edge: early_match_node / route_by_early_match.

Inserted between parse_node and detect_trusted_url_node. This is the
"comparer d'abord" step: check the document against what's expected (from
Spring Boot / the connected user's assignment) BEFORE spending any effort
on web verification, not after.

Three fields, three different treatments — same principle as the final
fuzzy_match, applied earlier and more strictly:

- NAME: fuzzy, lenient (EARLY_REJECT_NAME_THRESHOLD=0.50). Free text,
  transcribed by OCR, can legitimately vary in word order.
- TITLE: fuzzy but strict (EARLY_REJECT_TITLE_THRESHOLD=0.75). A
  certification title comes from a fixed issuer catalog, not free text —
  there's no legitimate personal variant of "AZ-204", only OCR noise on
  the same title or a genuinely different certification. This is the field
  that actually catches "real certificate, wrong training": a person's
  own, genuine, verifiable certificate for the WRONG course. Web
  verification would faithfully confirm that real-but-wrong certificate is
  real — which proves nothing about the assignment it's supposed to
  satisfy. Catching this before scraping means we never waste a network
  call confirming the authenticity of a document that was never going to
  satisfy this assignment regardless.
- DATE: not fuzzy text at all — score_date_field takes actual date objects
  and checks a tolerance window. A certificate dated before the assignment
  even started is a hard fraud signal, not noise.

Both thresholds are calibrated against real examples (see
tests/test_early_match.py for the actual pairs), not guessed — and both
still sit meaningfully below what a genuinely different name/title would
score, specifically so a bit of OCR noise on the RIGHT document doesn't
trip this gate and lose the chance for web verification to correct it.
Web verification remains the mechanism that resolves "was that just noisy
OCR, or a real difference" for anything ambiguous enough to pass here.
"""

from __future__ import annotations

import logging
from typing import Literal

from app.core.config import settings
from app.schemas.state import GraphState
from app.services.fuzzy.matcher import score_date_field, score_name_field, score_title_field

logger = logging.getLogger(__name__)


def early_match_node(state: GraphState) -> dict:
    expected = state["expected"]
    parsed = state["parsed"]

    name_score = score_name_field(expected.expected_name, parsed.holder_name)
    title_score = score_title_field(
        expected.expected_certification_title, parsed.certification_title
    )
    date_score = score_date_field(
        expected.expected_not_before, parsed.issue_date, settings.DATE_TOLERANCE_DAYS
    )

    reject_reason: str | None = None
    if name_score < settings.EARLY_REJECT_NAME_THRESHOLD:
        reject_reason = (
            f"extracted name {parsed.holder_name!r} does not resemble the expected "
            f"{expected.expected_name!r} ({name_score:.0%} similarity)"
        )
    elif title_score < settings.EARLY_REJECT_TITLE_THRESHOLD:
        reject_reason = (
            f"extracted title {parsed.certification_title!r} does not match the expected "
            f"{expected.expected_certification_title!r} ({title_score:.0%} similarity) — "
            "this looks like a genuine certificate for a different training"
        )
    elif date_score == 0.0:
        reject_reason = (
            f"certificate issue date {parsed.issue_date} predates the assignment "
            f"start date {expected.expected_not_before} beyond tolerance"
        )

    early_reject = reject_reason is not None

    if early_reject:
        logger.info("[EARLY_MATCH] Rejecting before web verification: %s", reject_reason)
    else:
        logger.info(
            "[EARLY_MATCH] name=%.2f title=%.2f date=%.2f -> proceeding to web verification",
            name_score,
            title_score,
            date_score,
        )

    return {
        "early_name_score": name_score,
        "early_title_score": title_score,
        "early_date_score": date_score,
        "early_reject": early_reject,
        "early_reject_reason": reject_reason,
    }


def route_by_early_match(state: GraphState) -> Literal["detect_trusted_url", "fuzzy_match"]:
    return "fuzzy_match" if state.get("early_reject") else "detect_trusted_url"
