-- Enable pgvector for RAG embeddings
create extension if not exists vector;
-- ============================================================
-- Chatbase tables (user-scoped, not org-scoped)
-- ============================================================

-- ------------------------------------------------------------
-- 1. chatbots
-- ------------------------------------------------------------
CREATE TABLE chatbots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  system_prompt    TEXT NOT NULL DEFAULT '',
  welcome_message  TEXT NOT NULL DEFAULT 'Hi! How can I help?',
  primary_color    TEXT NOT NULL DEFAULT '#6366f1',
  fallback_message TEXT NOT NULL DEFAULT 'Sorry, I don''t have information on that.',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chatbots_select_own" ON chatbots
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "chatbots_insert_own" ON chatbots
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "chatbots_update_own" ON chatbots
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "chatbots_delete_own" ON chatbots
  FOR DELETE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chatbots_updated_at
  BEFORE UPDATE ON chatbots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2. cb_documents
-- ------------------------------------------------------------
CREATE TABLE cb_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id   UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  source_type  TEXT NOT NULL CHECK (source_type IN ('file', 'url')),
  source_url   TEXT,
  mime_type    TEXT,
  raw_text     TEXT,
  chunk_count  INT NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  error_msg    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_documents_select_own" ON cb_documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cb_documents_insert_own" ON cb_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cb_documents_update_own" ON cb_documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "cb_documents_delete_own" ON cb_documents
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER cb_documents_updated_at
  BEFORE UPDATE ON cb_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 3. cb_chunks
-- ------------------------------------------------------------
CREATE TABLE cb_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES cb_documents(id) ON DELETE CASCADE,
  chunk_index   INT NOT NULL,
  content       TEXT NOT NULL,
  token_count   INT,
  embedding     vector(1024),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON cb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- cb_chunks has no user_id directly; access is controlled through cb_documents ownership.
-- We use a security-definer function pattern for chunk lookup during chat (public-facing RAG).
-- Direct row access via API is gated by the document's user_id through a policy join.
ALTER TABLE cb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_chunks_select_via_document" ON cb_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cb_documents d
      WHERE d.id = cb_chunks.document_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "cb_chunks_insert_via_document" ON cb_chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cb_documents d
      WHERE d.id = cb_chunks.document_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "cb_chunks_delete_via_document" ON cb_chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cb_documents d
      WHERE d.id = cb_chunks.document_id
        AND d.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 4. cb_conversations
-- ------------------------------------------------------------
CREATE TABLE cb_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id  UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chatbot_id, session_id)
);

ALTER TABLE cb_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_conversations_select_own" ON cb_conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cb_conversations_insert_own" ON cb_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "cb_conversations_update_own" ON cb_conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "cb_conversations_delete_own" ON cb_conversations
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER cb_conversations_updated_at
  BEFORE UPDATE ON cb_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 5. cb_conversation_turns
-- ------------------------------------------------------------
CREATE TABLE cb_conversation_turns (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id    UUID NOT NULL REFERENCES cb_conversations(id) ON DELETE CASCADE,
  user_message       TEXT NOT NULL,
  assistant_message  TEXT NOT NULL,
  escalated          BOOLEAN NOT NULL DEFAULT false,
  metadata           JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cb_conversation_turns ENABLE ROW LEVEL SECURITY;

-- Allow SELECT if the conversation belongs to the authenticated user
CREATE POLICY "cb_conversation_turns_select_via_conversation" ON cb_conversation_turns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cb_conversations c
      WHERE c.id = cb_conversation_turns.conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- Allow INSERT for both authenticated owners and anonymous public chat sessions
CREATE POLICY "cb_conversation_turns_insert_via_conversation" ON cb_conversation_turns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cb_conversations c
      WHERE c.id = cb_conversation_turns.conversation_id
        AND (c.user_id = auth.uid() OR c.user_id IS NULL)
    )
  );

-- ------------------------------------------------------------
-- 6. cb_plans
-- ------------------------------------------------------------
CREATE TABLE cb_plans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT UNIQUE NOT NULL,
  price_monthly_cents  INT NOT NULL DEFAULT 0,
  message_limit        INT,
  document_limit       INT,
  storage_limit_bytes  BIGINT,
  chatbot_limit        INT,
  stripe_price_id      TEXT
);

ALTER TABLE cb_plans ENABLE ROW LEVEL SECURITY;

-- Plans are public read; no user-level writes
CREATE POLICY "cb_plans_select_public" ON cb_plans
  FOR SELECT USING (true);

-- ------------------------------------------------------------
-- 7. cb_subscriptions
-- ------------------------------------------------------------
CREATE TABLE cb_subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id                  UUID REFERENCES cb_plans(id),
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT UNIQUE,
  status                   TEXT NOT NULL DEFAULT 'active',
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cb_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_subscriptions_select_own" ON cb_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cb_subscriptions_insert_own" ON cb_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cb_subscriptions_update_own" ON cb_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE TRIGGER cb_subscriptions_updated_at
  BEFORE UPDATE ON cb_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 8. cb_api_keys
-- ------------------------------------------------------------
CREATE TABLE cb_api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  key_prefix  TEXT NOT NULL,
  key_hash    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ
);

-- Unique index on key_hash only for active (non-revoked) keys
CREATE UNIQUE INDEX cb_api_keys_active_hash_idx ON cb_api_keys (key_hash) WHERE revoked_at IS NULL;

ALTER TABLE cb_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_api_keys_select_own" ON cb_api_keys
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cb_api_keys_insert_own" ON cb_api_keys
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cb_api_keys_delete_own" ON cb_api_keys
  FOR DELETE USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 9. cb_usage_monthly
-- ------------------------------------------------------------
CREATE TABLE cb_usage_monthly (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year             INT NOT NULL,
  month            INT NOT NULL,
  messages_count   INT NOT NULL DEFAULT 0,
  documents_count  INT NOT NULL DEFAULT 0,
  storage_bytes    BIGINT NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

ALTER TABLE cb_usage_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_usage_monthly_select_own" ON cb_usage_monthly
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cb_usage_monthly_insert_own" ON cb_usage_monthly
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cb_usage_monthly_update_own" ON cb_usage_monthly
  FOR UPDATE USING (user_id = auth.uid());

CREATE TRIGGER cb_usage_monthly_updated_at
  BEFORE UPDATE ON cb_usage_monthly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- Seed default chatbase plan tiers
-- ON CONFLICT DO NOTHING makes this idempotent on re-runs
-- stripe_price_id values are updated via environment/webhook
-- ============================================================

INSERT INTO cb_plans (name, price_monthly_cents, chatbot_limit, message_limit, document_limit, storage_limit_bytes, stripe_price_id)
VALUES
  (
    'Free',
    0,
    1,
    500,
    10,
    104857600,   -- 100 MB in bytes
    NULL
  ),
  (
    'Pro',
    4900,        -- $49.00 / month
    10,
    10000,
    200,
    5368709120,  -- 5 GB in bytes
    NULL
  ),
  (
    'Enterprise',
    14900,       -- $149.00 / month
    NULL,        -- unlimited chatbots
    NULL,        -- unlimited messages
    NULL,        -- unlimited documents
    NULL,        -- unlimited storage
    NULL
  )
ON CONFLICT (name) DO NOTHING;
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
-- Fix table name mismatches between migrations and application code.
--
-- Migration 015 created the chatbots table without the cb_ prefix, but all
-- application code references it as cb_chatbots. Similarly, cb_api_keys was
-- created with a key_prefix column but the code expects prefix.
--
-- This migration is idempotent: each rename only runs if the old name exists.

-- 1. chatbots → cb_chatbots
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chatbots'
  ) THEN
    ALTER TABLE chatbots RENAME TO cb_chatbots;
  END IF;
END $$;

-- 2. cb_api_keys.key_prefix → prefix
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cb_api_keys'
      AND column_name = 'key_prefix'
  ) THEN
    ALTER TABLE cb_api_keys RENAME COLUMN key_prefix TO prefix;
  END IF;
END $$;
