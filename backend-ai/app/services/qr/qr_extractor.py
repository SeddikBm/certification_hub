"""
QR code extraction.

Uses cv2.QRCodeDetector rather than pyzbar/zbar on purpose: it's already a
transitive dependency of opencv-python-headless (which we need anyway for
image handling), so there's no extra system package (libzbar0) to install
in the container. If you find OpenCV's detector too weak on low-res phone
photos of certificates, pyzbar is a drop-in swap here — same signature.
"""

from __future__ import annotations

import cv2
import numpy as np

_detector = cv2.QRCodeDetector()


def detect_qr_urls(image: np.ndarray) -> list[str]:
    """Return every decoded QR payload found in a page image."""
    bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR) if image.ndim == 3 else image

    try:
        ok, decoded_info, _points, _straight_qrcode = _detector.detectAndDecodeMulti(bgr)
    except cv2.error:
        return []

    if not ok:
        return []

    return [text for text in decoded_info if text]
