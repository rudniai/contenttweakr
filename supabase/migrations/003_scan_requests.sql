-- Scan requests table for local-scan-to-portal architecture
CREATE TABLE scan_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hours INTEGER DEFAULT 24,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_count INTEGER,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scan_requests_status ON scan_requests(status, created_at DESC);
CREATE INDEX idx_scan_requests_user_id ON scan_requests(user_id, created_at DESC);

ALTER TABLE scan_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own scan requests"
  ON scan_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own scan requests"
  ON scan_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can update scan requests (for local scanner)
CREATE POLICY "Service role can update scan requests"
  ON scan_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);
