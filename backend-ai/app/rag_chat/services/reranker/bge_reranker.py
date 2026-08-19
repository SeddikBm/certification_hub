"""
OpenRouter Reranker Engine — fast, lightweight reranking using vector cosine similarity.
Zero local disk download, zero local CPU load.
"""
from __future__ import annotations

import logging
import math
from functools import lru_cache

from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenRouterRerankerEngine:
    """Reranks retrieved candidate chunks using cosine similarity from the embedding engine."""

    def __init__(self, model_name: str | None = None) -> None:
        self.name = model_name or settings.RERANKER_MODEL

    def score(self, query: str, candidates: list[str]) -> list[float]:
        if not candidates:
            return []

        from app.rag_chat.services.embeddings.factory import get_embedding_engine

        emb = get_embedding_engine()
        try:
            q_vec = emb.embed_dense([query])[0]
            c_vecs = emb.embed_dense(candidates)
            scores: list[float] = []
            for cv in c_vecs:
                dot = sum(x * y for x, y in zip(q_vec, cv, strict=True))
                nq = math.sqrt(sum(x * x for x in q_vec)) or 1.0
                nc = math.sqrt(sum(y * y for y in cv)) or 1.0
                cosine_sim = dot / (nq * nc)
                # Normalize cosine similarity from [-1, 1] to [0, 1]
                scores.append(max(0.0, min(1.0, (cosine_sim + 1.0) / 2.0)))
            return scores
        except Exception as exc:
            logger.warning("[RERANKER] Embedding score computation failed: %s", exc)
            return [0.5] * len(candidates)


# Backward compatibility alias
BGERerankerEngine = OpenRouterRerankerEngine


@lru_cache(maxsize=1)
def get_reranker_engine() -> OpenRouterRerankerEngine:
    return OpenRouterRerankerEngine(model_name=settings.RERANKER_MODEL)
