-- Migration: Add fields for registration flow restructure
-- Adds temp_token and birth_date fields to registration_sessions table
-- Adds account_status field to users table

-- Add temp_token to registration_sessions (for storing generated tokens)
ALTER TABLE IF EXISTS public.registration_sessions
ADD COLUMN IF NOT EXISTS temp_token VARCHAR(1024),
ADD COLUMN IF NOT EXISTS temp_token_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for temp_token lookups
CREATE INDEX IF NOT EXISTS idx_registration_sessions_temp_token_hash 
ON public.registration_sessions(temp_token_hash);

-- Add account_status to users table (for tracking account completion)
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS account_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for account_status lookups
CREATE INDEX IF NOT EXISTS idx_users_account_status 
ON public.users(account_status);

-- Add birth_date to users table if not exists
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Create index for birth_date lookups
CREATE INDEX IF NOT EXISTS idx_users_birth_date 
ON public.users(birth_date);
