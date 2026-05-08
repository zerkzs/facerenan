-- Migration: 002_create_business_managers
-- Description: Create business_managers table for BM credential management
-- Date: 2026-05-07

-- UP
CREATE TABLE IF NOT EXISTS business_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bm_id TEXT NOT NULL,
  bm_name TEXT,
  user_token TEXT NOT NULL,
  system_token TEXT,
  app_id TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  last_renewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, bm_id)
);

CREATE INDEX idx_business_managers_user_id ON business_managers(user_id);
CREATE INDEX idx_business_managers_auto_renew ON business_managers(auto_renew) WHERE auto_renew = true;

-- Enable Row Level Security
ALTER TABLE business_managers ENABLE ROW LEVEL SECURITY;

-- Service role policy (server-side access only)
CREATE POLICY "service_role_business_managers" ON business_managers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DOWN (rollback)
-- DROP POLICY IF EXISTS "service_role_business_managers" ON business_managers;
-- DROP INDEX IF EXISTS idx_business_managers_auto_renew;
-- DROP INDEX IF EXISTS idx_business_managers_user_id;
-- DROP TABLE IF EXISTS business_managers;
