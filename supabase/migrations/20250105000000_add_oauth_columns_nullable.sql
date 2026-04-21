-- Phase 1: Add new nullable columns for unified OAuth support
-- This migration is non-breaking and reversible
-- Supports Requirements 6.1, 6.2, 6.3, 6.4

-- Add oauth_provider column with CHECK constraint
ALTER TABLE users
ADD COLUMN oauth_provider VARCHAR(50) CHECK (oauth_provider IN ('google', 'facebook', 'tiktok'));

-- Add oauth_id column (nullable for non-OAuth users)
ALTER TABLE users
ADD COLUMN oauth_id VARCHAR(255);

-- Create index on oauth_provider for query performance (Requirement 6.6)
CREATE INDEX idx_users_oauth_provider ON users(oauth_provider);

-- Create unique index on oauth_id where oauth_id IS NOT NULL (Requirement 6.7)
CREATE UNIQUE INDEX idx_users_oauth_id ON users(oauth_id) WHERE oauth_id IS NOT NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider used for registration (google, facebook, tiktok). NULL for email/password only users.';
COMMENT ON COLUMN users.oauth_id IS 'Unique identifier from OAuth provider. NULL for email/password only users.';

-- Note: email, password_hash, name, and email_verified columns already exist
-- email: VARCHAR(255) NOT NULL (Requirement 6.1)
-- password_hash: VARCHAR(255) NOT NULL (Requirement 6.2)
-- name: VARCHAR(255) NOT NULL
-- email_verified: BOOLEAN DEFAULT FALSE (Requirement 6.4)
