"""
Terminal Outcome Nodes representing the three boxes at the bottom of the diagram:
  - APPROVED (Green): Conforme Certificat + Base + Site
  - PENDING_APPROVAL (Orange): Conforme Certificat + Base, mais pas d'URL officielle (Revue manuelle Career Manager)
  - REJECTED (Red): Données non conformes (à la base et/ou au site)
"""

from __future__ import annotations

import logging

from app.schemas.enums import Decision, SourceType
from app.schemas.state import GraphState

logger = logging.getLogger(__name__)


def approved_outcome_node(state: GraphState) -> dict:
    reasons = state.get("reasons", [])
    if not reasons:
        reasons = ["Toutes les données sont conformes (Certificat + Base + Site)."]
    logger.info("[OUTCOME] APPROVED")
    return {
        "decision": Decision.APPROVED,
        "source": SourceType.WEB_VERIFIED,
        "reasons": reasons,
    }


def pending_approval_outcome_node(state: GraphState) -> dict:
    reasons = state.get("reasons", [])
    reasons.append(
        "URL officielle non détectée. Données conformes avec le certificat et la base mais pas d'URL officielle, pas de web scraping."
    )
    logger.info("[OUTCOME] PENDING_APPROVAL (PENDING_REVIEW)")
    return {
        "decision": Decision.PENDING_REVIEW,
        "source": SourceType.TEXT_ONLY,
        "reasons": reasons,
    }


def rejected_outcome_node(state: GraphState) -> dict:
    reasons = state.get("reasons", [])
    if not reasons:
        reasons = ["Données non conformes (à la base et/ou au site)."]
    source = SourceType.WEB_VERIFIED if state.get("scraped") else SourceType.TEXT_ONLY
    logger.info("[OUTCOME] REJECTED (reasons=%s)", reasons)
    return {
        "decision": Decision.REJECTED,
        "source": source,
        "reasons": reasons,
    }
