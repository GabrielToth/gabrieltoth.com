-- Phase 2: Populate new OAuth columns from existing Google OAuth data
-- This migration populates oauth_provider, oauth_id, email, and name for existing Google OAuth users
-- Supports Requirements 1.3, 1.4

-- Populate email from google_email for existing users where email is NULL
-- This handles users who registered via Google OAuth before the unified schema
UPDATE users
SET email = google_email
WHERE google_email IS NOT NULL
  AND email IS NULL;

-- Populate name from google_name for existing users where name is NULL
-- This handles users who registered via Google OAuth before the unified schema
UPDATE users
SET name = google_name
WHERE google_name IS NOT NULL
  AND name IS NULL;

-- Populate oauth_provider = 'google' and oauth_id from google_id for existing Google OAuth users
-- This migrates existing Google OAuth users to the unified OAuth schema
UPDATE users
SET 
  oauth_provider = 'google',
  oauth_id = google_id
WHERE google_id IS NOT NULL
  AND oauth_provider IS NULL;

-- Add comment to document the migration
COMMENT ON TABLE users IS 'Users table with unified OAuth support. Migrated from Google-specific columns to generic oauth_provider/oauth_id columns.';
