"""Embedding engine factory — returns OpenRouter embedding engine singleton."""
from __future__ import annotations

from functools import lru_cache
from app.core.config import settings
from app.rag_chat.services.embeddings.openrouter import OpenRouterEmbeddingEngine


@lru_cache(maxsize=1)
def get_embedding_engine() -> OpenRouterEmbeddingEngine:
    return OpenRouterEmbeddingEngine(model_name=settings.EMBEDDING_MODEL)
