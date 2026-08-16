"""
BGE-reranker-v2-m3 / Cross-Encoder Reranker with graceful fallback.
"""

from __future__ import annotations

import logging
import math

logger = logging.getLogger(__name__)


class BGERerankerEngine:
    name = "BAAI/bge-reranker-v2-m3"

    def __init__(self, device: str = "cpu") -> None:
        self._device = device
        self._model = None
        self._load_failed = False

    def _engine(self):
        if self._model is None and not self._load_failed:
            try:
                from FlagEmbedding import FlagReranker

                logger.info("Loading BGE reranker (device=%s)...", self._device)
                self._model = FlagReranker(
                    self.name, use_fp16=self._device == "cuda", device=self._device
                )
            except Exception as exc:
                logger.warning("FlagReranker could not be loaded (%s). Using cosine fallback.", exc)
                self._load_failed = True
        return self._model

    def score(self, query: str, candidates: list[str]) -> list[float]:
        """One relevance score per candidate, same order as the input list."""
        if not candidates:
            return []

        engine = self._engine()
        if engine is not None:
            try:
                pairs = [[query, c] for c in candidates]
                scores = engine.compute_score(pairs, normalize=True)
                return scores if isinstance(scores, list) else [scores]
            except Exception as exc:
                logger.warning("Reranker compute_score failed: %s. Using fallback.", exc)

        # Fallback using embedding cosine similarity
        from app.rag_chat.services.embeddings.factory import get_embedding_engine

        emb_engine = get_embedding_engine()
        q_vec = emb_engine.embed_dense([query])[0]
        c_vecs = emb_engine.embed_dense(candidates)

        scores = []
        for cv in c_vecs:
            dot = sum(x * y for x, y in zip(q_vec, cv, strict=True))
            norm_q = math.sqrt(sum(x * x for x in q_vec)) or 1.0
            norm_c = math.sqrt(sum(y * y for y in cv)) or 1.0
            scores.append(max(0.0, min(1.0, (dot / (norm_q * norm_c) + 1.0) / 2.0)))
        return scores
