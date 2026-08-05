"""
Node: fuzzy_match_node — "Calculateur Fuzzy Logic, Compare Document vs Attente BDD".

Picks the highest-trust comparison data available:
  scraped (web-verified)  >  parsed (OCR/LLM only)  >  nothing
and records *which* one it used as `source`, because that provenance is
exactly what evaluate_node needs to tell "Conforme & Prouvé" apart from
"Doute / Pas de preuve web" even at an identical score.
"""

from __future__ import annotations

import logging

from app.schemas.enums import SourceType
from app.schemas.state import GraphState
from app.services.fuzzy.matcher import compute_scores

logger = logging.getLogger(__name__)


def fuzzy_match_node(state: GraphState) -> dict:
    scraped = state.get("scraped")
    parsed = state["parsed"]

    if scraped is not None:
        comparison_data = scraped
        source = SourceType.WEB_VERIFIED
    elif parsed.holder_name or parsed.certification_title:
        comparison_data = parsed
        source = SourceType.TEXT_ONLY
    else:
        comparison_data = parsed
        source = SourceType.NONE

    scores = compute_scores(state["expected"], comparison_data)

    logger.info(
        "[FUZZY_MATCH] source=%s name=%.2f title=%.2f date=%.2f overall=%.2f",
        source.value,
        scores.name_score,
        scores.title_score,
        scores.date_score,
        scores.overall_score,
    )

    return {"scores": scores, "source": source}
