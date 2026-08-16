"""
SentenceTransformer embedding engine (supports all-MiniLM-L6-v2, BGE, and multilingual models).
"""

from __future__ import annotations

import logging
from sentence_transformers import SentenceTransformer

from app.rag_chat.services.embeddings.base import EmbeddingEngine

logger = logging.getLogger(__name__)


class SentenceTransformerEmbeddingEngine(EmbeddingEngine):
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2", device: str = "cpu") -> None:
        self.name = model_name
        self._device = device
        self._model: SentenceTransformer | None = None
        self._dense_dim: int | None = None

    def _engine(self) -> SentenceTransformer:
        if self._model is None:
            logger.info("Loading SentenceTransformer model %s (device=%s)...", self.name, self._device)
            self._model = SentenceTransformer(self.name, device=self._device)
            self._dense_dim = self._model.get_sentence_embedding_dimension()
        return self._model

    @property
    def dense_dim(self) -> int:
        if self._dense_dim is None:
            self._dense_dim = self._engine().get_sentence_embedding_dimension()
        return self._dense_dim

    def embed_dense(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        embeddings = self._engine().encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    def embed_hybrid(self, texts: list[str]) -> list[dict]:
        dense = self.embed_dense(texts)
        return [{"dense": d, "sparse": {}} for d in dense]
