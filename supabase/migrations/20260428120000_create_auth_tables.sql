-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create remember_me_tokens table
CREATE TABLE IF NOT EXISTS public.remember_me_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate_limit_attempts table
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL,
  attempt_count INT DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ip_address)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_remember_me_tokens_user_id ON public.remember_me_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_remember_me_tokens_expires_at ON public.remember_me_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_ip ON public.rate_limit_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);

-- Enable Row Level Security (RLS) on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit_logs (append-only)
-- Allow authenticated users to read audit logs
CREATE POLICY "audit_logs_read_policy" ON public.audit_logs
  FOR SELECT
  USING (true);

-- Allow service role to insert audit logs
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes on audit logs (append-only)
CREATE POLICY "audit_logs_no_update_policy" ON public.audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "audit_logs_no_delete_policy" ON public.audit_logs
  FOR DELETE
  USING (false);

-- Grant permissions
GRANT SELECT, INSERT ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.remember_me_tokens TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rate_limit_attempts TO authenticated;

-- Allow service role full access for backend operations
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.remember_me_tokens TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.rate_limit_attempts TO service_role;
