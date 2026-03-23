-- Add platform field to opportunities (default 'reddit' for existing rows)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'reddit';

-- Update the unique constraint to include platform
-- (same URL can exist on different platforms, though unlikely)
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_user_id_url_key;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_user_id_url_key UNIQUE (user_id, url);

-- Add index on platform for filtering
CREATE INDEX IF NOT EXISTS idx_opportunities_platform ON opportunities (platform);

-- Add HN settings to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hn_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hn_keywords JSONB DEFAULT NULL;
