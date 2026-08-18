"""
Hybrid retrieval against PostgreSQL + pgvector.

Schema this assumes (adapt to your real one — see notebooks/chunking_and_embedding_experiments.ipynb
for the exact CREATE TABLE used there):

    CREATE TABLE certification_chunks (
        id SERIAL PRIMARY KEY,
        certification_id INT NOT NULL,
        certification_title TEXT NOT NULL,
        section TEXT,
        chunk_text TEXT NOT NULL,
        source_url TEXT,                                          -- official syllabus page, for the live-scrape fallback
        embedding vector(1024),                                  -- BGE-M3 dense dim
        text_search tsvector GENERATED ALWAYS AS
            (to_tsvector('french', chunk_text)) STORED,
        created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX ON certification_chunks USING ivfflat (embedding vector_cosine_ops);
    CREATE INDEX ON certification_chunks USING GIN (text_search);

Honest simplification worth calling out: BGE-M3's actual sparse vectors
(token -> weight) aren't stored or matched here — that would need a
dedicated sparse-vector extension/index, real added complexity. Instead,
PostgreSQL's own full-text search (tsvector/ts_rank_cd) stands in for the
"lexical" half of hybrid search, which is a well-established, much simpler
practical substitute. The two ranked lists (dense cosine, full-text) are
merged with Reciprocal Rank Fusion (RRF) — simple, doesn't require the two
score scales to be comparable, and is the standard technique for exactly
this kind of two-index fusion. Swapping in true BGE-M3 sparse vectors later
is a real upgrade path if RRF-over-full-text turns out not to be precise
enough in practice — not needed to get a working, genuinely hybrid system today.
"""

from __future__ import annotations

import logging

import psycopg

from app.core.config import settings
from app.rag_chat.exceptions import VectorSearchError
from app.rag_chat.schemas.chat import RetrievedChunk

logger = logging.getLogger(__name__)

_RRF_K = 60  # standard constant from the original RRF paper — not sensitive to tune


class PgVectorStore:
    def __init__(self, dsn: str | None = None) -> None:
        self._dsn = dsn or settings.RAG_DB_DSN

    def hybrid_search(self, query_text: str, query_dense: list[float], top_k: int) -> list[RetrievedChunk]:
        try:
            with psycopg.connect(self._dsn) as conn, conn.cursor() as cur:
                dense_ranked = self._dense_search(cur, query_dense, top_k)
                lexical_ranked = self._lexical_search(cur, query_text, top_k)
        except psycopg.Error as exc:
            raise VectorSearchError(f"pgvector query failed: {exc}") from exc

        return self._fuse(dense_ranked, lexical_ranked, top_k)

    @staticmethod
    def _dense_search(cur, query_dense: list[float], top_k: int) -> list[dict]:
        cur.execute(
            """
            SELECT id, certification_id, certification_title, section, chunk_text, source_url,
                   1 - (embedding <=> %(qvec)s::vector) AS similarity
            FROM certification_chunks
            ORDER BY embedding <=> %(qvec)s::vector
            LIMIT %(top_k)s
            """,
            {"qvec": query_dense, "top_k": top_k},
        )
        return [_row_to_dict(cur, row) for row in cur.fetchall()]

    @staticmethod
    def _lexical_search(cur, query_text: str, top_k: int) -> list[dict]:
        cur.execute(
            """
            SELECT id, certification_id, certification_title, section, chunk_text, source_url,
                   ts_rank_cd(text_search, plainto_tsquery('french', %(q)s)) AS similarity
            FROM certification_chunks
            WHERE text_search @@ plainto_tsquery('french', %(q)s)
            ORDER BY similarity DESC
            LIMIT %(top_k)s
            """,
            {"q": query_text, "top_k": top_k},
        )
        return [_row_to_dict(cur, row) for row in cur.fetchall()]

    @staticmethod
    def _fuse(dense_ranked: list[dict], lexical_ranked: list[dict], top_k: int) -> list[RetrievedChunk]:
        rrf_scores: dict[int, float] = {}
        chunk_by_id: dict[int, dict] = {}

        for ranked_list in (dense_ranked, lexical_ranked):
            for rank, row in enumerate(ranked_list):
                rrf_scores[row["id"]] = rrf_scores.get(row["id"], 0.0) + 1.0 / (_RRF_K + rank + 1)
                chunk_by_id[row["id"]] = row

        ordered_ids = sorted(rrf_scores, key=lambda cid: rrf_scores[cid], reverse=True)[:top_k]
        return [
            RetrievedChunk(
                certification_id=str(chunk_by_id[cid]["certification_id"]) if chunk_by_id[cid].get("certification_id") is not None else None,
                certification_title=chunk_by_id[cid]["certification_title"],
                section=chunk_by_id[cid]["section"],
                text=chunk_by_id[cid]["chunk_text"],
                score=round(rrf_scores[cid], 4),
                source_url=chunk_by_id[cid].get("source_url"),
            )
            for cid in ordered_ids
        ]


def _row_to_dict(cur, row: tuple) -> dict:
    columns = [desc.name for desc in cur.description]
    return dict(zip(columns, row, strict=True))
