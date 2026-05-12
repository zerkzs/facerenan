-- Migration: 005_create_account_index
-- Description: Create account_index table for cross-BM ad account search cache
-- Date: 2026-05-11

-- UP
CREATE TABLE IF NOT EXISTS account_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  bm_id TEXT NOT NULL,
  name TEXT,
  last_synced TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, account_id, bm_id)
);

CREATE INDEX idx_account_index_user_id ON account_index(user_id);
CREATE INDEX idx_account_index_account_id ON account_index(account_id);
CREATE INDEX idx_account_index_bm_id ON account_index(bm_id);

-- Enable Row Level Security
ALTER TABLE account_index ENABLE ROW LEVEL SECURITY;

-- Service role policy (server-side access only)
CREATE POLICY "service_role_account_index" ON account_index
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DOWN (rollback)
-- DROP POLICY IF EXISTS "service_role_account_index" ON account_index;
-- DROP INDEX IF EXISTS idx_account_index_bm_id;
-- DROP INDEX IF EXISTS idx_account_index_account_id;
-- DROP INDEX IF EXISTS idx_account_index_user_id;
-- DROP TABLE IF EXISTS account_index;
