"""
BGE-M3 embedding engine.

Chosen as the default per the benchmark in the README: MIT license (no
usage restrictions, unlike some open-weight-but-not-really-open licenses),
100+ languages including French, and — the deciding factor for this
specific use case — hybrid dense+sparse retrieval in a single model. A
purely dense/semantic embedding can under-rank an exact-match query like
"AZ-204" against a chunk that literally contains "AZ-204"; the sparse
(BM25-like lexical) signal fixes that without needing a separate keyword
index. Model is lazy-loaded and cached on the instance — the same
"pay the load cost once per process, not once per request" pattern as
Module 2's PaddleOCREngine.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


class BGEM3EmbeddingEngine:
    name = "BAAI/bge-m3"
    dense_dim = 1024

    def __init__(self, device: str = "cpu") -> None:
        self._device = device
        self._model = None  # lazy init, see _engine()

    def _engine(self):
        if self._model is None:
            from FlagEmbedding import BGEM3FlagModel  # heavy import, done lazily

            logger.info("Loading BGE-M3 (device=%s)...", self._device)
            self._model = BGEM3FlagModel(
                self.name,
                use_fp16=self._device == "cuda",
                device=self._device,
            )
        return self._model

    def embed_dense(self, texts: list[str]) -> list[list[float]]:
        output = self._engine().encode(
            texts, return_dense=True, return_sparse=False, return_colbert_vecs=False
        )
        return output["dense_vecs"].tolist()

    def embed_hybrid(self, texts: list[str]) -> list[dict]:
        output = self._engine().encode(
            texts, return_dense=True, return_sparse=True, return_colbert_vecs=False
        )
        dense = output["dense_vecs"].tolist()
        sparse = output["lexical_weights"]  # list[dict[token_id, weight]]
        return [{"dense": d, "sparse": s} for d, s in zip(dense, sparse, strict=True)]
