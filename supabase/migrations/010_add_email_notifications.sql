-- Add email notification settings to user_settings
ALTER TABLE user_settings
ADD COLUMN email_notifications BOOLEAN DEFAULT FALSE,
ADD COLUMN notification_threshold INTEGER DEFAULT 70
CHECK (notification_threshold >= 0 AND notification_threshold <= 100);
