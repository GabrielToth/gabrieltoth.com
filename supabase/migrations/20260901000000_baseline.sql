-- ============================================================================
-- BASELINE MIGRATION (consolidated 2026-09-01)
-- Consolidates all previous migrations applied to production.
-- See git history for individual migration details.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 20260630_missing_scheduled_posts_tables.sql
-- ----------------------------------------------------------------------------

-- Migration: Add missing scheduled_posts and related tables
-- Applied: 2026-06-30
-- This applies table definitions from schema.sql that were never migrated
-- Uses IF NOT EXISTS and DO blocks for idempotency

-- ============================================================================
-- 14. SCHEDULED_POSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  media_type TEXT DEFAULT 'text',
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON public.scheduled_posts(scheduled_time);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_posts' AND policyname = 'Users can manage own scheduled posts'
  ) THEN
    CREATE POLICY "Users can manage own scheduled posts"
      ON public.scheduled_posts FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 15. SCHEDULED_POST_NETWORKS TABLE (junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_post_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  external_id TEXT,
  external_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_post_networks_post_id ON public.scheduled_post_networks(post_id);

ALTER TABLE public.scheduled_post_networks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_post_networks' AND policyname = 'Users can manage post networks'
  ) THEN
    CREATE POLICY "Users can manage post networks"
      ON public.scheduled_post_networks FOR ALL
      USING (
        post_id IN (SELECT id FROM public.scheduled_posts WHERE user_id = auth.uid())
      )
      WITH CHECK (
        post_id IN (SELECT id FROM public.scheduled_posts WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ============================================================================
-- 16. PUBLICATION_HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.publication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  external_id TEXT,
  external_url TEXT,
  error_message TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publication_history_user_id ON public.publication_history(user_id);
CREATE INDEX IF NOT EXISTS idx_publication_history_platform ON public.publication_history(platform);
CREATE INDEX IF NOT EXISTS idx_publication_history_published_at ON public.publication_history(published_at);

ALTER TABLE public.publication_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'publication_history' AND policyname = 'Users can view own publication history'
  ) THEN
    CREATE POLICY "Users can view own publication history"
      ON public.publication_history FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 17. SCHEDULED_POST_MEDIA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_mode TEXT NOT NULL DEFAULT 'cloud',
  original_filename TEXT,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  video_duration_seconds INTEGER,
  storage_path TEXT,
  storage_status TEXT DEFAULT 'pending',
  storage_cost_per_gb_per_day NUMERIC(10, 2) NOT NULL DEFAULT 6.67,
  bandwidth_cost_per_gb NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  base_fee NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  storage_days INTEGER,
  total_cost_charged NUMERIC(10, 2),
  total_cost_refunded NUMERIC(10, 2) DEFAULT 0.00,
  billing_status TEXT DEFAULT 'charged',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_post_media_post_id ON public.scheduled_post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_post_media_user_id ON public.scheduled_post_media(user_id);

ALTER TABLE public.scheduled_post_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_post_media' AND policyname = 'Users can manage own post media'
  ) THEN
    CREATE POLICY "Users can manage own post media"
      ON public.scheduled_post_media FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 20260702_fix_production_schema.sql
-- ----------------------------------------------------------------------------

-- Migration: Fix production schema to match supabase/schema.sql
-- Applied: 2026-07-02
--
-- Production database was created with a minimal schema and never received
-- full migrations. This adds missing columns and tables needed by the
-- current codebase.

-- ============================================================================
-- 1. SESSIONS TABLE — add token_hash column (production has session_id)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'token_hash'
  ) THEN
    -- Add token_hash, populate from existing session_id
    ALTER TABLE public.sessions ADD COLUMN token_hash TEXT;
    UPDATE public.sessions SET token_hash = session_id WHERE token_hash IS NULL;
    ALTER TABLE public.sessions ALTER COLUMN token_hash SET NOT NULL;
    ALTER TABLE public.sessions ADD CONSTRAINT sessions_token_hash_unique UNIQUE (token_hash);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON public.sessions(token_hash);

-- Add missing columns
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Make old session_id nullable (code no longer writes to it; uses token_hash)
ALTER TABLE public.sessions ALTER COLUMN session_id DROP NOT NULL;
ALTER TABLE public.sessions ALTER COLUMN session_id SET DEFAULT '';

-- Drop old constraint that required session_id to be non-empty
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS token_not_empty;

-- ============================================================================
-- 2. REMEMBER_ME_TOKENS TABLE (missing entirely from production)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.remember_me_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remember_me_tokens_user_id ON public.remember_me_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_remember_me_tokens_token_hash ON public.remember_me_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_remember_me_tokens_expires_at ON public.remember_me_tokens(expires_at);

ALTER TABLE public.remember_me_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'remember_me_tokens' AND policyname = 'Users can manage own remember_me_tokens'
  ) THEN
    CREATE POLICY "Users can manage own remember_me_tokens"
      ON public.remember_me_tokens FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 3. CSRF_TOKENS TABLE (missing entirely from production)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.csrf_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csrf_tokens_hash ON public.csrf_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires_at ON public.csrf_tokens(expires_at);

-- ============================================================================
-- 4. SOCIAL_NETWORKS TABLE (missing entirely from production)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.social_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL DEFAULT '',
  platform_username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_networks_user_id ON public.social_networks(user_id);
CREATE INDEX IF NOT EXISTS idx_social_networks_platform ON public.social_networks(platform);
CREATE INDEX IF NOT EXISTS idx_social_networks_status ON public.social_networks(status);

ALTER TABLE public.social_networks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'social_networks' AND policyname = 'Users can manage own social_networks'
  ) THEN
    CREATE POLICY "Users can manage own social_networks"
      ON public.social_networks FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 20260703_fix_empty_token_hash.sql
-- ----------------------------------------------------------------------------

-- Migration: Fix session creation failure (duplicate key on sessions_token_key)
-- Applied: 2026-07-03
--
-- ROOT CAUSE:
-- The previous migration (20260702) added a token_hash column and set session_id
-- DEFAULT to ''. But the OLD sessions_token_key UNIQUE constraint on session_id
-- still existed. When code creates a new session (writes to token_hash only),
-- session_id gets the DEFAULT '' → second insert fails with duplicate key because
-- PostgreSQL treats '' = '' for UNIQUE constraints.
--
-- Also: empty token_hash values from the migration populating from empty session_id.

-- 1. Delete sessions with empty session_id (caused by DEFAULT '')
DELETE FROM public.sessions WHERE session_id = '' OR session_id IS NULL;

-- 2. Delete sessions with empty token_hash
DELETE FROM public.sessions WHERE token_hash = '' OR token_hash IS NULL;

-- 3. Drop the OLD sessions_token_key constraint on session_id (ROOT CAUSE)
--    The code only uses token_hash now; session_id is legacy/dead.
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_token_key;

-- 4. Add check constraint to prevent empty token_hash in the future
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.sessions'::regclass 
    AND conname = 'sessions_token_hash_not_empty'
  ) THEN
    ALTER TABLE public.sessions 
      ADD CONSTRAINT sessions_token_hash_not_empty 
      CHECK (token_hash != '');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 20260704_create_oauth_tokens_table.sql
-- ----------------------------------------------------------------------------

-- Migration: Create oauth_tokens table
-- Description: Stores encrypted OAuth tokens for social media API access
-- This migration is needed because the oauth_tokens table exists in schema.sql
-- but was never deployed to production Supabase via a migration.

-- Create the table
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  encrypted_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON public.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_platform ON public.oauth_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON public.oauth_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'oauth_tokens'
      AND policyname = 'Users can manage own oauth tokens'
  ) THEN
    CREATE POLICY "Users can manage own oauth tokens"
      ON public.oauth_tokens FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 20260712_scheduled_streams_table.sql
-- ----------------------------------------------------------------------------

-- Migration: Create scheduled_streams table for stream scheduling
-- This table stores scheduled live streams with notification settings

-- ============================================================================
-- SCHEDULED STREAMS TABLE
-- ============================================================================
-- Stores user-scheduled live streams with platform selection, timing,
-- and notification preferences. Supports Twitch and Kick platforms.

CREATE TABLE IF NOT EXISTS public.scheduled_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT[] NOT NULL DEFAULT '{twitch,kick}',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  scheduled_start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'live', 'completed')),
  notification_methods TEXT[] DEFAULT '{discord}',
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for querying streams by user and status
CREATE INDEX IF NOT EXISTS idx_scheduled_streams_user_status
  ON public.scheduled_streams(user_id, status);

-- Index for querying upcoming streams
CREATE INDEX IF NOT EXISTS idx_scheduled_streams_start_time
  ON public.scheduled_streams(scheduled_start_time)
  WHERE status = 'scheduled';

-- Enable Row Level Security
ALTER TABLE public.scheduled_streams ENABLE ROW LEVEL SECURITY;

-- Policies: users can CRUD their own scheduled streams
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scheduled_streams' AND policyname = 'Users can view own scheduled streams') THEN
    CREATE POLICY "Users can view own scheduled streams"
      ON public.scheduled_streams
      FOR SELECT
  USING (user_id = auth.uid());    END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scheduled_streams' AND policyname = 'Users can create own scheduled streams') THEN
    CREATE POLICY "Users can create own scheduled streams"
      ON public.scheduled_streams
      FOR INSERT
  WITH CHECK (user_id = auth.uid());    END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scheduled_streams' AND policyname = 'Users can update own scheduled streams') THEN
    CREATE POLICY "Users can update own scheduled streams"
      ON public.scheduled_streams
      FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());    END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scheduled_streams' AND policyname = 'Users can delete own scheduled streams') THEN
    CREATE POLICY "Users can delete own scheduled streams"
      ON public.scheduled_streams
      FOR DELETE
  USING (user_id = auth.uid());    END IF;
END $$;

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_scheduled_streams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scheduled_streams_updated_at
  ON public.scheduled_streams;
CREATE TRIGGER trigger_update_scheduled_streams_updated_at
  BEFORE UPDATE ON public.scheduled_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_streams_updated_at();

COMMENT ON TABLE public.scheduled_streams IS 'User-scheduled live streams with platform, timing, and notification settings';
COMMENT ON COLUMN public.scheduled_streams.platform IS 'Array of platforms for the stream (twitch, kick)';
COMMENT ON COLUMN public.scheduled_streams.status IS 'Current status: scheduled, cancelled, live, completed';
COMMENT ON COLUMN public.scheduled_streams.notification_methods IS 'Array of notification channels (discord, telegram)';
COMMENT ON COLUMN public.scheduled_streams.notification_sent IS 'Whether notification has been sent for this stream';

-- ----------------------------------------------------------------------------
-- 20260720_meta_publish_tasks.sql
-- ----------------------------------------------------------------------------

-- Migration: meta_publish_tasks
-- Description: Queue for Meta Business Suite browser automation tasks.
-- When a user publishes to Facebook/Instagram, instead of calling the Graph API
-- (which is localOnly / unapproved), a task is created here. The .203 worker
-- polls this table, executes Puppeteer-core + stealth against a real Chrome
-- session logged into Meta Business Suite.

-- ============================================================================
-- META_PUBLISH_TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meta_publish_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who created this task (JWT email verified server-side)
  created_by TEXT NOT NULL,

  -- Task lifecycle
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploading', 'downloading', 'processing', 'completed', 'failed')),

  -- What to publish
  task_type TEXT NOT NULL
    CHECK (task_type IN ('video', 'post', 'story')),

  -- Full metadata (title, description, hashtags, schedule, platforms, etc.)
  payload JSONB NOT NULL DEFAULT '{}',

  -- Video source: 'smb' (direct from .100), 'upload' (via tus from anywhere), 'local' (already on .203)
  video_source TEXT
    CHECK (video_source IN ('smb', 'upload', 'local')),

  -- SMB path or local path on .203
  video_path TEXT,

  -- Original filename (for display / logs)
  video_original_name TEXT,

  -- Upload progress tracking
  upload_bytes_received BIGINT DEFAULT 0,
  upload_bytes_total BIGINT,

  -- Result
  result JSONB,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_meta_publish_tasks_status ON public.meta_publish_tasks(status);
CREATE INDEX IF NOT EXISTS idx_meta_publish_tasks_created_by ON public.meta_publish_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_meta_publish_tasks_created_at ON public.meta_publish_tasks(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.meta_publish_tasks ENABLE ROW LEVEL SECURITY;

-- Only allowed users can insert tasks
-- Whitelist: gabrieltothgoncalves@gmail.com, csgoblackbelt@gmail.com
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'meta_publish_tasks' AND policyname = 'Allowed users can create tasks') THEN
    CREATE POLICY "Allowed users can create tasks"
      ON public.meta_publish_tasks FOR INSERT
      WITH CHECK (
        auth.email() IN (
          'gabrieltothgoncalves@gmail.com',
          'csgoblackbelt@gmail.com'
        )
        AND created_by = auth.email()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'meta_publish_tasks' AND policyname = 'Users can view own tasks') THEN
    CREATE POLICY "Users can view own tasks"
      ON public.meta_publish_tasks FOR SELECT
      USING (
        created_by = auth.email()
        AND auth.email() IN (
          'gabrieltothgoncalves@gmail.com',
          'csgoblackbelt@gmail.com'
        )
      );
  END IF;
END $$;

-- Only service_role can update (for the .203 worker)
-- This is enforced via the API route that checks service_role key
-- No UPDATE policy for public role

-- ============================================================================
-- UPDATED AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_meta_publish_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_meta_publish_tasks_updated_at ON public.meta_publish_tasks;
CREATE TRIGGER set_meta_publish_tasks_updated_at
  BEFORE UPDATE ON public.meta_publish_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_meta_publish_tasks_updated_at();

-- ----------------------------------------------------------------------------
-- 20260722_create_credits_tables.sql
-- ----------------------------------------------------------------------------

-- ============================================================================
-- CREDITS SYSTEM TABLES
-- Driven by src/lib/credits/service.ts (uses <transactions> + <user_accounts>)
-- ============================================================================

-- Atomic credit balance per user. Row-locked for concurrent operations.
CREATE TABLE IF NOT EXISTS public.user_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_accounts' AND policyname = 'Users can view own account') THEN
    CREATE POLICY "Users can view own account"
      ON public.user_accounts
      FOR SELECT
  USING (user_id = auth.uid());    END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_accounts' AND policyname = 'System can update accounts') THEN
    CREATE POLICY "System can update accounts"
      ON public.user_accounts
      FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');    END IF;
END $$;

-- Immutable ledger of credit movements.
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  reason TEXT NOT NULL,
  balance_before NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Users can view own transactions') THEN
    CREATE POLICY "Users can view own transactions"
      ON public.transactions
      FOR SELECT
  USING (user_id = auth.uid());    END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'System can insert transactions') THEN
    CREATE POLICY "System can insert transactions"
      ON public.transactions
      FOR INSERT
  WITH CHECK (auth.role() = 'service_role');    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 20260901_client_sessions.sql
-- ----------------------------------------------------------------------------

-- Client session/cookie vault for unofficial social media integrations
-- (Twitter/X, Facebook, Instagram, Kwai via OmniRoute/1proxy scraping mesh)
--
-- Encrypted with AES-256-CBC via scripts/env/COOKIE_ENCRYPTION_KEY

create table if not exists client_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    platform text not null check (platform in ('twitter', 'facebook', 'instagram', 'kwai', 'tiktok', 'twitch', 'youtube')),
    payload jsonb not null, -- { encryptedCookies: string, iv: string, scrapedAt, expiresIn }
    credits_used integer not null default 0,
    last_billed_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, platform)
);

create index idx_client_sessions_user on client_sessions(user_id);
create index idx_client_sessions_billable on client_sessions(last_billed_at) where credits_used > 0;

-- RLS: users can only see their own sessions
alter table client_sessions enable row level security;

create policy "users_read_own_sessions"
    on client_sessions for select
    using (auth.uid() = user_id);

create policy "users_insert_own_sessions"
    on client_sessions for insert
    with check (auth.uid() = user_id);

create policy "users_delete_own_sessions"
    on client_sessions for delete
    using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 20260902_fix_users_table_picture.sql
-- ----------------------------------------------------------------------------

-- Migration: Fix users table missing columns
-- Applied: 2026-09-01
--
-- Production users table is missing the `picture` column (used by OAuth login)
-- and potentially other legacy columns. Add them defensively.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'picture'
  ) THEN
    ALTER TABLE public.users ADD COLUMN picture TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'oauth_email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN oauth_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'oauth_provider'
  ) THEN
    ALTER TABLE public.users ADD COLUMN oauth_provider TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'oauth_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN oauth_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.users ADD COLUMN birth_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'account_completion_status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN account_completion_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'account_completed_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN account_completed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.users ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;
