-- Database Schema for Custom Platform
-- Designed for total metric visibility and usage-based billing

-- Profiles (Core user data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- Linked to Auth.js or external Auth
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  credits_balance BIGINT DEFAULT 0 NOT NULL CHECK (credits_balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Accounts (Twitch, YT, etc)
CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Metering Logs (Raw Infrastructure Consumption)
-- This allows total transparency for Bandwidth, Disk, and Cache usage
CREATE TABLE IF NOT EXISTS public.metering_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'bandwidth', 'storage', 'cache', 'api'
  amount BIGINT NOT NULL,      -- bytes or count
  credits_cost INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Transactions (Financial History)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'purchase', 'usage', 'subscription', 'refund'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Infrastructure Aggregates (For Dashboard Performance)
CREATE TABLE IF NOT EXISTS public.infra_stats (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_bandwidth BIGINT DEFAULT 0,
  total_storage BIGINT DEFAULT 0,
  total_cache_ops BIGINT DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- Additional tables for distributed infrastructure logging

-- User Accounts (for atomic credit transactions with row locking)
CREATE TABLE IF NOT EXISTS public.user_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Transactions (for audit trail of credit operations)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_accounts(user_id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('debit', 'credit')),
  reason TEXT NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_transactions ON public.transactions(user_id, created_at DESC);

-- Usage Metrics (for metering system)
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(15, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_metrics ON public.usage_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aggregation ON public.usage_metrics(created_at, user_id);

-- Daily Usage Summary (for billing aggregation)
CREATE TABLE IF NOT EXISTS public.daily_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  bandwidth_gb DECIMAL(10, 4) NOT NULL DEFAULT 0,
  storage_gb DECIMAL(10, 4) NOT NULL DEFAULT 0,
  cache_ops INTEGER NOT NULL DEFAULT 0,
  api_calls INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- Pricing Configuration (for flexible pricing updates)
CREATE TABLE IF NOT EXISTS public.pricing_config (
  metric_type VARCHAR(50) PRIMARY KEY,
  cost_per_unit DECIMAL(10, 6) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default pricing values
INSERT INTO public.pricing_config (metric_type, cost_per_unit, unit) VALUES
  ('bandwidth', 0.10, 'GB'),
  ('storage', 0.05, 'GB'),
  ('cache_ops', 0.0001, 'operation'),
  ('api_calls', 0.001, 'call')
ON CONFLICT (metric_type) DO NOTHING;

