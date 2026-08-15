"""
BGE-reranker-v2-m3 — cross-encoder reranking.

Vector search (even hybrid dense+sparse) ranks candidates independently of
each other, comparing each to the query in isolation. A cross-encoder
reranker looks at the (query, candidate) pair jointly, which is slower per
pair but meaningfully more accurate — the standard pattern is: pull a wide
net with the embedding model (VECTOR_TOP_K candidates), then narrow to the
best few with the reranker (RERANK_TOP_N) before they ever reach the LLM.
Apache 2.0, ~278M params, light enough to run on CPU for the batch sizes
this endpoint sees (a few dozen candidates per query, not thousands).
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


class BGERerankerEngine:
    name = "BAAI/bge-reranker-v2-m3"

    def __init__(self, device: str = "cpu") -> None:
        self._device = device
        self._model = None

    def _engine(self):
        if self._model is None:
            from FlagEmbedding import FlagReranker

            logger.info("Loading BGE reranker (device=%s)...", self._device)
            self._model = FlagReranker(
                self.name, use_fp16=self._device == "cuda", device=self._device
            )
        return self._model

    def score(self, query: str, candidates: list[str]) -> list[float]:
        """One relevance score per candidate, same order as the input list."""
        if not candidates:
            return []
        pairs = [[query, c] for c in candidates]
        scores = self._engine().compute_score(pairs, normalize=True)
        # compute_score returns a bare float instead of a list when len(pairs) == 1
        return scores if isinstance(scores, list) else [scores]
