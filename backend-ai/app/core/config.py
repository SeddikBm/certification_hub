"""
Centralised configuration for the Certificate Validation microservice.

Everything that could plausibly change between environments (dev / staging /
prod) or between deployments lives here, sourced from environment variables
via pydantic-settings. Nothing else in the codebase should call os.environ
directly — import `settings` from this module instead.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Service metadata -------------------------------------------------
    APP_NAME: str = "certification-hub-validation-engine"
    ENV: str = "dev"  # dev | staging | prod
    LOG_LEVEL: str = "INFO"  # set to DEBUG locally for maximum console detail
    API_KEY: str = Field(
        default="change-me",
        description="Shared secret expected in the X-API-Key header, "
        "used by the Spring Boot gateway to authenticate itself.",
    )

    # --- Groq / LLM ---------------------------------------------------------
    # NOTE (2026-07): Groq deprecated llama-3.1-8b-instant and
    # llama-3.3-70b-versatile for free/developer-tier accounts on 2026-06-17.
    # Recommended replacements at time of writing are openai/gpt-oss-120b
    # (quality) / openai/gpt-oss-20b (speed) or qwen/qwen3.6-27b (also
    # vision-capable). Keep this in an env var — don't hardcode a model id
    # you might have to change again in three months.
    GROQ_API_KEY: str = ""
    GROQ_PARSER_MODEL: str = "openai/gpt-oss-120b"
    GROQ_VISION_MODEL: str | None = "qwen/qwen3.6-27b"  # optional VLM fallback path
    GROQ_REQUEST_TIMEOUT_S: float = 30.0

    # --- Document extraction ------------------------------------------------
    OCR_ENGINE: str = "paddleocr"  # "paddleocr" | "tesseract"
    OCR_LANGUAGES: str = "fr+en"
    PDF_RENDER_DPI: int = 300
    # If native (embedded) PDF text is shorter than this, we treat the file
    # as a scanned/flattened image and fall back to OCR.
    MIN_NATIVE_TEXT_CHARS: int = 40

    # --- Web verification agent ---------------------------------------------
    TRUSTED_ISSUER_DOMAINS: list[str] = [
        "credly.com",
        "youracclaim.com",
        "badgr.com",
        "udemy.com",
        "coursera.org",
        "pluralsight.com",
        "learn.microsoft.com",
        "microsoft.com",
        "aws.amazon.com",
        "cloud.google.com",
        "redhat.com",
        "comptia.org",
        "isc2.org",
        "pmi.org",
        "cisco.com",
        "hashicorp.com",
        "salesforce.com",
    ]
    SCRAPER_TIMEOUT_S: float = 10.0
    SCRAPER_MAX_BYTES: int = 3_000_000  # guard against oversized responses

    # Off by default on purpose. Flipping this to False means the scraper
    # will fetch a page even if that site's robots.txt says not to — that's
    # a compliance/ToS call for Devoteam to make deliberately (ideally with
    # whoever owns legal/vendor-relationship risk), not a default this code
    # should choose silently. See README "Faisabilité du scraping" section
    # before touching this in any real deployment.
    RESPECT_ROBOTS_TXT: bool = True

    # --- Scoring thresholds ---------------------------------------------------
    SCORE_THRESHOLD_APPROVE: float = 0.95
    SCORE_THRESHOLD_REJECT: float = 0.60
    DATE_TOLERANCE_DAYS: int = 3

    # Deliberately much lower than SCORE_THRESHOLD_REJECT: this gate fires
    # BEFORE web verification, straight off the OCR/LLM name reading alone,
    # so it needs a wide margin for OCR noise (a misread letter or two).
    # Calibrated against real name pairs (2026-08-03): genuinely different
    # people scored 0.18-0.39 (token_sort_ratio), while the same person with
    # realistic OCR noise (misread letters, "rn"/"m" confusion, word-order
    # swaps) scored 0.91-1.00 — 0.50 sits comfortably in that gap. Re-check
    # this gap if you change the underlying scoring function.
    EARLY_REJECT_NAME_THRESHOLD: float = 0.50

    # Certification titles are NOT free text the way names are — they come
    # from a fixed catalog, so a mismatch is either OCR noise on the same
    # title or a genuinely different certification, never a legitimate
    # personal variant. Calibrated 2026-08-03: same title with realistic
    # OCR noise scored 0.83-1.00; genuinely different titles scored
    # 0.08-0.68 (the top of that range being same-family exam codes like
    # "AZ-204" vs "AZ-900", which share a lot of characters despite being
    # different exams — the narrowest, riskiest case). 0.75 sits in the
    # ~0.15 gap between the two clusters. This is a real but narrower
    # margin than the name threshold above — re-run the calibration in
    # tests/test_early_match.py before changing either threshold or the
    # scoring function.
    EARLY_REJECT_TITLE_THRESHOLD: float = 0.75

    # --- Misc -----------------------------------------------------------------
    MAX_UPLOAD_MB: int = 15


@lru_cache
def get_settings() -> Settings:
    """Settings is cheap but env parsing isn't free — cache the singleton."""
    return Settings()


settings = get_settings()
