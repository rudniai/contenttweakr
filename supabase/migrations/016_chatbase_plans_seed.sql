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
