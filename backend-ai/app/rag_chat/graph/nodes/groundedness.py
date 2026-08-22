"""
Node + conditional edge: groundedness_node / route_by_groundedness.

Last gate before the response is returned. Bounded retry: at most
GROUNDEDNESS_MAX_RETRIES regenerations (default 1) — this must never
become a loop that silently doubles or triples response latency.
"""

from __future__ import annotations

import logging
from typing import Literal

from app.core.config import settings
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.llm.groundedness_checker import GroundednessChecker

logger = logging.getLogger(__name__)


def groundedness_node(state: GraphState) -> dict:
    reasons = state.get("reasons", [])

    # The off-topic canned message never goes through this check (see
    # off_topic_response_node, which already sets grounded=True) — this
    # node only ever runs on a genuinely generated answer.
    context = _reconstruct_context_text(state)

    try:
        grounded, reason = GroundednessChecker().check(state["answer"], context)
    except RagChatError as exc:
        # Fail closed but don't block the response: flag it as ungrounded
        # (so the API layer can annotate it) rather than crashing the request.
        logger.warning("[GROUNDEDNESS] Check itself failed: %s", exc)
        return {
            "grounded": False,
            "groundedness_reason": f"Groundedness check failed: {exc}",
            "reasons": [*reasons, f"[GROUNDEDNESS] Check failed: {exc}"],
        }

    logger.info("[GROUNDEDNESS] grounded=%s reason=%s", grounded, reason)
    return {
        "grounded": grounded,
        "groundedness_reason": reason,
        "reasons": [*reasons, f"[GROUNDEDNESS] grounded={grounded}" + (f" ({reason})" if reason else "")],
    }


def route_by_groundedness(state: GraphState) -> Literal["regenerate", "done"]:
    already_retried = state.get("generation_attempts", 0) >= 1 + settings.GROUNDEDNESS_MAX_RETRIES
    if state.get("grounded") or already_retried:
        return "done"
    return "regenerate"


def _reconstruct_context_text(state: GraphState) -> str:
    # Mirrors generate_node._build_context so GroundednessChecker has
    # the exact same facts that were given to the generation prompt.
    parts: list[str] = []

    user_role = state.get("user_role") or "COLLABORATEUR"
    user_name = state.get("user_name")
    squad_id = state.get("squad_id")
    parts.append(f"Profil de l'utilisateur connecté : Nom = {user_name or 'Non spécifié'}, Rôle = {user_role}, Squad = {squad_id or 'Non assignée'}.")

    sql_rows = state.get("sql_rows")
    if sql_rows is not None:
        if len(sql_rows) > 0:
            formatted_rows = []
            for idx, row in enumerate(sql_rows, 1):
                row_items = [f"  - {k}: {v}" for k, v in row.items() if v is not None]
                formatted_rows.append(f"Résultat {idx} :\n" + "\n".join(row_items))
            parts.append("Données structurées extraites de la base SQL :\n" + "\n\n".join(formatted_rows))
        else:
            parts.append(
                "Résultat de la requête SQL : La requête a été exécutée avec succès dans la base de données mais a retourné 0 enregistrement (aucun résultat trouvé correspondant aux critères)."
            )

    for chunk in state.get("vector_chunks") or []:
        parts.append(f"[{chunk.certification_title} — {chunk.section or 'général'}]\n{chunk.text}")

    if state.get("scraped_content"):
        parts.append("Contenu récupéré en direct :\n" + state["scraped_content"])

    return "\n\n".join(parts)
