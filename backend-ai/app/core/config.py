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
    SCRAPER_TIMEOUT_S: float = 10.0
    SCRAPER_MAX_BYTES: int = 3_000_000
    RESPECT_ROBOTS_TXT: bool = False

    # --- Validation thresholds ------------------------------------------------
    NAME_FUZZY_THRESHOLD: float = 0.90  # Nom fuzzy >= 90%

    # --- Misc -----------------------------------------------------------------
    MAX_UPLOAD_MB: int = 15



@lru_cache
def get_settings() -> Settings:
    """Settings is cheap but env parsing isn't free — cache the singleton."""
    return Settings()


settings = get_settings()
