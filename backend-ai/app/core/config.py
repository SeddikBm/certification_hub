"""
Centralised configuration for the Certificate Validation and RAG Chat microservices.
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
        default="certifhub-internal-key-2026",
        description="Shared secret expected in the X-API-Key header, "
        "used by the Spring Boot gateway to authenticate itself.",
    )

    # --- OpenRouter & Groq LLM Settings ------------------------------------
    GROQ_API_KEY: str = ""
    GROQ_PARSER_MODEL: str = "nvidia/nemotron-3-ultra-550b-a55b:free"
    GROQ_VISION_MODEL: str | None = "qwen/qwen3.6-27b"  # optional VLM fallback path
    GROQ_REQUEST_TIMEOUT_S: float = 30.0

    # --- Document extraction ------------------------------------------------
    OCR_ENGINE: str = "paddleocr"  # "paddleocr" | "tesseract"
    OCR_LANGUAGES: str = "fr+en"
    PDF_RENDER_DPI: int = 300
    MIN_NATIVE_TEXT_CHARS: int = 40

    # --- Web verification agent ---------------------------------------------
    SCRAPER_TIMEOUT_S: float = 10.0
    SCRAPER_MAX_BYTES: int = 3_000_000

    # --- Validation thresholds ------------------------------------------------
    NAME_FUZZY_THRESHOLD: float = 0.90  # Nom fuzzy >= 90%

    # --- Misc -----------------------------------------------------------------
    MAX_UPLOAD_MB: int = 15

    # --- LLM for RAG ----------------------------------------------------------
    RAG_LLM_MODEL: str = "nvidia/nemotron-3-ultra-550b-a55b:free"

    # --- Embeddings & reranking (OpenRouter Nemotron API or local) ------------
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    EMBEDDING_MODEL: str = "nvidia/nemotron-3-embed-1b:free"
    EMBEDDING_DEVICE: str = "cpu"  # "cpu" | "cuda"
    RERANKER_MODEL: str = "nvidia/llama-nemotron-rerank-vl-1b-v2:free"
    RERANKER_DEVICE: str = "cpu"
    HF_TOKEN: str = ""

    # --- Vector store (PostgreSQL + pgvector) ----------------------------------
    RAG_DB_DSN: str = "postgresql://certif_user:certif_password@postgres-db:5432/certifhub_db"
    RAG_DB_DSN_WRITE: str = "postgresql://certif_user:certif_password@postgres-db:5432/certifhub_db"

    # --- Retrieval -----------------------------------------------------------------
    VECTOR_TOP_K: int = 15
    RERANK_TOP_N: int = 5
    RETRIEVAL_GRADE_MIN_SCORE: float = 0.40

    # --- Topic guardrail --------------------------------------------------------
    GUARDRAIL_SIMILARITY_THRESHOLD: float = 0.45
    GUARDRAIL_REDIRECT_MESSAGE: str = (
        "Je suis votre conseiller IA dédié aux certifications et formations CertificationHub. "
        "Je suis là pour vous aider à explorer le catalogue, comparer les certifications, "
        "comprendre les prérequis et les formats d'examen, ou analyser les statistiques de vos squads. "
        "Comment puis-je vous aider sur un sujet lié aux certifications ?"
    )

    # --- Text-to-SQL guardrail -------------------------------------------------
    SQL_ALLOWED_TABLES: list[str] = [
        "certifications",
        "squads",
        "certification_squads",
        "certification_ratings",
        "assignments",
        "users",
    ]
    SQL_MAX_ROWS: int = 50
    SQL_STATEMENT_TIMEOUT_MS: int = 5000

    # --- Groundedness & generation --------------------------------------------
    GROUNDEDNESS_MAX_RETRIES: int = 1  # regenerate once if ungrounded, never loop further

    # --- Chunking (ingestion) --------------------------------------------------------
    CHUNK_SIZE_TOKENS: int = 512
    CHUNK_OVERLAP_RATIO: float = 0.0

    # --- Ingestion pipeline retry / dead-letter ----------------------------------
    INGESTION_MAX_RETRIES: int = 1
    INGESTION_BACKOFF_BASE_S: float = 1.0  # fast retry if transient error
    INGESTION_REFRESH_INTERVAL_DAYS: int = 90  # periodic re-scrape/re-embed cadence


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
