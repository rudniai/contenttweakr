-- RPC function for pgvector similarity search used by chatbase
create or replace function match_chunks(
  query_embedding vector(1024),
  chatbot_id uuid,
  match_count int default 5
)
returns table (
  content text,
  similarity float
)
language sql stable
as $$
  select
    cb_chunks.content,
    1 - (cb_chunks.embedding <=> query_embedding) as similarity
  from cb_chunks
  inner join cb_documents on cb_chunks.document_id = cb_documents.id
  where
    cb_documents.chatbot_id = match_chunks.chatbot_id
    and cb_documents.status = 'ready'
  order by cb_chunks.embedding <=> query_embedding
  limit match_count;
$$;
