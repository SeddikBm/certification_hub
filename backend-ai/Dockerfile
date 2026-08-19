FROM python:3.11-slim

# libgl1/libglib2.0-0: required by opencv-python-headless at import time.
# tesseract-ocr(-fra): only needed if OCR_ENGINE=tesseract — safe to remove
# if you standardise on PaddleOCR to shrink the image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    tesseract-ocr-fra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
