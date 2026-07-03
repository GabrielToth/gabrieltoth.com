-- Migration: Fix empty token_hash values causing unique constraint violations
-- Applied: 2026-07-03
--
-- The previous migration (20260702) populated token_hash from session_id,
-- but if session_id was empty, those rows have empty token_hash values.
-- PostgreSQL treats multiple empty strings as duplicates for UNIQUE constraints,
-- causing "duplicate key value violates unique constraint sessions_token_key" errors.

-- 1. Delete sessions with empty token_hash (they're invalid anyway)
DELETE FROM public.sessions WHERE token_hash = '' OR token_hash IS NULL;

-- 2. Add a check constraint to prevent empty token_hash in the future
ALTER TABLE public.sessions 
  ADD CONSTRAINT sessions_token_hash_not_empty 
  CHECK (token_hash != '');

-- 3. Verify the fix
DO $$
DECLARE
  empty_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO empty_count FROM public.sessions WHERE token_hash = '' OR token_hash IS NULL;
  IF empty_count > 0 THEN
    RAISE WARNING 'Still have % sessions with empty token_hash', empty_count;
  ELSE
    RAISE NOTICE 'All sessions now have valid token_hash values';
  END IF;
END $$;
