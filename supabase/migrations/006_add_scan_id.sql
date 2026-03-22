-- Add scan_id foreign key to opportunities table
-- Links each opportunity to the scan that discovered it

ALTER TABLE opportunities
  ADD COLUMN scan_id uuid REFERENCES scan_requests(id) ON DELETE SET NULL;

CREATE INDEX idx_opportunities_scan_id ON opportunities(scan_id);
