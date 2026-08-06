"""
Node: evaluate_node — "Évaluation Finale (Score & Source)".

Decision table, mirroring the three leaf outcomes in the diagram exactly:

  APPROVED         Conforme & Prouvé      source == WEB_VERIFIED
                                           AND overall_score >= approve threshold
                                           AND no field is a hard mismatch

  REJECTED         Fraude / Erreur        overall_score <= reject threshold
                                           OR a hard mismatch: date_score of 0.0
                                           (cert predates the assignment) OR
                                           title_score below the strict title
                                           floor (a genuine certificate for a
                                           different training is still a reject,
                                           even if the person and a good overall
                                           average would otherwise look fine —
                                           see early_match_node's docstring for
                                           why title gets its own hard floor
                                           instead of just being averaged in)

  PENDING_REVIEW   Doute / Pas de preuve  everything else — including a
                                          "OCR seul" case: even a perfect-looking
                                          score with source == TEXT_ONLY never
                                          auto-approves, per the diagram's own
                                          "Score moyen OU OCR seul" label. A
                                          human (Career Manager) always gets the
                                          final say when there's no independent proof.

The title floor is checked here too, not just in early_match_node, so a
mismatch that only becomes visible AFTER scraping (the official site's own
title clearly differs from what was expected) is still a hard reject, not
diluted into "pending" by an otherwise-good name/date average.
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.schemas.enums import Decision, SourceType
from app.schemas.state import GraphState

logger = logging.getLogger(__name__)


def evaluate_node(state: GraphState) -> dict:
    scores = state["scores"]
    source = state["source"]
    reasons: list[str] = []

    hard_name_mismatch = scores.name_score < 0.90
    hard_date_mismatch = scores.date_score < 1.0
    hard_title_mismatch = scores.title_score < 1.0
    hard_mismatch = hard_name_mismatch or hard_date_mismatch or hard_title_mismatch

    if hard_name_mismatch:
        reasons.append(
            f"Le nom du collaborateur ({scores.name_score:.0%}) est inférieur au seuil fuzzy strict de 90%."
        )
    if hard_date_mismatch:
        reasons.append(
            "La date du certificat ne correspond pas exactement à la date de complétion en BDD (comparaison stricte)."
        )
    if hard_title_mismatch:
        reasons.append(
            "Le titre de la certification ne correspond pas exactement au titre attendu (comparaison stricte)."
        )


    if state.get("early_reject"):
        reasons.append(f"Web verification was skipped: {state.get('early_reject_reason')}.")

    if source == SourceType.NONE:
        reasons.append("No usable name/title could be extracted from the document.")

    if scores.overall_score <= settings.SCORE_THRESHOLD_REJECT or hard_mismatch:
        decision = Decision.REJECTED
        if not hard_mismatch:
            reasons.append(
                f"Overall similarity score ({scores.overall_score:.0%}) is below the "
                f"rejection threshold ({settings.SCORE_THRESHOLD_REJECT:.0%})."
            )

    elif (
        source == SourceType.WEB_VERIFIED
        and scores.overall_score >= settings.SCORE_THRESHOLD_APPROVE
    ):
        decision = Decision.APPROVED
        reasons.append(
            f"Name and title confirmed on the issuer's official site with "
            f"{scores.overall_score:.0%} similarity."
        )

    else:
        decision = Decision.PENDING_REVIEW
        if source != SourceType.WEB_VERIFIED:
            if state.get("scrape_error"):
                reasons.append(f"Web verification could not be completed: {state['scrape_error']}")
            elif state.get("trusted_url"):
                reasons.append(
                    "A trusted verification URL was found but could not be reached."
                )
            else:
                reasons.append(
                    "No trusted verification URL/QR was found in the document — "
                    "the document could not be independently confirmed."
                )
        else:
            reasons.append(
                f"Web-verified but similarity ({scores.overall_score:.0%}) is below "
                f"the auto-approve threshold ({settings.SCORE_THRESHOLD_APPROVE:.0%})."
            )

    logger.info("[EVALUATE] decision=%s reasons=%s", decision.value, reasons)
    return {"decision": decision, "reasons": reasons}
