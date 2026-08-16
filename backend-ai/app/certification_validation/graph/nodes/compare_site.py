"""
Étape 5: COMPARAISON CERTIFICAT VS DONNÉES DU SITE.
Noeud Conditionnel 3: Données du site conformes au certificat ?
"""

from __future__ import annotations

import logging
from typing import Literal

from app.certification_validation.schemas.state import GraphState
from app.certification_validation.services.fuzzy.matcher import compute_scores

logger = logging.getLogger(__name__)


def compare_site_node(state: GraphState) -> dict:
    scraped = state.get("scraped")
    expected = state["expected"]
    existing_reasons = state.get("reasons", [])

    if scraped is None:
        logger.warning("[COMPARE_SITE] Impossible de scraper les données du site")
        return {
            "site_conform": False,
            "reasons": existing_reasons + ["Les données du site officiel n'ont pas pu être récupérées."],
        }

    site_scores = compute_scores(expected, scraped)
    is_conform = True
    reasons = list(existing_reasons)

    if site_scores.name_score < 0.90:
        is_conform = False
        reasons.append(
            f"Le nom sur le site officiel « {scraped.holder_name or 'Non détecté'} » ne correspond pas au nom attendu « {expected.expected_name} »."
        )

    if site_scores.title_score < 1.0:
        is_conform = False
        reasons.append(
            f"Le titre sur le site officiel « {scraped.certification_title or 'Non détecté'} » ne correspond pas au titre attendu « {expected.expected_certification_title} »."
        )

    exp_date = expected.expected_date
    if exp_date is not None and site_scores.date_score < 1.0:
        is_conform = False
        reasons.append(
            f"La date sur le site officiel « {scraped.issue_date or 'Non détectée'} » ne correspond pas à la date attendue « {exp_date} »."
        )



    logger.info(
        "[COMPARE_SITE] conform=%s site_name=%.2f site_title=%.2f site_date=%.2f",
        is_conform,
        site_scores.name_score,
        site_scores.title_score,
        site_scores.date_score,
    )

    return {
        "site_conform": is_conform,
        "reasons": reasons,
    }


def route_after_site(state: GraphState) -> Literal["approved_outcome", "rejected_outcome"]:
    return "approved_outcome" if state.get("site_conform") else "rejected_outcome"
