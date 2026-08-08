"""
PaddleOCR-backed engine.

Chosen as the default because it's the only open-source engine in our
benchmark with built-in layout/structure awareness (PP-Structure) and the
best raw accuracy on printed + moderately messy documents (see README for
the full benchmark table). The model is lazy-loaded and cached on the
instance since PaddleOCR's startup cost (~1-2s to load weights) is the kind
of thing you pay once per process, not once per request.
"""

from __future__ import annotations

import logging

import numpy as np

logger = logging.getLogger(__name__)


class PaddleOCREngine:
    name = "paddleocr"

    def __init__(self, languages: str = "fr+en") -> None:
        # PaddleOCR's `lang` is a single code, not "fr+en". We initialise a
        # French model by default because Devoteam Morocco certificates are
        # predominantly FR/EN; English tokens (cert titles, "AZ-204", issuer
        # names) are still recognised fine by the fr model's latin charset.
        self._lang = "fr" if "fr" in languages else "en"
        self._ocr = None  # lazy init, see _engine()

    def _engine(self):
        if self._ocr is None:
            from paddleocr import PaddleOCR  # heavy import, done lazily

            logger.info("Loading PaddleOCR model (lang=%s)...", self._lang)
            try:
                self._ocr = PaddleOCR(
                    lang=self._lang,
                    use_angle_cls=True,
                    show_log=False,
                )
            except (ValueError, TypeError):
                self._ocr = PaddleOCR(
                    lang=self._lang,
                    use_angle_cls=True,
                )
        return self._ocr


    def image_to_text(self, image: np.ndarray) -> str:
        result = self._engine().ocr(image, cls=True)
        if not result or result[0] is None:
            return ""

        # Each detection is [box, (text, confidence)]. Sort top-to-bottom,
        # left-to-right using the box's top-left corner as a cheap but
        # effective reading-order heuristic for single-column certificates.
        lines = sorted(
            result[0],
            key=lambda det: (round(det[0][0][1] / 15), det[0][0][0]),
        )
        return "\n".join(line[1][0] for line in lines if line[1][0].strip())
