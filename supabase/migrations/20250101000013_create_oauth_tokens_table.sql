-- Create oauth_tokens table
-- Stores encrypted OAuth tokens for each network with expiration tracking
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  network_id UUID NOT NULL REFERENCES social_networks(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- AES-256 encrypted
  refresh_token TEXT, -- AES-256 encrypted
  expires_at TIMESTAMP,
  scope TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_network_token UNIQUE(user_id, network_id)
);

-- Create indexes for common queries
CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_network_id ON oauth_tokens(network_id);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_user_network ON oauth_tokens(user_id, network_id);

-- Enable RLS (Row Level Security)
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own tokens
CREATE POLICY "Users can view their own OAuth tokens"
  ON oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: users can only insert their own tokens
CREATE POLICY "Users can insert their own OAuth tokens"
  ON oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only update their own tokens
CREATE POLICY "Users can update their own OAuth tokens"
  ON oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only delete their own tokens
CREATE POLICY "Users can delete their own OAuth tokens"
  ON oauth_tokens
  FOR DELETE
  USING (auth.uid() = user_id);
