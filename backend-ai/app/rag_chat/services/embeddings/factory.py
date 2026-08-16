from __future__ import annotations

import logging
from functools import lru_cache

from app.core.config import settings
from app.rag_chat.services.embeddings.base import EmbeddingEngine

logger = logging.getLogger(__name__)


@lru_cache
def get_embedding_engine() -> EmbeddingEngine:
    name = settings.EMBEDDING_MODEL.lower()

    if "bge-m3" in name:
        try:
            from app.rag_chat.services.embeddings.bge_m3 import BGEM3EmbeddingEngine

            return BGEM3EmbeddingEngine(device=settings.EMBEDDING_DEVICE)
        except Exception as exc:
            logger.warning("Could not load BGEM3FlagModel (%s), falling back to SentenceTransformer", exc)

    from app.rag_chat.services.embeddings.sentence_transformer import SentenceTransformerEmbeddingEngine

    return SentenceTransformerEmbeddingEngine(
        model_name=settings.EMBEDDING_MODEL,
        device=settings.EMBEDDING_DEVICE,
    )
