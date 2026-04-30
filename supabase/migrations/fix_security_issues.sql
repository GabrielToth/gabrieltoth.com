-- Fix Security Issues in Supabase Database
-- Resolves RLS policies and SECURITY DEFINER function issues

-- 1. Fix rls_auto_enable() SECURITY DEFINER function
-- Revoke EXECUTE from anon and authenticated roles
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- 2. Add RLS policies for audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Add RLS policies for email_verification_tokens table
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_verification_tokens_select_own" ON public.email_verification_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "email_verification_tokens_update_own" ON public.email_verification_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "email_verification_tokens_delete_own" ON public.email_verification_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Add RLS policies for login_attempts table
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_attempts_select_own" ON public.login_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "login_attempts_insert_own" ON public.login_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Add RLS policies for password_reset_tokens table
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "password_reset_tokens_select_own" ON public.password_reset_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "password_reset_tokens_update_own" ON public.password_reset_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "password_reset_tokens_delete_own" ON public.password_reset_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Add RLS policies for registration_sessions table
ALTER TABLE public.registration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registration_sessions_select_own" ON public.registration_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "registration_sessions_update_own" ON public.registration_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "registration_sessions_delete_own" ON public.registration_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Add RLS policies for sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON public.sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_update_own" ON public.sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_delete_own" ON public.sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Add RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- 9. Switch rls_auto_enable() to SECURITY INVOKER if possible
-- Note: This requires recreating the function
-- ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;
