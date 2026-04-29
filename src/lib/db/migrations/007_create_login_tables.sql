-- Migration: Create tables for secure login implementation
-- This migration creates the necessary tables for the secure login feature
-- Includes: sessions, remember_me_tokens, rate_limit_attempts

-- Sessions Table
-- Stores active user sessions with expiration and metadata
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.auth_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON public.sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- Remember Me Tokens Table
-- Stores long-lived tokens for "Remember Me" functionality (30 days)
CREATE TABLE IF NOT EXISTS public.remember_me_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.auth_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_remember_me_tokens_user_id ON public.remember_me_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_remember_me_tokens_token_hash ON public.remember_me_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_remember_me_tokens_expires_at ON public.remember_me_tokens(expires_at);

-- Rate Limit Attempts Table
-- Tracks failed login attempts per IP address for rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL,
  attempt_count INT DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ip_address)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_ip_address ON public.rate_limit_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_last_attempt_at ON public.rate_limit_attempts(last_attempt_at);

-- CSRF Tokens Table
-- Stores CSRF tokens for form protection
CREATE TABLE IF NOT EXISTS public.csrf_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_token_hash ON public.csrf_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires_at ON public.csrf_tokens(expires_at);

-- Update audit_logs table to include user_agent if not already present
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create index for audit_logs user_agent
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_agent ON public.audit_logs(user_agent);
