-- Canonical database schema (consolidated). Apply via: npx supabase db push
-- This is the single source of truth for ALL tables.
-- Individual migration files are removed after consolidation.
-- Last consolidated: 2026-06-22

-- ============================================================================
-- 1. USERS TABLE (unified: password + OAuth)
-- ============================================================================
-- Single user table supporting both Argon2id password auth and OAuth providers.
-- password_hash is nullable for OAuth-first users who haven't set a password yet.

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identity
  email TEXT UNIQUE NOT NULL,
  name TEXT,

  -- Password auth (Argon2id only)
  password_hash TEXT,
  password_algorithm TEXT DEFAULT 'argon2id'
    CHECK (password_algorithm IN ('argon2id')),

  -- OAuth identity
  oauth_provider TEXT,
  oauth_id TEXT,
  oauth_email TEXT,
  picture TEXT,

  -- Personal data
  phone TEXT,
  birth_date DATE,

  -- Account status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  account_completion_status TEXT DEFAULT 'pending'
    CHECK (account_completion_status IN ('pending', 'completed')),
  account_completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login TIMESTAMPTZ,

  -- Flexible metadata
  metadata JSONB DEFAULT '{}',

  -- Unique constraint per OAuth provider
  UNIQUE(oauth_provider, oauth_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON public.users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_completion_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own data"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update own data"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- 2. PROFILES TABLE
-- ============================================================================
-- Extended profile data per user. One-to-one with users(id).

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  credits_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL
    CONSTRAINT profiles_credits_balance_check CHECK (credits_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- 3. RATE_LIMIT_RECORDS TABLE
-- ============================================================================
-- Tracks failed authentication attempts for brute-force protection.

CREATE TABLE IF NOT EXISTS public.rate_limit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  failed_attempts INTEGER DEFAULT 0 NOT NULL,
  last_attempt TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_email ON public.rate_limit_records(email);
CREATE INDEX IF NOT EXISTS idx_rate_limit_locked ON public.rate_limit_records(locked_until);
CREATE INDEX IF NOT EXISTS idx_rate_limit_last_attempt ON public.rate_limit_records(last_attempt);

ALTER TABLE public.rate_limit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "System only access"
  ON public.rate_limit_records FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 4. AUDIT_LOGS TABLE
-- ============================================================================
-- Immutable log of all authentication and security events.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  email TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  attempt_count INTEGER,
  old_algorithm TEXT,
  new_algorithm TEXT,
  error_code TEXT,
  error_message TEXT,
  captcha_provider TEXT,
  captcha_success BOOLEAN,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_email ON public.audit_logs(email);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_event_timestamp ON public.audit_logs(event_type, timestamp);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 5. SESSIONS TABLE
-- ============================================================================
-- Active user sessions with expiration.

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON public.sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 6. REMEMBER_ME_TOKENS TABLE
-- ============================================================================
-- Long-lived tokens for persistent sessions.

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

CREATE POLICY IF NOT EXISTS "Users can manage own remember tokens"
  ON public.remember_me_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7. CSRF_TOKENS TABLE
-- ============================================================================
-- Server-side CSRF token storage for form protection.

CREATE TABLE IF NOT EXISTS public.csrf_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csrf_tokens_hash ON public.csrf_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires_at ON public.csrf_tokens(expires_at);

ALTER TABLE public.csrf_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "System only access"
  ON public.csrf_tokens FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 8. EMAIL_VERIFICATION_TOKENS TABLE
-- ============================================================================
-- Tokens for email verification during registration.

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "System only access"
  ON public.email_verification_tokens FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 9. REGISTRATION_SESSIONS TABLE
-- ============================================================================
-- Multi-step registration session persistence.

CREATE TABLE IF NOT EXISTS public.registration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  current_step INTEGER DEFAULT 1,
  temp_token TEXT,
  temp_token_hash TEXT,
  birth_date DATE,
  password_hash TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_registration_sessions_session_id ON public.registration_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_registration_sessions_temp_token_hash ON public.registration_sessions(temp_token_hash);
CREATE INDEX IF NOT EXISTS idx_registration_sessions_expires_at ON public.registration_sessions(expires_at);

ALTER TABLE public.registration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "System only access"
  ON public.registration_sessions FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 10. LINKED_ACCOUNTS TABLE
-- ============================================================================
-- Platform accounts linked to a user (Twitch, YouTube, etc).

CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id ON public.linked_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_linked_accounts_platform ON public.linked_accounts(platform);

ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage own linked accounts"
  ON public.linked_accounts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 11. OAUTH_TOKENS TABLE
-- ============================================================================
-- Encrypted OAuth tokens for social media API access.

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

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON public.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_platform ON public.oauth_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON public.oauth_tokens(expires_at);

ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage own oauth tokens"
  ON public.oauth_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 12. NETWORK_GROUPS TABLE
-- ============================================================================
-- User-defined groups of social networks for publishing.

CREATE TABLE IF NOT EXISTS public.network_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_network_groups_user_id ON public.network_groups(user_id);

ALTER TABLE public.network_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage own network groups"
  ON public.network_groups FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 13. GROUP_NETWORKS TABLE (junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.group_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.network_groups(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_group_networks_group_id ON public.group_networks(group_id);

ALTER TABLE public.group_networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage group networks"
  ON public.group_networks FOR ALL
  USING (
    group_id IN (SELECT id FROM public.network_groups WHERE user_id = auth.uid())
  )
  WITH CHECK (
    group_id IN (SELECT id FROM public.network_groups WHERE user_id = auth.uid())
  );

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

CREATE POLICY IF NOT EXISTS "Users can manage own scheduled posts"
  ON public.scheduled_posts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

CREATE POLICY IF NOT EXISTS "Users can manage post networks"
  ON public.scheduled_post_networks FOR ALL
  USING (
    post_id IN (SELECT id FROM public.scheduled_posts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    post_id IN (SELECT id FROM public.scheduled_posts WHERE user_id = auth.uid())
  );

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

CREATE POLICY IF NOT EXISTS "Users can view own publication history"
  ON public.publication_history FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 17. SCHEDULED_POST_MEDIA TABLE
-- ============================================================================
-- Media files attached to scheduled posts (video uploads, etc).

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

CREATE POLICY IF NOT EXISTS "Users can manage own post media"
  ON public.scheduled_post_media FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 18. CREDIT_TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 19. USER_ACCOUNTS TABLE
-- ============================================================================
-- Atomic credit balance with row locking for concurrent operations.

CREATE TABLE IF NOT EXISTS public.user_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own account"
  ON public.user_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can update accounts"
  ON public.user_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 20. TRANSACTIONS TABLE (financial audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_accounts(user_id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  reason TEXT NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_transactions ON public.transactions(user_id, created_at DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 21. METERING_LOGS TABLE
-- ============================================================================
-- Raw infrastructure consumption tracking (bandwidth, storage, cache, API).

CREATE TABLE IF NOT EXISTS public.metering_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  amount BIGINT NOT NULL,
  credits_cost INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metering_logs_user_id ON public.metering_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_metering_logs_resource_type ON public.metering_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_metering_logs_created_at ON public.metering_logs(created_at);

ALTER TABLE public.metering_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own metering"
  ON public.metering_logs FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 22. INFRA_STATS TABLE
-- ============================================================================
-- Aggregated infrastructure usage per user per day.

CREATE TABLE IF NOT EXISTS public.infra_stats (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_bandwidth BIGINT DEFAULT 0,
  total_storage BIGINT DEFAULT 0,
  total_cache_ops BIGINT DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.infra_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own infra stats"
  ON public.infra_stats FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 23. USAGE_METRICS TABLE
-- ============================================================================
-- Granular usage tracking for the metering system.

CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  value DECIMAL(15, 2) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_id ON public.usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON public.usage_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_created_at ON public.usage_metrics(created_at);

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own usage metrics"
  ON public.usage_metrics FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 24. DAILY_USAGE_SUMMARY TABLE
-- ============================================================================
-- Pre-aggregated daily usage for billing.

CREATE TABLE IF NOT EXISTS public.daily_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  bandwidth_gb DECIMAL(10, 4) NOT NULL DEFAULT 0,
  storage_gb DECIMAL(10, 4) NOT NULL DEFAULT 0,
  cache_ops INTEGER NOT NULL DEFAULT 0,
  api_calls INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_usage_user_id ON public.daily_usage_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON public.daily_usage_summary(date);

ALTER TABLE public.daily_usage_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own daily usage"
  ON public.daily_usage_summary FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 25. PRICING_CONFIG TABLE
-- ============================================================================
-- Flexible pricing configuration for metered resources.

CREATE TABLE IF NOT EXISTS public.pricing_config (
  metric_type TEXT PRIMARY KEY,
  cost_per_unit DECIMAL(10, 6) NOT NULL,
  unit TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.pricing_config (metric_type, cost_per_unit, unit) VALUES
  ('bandwidth', 0.10, 'GB'),
  ('storage', 0.05, 'GB'),
  ('cache_ops', 0.0001, 'operation'),
  ('api_calls', 0.001, 'call')
ON CONFLICT (metric_type) DO NOTHING;

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Everyone can view pricing"
  ON public.pricing_config FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "System can update pricing"
  ON public.pricing_config FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 26. HELPER FUNCTIONS
-- ============================================================================

-- Function: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_rate_limit_updated_at
  BEFORE UPDATE ON public.rate_limit_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 27. VIEWS FOR MONITORING
-- ============================================================================

CREATE OR REPLACE VIEW recent_auth_attempts AS
SELECT
  event_type,
  email,
  COUNT(*) as count,
  MAX(timestamp) as latest,
  MIN(timestamp) as oldest
FROM public.audit_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type, email
ORDER BY latest DESC;

CREATE OR REPLACE VIEW locked_accounts AS
SELECT
  email,
  failed_attempts,
  locked_until,
  NOW() as current_time,
  locked_until - NOW() as time_remaining
FROM public.rate_limit_records
WHERE locked_until IS NOT NULL
  AND locked_until > NOW()
ORDER BY locked_until DESC;

CREATE OR REPLACE VIEW password_migrations AS
SELECT
  email,
  old_algorithm,
  new_algorithm,
  COUNT(*) as migration_count,
  MAX(timestamp) as latest_migration,
  MIN(timestamp) as first_migration
FROM public.audit_logs
WHERE event_type = 'password_migration'
GROUP BY email, old_algorithm, new_algorithm
ORDER BY latest_migration DESC;

-- ============================================================================
-- 28. SCHEDULED STREAMS TABLE
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
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'live', 'completed')),
  notification_methods TEXT[] DEFAULT '{discord}',
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scheduled_streams_user_status
  ON public.scheduled_streams(user_id, status);

CREATE INDEX IF NOT EXISTS idx_scheduled_streams_start_time
  ON public.scheduled_streams(scheduled_start_time)
  WHERE status = 'scheduled';

ALTER TABLE public.scheduled_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own scheduled streams"
  ON public.scheduled_streams FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can create own scheduled streams"
  ON public.scheduled_streams FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update own scheduled streams"
  ON public.scheduled_streams FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete own scheduled streams"
  ON public.scheduled_streams FOR DELETE
  USING (user_id = auth.uid());

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

-- ============================================================================
-- 29. CLEANUP FUNCTIONS (testing/development)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_all_users()
RETURNS TABLE(users_deleted INT, rate_limits_deleted INT, audit_logs_deleted INT) AS $$
DECLARE
  v_users_count INT := 0;
  v_rate_limits_count INT := 0;
  v_audit_logs_count INT := 0;
BEGIN
  SELECT COUNT(*) INTO v_users_count FROM public.users;
  SELECT COUNT(*) INTO v_rate_limits_count FROM public.rate_limit_records;
  SELECT COUNT(*) INTO v_audit_logs_count FROM public.audit_logs;

  DELETE FROM public.rate_limit_records;
  DELETE FROM public.audit_logs;
  DELETE FROM public.sessions;
  DELETE FROM public.email_verification_tokens;
  DELETE FROM public.registration_sessions;
  DELETE FROM public.remember_me_tokens;
  DELETE FROM public.csrf_tokens;
  DELETE FROM public.linked_accounts;
  DELETE FROM public.oauth_tokens;
  DELETE FROM public.user_accounts;
  DELETE FROM public.transactions;
  DELETE FROM public.metering_logs;
  DELETE FROM public.usage_metrics;
  DELETE FROM public.daily_usage_summary;
  DELETE FROM public.scheduled_post_media;
  DELETE FROM public.scheduled_post_networks;
  DELETE FROM public.publication_history;
  DELETE FROM public.scheduled_posts;
  DELETE FROM public.scheduled_streams;
  DELETE FROM public.network_groups;
  DELETE FROM public.group_networks;
  DELETE FROM public.pricing_config;
  DELETE FROM public.profiles;
  DELETE FROM public.users;

  RETURN QUERY SELECT v_users_count, v_rate_limits_count, v_audit_logs_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 30. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.users IS 'Unified user accounts: Argon2id password + OAuth providers';
COMMENT ON COLUMN public.users.password_hash IS 'Password hash in Argon2id format (null for OAuth-only users)';
COMMENT ON COLUMN public.users.password_algorithm IS 'Always argon2id';
COMMENT ON COLUMN public.users.account_completion_status IS 'pending if user still needs to fill personal data';
COMMENT ON TABLE public.profiles IS 'Extended user profile with credits balance';
COMMENT ON TABLE public.rate_limit_records IS 'Tracks failed authentication attempts for brute-force protection';
COMMENT ON TABLE public.audit_logs IS 'Immutable log of all authentication and security events';
COMMENT ON TABLE public.sessions IS 'Active user sessions';
COMMENT ON TABLE public.registration_sessions IS 'Multi-step registration session data';
COMMENT ON TABLE public.credit_transactions IS 'Credit purchase and usage history';
COMMENT ON TABLE public.metering_logs IS 'Raw infrastructure consumption data';
COMMENT ON TABLE public.pricing_config IS 'Per-unit pricing for metered resources';
COMMENT ON TABLE public.scheduled_streams IS 'User-scheduled live streams with platform, timing, and notification settings';
COMMENT ON COLUMN public.scheduled_streams.platform IS 'Array of platforms for the stream (twitch, kick)';
COMMENT ON COLUMN public.scheduled_streams.status IS 'Current status: scheduled, cancelled, live, completed';
COMMENT ON COLUMN public.scheduled_streams.notification_methods IS 'Array of notification channels (discord, telegram)';
COMMENT ON COLUMN public.scheduled_streams.notification_sent IS 'Whether notification has been sent for this stream';
