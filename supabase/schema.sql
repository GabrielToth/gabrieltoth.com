-- Canonical Supabase schema (consolidated). Apply via: npx supabase db push
-- Individual migration files are removed after apply; edit this file for new DDL.

-- === 20260501_create_password_storage_schema.sql ===
-- Migration: Create Password Storage Schema
-- Description: Creates users, rate_limit_records, and audit_logs tables for secure password storage
-- Author: Kiro
-- Date: 2026-05-01

-- ============================================================================
-- 1. USERS TABLE (Password Storage)
-- ============================================================================
-- Stores user credentials with Argon2id hashes
-- Argon2id password hashes only

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Identity
  email TEXT UNIQUE NOT NULL,
  
  -- Password Storage
  password_hash TEXT NOT NULL,                 -- Argon2id: $argon2id$v=19$...
  
  password_algorithm TEXT DEFAULT 'argon2id'
  CHECK (password_algorithm IN ('argon2id')),
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for fast lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Enable Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (id = auth.uid());

-- RLS Policy: Only system can insert (via triggers or auth service)
CREATE POLICY "System can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Users can only update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- 2. RATE_LIMIT_RECORDS TABLE
-- ============================================================================
-- Tracks failed authentication attempts for brute-force protection
-- Supabase-backed (not in-memory) for serverless compatibility

CREATE TABLE IF NOT EXISTS rate_limit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  email TEXT UNIQUE NOT NULL,
  
  -- Attempt Tracking
  failed_attempts INTEGER DEFAULT 0 NOT NULL,
  last_attempt TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Lockout Status
  locked_until TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast lookups and cleanup
CREATE INDEX idx_rate_limit_email ON rate_limit_records(email);
CREATE INDEX idx_rate_limit_locked ON rate_limit_records(locked_until);
CREATE INDEX idx_rate_limit_last_attempt ON rate_limit_records(last_attempt);

-- Enable Row-Level Security
ALTER TABLE rate_limit_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only system can access (not user-facing)
CREATE POLICY "System only access"
  ON rate_limit_records
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 3. AUDIT_LOGS TABLE
-- ============================================================================
-- Logs all authentication events for security monitoring and compliance
-- Tracks: login attempts, failures, rate limiting, algorithm migrations

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Classification
  event_type TEXT NOT NULL,
  -- Values: 'auth_success', 'auth_failure', 'rate_limit_triggered', 
  --         'password_migration', 'captcha_verification', 'captcha_bypass_attempted'
  
  -- User Identification (anonymous for failed attempts)
  email TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Event Details
  attempt_count INTEGER,
  old_algorithm TEXT,
  new_algorithm TEXT,
  
  -- Error Information
  error_code TEXT,
  error_message TEXT,
  
  -- CAPTCHA Information
  captcha_provider TEXT,
  captcha_success BOOLEAN,
  
  -- Request Metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Flexible JSON for future extensibility
  details JSONB DEFAULT '{}',
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for audit queries
CREATE INDEX idx_audit_email ON audit_logs(email);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_event_timestamp ON audit_logs(event_type, timestamp);

-- Enable Row-Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_updated_at
  BEFORE UPDATE ON rate_limit_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. CLEANUP FUNCTIONS (For testing/development)
-- ============================================================================

-- Function: Delete all user data safely
CREATE OR REPLACE FUNCTION cleanup_all_users()
RETURNS TABLE(users_deleted INT, rate_limits_deleted INT, audit_logs_deleted INT) AS $$
DECLARE
  v_users_count INT := 0;
  v_rate_limits_count INT := 0;
  v_audit_logs_count INT := 0;
BEGIN
  -- Count before deletion
  SELECT COUNT(*) INTO v_users_count FROM users;
  SELECT COUNT(*) INTO v_rate_limits_count FROM rate_limit_records;
  SELECT COUNT(*) INTO v_audit_logs_count FROM audit_logs;

  -- Delete in correct order to respect foreign keys
  DELETE FROM rate_limit_records;
  DELETE FROM audit_logs;
  DELETE FROM users;

  RETURN QUERY SELECT v_users_count, v_rate_limits_count, v_audit_logs_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. VIEWS FOR MONITORING
-- ============================================================================

-- View: Recent authentication attempts (last 24 hours)
CREATE OR REPLACE VIEW recent_auth_attempts AS
SELECT 
  event_type,
  email,
  COUNT(*) as count,
  MAX(timestamp) as latest,
  MIN(timestamp) as oldest
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type, email
ORDER BY latest DESC;

-- View: Currently locked accounts
CREATE OR REPLACE VIEW locked_accounts AS
SELECT 
  email,
  failed_attempts,
  locked_until,
  NOW() as current_time,
  locked_until - NOW() as time_remaining
FROM rate_limit_records
WHERE locked_until IS NOT NULL
  AND locked_until > NOW()
ORDER BY locked_until DESC;

-- View: Successful algorithm migrations
CREATE OR REPLACE VIEW password_migrations AS
SELECT 
  email,
  old_algorithm,
  new_algorithm,
  COUNT(*) as migration_count,
  MAX(timestamp) as latest_migration,
  MIN(timestamp) as first_migration
FROM audit_logs
WHERE event_type = 'password_migration'
GROUP BY email, old_algorithm, new_algorithm
ORDER BY latest_migration DESC;

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with password hashes (Argon2id only)';
COMMENT ON COLUMN users.password_hash IS 'Password hash in Argon2id format (includes salt)';
COMMENT ON COLUMN users.password_algorithm IS 'Algorithm used for password hash (for migration tracking)';

COMMENT ON TABLE rate_limit_records IS 'Tracks failed authentication attempts for brute-force protection';
COMMENT ON COLUMN rate_limit_records.failed_attempts IS 'Count of consecutive failed attempts (resets on success)';
COMMENT ON COLUMN rate_limit_records.locked_until IS 'Timestamp until which account is locked (null = not locked)';

COMMENT ON TABLE audit_logs IS 'Immutable log of all authentication and security events';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event: auth_success, auth_failure, rate_limit_triggered, etc.';
COMMENT ON COLUMN audit_logs.details IS 'Flexible JSON for event-specific metadata';


-- === 20260507_add_registration_flow_fields.sql ===
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


-- === 20260518120000_revoke_rls_auto_enable_rpc.sql ===
-- Supabase linter: anon/authenticated must not EXECUTE SECURITY DEFINER helpers via PostgREST.
-- rls_auto_enable is an internal DDL event-trigger helper, not a public RPC.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
  ) THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon;
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
  END IF;
END $$;


-- === 20260519120000_argon2id_only_password_algorithm.sql ===
-- Argon2id only: enforce argon2id only on password_algorithm constraint

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_password_algorithm_check;

ALTER TABLE users
  ADD CONSTRAINT users_password_algorithm_check
  CHECK (password_algorithm IN ('argon2id'));

COMMENT ON COLUMN users.password_hash IS 'Argon2id: $argon2id$v=19$...';
COMMENT ON COLUMN users.password_algorithm IS 'Always argon2id';


-- === 20260621_add_video_scheduling_and_decimal_credits.sql ===
-- Migration: Add Video Scheduling & Decimal Credit Support
-- Purpose: Support video upload storage, decimal credit balances, and per-platform media scheduling
-- Dependencies: Requires profiles, credit_transactions, and scheduled_posts tables

-- ============================================================================
-- 1. Migrate profiles.credits_balance to NUMERIC for decimal precision
-- ============================================================================
ALTER TABLE IF EXISTS public.profiles
  ALTER COLUMN credits_balance DROP DEFAULT;

ALTER TABLE IF EXISTS public.profiles
  ALTER COLUMN credits_balance TYPE NUMERIC(12, 2)
  USING credits_balance::NUMERIC(12, 2);

ALTER TABLE IF EXISTS public.profiles
  ALTER COLUMN credits_balance SET DEFAULT 0.00;

ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT IF NOT EXISTS profiles_credits_balance_check
  CHECK (credits_balance >= 0);

-- ============================================================================
-- 2. Migrate credit_transactions.amount to NUMERIC for decimal precision
-- ============================================================================
ALTER TABLE IF EXISTS public.credit_transactions
  ALTER COLUMN amount TYPE NUMERIC(10, 2)
  USING amount::NUMERIC(10, 2);

-- ============================================================================
-- 3. Create scheduled_post_media table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scheduled_post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Media origin
  storage_mode VARCHAR(10) NOT NULL DEFAULT 'cloud',
  original_filename VARCHAR(500),
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  video_duration_seconds INTEGER,

  -- Cloud storage location
  storage_path TEXT,
  storage_status VARCHAR(20) DEFAULT 'pending',

  -- Billing (cloud mode only)
  storage_cost_per_gb_per_day NUMERIC(10, 2) NOT NULL DEFAULT 6.67,
  bandwidth_cost_per_gb NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  base_fee NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  storage_days INTEGER,
  total_cost_charged NUMERIC(10, 2),
  total_cost_refunded NUMERIC(10, 2) DEFAULT 0.00,
  billing_status VARCHAR(20) DEFAULT 'charged',

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_post_media_post_id
  ON public.scheduled_post_media(post_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_post_media_user_id
  ON public.scheduled_post_media(user_id);

-- ============================================================================
-- 4. Add media_type column to scheduled_posts
-- ============================================================================
ALTER TABLE IF EXISTS public.scheduled_posts
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'text';

-- ============================================================================
-- 5. RLS policies for scheduled_post_media
-- ============================================================================
ALTER TABLE public.scheduled_post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS scheduled_post_media_user_access
  ON public.scheduled_post_media
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS scheduled_post_media_service_role
  ON public.scheduled_post_media
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

