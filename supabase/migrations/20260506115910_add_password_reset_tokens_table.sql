-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own reset tokens (for validation)
CREATE POLICY "Users can read own reset tokens"
    ON password_reset_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Service role can manage all tokens (for API routes)
CREATE POLICY "Service role can manage all tokens"
    ON password_reset_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

-- Function to automatically delete expired tokens (cleanup)
CREATE OR REPLACE FUNCTION delete_expired_password_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW();
END;
$$;

-- Create a scheduled job to run cleanup daily (requires pg_cron extension)
-- Note: This requires pg_cron extension to be enabled in Supabase
-- You can enable it in: Database > Extensions > pg_cron
-- Uncomment the following lines after enabling pg_cron:

-- SELECT cron.schedule(
--     'delete-expired-password-reset-tokens',
--     '0 0 * * *', -- Run daily at midnight
--     $$SELECT delete_expired_password_reset_tokens()$$
-- );

-- Add comment to table
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for user password recovery';
COMMENT ON COLUMN password_reset_tokens.token IS 'Unique reset token sent via email';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration timestamp (typically 1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when token was used (null if not used yet)';
