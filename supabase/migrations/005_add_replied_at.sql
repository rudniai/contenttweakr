-- Add reply tracking column to opportunities
ALTER TABLE opportunities ADD COLUMN replied_at timestamptz;

-- Index for filtering replied/unreplied opportunities
CREATE INDEX idx_opportunities_replied_at ON opportunities (replied_at);
