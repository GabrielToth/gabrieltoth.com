-- Create scheduled_posts table
-- Stores scheduled posts with content and metadata
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'cancelled'))
);

-- Create indexes for common queries
CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_user_scheduled_time ON scheduled_posts(user_id, scheduled_time);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);

-- Enable RLS (Row Level Security)
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own posts
CREATE POLICY "Users can view their own scheduled posts"
  ON scheduled_posts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: users can only insert their own posts
CREATE POLICY "Users can insert their own scheduled posts"
  ON scheduled_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only update their own posts
CREATE POLICY "Users can update their own scheduled posts"
  ON scheduled_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only delete their own posts
CREATE POLICY "Users can delete their own scheduled posts"
  ON scheduled_posts
  FOR DELETE
  USING (auth.uid() = user_id);
