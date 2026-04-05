-- ============================================================
-- Waitlist email capture
-- ============================================================
CREATE TABLE IF NOT EXISTS waitlist_emails (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'landing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deduplicate by email
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_emails_email_idx ON waitlist_emails (lower(email));

-- No RLS needed — inserts go through service client only
