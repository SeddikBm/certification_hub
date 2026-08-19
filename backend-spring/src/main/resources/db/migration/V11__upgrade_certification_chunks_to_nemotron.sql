-- NVIDIA Nemotron 3 Embed returns 2048 dimensions.
-- Upgrading embedding column to vector(2048).
CREATE EXTENSION IF NOT EXISTS vector;

DROP INDEX IF EXISTS idx_certchunks_embedding_ivfflat;
DROP INDEX IF EXISTS idx_certchunks_embedding_hnsw;

ALTER TABLE certification_chunks
    ALTER COLUMN embedding TYPE vector(2048)
    USING NULL::vector(2048);
