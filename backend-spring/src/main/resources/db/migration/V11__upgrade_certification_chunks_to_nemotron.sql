-- NVIDIA Nemotron 3 Embed returns 2048 dimensions.  pgvector's regular
-- vector indexes stop at 2000 dimensions, while halfvec supports up to 4000
-- and HNSW indexing. Existing embeddings are incompatible and intentionally
-- cleared; backend-ai re-creates them during the next initial ingestion.
CREATE EXTENSION IF NOT EXISTS vector;

DROP INDEX IF EXISTS idx_certchunks_embedding_ivfflat;

ALTER TABLE certification_chunks
    ALTER COLUMN embedding TYPE halfvec(2048)
    USING NULL::halfvec(2048);

CREATE INDEX IF NOT EXISTS idx_certchunks_embedding_hnsw
    ON certification_chunks USING hnsw (embedding halfvec_cosine_ops)
    WITH (m = 16, ef_construction = 64);
