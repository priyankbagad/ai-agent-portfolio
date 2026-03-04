CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1024),
  match_count int
)
RETURNS TABLE(content text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.content,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  FROM knowledge_base
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
