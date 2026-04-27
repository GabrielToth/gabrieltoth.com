-- Create scheduled_post_networks junction table
-- Maps scheduled posts to target networks (many-to-many relationship)
CREATE TABLE scheduled_post_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  network_id UUID NOT NULL REFERENCES social_networks(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_post_network UNIQUE(post_id, network_id)
);

-- Create indexes for common queries
CREATE INDEX idx_scheduled_post_networks_post_id ON scheduled_post_networks(post_id);
CREATE INDEX idx_scheduled_post_networks_network_id ON scheduled_post_networks(network_id);

-- Enable RLS (Row Level Security)
ALTER TABLE scheduled_post_networks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see networks for their own posts
CREATE POLICY "Users can view networks for their own posts"
  ON scheduled_post_networks
  FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM scheduled_posts WHERE user_id = auth.uid()
    )
  );

-- Create RLS policy: users can only insert networks for their own posts
CREATE POLICY "Users can insert networks for their own posts"
  ON scheduled_post_networks
  FOR INSERT
  WITH CHECK (
    post_id IN (
      SELECT id FROM scheduled_posts WHERE user_id = auth.uid()
    )
    AND network_id IN (
      SELECT id FROM social_networks WHERE user_id = auth.uid()
    )
  );

-- Create RLS policy: users can only delete networks from their own posts
CREATE POLICY "Users can delete networks from their own posts"
  ON scheduled_post_networks
  FOR DELETE
  USING (
    post_id IN (
      SELECT id FROM scheduled_posts WHERE user_id = auth.uid()
    )
  );
