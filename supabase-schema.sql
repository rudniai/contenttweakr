-- ContentTweakr Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own usage
CREATE POLICY "Users can insert own usage"
  ON usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own usage
CREATE POLICY "Users can update own usage"
  ON usage_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date 
  ON usage_tracking(user_id, date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
