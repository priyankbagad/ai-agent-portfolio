CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1024),
  file_name TEXT,
  chunk_index INT
);
CREATE INDEX ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops);
