"""Node: vector_search_node — hybrid retrieval + cached cross-encoder reranking.

The vector/RAG path handles semantic content questions only
("what topics does CKA cover?", "prerequisites for PSM-I?", etc.).
All structured/factual queries (by squad, provider, price, level, code)
are answered by the text_to_sql_node via SQL — no metadata filtering needed here.
"""
from __future__ import annotations
import logging
from app.core.config import settings
from app.rag_chat.exceptions import RagChatError
from app.rag_chat.schemas.chat import RetrievedChunk
from app.rag_chat.schemas.state import GraphState
from app.rag_chat.services.embeddings.factory import get_embedding_engine
from app.rag_chat.services.reranker.bge_reranker import get_reranker_engine
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

    top_score = reranked[0].score if reranked else 0.0
    logger.info("[VECTOR_SEARCH] %d -> %d after reranking (top=%.4f)",
                len(candidates), len(reranked), top_score)
    return {"vector_chunks": reranked,
            "reasons": [*reasons, f"[VECTOR_SEARCH] {len(reranked)} chunk(s), top={top_score:.4f}"]}


def _rerank(query: str, candidates: list[RetrievedChunk]) -> list[RetrievedChunk]:
    if not candidates:
        return []
    scores = get_reranker_engine().score(query, [c.text for c in candidates])
    scored = sorted(zip(candidates, scores, strict=True), key=lambda p: p[1], reverse=True)
    top = scored[:settings.RERANK_TOP_N]
    return [c.model_copy(update={"score": round(float(s), 4)}) for c, s in top]
