-- Migration: meta_publish_tasks
-- Description: Queue for Meta Business Suite browser automation tasks.
-- When a user publishes to Facebook/Instagram, instead of calling the Graph API
-- (which is localOnly / unapproved), a task is created here. The .203 worker
-- polls this table, executes Puppeteer-core + stealth against a real Chrome
-- session logged into Meta Business Suite.

-- ============================================================================
-- META_PUBLISH_TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meta_publish_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who created this task (JWT email verified server-side)
  created_by TEXT NOT NULL,

  -- Task lifecycle
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploading', 'downloading', 'processing', 'completed', 'failed')),

  -- What to publish
  task_type TEXT NOT NULL
    CHECK (task_type IN ('video', 'post', 'story')),

  -- Full metadata (title, description, hashtags, schedule, platforms, etc.)
  payload JSONB NOT NULL DEFAULT '{}',

  -- Video source: 'smb' (direct from .100), 'upload' (via tus from anywhere), 'local' (already on .203)
  video_source TEXT
    CHECK (video_source IN ('smb', 'upload', 'local')),

  -- SMB path or local path on .203
  video_path TEXT,

  -- Original filename (for display / logs)
  video_original_name TEXT,

  -- Upload progress tracking
  upload_bytes_received BIGINT DEFAULT 0,
  upload_bytes_total BIGINT,

  -- Result
  result JSONB,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_meta_publish_tasks_status ON public.meta_publish_tasks(status);
CREATE INDEX IF NOT EXISTS idx_meta_publish_tasks_created_by ON public.meta_publish_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_meta_publish_tasks_created_at ON public.meta_publish_tasks(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.meta_publish_tasks ENABLE ROW LEVEL SECURITY;

-- Only allowed users can insert tasks
-- Whitelist: gabrieltothgoncalves@gmail.com, csgoblackbelt@gmail.com
CREATE POLICY "Allowed users can create tasks"
  ON public.meta_publish_tasks FOR INSERT
  WITH CHECK (
    auth.email() IN (
      'gabrieltothgoncalves@gmail.com',
      'csgoblackbelt@gmail.com'
    )
    AND created_by = auth.email()
  );

-- Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON public.meta_publish_tasks FOR SELECT
  USING (
    created_by = auth.email()
    AND auth.email() IN (
      'gabrieltothgoncalves@gmail.com',
      'csgoblackbelt@gmail.com'
    )
  );

-- Only service_role can update (for the .203 worker)
-- This is enforced via the API route that checks service_role key
-- No UPDATE policy for public role

-- ============================================================================
-- UPDATED AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_meta_publish_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_meta_publish_tasks_updated_at
  BEFORE UPDATE ON public.meta_publish_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_meta_publish_tasks_updated_at();
