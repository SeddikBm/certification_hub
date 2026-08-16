from __future__ import annotations

from app.certification_validation.graph.builder import build_validation_graph
from app.certification_validation.schemas.enums import Decision, SourceType
from app.certification_validation.schemas.state import GraphState
from app.certification_validation.schemas.validation import ExpectedInfo, FieldScores, ParsedCertificate, ValidationResponse




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

    decision = final_state.get("decision", Decision.PENDING_REVIEW)
    requires_review = decision not in (Decision.APPROVED, Decision.REJECTED)

    return ValidationResponse(
        assignment_id=expected.assignment_id,
        decision=decision,
        source=final_state.get("source", SourceType.NONE),
        scores=final_state.get("scores", FieldScores(name_score=0, title_score=0, date_score=0, overall_score=0)),
        extracted=final_state.get("scraped") or final_state.get("parsed", ParsedCertificate()),
        detected_urls=final_state.get("detected_urls", []),
        reasons=final_state.get("reasons", []),
        requires_manual_review=requires_review,
    )

