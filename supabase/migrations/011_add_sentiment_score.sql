-- Add sentiment_score to opportunities
ALTER TABLE opportunities
ADD COLUMN sentiment_score INTEGER DEFAULT 0;

-- Add skip_toxic_threads to user_settings
ALTER TABLE user_settings
ADD COLUMN skip_toxic_threads BOOLEAN DEFAULT true;
