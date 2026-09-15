-- Migration: Create custom_commands table for chatbot management
-- Date: 2026-09-14

CREATE TABLE IF NOT EXISTS public.custom_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Command definition
    trigger TEXT NOT NULL,                     -- e.g. "!discord", "!title"
    type TEXT NOT NULL DEFAULT 'response'
      CHECK (type IN ('response', 'stream_update', 'moderation', 'system')),
    
    -- Content & execution
    response_template TEXT,                    -- Response text with interpolations {user}, {title}, etc.
    description TEXT,                          -- Human readable description
    
    -- Permissions & Platforms (JSON arrays)
    platforms JSONB DEFAULT '["twitch", "kick", "youtube"]'::jsonb,  -- Platforms where command works
    allowed_roles JSONB DEFAULT '["broadcaster", "moderator", "viewer"]'::jsonb, -- Who can use: broadcaster, moderator, subscriber, viewer

    -- Settings
    cooldown_seconds INTEGER DEFAULT 10,       -- Cooldown between uses
    enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure unique trigger per user
    UNIQUE(user_id, trigger)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_commands_user_id ON public.custom_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_commands_trigger ON public.custom_commands(trigger);

-- RLS
ALTER TABLE public.custom_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom commands"
  ON public.custom_commands FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
