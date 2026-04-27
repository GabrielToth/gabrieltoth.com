-- Create group_networks junction table
-- Maps networks to groups (many-to-many relationship)
CREATE TABLE group_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES network_groups(id) ON DELETE CASCADE,
  network_id UUID NOT NULL REFERENCES social_networks(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_group_network UNIQUE(group_id, network_id)
);

-- Create indexes for common queries
CREATE INDEX idx_group_networks_group_id ON group_networks(group_id);
CREATE INDEX idx_group_networks_network_id ON group_networks(network_id);

-- Enable RLS (Row Level Security)
ALTER TABLE group_networks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see networks in their own groups
CREATE POLICY "Users can view networks in their own groups"
  ON group_networks
  FOR SELECT
  USING (
    group_id IN (
      SELECT id FROM network_groups WHERE user_id = auth.uid()
    )
  );

-- Create RLS policy: users can only insert networks into their own groups
CREATE POLICY "Users can insert networks into their own groups"
  ON group_networks
  FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT id FROM network_groups WHERE user_id = auth.uid()
    )
    AND network_id IN (
      SELECT id FROM social_networks WHERE user_id = auth.uid()
    )
  );

-- Create RLS policy: users can only delete networks from their own groups
CREATE POLICY "Users can delete networks from their own groups"
  ON group_networks
  FOR DELETE
  USING (
    group_id IN (
      SELECT id FROM network_groups WHERE user_id = auth.uid()
    )
  );
