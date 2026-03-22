-- Add hidden column to opportunities table
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Index for efficient filtering by user and hidden status
CREATE INDEX IF NOT EXISTS idx_opportunities_hidden ON opportunities(user_id, hidden);
