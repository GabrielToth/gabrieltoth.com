-- Migration: Add Video Scheduling & Decimal Credit Support
-- Purpose: Support video upload storage, decimal credit balances, and per-platform media scheduling
-- Dependencies: Requires 006_create_scheduled_posts_table.sql (for scheduled_posts table)

-- ============================================================================
-- 1. Migrate profiles.credits_balance to NUMERIC for decimal precision
-- ============================================================================
ALTER TABLE public.profiles
  ALTER COLUMN credits_balance DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN credits_balance TYPE NUMERIC(12, 2)
  USING credits_balance::NUMERIC(12, 2);

ALTER TABLE public.profiles
  ALTER COLUMN credits_balance SET DEFAULT 0.00;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_credits_balance_check CHECK (credits_balance >= 0);

-- ============================================================================
-- 2. Migrate credit_transactions.amount to NUMERIC for decimal precision
-- ============================================================================
ALTER TABLE public.credit_transactions
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
  -- 'cloud' | 'local'
  original_filename VARCHAR(500),
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  video_duration_seconds INTEGER,

  -- Cloud storage location
  storage_path TEXT,
  storage_status VARCHAR(20) DEFAULT 'pending',
  -- 'pending' | 'stored' | 'uploading_youtube' | 'published' | 'deleted'

  -- Billing (cloud mode only)
  storage_cost_per_gb_per_day NUMERIC(10, 2) NOT NULL DEFAULT 6.67,
  bandwidth_cost_per_gb NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  base_fee NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  storage_days INTEGER,
  total_cost_charged NUMERIC(10, 2),
  total_cost_refunded NUMERIC(10, 2) DEFAULT 0.00,
  billing_status VARCHAR(20) DEFAULT 'charged',
  -- 'charged' | 'partially_refunded' | 'fully_refunded'

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
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'text';
-- 'text' | 'video'

-- ============================================================================
-- 5. RLS policies for scheduled_post_media
-- ============================================================================
ALTER TABLE public.scheduled_post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_post_media_user_access ON public.scheduled_post_media
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY scheduled_post_media_service_role ON public.scheduled_post_media
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
