"""
Node: vector_search_node — "Agent Vectoriel (Conseil Sémantique & Filtrage)".

Two stages: pull a wide net with hybrid dense+sparse search
(VECTOR_TOP_K candidates), then narrow to the best few with the
cross-encoder reranker (RERANK_TOP_N) — see the reranker module's
docstring for why this two-stage approach beats using either alone.
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.schemas.chat import RetrievedChunk
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.embeddings.factory import get_embedding_engine
from app.rag_chat.services.reranker.bge_reranker import BGERerankerEngine
from app.rag_chat.services.vector_store.pgvector_store import PgVectorStore

logger = logging.getLogger(__name__)


def vector_search_node(state: GraphState) -> dict:
    query = state["rewritten_query"]
    reasons = state.get("reasons", [])

    try:
        query_dense = get_embedding_engine().embed_dense([query])[0]
        candidates = PgVectorStore().hybrid_search(query, query_dense, top_k=settings.VECTOR_TOP_K)
        reranked = _rerank(query, candidates)
    except RagChatError as exc:
        logger.error("[VECTOR_SEARCH] Failed: %s", exc)
        return {"vector_chunks": [], "reasons": [*reasons, f"[VECTOR_SEARCH] Failed: {exc}"]}

    logger.info(
        "[VECTOR_SEARCH] %d candidate(s) -> %d after reranking (top score=%.2f)",
        len(candidates),
        len(reranked),
        reranked[0].score if reranked else 0.0,
    )
    return {
        "vector_chunks": reranked,
        "reasons": [*reasons, f"[VECTOR_SEARCH] {len(reranked)} chunk(s) retrieved"],
    }


def _rerank(query: str, candidates: list[RetrievedChunk]) -> list[RetrievedChunk]:
    if not candidates:
        return []

    scores = BGERerankerEngine(device=settings.RERANKER_DEVICE).score(query, [c.text for c in candidates])
    scored = sorted(zip(candidates, scores, strict=True), key=lambda pair: pair[1], reverse=True)
    top = scored[: settings.RERANK_TOP_N]
    return [chunk.model_copy(update={"score": round(float(score), 4)}) for chunk, score in top]
