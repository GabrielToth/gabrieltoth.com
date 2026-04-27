-- Create publication_history table
-- Records all published posts with status and external references
CREATE TABLE publication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES scheduled_posts(id) ON DELETE SET NULL,
  network_id UUID NOT NULL REFERENCES social_networks(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  external_id VARCHAR(255),
  external_url TEXT,
  error_message TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'success', 'failed', 'retrying'))
);

-- Create indexes for common queries
CREATE INDEX idx_publication_history_user_id ON publication_history(user_id);
CREATE INDEX idx_publication_history_post_id ON publication_history(post_id);
CREATE INDEX idx_publication_history_network_id ON publication_history(network_id);
CREATE INDEX idx_publication_history_status ON publication_history(status);
CREATE INDEX idx_publication_history_user_published_at ON publication_history(user_id, published_at);
CREATE INDEX idx_publication_history_published_at ON publication_history(published_at);

-- Enable RLS (Row Level Security)
ALTER TABLE publication_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own publication history
CREATE POLICY "Users can view their own publication history"
  ON publication_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: users can only insert their own publication history
CREATE POLICY "Users can insert their own publication history"
  ON publication_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only update their own publication history
CREATE POLICY "Users can update their own publication history"
  ON publication_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only delete their own publication history
CREATE POLICY "Users can delete their own publication history"
  ON publication_history
  FOR DELETE
  USING (auth.uid() = user_id);
