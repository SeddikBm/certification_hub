CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS certification_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certification_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
    certification_code VARCHAR(100),
    certification_title VARCHAR(255) NOT NULL,
    section VARCHAR(255),
    chunk_text TEXT NOT NULL,
    source_url TEXT,
    embedding vector(1024),
    text_search tsvector GENERATED ALWAYS AS (to_tsvector('french', chunk_text)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cert_chunks_cert_id ON certification_chunks (certification_id);
CREATE INDEX IF NOT EXISTS idx_cert_chunks_search ON certification_chunks USING GIN (text_search);
