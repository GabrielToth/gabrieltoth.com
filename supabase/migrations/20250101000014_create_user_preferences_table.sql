-- Create user_preferences table
-- Stores user preferences for timezone, default networks, and notification settings
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone VARCHAR(100) DEFAULT 'UTC',
  default_networks JSONB DEFAULT '[]',
  notification_enabled BOOLEAN DEFAULT TRUE,
  notification_on_success BOOLEAN DEFAULT TRUE,
  notification_on_failure BOOLEAN DEFAULT TRUE,
  auto_retry_enabled BOOLEAN DEFAULT TRUE,
  max_retry_attempts INTEGER DEFAULT 3,
  retry_backoff_ms INTEGER DEFAULT 2000,
  default_visibility VARCHAR(50) DEFAULT 'public',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: users can only insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only delete their own preferences
CREATE POLICY "Users can delete their own preferences"
  ON user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);
