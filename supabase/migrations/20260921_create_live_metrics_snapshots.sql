-- ----------------------------------------------------------------------------
-- 20260921_create_live_metrics_snapshots.sql
--
-- Persists per-stream viewer/chat metrics so the Live dashboard and Insights
-- pages aggregate REAL history instead of in-memory mock data (which is lost
-- on every serverless cold start).
--
-- Rows are written by POST /api/live/metrics (viewer polling cadence) and
-- read+aggregated by GET /api/live/metrics.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.live_metrics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    viewers INTEGER NOT NULL DEFAULT 0,
    chat_messages_count INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_metrics_user_id
    ON public.live_metrics_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_live_metrics_timestamp
    ON public.live_metrics_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_live_metrics_platform
    ON public.live_metrics_snapshots(platform);

ALTER TABLE public.live_metrics_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'live_metrics_snapshots'
      AND policyname = 'Users can read own live metrics'
  ) THEN
    CREATE POLICY "Users can read own live metrics"
      ON public.live_metrics_snapshots FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Service role (API routes) bypasses RLS for inserts.
