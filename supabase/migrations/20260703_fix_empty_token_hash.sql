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
