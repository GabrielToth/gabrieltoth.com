-- Create social_networks table
-- Stores linked social media accounts for users
CREATE TABLE social_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'connected',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_platform UNIQUE(user_id, platform),
  CONSTRAINT valid_platform CHECK (platform IN ('youtube', 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'))
);

-- Create indexes for common queries
CREATE INDEX idx_social_networks_user_id ON social_networks(user_id);
CREATE INDEX idx_social_networks_user_platform ON social_networks(user_id, platform);
CREATE INDEX idx_social_networks_status ON social_networks(status);

-- Enable RLS (Row Level Security)
ALTER TABLE social_networks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own networks
CREATE POLICY "Users can view their own social networks"
  ON social_networks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: users can only insert their own networks
CREATE POLICY "Users can insert their own social networks"
  ON social_networks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only update their own networks
CREATE POLICY "Users can update their own social networks"
  ON social_networks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only delete their own networks
CREATE POLICY "Users can delete their own social networks"
  ON social_networks
  FOR DELETE
  USING (auth.uid() = user_id);
