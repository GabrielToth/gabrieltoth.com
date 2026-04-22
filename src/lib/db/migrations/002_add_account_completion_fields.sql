-- Migration: Add account completion fields to users table
-- This migration adds fields to support the account completion flow for legacy OAuth users
-- who need to complete their account setup by adding password, phone number, and birth date

-- Add new columns to users table for account completion
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS account_completion_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS account_completed_at TIMESTAMP WITH TIME ZONE;

-- Add new columns to users table for OAuth provider support
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20),
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS picture VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_account_completion_status ON public.users(account_completion_status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider_id ON public.users(oauth_provider, oauth_id);

-- Create temporary tokens table for tracking temporary tokens and their expiration
CREATE TABLE IF NOT EXISTS public.temp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  oauth_provider VARCHAR(20),
  oauth_id VARCHAR(255),
  email VARCHAR(255),
  name VARCHAR(255),
  picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for temp_tokens table
CREATE INDEX IF NOT EXISTS idx_temp_tokens_expires_at ON public.temp_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_tokens_user_id ON public.temp_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_tokens_token_hash ON public.temp_tokens(token_hash);

</content>
</invoke>