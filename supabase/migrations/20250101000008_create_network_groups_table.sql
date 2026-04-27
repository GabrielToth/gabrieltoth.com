-- Create network_groups table
-- Stores user-defined groups of social networks
CREATE TABLE network_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_group_name_per_user UNIQUE(user_id, name)
);

-- Create indexes for common queries
CREATE INDEX idx_network_groups_user_id ON network_groups(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE network_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own groups
CREATE POLICY "Users can view their own network groups"
  ON network_groups
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: users can only insert their own groups
CREATE POLICY "Users can insert their own network groups"
  ON network_groups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only update their own groups
CREATE POLICY "Users can update their own network groups"
  ON network_groups
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only delete their own groups
CREATE POLICY "Users can delete their own network groups"
  ON network_groups
  FOR DELETE
  USING (auth.uid() = user_id);
