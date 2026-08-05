from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.services.ocr.base import OCREngine


@lru_cache
def get_ocr_engine(engine_name: str | None = None) -> OCREngine:
    """
    Return a cached OCR engine instance. Swapping engines is a config
    change (OCR_ENGINE=tesseract in .env), never a code change — nodes only
    ever depend on the OCREngine Protocol.
    """
    name = (engine_name or settings.OCR_ENGINE).lower()

    if name == "paddleocr":
        from app.services.ocr.paddle_engine import PaddleOCREngine

        return PaddleOCREngine(languages=settings.OCR_LANGUAGES)

    if name == "tesseract":
        from app.services.ocr.tesseract_engine import TesseractOCREngine

        return TesseractOCREngine(languages=settings.OCR_LANGUAGES)

    raise ValueError(f"Unknown OCR_ENGINE '{name}'. Use 'paddleocr' or 'tesseract'.")
