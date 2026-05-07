-- Migration: 001_create_users_and_tokens
-- Description: Create users and user_tokens tables for Meta OAuth auth
-- Date: 2026-05-07

-- UP
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_meta_id ON users(meta_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Service role policies (server-side access only)
CREATE POLICY "service_role_users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_tokens" ON user_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DOWN (rollback)
-- DROP POLICY IF EXISTS "service_role_tokens" ON user_tokens;
-- DROP POLICY IF EXISTS "service_role_users" ON users;
-- DROP TABLE IF EXISTS user_tokens;
-- DROP TABLE IF EXISTS users;
