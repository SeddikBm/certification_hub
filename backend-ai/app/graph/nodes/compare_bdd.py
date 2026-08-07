"""
Node 3: COMPARAISON CERTIFICAT VS BASE DE DONNÉES.
Noeud Conditionnel 1: Données conformes ?
  - Nom: Fuzzy logic >= 90%
  - Titre: Comparaison stricte = 1.0
  - Date: Comparaison stricte = 1.0
"""

from __future__ import annotations

import logging
from typing import Literal

from app.schemas.state import GraphState
from app.services.fuzzy.matcher import compute_scores

logger = logging.getLogger(__name__)


def compare_bdd_node(state: GraphState) -> dict:
    expected = state["expected"]
    parsed = state["parsed"]

    scores = compute_scores(expected, parsed)

    reasons: list[str] = []
    is_conform = True

    if scores.name_score < 0.90:
        is_conform = False
        reasons.append(
            f"Le nom du collaborateur sur le certificat ({parsed.holder_name!r}) ne correspond pas au nom attendu ({expected.expected_name!r}) avec une similitude >= 90%."
        )

    if scores.title_score < 1.0:
        is_conform = False
        reasons.append(
            f"Le titre de la certification sur le certificat ({parsed.certification_title!r}) ne correspond pas exactement au titre attendu en BDD ({expected.expected_certification_title!r})."
        )

    exp_date = getattr(expected, "expected_date", None) or getattr(expected, "expected_not_before", None)
    if exp_date is not None and scores.date_score < 1.0:
        is_conform = False
        reasons.append(
            f"La date du certificat ({parsed.issue_date}) ne correspond pas exactement à la date de complétion enregistrée en BDD ({exp_date})."
        )

    logger.info("==========================================")
    logger.info("[NODE 3: COMPARE_BDD] expected_name=%r expected_title=%r expected_date=%r", expected.expected_name, expected.expected_certification_title, exp_date)
    logger.info("[NODE 3: COMPARE_BDD] actual_name=%r actual_title=%r actual_date=%r", parsed.holder_name, parsed.certification_title, parsed.issue_date)
    logger.info("[NODE 3: COMPARE_BDD] SCORES -> name=%.2f title=%.2f date=%.2f overall=%.2f | IS_CONFORM=%s", scores.name_score, scores.title_score, scores.date_score, scores.overall_score, is_conform)
    if reasons:
        logger.info("[NODE 3: COMPARE_BDD] MISMATCH REASONS: %s", reasons)
    logger.info("==========================================")

    return {
        "scores": scores,
        "bdd_conform": is_conform,
        "reasons": reasons,
    }


def route_after_bdd(state: GraphState) -> Literal["detect_url", "rejected_outcome"]:
    return "detect_url" if state.get("bdd_conform") else "rejected_outcome"
