-- Rollback Migration: Remove account completion fields from users table
-- This migration reverses the changes made by 002_add_account_completion_fields.sql
-- WARNING: This will drop the temp_tokens table and remove columns from the users table

-- Drop temp_tokens table and its indexes
DROP TABLE IF EXISTS public.temp_tokens CASCADE;

-- Drop indexes on users table
DROP INDEX IF EXISTS public.idx_users_account_completion_status;
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_oauth_provider_id;

-- Remove columns from users table
ALTER TABLE IF EXISTS public.users
DROP COLUMN IF EXISTS password_hash,
DROP COLUMN IF EXISTS phone_number,
DROP COLUMN IF EXISTS birth_date,
DROP COLUMN IF EXISTS account_completion_status,
DROP COLUMN IF EXISTS account_completed_at,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS oauth_provider,
DROP COLUMN IF EXISTS oauth_id,
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS picture,
DROP COLUMN IF EXISTS email_verified;
