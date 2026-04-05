-- Add MCP servers column to cb_chatbots
ALTER TABLE cb_chatbots
  ADD COLUMN IF NOT EXISTS mcp_servers JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Webhooks table
CREATE TABLE IF NOT EXISTS cb_webhooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id  UUID NOT NULL REFERENCES cb_chatbots(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  secret      TEXT,
  events      TEXT[] NOT NULL DEFAULT ARRAY['new_message','new_conversation','escalation'],
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cb_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_webhooks_select_own" ON cb_webhooks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cb_webhooks_insert_own" ON cb_webhooks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cb_webhooks_update_own" ON cb_webhooks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "cb_webhooks_delete_own" ON cb_webhooks
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER cb_webhooks_updated_at
  BEFORE UPDATE ON cb_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Webhook deliveries
CREATE TABLE IF NOT EXISTS cb_webhook_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id      UUID NOT NULL REFERENCES cb_webhooks(id) ON DELETE CASCADE,
  event           TEXT NOT NULL,
  payload         JSONB NOT NULL,
  status_code     INT,
  response_body   TEXT,
  attempt_count   INT NOT NULL DEFAULT 0,
  delivered_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cb_webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_webhook_deliveries_select_via_webhook" ON cb_webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cb_webhooks w
      WHERE w.id = cb_webhook_deliveries.webhook_id
        AND w.user_id = auth.uid()
    )
  );
