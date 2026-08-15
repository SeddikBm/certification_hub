"""
Topic guardrail — is this question even about certifications?

Deliberately NOT an LLM call on every message: that's cost and latency on
100% of traffic for a check that should be near-instant. Instead, this
reuses the SAME embedding engine the vector-search agent already needs
(BGE-M3), comparing the question's embedding by cosine similarity against
a small set of reference in-scope questions — zero extra model to host,
zero extra inference cost beyond one embedding call.

Reference questions deliberately span BOTH downstream intents (factual/
"analytique" and advisory/"conseil") so the guardrail doesn't accidentally
correlate with — and leak information about — the routing decision that
happens later; it only answers "is this on-topic at all", not "which agent
should handle it".
"""

from __future__ import annotations

import logging
import math

from app.core.config import settings
from app.rag_chat.services.embeddings.base import EmbeddingEngine
from app.rag_chat.services.embeddings.factory import get_embedding_engine

logger = logging.getLogger(__name__)

REFERENCE_QUESTIONS = [
    # advisory / "conseil"
    "Quelle certification choisir pour évoluer vers le cloud ?",
    "Quel parcours de certification pour devenir Scrum Master ?",
    "Quelle est la différence entre les certifications AZ-104 et AZ-204 ?",
    "Quelle certification AWS est adaptée à un développeur débutant ?",
    "Recommande-moi une formation pour progresser en cybersécurité.",
    # factual / "analytique"
    "Combien de certifications ai-je obtenues cette année ?",
    "Quelles certifications ai-je en cours de validation ?",
    "Quand expire ma certification PSM I ?",
    "Liste mes certifications validées par mon manager.",
    "Combien de personnes de ma squad ont une certification Azure ?",
]


class TopicClassifier:
    def __init__(self, engine: EmbeddingEngine | None = None) -> None:
        self._engine = engine or get_embedding_engine()
        self._reference_vectors: list[list[float]] | None = None

    def _reference_embeddings(self) -> list[list[float]]:
        if self._reference_vectors is None:
            self._reference_vectors = self._engine.embed_dense(REFERENCE_QUESTIONS)
        return self._reference_vectors

    def classify(self, question: str) -> tuple[bool, float]:
        """Returns (on_topic, best_similarity_score)."""
        query_vec = self._engine.embed_dense([question])[0]
        best_score = max(_cosine_similarity(query_vec, ref) for ref in self._reference_embeddings())
        on_topic = best_score >= settings.GUARDRAIL_SIMILARITY_THRESHOLD
        logger.info("[GUARDRAIL] best_similarity=%.3f on_topic=%s", best_score, on_topic)
        return on_topic, best_score


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
