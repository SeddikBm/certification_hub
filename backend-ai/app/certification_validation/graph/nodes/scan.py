"""
Node: scan_node — "Scanner Multi-Modal, Extrait : Texte (OCR) + QR/URLs".

Decision inside this node (the actual "why OCR" logic):
  1. Always rasterize pages (needed for QR detection regardless of format).
  2. If it's a PDF with a real text layer, use that directly — zero OCR
     error, near-zero latency, this is the common case for badge/portal
     PDF exports.
  3. Only fall back to the OCR engine when the native layer is too short
     (a scanned page, a screenshot, a flattened "print to PDF" image) or
     the upload is a plain image to begin with.
  4. Collect candidate URLs from BOTH the QR codes and a text regex — some
     issuers print the verify link as text next to the QR, not just inside it.

Extraction (PyMuPDF/PIL) and OCR (Tesseract/PaddleOCR) are two genuinely
different failure modes with different fixes (a corrupt/unsupported file
vs. a missing OCR dependency or a garbled scan), so they're wrapped in
separate try/except blocks, each raising DocumentExtractionError with a
message that says which one it was — that's what shows up in server logs
and, via the API's fallback handler, in the PENDING_REVIEW reason too.
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.exceptions import DocumentExtractionError, UnsupportedFileTypeError
from app.schemas.state import GraphState
from app.services.ocr.factory import get_ocr_engine
from app.services.qr.qr_extractor import detect_qr_urls
from app.utils.pdf_utils import extract_document
from app.utils.url_utils import extract_urls

logger = logging.getLogger(__name__)


def scan_node(state: GraphState) -> dict:
    file_name = state.get("file_name", "?")
    logger.info("[SCAN] Starting extraction for '%s' (mime=%s)", file_name, state["mime_type"])

    try:
        extraction = extract_document(
            state["file_bytes"], state["mime_type"], dpi=settings.PDF_RENDER_DPI
        )
    except UnsupportedFileTypeError:
        raise  # distinct case the API layer handles as a 400, not a PENDING_REVIEW fallback
    except Exception as exc:
        logger.error("[SCAN] PDF/image extraction failed for '%s': %s", file_name, exc)
        raise DocumentExtractionError(f"Could not read '{file_name}' as a PDF/image: {exc}") from exc

    used_ocr = len(extraction.native_text) < settings.MIN_NATIVE_TEXT_CHARS

    if used_ocr:
        logger.info(
            "[SCAN] Native text too short (%d chars) — falling back to OCR (engine=%s)",
            len(extraction.native_text),
            settings.OCR_ENGINE,
        )
        try:
            engine = get_ocr_engine()
            raw_text = "\n".join(engine.image_to_text(img) for img in extraction.page_images)
        except Exception as exc:
            logger.error("[SCAN] OCR engine '%s' failed: %s", settings.OCR_ENGINE, exc)
            raise DocumentExtractionError(
                f"OCR engine '{settings.OCR_ENGINE}' failed to process '{file_name}': {exc}"
            ) from exc
        logger.info("[SCAN] OCR produced %d chars of text", len(raw_text))
    else:
        raw_text = extraction.native_text
        logger.info("[SCAN] Using native PDF text (%d chars, no OCR needed)", len(raw_text))

    logger.info("==========================================")
    logger.info("[SCAN RAW EXTRACTED TEXT RESULT] (used_ocr=%s, length=%d chars)", used_ocr, len(raw_text))
    logger.info("[SCAN RAW TEXT]:\n%s", raw_text)
    logger.info("==========================================")


    urls = extract_urls(raw_text)
    for img in extraction.page_images:
        for qr_payload in detect_qr_urls(img):
            if qr_payload.startswith("http") and qr_payload not in urls:
                urls.append(qr_payload)

    logger.info("[SCAN] Found %d candidate URL(s): %s", len(urls), urls)

    return {"raw_text": raw_text, "used_ocr": used_ocr, "detected_urls": urls}
