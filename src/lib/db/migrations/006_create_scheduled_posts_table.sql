-- Migration: Create Scheduled Posts Tables
-- Purpose: Store scheduled posts and their target networks
-- Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8

-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create scheduled_post_networks junction table
CREATE TABLE IF NOT EXISTS public.scheduled_post_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  external_id VARCHAR(255),
  external_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create publication_history table
CREATE TABLE IF NOT EXISTS public.publication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  external_id VARCHAR(255),
  external_url TEXT,
  error_message TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_time ON public.scheduled_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_scheduled_time ON public.scheduled_posts(user_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_post_networks_post_id ON public.scheduled_post_networks(post_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_post_networks_status ON public.scheduled_post_networks(status);
CREATE INDEX IF NOT EXISTS idx_publication_history_user_id ON public.publication_history(user_id);
CREATE INDEX IF NOT EXISTS idx_publication_history_platform ON public.publication_history(platform);
CREATE INDEX IF NOT EXISTS idx_publication_history_published_at ON public.publication_history(published_at);
CREATE INDEX IF NOT EXISTS idx_publication_history_user_published_at ON public.publication_history(user_id, published_at);

-- Enable Row Level Security
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_post_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scheduled_posts
CREATE POLICY scheduled_posts_user_access ON public.scheduled_posts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY scheduled_posts_service_role ON public.scheduled_posts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create RLS policies for scheduled_post_networks
CREATE POLICY scheduled_post_networks_user_access ON public.scheduled_post_networks
  FOR ALL
  USING (
    post_id IN (
      SELECT id FROM public.scheduled_posts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    post_id IN (
      SELECT id FROM public.scheduled_posts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY scheduled_post_networks_service_role ON public.scheduled_post_networks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create RLS policies for publication_history
CREATE POLICY publication_history_user_access ON public.publication_history
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY publication_history_service_role ON public.publication_history
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
