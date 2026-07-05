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
