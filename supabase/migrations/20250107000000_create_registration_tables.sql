-- Create registration_sessions table for session persistence
CREATE TABLE registration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  CONSTRAINT session_id_not_empty CHECK (session_id != ''),
  CONSTRAINT valid_step CHECK (current_step >= 1 AND current_step <= 4)
);

CREATE INDEX idx_registration_sessions_session_id ON registration_sessions(session_id);
CREATE INDEX idx_registration_sessions_email ON registration_sessions(email);
CREATE INDEX idx_registration_sessions_expires_at ON registration_sessions(expires_at);
-- Composite index for session validation queries (session_id + expires_at)
CREATE INDEX idx_registration_sessions_session_expires ON registration_sessions(session_id, expires_at);
-- Partial index for active sessions (common query pattern)
CREATE INDEX idx_registration_sessions_active ON registration_sessions(session_id, expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

-- Add phone column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add email_verified column if it doesn't exist (it should already exist from initial schema)
-- This is a safety check in case the initial migration didn't include it
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update email_verification_tokens table to include email field for reference
ALTER TABLE email_verification_tokens ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create composite index for email verification token queries
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email_expires ON email_verification_tokens(email, expires_at);

-- Add comment to document the registration_sessions table
COMMENT ON TABLE registration_sessions IS 'Stores temporary registration session data during multi-step registration process. Sessions expire after 30 minutes of inactivity.';
COMMENT ON COLUMN registration_sessions.session_id IS 'Unique session identifier for the registration flow';
COMMENT ON COLUMN registration_sessions.email IS 'Email address being registered';
COMMENT ON COLUMN registration_sessions.name IS 'Full name provided during registration';
COMMENT ON COLUMN registration_sessions.phone IS 'Phone number provided during registration';
COMMENT ON COLUMN registration_sessions.current_step IS 'Current step in the registration flow (1-4)';
COMMENT ON COLUMN registration_sessions.expires_at IS 'Timestamp when the session expires (30 minutes from creation)';
