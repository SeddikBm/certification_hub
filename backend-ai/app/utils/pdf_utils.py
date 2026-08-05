"""
Document utilities built on PyMuPDF (fitz).

One dependency does two jobs we need:
  1. Pull the *native* text layer out of a PDF, if it has one — most IT
     certificates (Credly, Udemy, AWS, Microsoft Learn PDF exports) are
     born-digital and already contain a perfect, 100%-accurate text layer.
     No OCR needed at all for these; it would only add latency and risk.
  2. Rasterize pages to images — needed (a) as OCR input for the scanned/
     screenshotted minority of uploads, and (b) always, for QR-code
     detection, since a QR code is graphical and never appears in the text
     layer even when the rest of the page does.

This dual role is why `extract_document` returns *both* the native text and
the rendered images rather than picking one — the scan node decides how to
combine them.
"""

from __future__ import annotations

from dataclasses import dataclass

import fitz  # PyMuPDF
import numpy as np
from PIL import Image

from app.exceptions import UnsupportedFileTypeError

SUPPORTED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
SUPPORTED_PDF_TYPE = "application/pdf"


@dataclass
class ExtractionResult:
    native_text: str
    page_images: list[np.ndarray]  # RGB arrays, one per page


def render_pages_to_images(file_bytes: bytes, dpi: int) -> list[np.ndarray]:
    """Render every page of a PDF to an RGB numpy array at the given DPI."""
    images: list[np.ndarray] = []
    zoom = dpi / 72  # PDF base resolution is 72 DPI
    matrix = fitz.Matrix(zoom, zoom)

    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            pix = page.get_pixmap(matrix=matrix, colorspace=fitz.csRGB)
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
                pix.height, pix.width, pix.n
            )
            images.append(img)
    return images


def extract_native_pdf_text(file_bytes: bytes) -> str:
    """Pull the embedded text layer out of a PDF (empty string if none)."""
    chunks: list[str] = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            chunks.append(page.get_text())
    return "\n".join(chunks).strip()


def load_single_image(file_bytes: bytes) -> np.ndarray:
    """Load a plain image upload (PNG/JPEG/WEBP) into an RGB numpy array."""
    with Image.open(__import__("io").BytesIO(file_bytes)) as img:
        return np.array(img.convert("RGB"))


def extract_document(file_bytes: bytes, mime_type: str, dpi: int) -> ExtractionResult:
    """
    Entry point used by the scan node. Dispatches on mime type and always
    returns page images (for QR detection / OCR fallback) plus whatever
    native text is available (empty for plain images).
    """
    if mime_type == SUPPORTED_PDF_TYPE:
        return ExtractionResult(
            native_text=extract_native_pdf_text(file_bytes),
            page_images=render_pages_to_images(file_bytes, dpi),
        )

    if mime_type in SUPPORTED_IMAGE_TYPES:
        return ExtractionResult(native_text="", page_images=[load_single_image(file_bytes)])

    raise UnsupportedFileTypeError(
        f"Unsupported mime type '{mime_type}'. Expected PDF or PNG/JPEG/WEBP."
    )
