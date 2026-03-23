-- Add scan_frequency column to user_settings
-- Options: 'disabled', 'daily', 'twice_daily', 'every_6h'
ALTER TABLE user_settings
ADD COLUMN scan_frequency TEXT DEFAULT 'disabled'
CHECK (scan_frequency IN ('disabled', 'daily', 'twice_daily', 'every_6h'));
