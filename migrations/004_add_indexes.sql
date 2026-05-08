-- Migration: 004_add_indexes
-- Description: Add missing indexes for email lookups and BM ID queries
-- Date: 2026-05-07

-- UP
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_business_managers_bm_id ON business_managers(user_id, bm_id);

-- DOWN (rollback)
-- DROP INDEX IF EXISTS idx_business_managers_bm_id;
-- DROP INDEX IF EXISTS idx_users_email;
