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
