-- Create linking_activity table
-- Tracks all linking and unlinking activities with device/location information
CREATE TABLE linking_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_channel_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'link', 'unlink', 'recovery_attempt', 'suspicious_detected'
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  country VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_suspicious BOOLEAN DEFAULT FALSE,
  suspicious_reason VARCHAR(255),
  status VARCHAR(50), -- 'pending', 'completed', 'failed', 'blocked'
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_youtube_channel FOREIGN KEY (youtube_channel_id) 
    REFERENCES youtube_channels(youtube_channel_id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_linking_activity_user_id ON linking_activity(user_id);
CREATE INDEX idx_linking_activity_youtube_channel_id ON linking_activity(youtube_channel_id);
CREATE INDEX idx_linking_activity_created_at ON linking_activity(created_at);
CREATE INDEX idx_linking_activity_is_suspicious ON linking_activity(is_suspicious);

-- Enable RLS (Row Level Security)
ALTER TABLE linking_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own activity
CREATE POLICY "Users can view their own linking activity"
  ON linking_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: only system can insert activity records
CREATE POLICY "System can insert linking activity"
  ON linking_activity
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy: activity records cannot be updated
CREATE POLICY "Linking activity records are immutable"
  ON linking_activity
  FOR UPDATE
  USING (false);

-- Create RLS policy: activity records cannot be deleted
CREATE POLICY "Linking activity records cannot be deleted"
  ON linking_activity
  FOR DELETE
  USING (false);
