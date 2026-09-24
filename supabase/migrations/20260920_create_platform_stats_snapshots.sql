-- ----------------------------------------------------------------------------
-- 20260920_create_platform_stats_snapshots.sql
--
-- Persists real per-platform channel statistics snapshots so the Insights
-- dashboard can compute real deltas (growth) over 7/30/90-day periods
-- instead of showing synthetic placeholder numbers.
--
-- One row per (user, platform, day). Written by the analytics route when it
-- fetches fresh stats from the platform APIs (cached 1h in memory).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.platform_stats_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    followers BIGINT,
    views BIGINT,
    channel_name TEXT,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One snapshot per user+platform per day (latest wins within the day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_stats_snapshots_user_platform_day
    ON public.platform_stats_snapshots (
        user_id,
        platform,
        ((captured_at AT TIME ZONE 'utc')::date)
    );

CREATE INDEX IF NOT EXISTS idx_stats_snapshots_user_id
    ON public.platform_stats_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_stats_snapshots_platform
    ON public.platform_stats_snapshots(platform);

ALTER TABLE public.platform_stats_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'platform_stats_snapshots'
      AND policyname = 'Users can read own stats snapshots'
  ) THEN
    CREATE POLICY "Users can read own stats snapshots"
      ON public.platform_stats_snapshots FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Service role (used by the Next.js API routes with SUPABASE_SERVICE_ROLE_KEY)
-- bypasses RLS, so insert/update happens through the API layer only.
