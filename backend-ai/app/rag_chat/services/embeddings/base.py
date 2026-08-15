"""
Embedding engine contract.

Same swappability pattern as app.certification_validation.services.ocr.base:
nodes and the factory depend on this Protocol, never on a concrete engine
class — swapping EMBEDDING_MODEL in .env is a one-line change, not a
refactor. BGE-M3 (see bge_m3.py) is the only implementation today, but any
future replacement (a bigger Qwen3-Embedding variant, a hosted API) just
needs to satisfy this interface.
"""

from __future__ import annotations

from typing import Protocol, TypedDict


class HybridEmbedding(TypedDict):
    dense: list[float]
    sparse: dict[str, float]  # token -> weight, BM25-like lexical signal


class EmbeddingEngine(Protocol):
    name: str
    dense_dim: int

    def embed_dense(self, texts: list[str]) -> list[list[float]]:
        """Dense embeddings only — used for the topic guardrail's cheap
        cosine-similarity check, where the sparse/lexical signal doesn't matter."""
        ...

    def embed_hybrid(self, texts: list[str]) -> list[HybridEmbedding]:
        """Dense + sparse — used for actual retrieval, where BGE-M3's hybrid
        signal is what makes short exact-match queries (exam codes like
        "AZ-204") work well alongside semantic ones."""
        ...
