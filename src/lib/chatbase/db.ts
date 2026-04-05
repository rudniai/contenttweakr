import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Service-role client (bypasses RLS — server-side only)
// ---------------------------------------------------------------------------

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Chatbot = {
  id: string;
  user_id: string;
  name: string;
  system_prompt: string;
  welcome_message: string;
  primary_color: string;
  fallback_message: string;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  chatbot_id: string;
  user_id: string;
  filename: string;
  source_type: 'file' | 'url';
  source_url: string | null;
  mime_type: string | null;
  raw_text: string | null;
  chunk_count: number;
  status: 'pending' | 'processing' | 'ready' | 'error';
  error_msg: string | null;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  chatbot_id: string;
  user_id: string | null;
  session_id: string;
  created_at: string;
  updated_at: string;
};

export type ConversationTurn = {
  id: string;
  conversation_id: string;
  user_message: string;
  assistant_message: string;
  escalated: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type Plan = {
  id: string;
  name: string;
  price_monthly_cents: number;
  message_limit: number | null;
  document_limit: number | null;
  storage_limit_bytes: number | null;
  chatbot_limit: number | null;
  stripe_price_id: string | null;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export async function getChatbot(
  chatbotId: string,
  userId?: string
): Promise<Chatbot | null> {
  const supabase = getServiceClient();

  let query = supabase
    .from('cb_chatbots')
    .select('*')
    .eq('id', chatbotId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`getChatbot error: ${error.message}`);
  }

  return data as Chatbot;
}

export async function listChatbots(userId: string): Promise<Chatbot[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('cb_chatbots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`listChatbots error: ${error.message}`);
  }

  return (data ?? []) as Chatbot[];
}

/**
 * Search for chunks similar to the given embedding using pgvector cosine
 * similarity.
 *
 * This requires a Postgres RPC function `match_chunks` to be defined in your
 * Supabase project. Example SQL to create it:
 *
 * ```sql
 * CREATE OR REPLACE FUNCTION match_chunks(
 *   query_embedding vector(1024),
 *   match_chatbot_id uuid,
 *   match_count int DEFAULT 5
 * )
 * RETURNS TABLE(content text, similarity float)
 * LANGUAGE sql STABLE AS $$
 *   SELECT
 *     content,
 *     1 - (embedding <=> query_embedding) AS similarity
 *   FROM cb_chunks
 *   WHERE document_id IN (
 *     SELECT id FROM cb_documents
 *     WHERE chatbot_id = match_chatbot_id AND status = 'ready'
 *   )
 *   ORDER BY embedding <=> query_embedding
 *   LIMIT match_count;
 * $$;
 * ```
 *
 * If the RPC function does not exist, this falls back to returning an empty
 * array (no context will be injected into the prompt).
 */
export async function searchSimilarChunks(
  chatbotId: string,
  embedding: number[],
  topK = 5
): Promise<{ content: string; similarity: number }[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_chatbot_id: chatbotId,
    match_count: topK,
  });

  if (error) {
    // Graceful fallback: if the RPC function doesn't exist yet, return empty
    // so the chat can still work (just without RAG context).
    console.warn(
      'searchSimilarChunks: RPC match_chunks failed, returning empty context.',
      error.message
    );
    return [];
  }

  return (data ?? []) as { content: string; similarity: number }[];
}
