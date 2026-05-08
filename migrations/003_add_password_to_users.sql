-- Migration: 003_add_password_to_users
-- Description: Add password_hash column for email/password auth, make meta_id optional
-- Date: 2026-05-07

-- UP
ALTER TABLE users ALTER COLUMN meta_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- DOWN (rollback)
-- ALTER TABLE users DROP COLUMN password_hash;
-- ALTER TABLE users ALTER COLUMN meta_id SET NOT NULL;
