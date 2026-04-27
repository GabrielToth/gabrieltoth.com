-- Migration: Create Network Groups Tables
-- Purpose: Store user-defined groups of social networks
-- Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10

-- Create network_groups table
CREATE TABLE IF NOT EXISTS public.network_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create group_networks junction table
CREATE TABLE IF NOT EXISTS public.group_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.network_groups(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, platform)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_network_groups_user_id ON public.network_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_network_groups_name ON public.network_groups(name);
CREATE INDEX IF NOT EXISTS idx_group_networks_group_id ON public.group_networks(group_id);
CREATE INDEX IF NOT EXISTS idx_group_networks_platform ON public.group_networks(platform);

-- Enable Row Level Security
ALTER TABLE public.network_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_networks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for network_groups: Users can only access their own groups
CREATE POLICY network_groups_user_access ON public.network_groups
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create RLS policy for network_groups: Service role can access all groups
CREATE POLICY network_groups_service_role ON public.network_groups
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create RLS policy for group_networks: Users can only access networks in their groups
CREATE POLICY group_networks_user_access ON public.group_networks
  FOR ALL
  USING (
    group_id IN (
      SELECT id FROM public.network_groups WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.network_groups WHERE user_id = auth.uid()
    )
  );

-- Create RLS policy for group_networks: Service role can access all
CREATE POLICY group_networks_service_role ON public.group_networks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
