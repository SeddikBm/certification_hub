"""
Node: parse_node — "LLM Parser, Structure en JSON (Nom, Titre, Date)".

Deliberately kept separate from scan_node: the LLM never sees the image,
only the already-extracted text. This keeps the failure modes independent
and debuggable — if a result looks wrong you can tell in one look whether
the text extraction or the structuring step is at fault, and it lets you
swap models/providers for parsing without touching extraction at all.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from app.certification_validation.exceptions import LLMParsingError
from app.certification_validation.schemas.state import GraphState
from app.certification_validation.services.llm.field_extractor import CertificateFieldExtractor
from app.core.config import settings

logger = logging.getLogger(__name__)


@lru_cache
def _client() -> CertificateFieldExtractor:
    return CertificateFieldExtractor()


def parse_node(state: GraphState) -> dict:
    raw_text = state["raw_text"]
    logger.info("[LLM] Sending %d chars to Groq (model=%s)", len(raw_text), settings.GROQ_PARSER_MODEL)

    try:
        parsed = _client().extract_fields(raw_text)
    except LLMParsingError as exc:
        # Already the right exception type (raised by GroqClient itself for
        # both API-call failures and malformed JSON) — just log clearly
        # and let it propagate to the API layer's fallback handler.
        logger.error("[LLM] Parsing failed: %s", exc)
        raise

    logger.info(
        "[LLM] Parsed: name=%r title=%r date=%s issuer=%r",
        parsed.holder_name,
        parsed.certification_title,
        parsed.issue_date,
        parsed.issuer,
    )
    return {"parsed": parsed}
