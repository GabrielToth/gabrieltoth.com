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
