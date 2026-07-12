-- Migration: Create scheduled_streams table for stream scheduling
-- This table stores scheduled live streams with notification settings

-- ============================================================================
-- SCHEDULED STREAMS TABLE
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
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'live', 'completed')),
  notification_methods TEXT[] DEFAULT '{discord}',
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for querying streams by user and status
CREATE INDEX IF NOT EXISTS idx_scheduled_streams_user_status
  ON public.scheduled_streams(user_id, status);

-- Index for querying upcoming streams
CREATE INDEX IF NOT EXISTS idx_scheduled_streams_start_time
  ON public.scheduled_streams(scheduled_start_time)
  WHERE status = 'scheduled';

-- Enable Row Level Security
ALTER TABLE public.scheduled_streams ENABLE ROW LEVEL SECURITY;

-- Policies: users can CRUD their own scheduled streams
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

-- Auto-update updated_at on row modification
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

COMMENT ON TABLE public.scheduled_streams IS 'User-scheduled live streams with platform, timing, and notification settings';
COMMENT ON COLUMN public.scheduled_streams.platform IS 'Array of platforms for the stream (twitch, kick)';
COMMENT ON COLUMN public.scheduled_streams.status IS 'Current status: scheduled, cancelled, live, completed';
COMMENT ON COLUMN public.scheduled_streams.notification_methods IS 'Array of notification channels (discord, telegram)';
COMMENT ON COLUMN public.scheduled_streams.notification_sent IS 'Whether notification has been sent for this stream';
