from __future__ import annotations

import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


class PaddleOCREngine:
    name = "paddleocr"

    def __init__(self, languages: str = "fr+en") -> None:
        self._lang = "fr" if "fr" in languages else "en"
        self._ocr = None

    def _engine(self):
        if self._ocr is None:
            from paddleocr import PaddleOCR

            logger.info(
                "Loading PaddleOCR 3.7.0 model (lang=%s)...",
                self._lang,
            )

            self._ocr = PaddleOCR(
                lang=self._lang,
            )

        return self._ocr

    def image_to_text(self, image: np.ndarray) -> str:
        ocr = self._engine()

        logger.info("Running PaddleOCR inference...")

        results = ocr.predict(image)

        for result in results:
            result.print()

        texts: list[str] = []

        for result in results:
            # PaddleOCR 3.x Result object
            data = result.json

            # Depending on PaddleOCR version, json may be a JSON string
            if isinstance(data, str):
                import json
                data = json.loads(data)

            # Result can be wrapped in {"res": {...}}
            if isinstance(data, dict) and "res" in data:
                data = data["res"]

            if not isinstance(data, dict):
                logger.warning(
                    "Unexpected PaddleOCR result type: %s",
                    type(data),
                )
                continue

        rec_texts = data.get("rec_texts", [])

        logger.info(
            "PaddleOCR detected %d text regions",
            len(rec_texts),
        )

        texts.extend(
            text.strip()
            for text in rec_texts
            if isinstance(text, str) and text.strip()
        )

        return "\n".join(texts)