"""
Embedding engine contract.

Same swappability pattern as app.certification_validation.services.ocr.base:
nodes and the factory depend on this Protocol, never on a concrete engine
class — swapping EMBEDDING_MODEL in .env is a one-line change, not a
refactor. The production implementation is OpenRouter/NVIDIA Nemotron; any
future provider only needs to satisfy this interface.
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
        """Dense + lexical signal contract.

        The production implementation uses OpenRouter dense embeddings and
        PostgreSQL ``tsvector`` for sparse/lexical matching.
        """
        ...
