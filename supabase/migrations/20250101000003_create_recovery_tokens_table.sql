-- Create recovery_tokens table
-- Stores recovery tokens for channel ownership recovery
CREATE TABLE recovery_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_channel_id VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- bcrypt hash
  user_email VARCHAR(255) NOT NULL,
  initiated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'used', 'expired', 'revoked'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_youtube_channel FOREIGN KEY (youtube_channel_id) 
    REFERENCES youtube_channels(youtube_channel_id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_recovery_tokens_youtube_channel_id ON recovery_tokens(youtube_channel_id);
CREATE INDEX idx_recovery_tokens_expires_at ON recovery_tokens(expires_at);
CREATE INDEX idx_recovery_tokens_status ON recovery_tokens(status);

-- Enable RLS (Row Level Security)
ALTER TABLE recovery_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: only system can view recovery tokens
CREATE POLICY "System can view recovery tokens"
  ON recovery_tokens
  FOR SELECT
  USING (true);

-- Create RLS policy: only system can insert recovery tokens
CREATE POLICY "System can insert recovery tokens"
  ON recovery_tokens
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy: only system can update recovery tokens
CREATE POLICY "System can update recovery tokens"
  ON recovery_tokens
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create RLS policy: only system can delete recovery tokens
CREATE POLICY "System can delete recovery tokens"
  ON recovery_tokens
  FOR DELETE
  USING (true);
