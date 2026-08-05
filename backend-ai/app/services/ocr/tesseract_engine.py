"""
Tesseract-backed engine — the lightweight fallback.

Use this when you can't/don't want the PaddlePaddle dependency (e.g. a
constrained container image, or a CPU-only box where Tesseract's ~450ms/page
beats PaddleOCR's ~2s/page and the extra accuracy doesn't matter because the
document is a clean, born-digital PDF anyway). See README benchmark.
"""

from __future__ import annotations

import numpy as np


class TesseractOCREngine:
    name = "tesseract"

    def __init__(self, languages: str = "fr+en") -> None:
        # Tesseract's lang codes use ISO 639-2 (fra, eng) joined by '+'.
        mapping = {"fr": "fra", "en": "eng"}
        codes = [mapping[code] for code in languages.split("+") if code in mapping]
        self._lang = "+".join(codes) or "eng"

    def image_to_text(self, image: np.ndarray) -> str:
        import pytesseract
        from PIL import Image

        pil_image = Image.fromarray(image)
        return pytesseract.image_to_string(pil_image, lang=self._lang)
