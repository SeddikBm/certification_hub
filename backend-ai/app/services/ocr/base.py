"""
OCR engine contract.

Any engine (Tesseract, PaddleOCR, a future cloud API) just needs to
implement `image_to_text`. Nodes and the factory depend on this Protocol,
never on a concrete engine class — that's what makes swapping OCR_ENGINE in
.env a one-line change instead of a refactor.
"""

from __future__ import annotations

from typing import Protocol

import numpy as np


class OCREngine(Protocol):
    name: str

    def image_to_text(self, image: np.ndarray) -> str:
        """
        Run OCR on a single page image (BGR or grayscale numpy array, as
        produced by app.utils.pdf_utils.render_pages_to_images) and return
        the recognised text, reading order preserved as best-effort.
        """
        ...
