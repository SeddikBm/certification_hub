from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.rag_chat.services.embeddings.base import EmbeddingEngine


@lru_cache
def get_embedding_engine() -> EmbeddingEngine:
    name = settings.EMBEDDING_MODEL.lower()

    if "bge-m3" in name:
        from app.rag_chat.services.embeddings.bge_m3 import BGEM3EmbeddingEngine

        return BGEM3EmbeddingEngine(device=settings.EMBEDDING_DEVICE)

    raise ValueError(
        f"Unknown EMBEDDING_MODEL '{settings.EMBEDDING_MODEL}'. "
        "Only BAAI/bge-m3 is wired up today — add a new branch here (and a "
        "matching engine class) to support another model."
    )
