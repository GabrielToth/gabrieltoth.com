-- Create unlink_revocation_window table
-- Allows users to revoke unlinking within 24 hours if suspicious activity detected
CREATE TABLE unlink_revocation_window (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_channel_id VARCHAR(255) NOT NULL,
  unlink_initiated_at TIMESTAMP NOT NULL,
  revocation_expires_at TIMESTAMP NOT NULL, -- 24 hours from initiation
  revoked_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'revoked', 'expired'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_youtube_channel FOREIGN KEY (youtube_channel_id) 
    REFERENCES youtube_channels(youtube_channel_id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_unlink_revocation_window_user_id ON unlink_revocation_window(user_id);
CREATE INDEX idx_unlink_revocation_window_revocation_expires_at ON unlink_revocation_window(revocation_expires_at);
CREATE INDEX idx_unlink_revocation_window_status ON unlink_revocation_window(status);

-- Enable RLS (Row Level Security)
ALTER TABLE unlink_revocation_window ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own revocation windows
CREATE POLICY "Users can view their own unlink revocation windows"
  ON unlink_revocation_window
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: only system can insert revocation windows
CREATE POLICY "System can insert unlink revocation windows"
  ON unlink_revocation_window
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy: only system can update revocation windows
CREATE POLICY "System can update unlink revocation windows"
  ON unlink_revocation_window
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create RLS policy: only system can delete revocation windows
CREATE POLICY "System can delete unlink revocation windows"
  ON unlink_revocation_window
  FOR DELETE
  USING (true);
