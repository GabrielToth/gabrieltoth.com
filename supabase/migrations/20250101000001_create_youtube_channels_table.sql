-- Create youtube_channels table
-- Stores YouTube channel information linked to users
CREATE TABLE youtube_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_channel_id VARCHAR(255) NOT NULL UNIQUE,
  channel_name VARCHAR(255) NOT NULL,
  channel_description TEXT,
  custom_url VARCHAR(255),
  subscriber_count INTEGER,
  access_token TEXT NOT NULL, -- AES-256 encrypted
  refresh_token TEXT, -- AES-256 encrypted
  token_expires_at TIMESTAMP,
  linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_channel_per_user UNIQUE(user_id, youtube_channel_id),
  CONSTRAINT unique_youtube_channel UNIQUE(youtube_channel_id)
);

-- Create indexes for common queries
CREATE INDEX idx_youtube_channels_user_id ON youtube_channels(user_id);
CREATE INDEX idx_youtube_channels_youtube_channel_id ON youtube_channels(youtube_channel_id);
CREATE INDEX idx_youtube_channels_is_active ON youtube_channels(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own channels
CREATE POLICY "Users can view their own YouTube channels"
  ON youtube_channels
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: users can only insert their own channels
CREATE POLICY "Users can insert their own YouTube channels"
  ON youtube_channels
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only update their own channels
CREATE POLICY "Users can update their own YouTube channels"
  ON youtube_channels
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only delete their own channels
CREATE POLICY "Users can delete their own YouTube channels"
  ON youtube_channels
  FOR DELETE
  USING (auth.uid() = user_id);
