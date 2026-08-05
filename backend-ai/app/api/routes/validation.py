from __future__ import annotations

import logging
from datetime import date

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps import verify_internal_api_key
from app.core.config import settings
from app.exceptions import UnsupportedFileTypeError
from app.graph.runner import run_validation
from app.schemas.enums import Decision, SourceType
from app.schemas.validation import ExpectedInfo, FieldScores, ParsedCertificate, ValidationResponse
from app.utils.pdf_utils import SUPPORTED_IMAGE_TYPES, SUPPORTED_PDF_TYPE

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["validation"],
    dependencies=[Depends(verify_internal_api_key)],
)


def _fallback_pending_review(assignment_id: int, exc: Exception) -> ValidationResponse:
    """
    Safety net for unexpected engine failures (LLM outage, scraper crash,
    corrupt file that slips past the type check, ...). This is a
    fraud-detection workflow: an exception must never mean the submission
    silently disappears. Route to a human instead of raising a 500.

    The exception's *type name* is included in the reason on purpose (e.g.
    "DocumentExtractionError", "LLMParsingError") — that's what tells you,
    from the API response alone and not just server logs, which stage
    failed: OCR/extraction, the LLM call, or something unexpected.
    """
    origin = type(exc).__name__
    return ValidationResponse(
        assignment_id=assignment_id,
        decision=Decision.PENDING_REVIEW,
        source=SourceType.NONE,
        scores=FieldScores(name_score=0, title_score=0, date_score=0, overall_score=0),
        extracted=ParsedCertificate(),
        detected_urls=[],
        reasons=[
            f"Automated validation could not complete ({origin}: {str(exc)[:200]}) "
            "— flagged for manual review."
        ],
        requires_manual_review=True,
    )


@router.post("/validate", response_model=ValidationResponse)
async def validate_certificate(
    file: UploadFile = File(..., description="Certificate PDF or image"),
    assignment_id: int = Form(...),
    expected_name: str = Form(...),
    expected_certification_title: str = Form(...),
    expected_not_before: date | None = Form(None),
) -> ValidationResponse:
    if file.content_type not in {SUPPORTED_PDF_TYPE, *SUPPORTED_IMAGE_TYPES}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported content type '{file.content_type}'. Expected PDF or PNG/JPEG/WEBP.",
        )

    file_bytes = await file.read()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds the {settings.MAX_UPLOAD_MB} MB limit.",
        )

    logger.info(
        "[API] Received validation request: assignment_id=%s file=%s (%d bytes, %s)",
        assignment_id,
        file.filename,
        len(file_bytes),
        file.content_type,
    )

    expected = ExpectedInfo(
        assignment_id=assignment_id,
        expected_name=expected_name,
        expected_certification_title=expected_certification_title,
        expected_not_before=expected_not_before,
    )

    try:
        result = run_validation(
            file_bytes=file_bytes,
            mime_type=file.content_type,
            file_name=file.filename or "upload",
            expected=expected,
        )
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 — intentional broad safety net, see docstring above
        logger.exception(
            "[API] Validation engine failed for assignment_id=%s (%s)",
            assignment_id,
            type(exc).__name__,
        )
        return _fallback_pending_review(assignment_id, exc)

    logger.info(
        "[API] assignment_id=%s -> decision=%s source=%s",
        assignment_id,
        result.decision,
        result.source,
    )
    return result
