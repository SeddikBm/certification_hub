from __future__ import annotations

from app.graph.builder import build_validation_graph
from app.schemas.enums import Decision
from app.schemas.state import GraphState
from app.schemas.validation import ExpectedInfo, ValidationResponse


def run_validation(
    file_bytes: bytes,
    mime_type: str,
    file_name: str,
    expected: ExpectedInfo,
) -> ValidationResponse:
    initial_state: GraphState = {
        "file_bytes": file_bytes,
        "file_name": file_name,
        "mime_type": mime_type,
        "expected": expected,
    }

    graph = build_validation_graph()
    final_state: GraphState = graph.invoke(initial_state)

    return ValidationResponse(
        assignment_id=expected.assignment_id,
        decision=final_state["decision"],
        source=final_state["source"],
        scores=final_state["scores"],
        extracted=final_state.get("scraped") or final_state["parsed"],
        detected_urls=final_state.get("detected_urls", []),
        reasons=final_state["reasons"],
        requires_manual_review=final_state["decision"] != Decision.APPROVED,
    )
