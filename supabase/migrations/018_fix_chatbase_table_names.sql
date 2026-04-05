-- Fix table name mismatches between migrations and application code.
--
-- Migration 015 created the chatbots table without the cb_ prefix, but all
-- application code references it as cb_chatbots. Similarly, cb_api_keys was
-- created with a key_prefix column but the code expects prefix.
--
-- This migration is idempotent: each rename only runs if the old name exists.

-- 1. chatbots → cb_chatbots
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chatbots'
  ) THEN
    ALTER TABLE chatbots RENAME TO cb_chatbots;
  END IF;
END $$;

-- 2. cb_api_keys.key_prefix → prefix
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cb_api_keys'
      AND column_name = 'key_prefix'
  ) THEN
    ALTER TABLE cb_api_keys RENAME COLUMN key_prefix TO prefix;
  END IF;
END $$;
