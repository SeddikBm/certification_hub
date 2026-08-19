"""
OpenRouter Embedding Engine — calls OpenRouter /api/v1/embeddings.
Zero local disk download, zero local CPU load.
"""
from __future__ import annotations

import logging
import httpx
from app.core.config import settings
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.services.embeddings.base import HybridEmbedding

logger = logging.getLogger(__name__)


class OpenRouterEmbeddingEngine:
    dense_dim = 2048

    def __init__(self, model_name: str | None = None, api_key: str | None = None) -> None:
        self.name = model_name or settings.EMBEDDING_MODEL
        self._api_key = api_key or settings.OPENROUTER_API_KEY
        self._base_url = settings.OPENROUTER_BASE_URL.rstrip("/")
        self._headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "CertificationHub",
        }

    def embed_dense(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if not self._api_key:
            raise RagChatError("OPENROUTER_API_KEY is not configured")

        # Batch in groups of 32 to avoid HTTP payload limits
        batch_size = 32
        all_embeddings: list[list[float]] = []

        with httpx.Client(timeout=45.0) as client:
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                try:
                    resp = client.post(
                        f"{self._base_url}/embeddings",
                        headers=self._headers,
                        json={"model": self.name, "input": batch},
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    items = sorted(data["data"], key=lambda x: x["index"])
                    vectors = [item["embedding"] for item in items]
                    for vector in vectors:
                        if len(vector) != self.dense_dim:
                            raise RagChatError(
                                f"OpenRouter returned {len(vector)} dimensions; expected {self.dense_dim}"
                            )
                    all_embeddings.extend(vectors)
                except Exception as exc:
                    logger.error("[EMBEDDING] OpenRouter API call failed: %s", exc)
                    raise RagChatError(f"OpenRouter embedding call failed: {exc}") from exc

        return all_embeddings

    def embed_hybrid(self, texts: list[str]) -> list[HybridEmbedding]:
        dense = self.embed_dense(texts)
        return [{"dense": d, "sparse": {}} for d in dense]
