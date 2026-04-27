-- Migration: Create Social Networks Table
-- Purpose: Store linked social media accounts for users
-- Requirements: 5.1, 5.2, 5.3, 5.4, 5.5

-- Create social_networks table
CREATE TABLE IF NOT EXISTS public.social_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_user_id VARCHAR(255) NOT NULL,
  platform_username VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'connected',
  linked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_networks_user_id ON public.social_networks(user_id);
CREATE INDEX IF NOT EXISTS idx_social_networks_platform ON public.social_networks(platform);
CREATE INDEX IF NOT EXISTS idx_social_networks_user_platform ON public.social_networks(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_networks_status ON public.social_networks(status);

-- Enable Row Level Security
ALTER TABLE public.social_networks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only access their own networks
CREATE POLICY social_networks_user_access ON public.social_networks
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create RLS policy: Service role can access all networks
CREATE POLICY social_networks_service_role ON public.social_networks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
