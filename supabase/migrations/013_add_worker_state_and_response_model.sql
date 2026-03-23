-- Worker health state table
CREATE TABLE IF NOT EXISTS worker_state (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  last_heartbeat TIMESTAMPTZ,
  status TEXT DEFAULT 'stopped', -- running, stopped, error
  current_scan_id UUID REFERENCES scan_requests(id),
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert singleton row
INSERT INTO worker_state (id) VALUES ('singleton') ON CONFLICT DO NOTHING;

-- Allow service role full access (worker uses service role key)
ALTER TABLE worker_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on worker_state"
  ON worker_state FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add model column to generated_responses
ALTER TABLE generated_responses
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'sonnet';
