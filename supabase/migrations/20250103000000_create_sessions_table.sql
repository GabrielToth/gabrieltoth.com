-- Create sessions table with session_id column
-- This migration creates the sessions table as specified in the OAuth Google Authentication spec
-- Columns: id (UUID), user_id (UUID FK), session_id (VARCHAR unique), created_at (TIMESTAMP), expires_at (TIMESTAMP)

-- Note: The sessions table was already created in the initial migration with a 'token' column.
-- This migration renames 'token' to 'session_id' to match the specification.

-- Drop the old composite indexes that reference the 'token' column
DROP INDEX IF EXISTS idx_sessions_token_expires;
DROP INDEX IF EXISTS idx_sessions_active;
DROP INDEX IF EXISTS idx_sessions_token;

-- Rename the 'token' column to 'session_id'
ALTER TABLE sessions
RENAME COLUMN token TO session_id;

-- Recreate the indexes with the new column name
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Composite index for session validation queries (session_id + expires_at)
CREATE INDEX idx_sessions_session_id_expires ON sessions(session_id, expires_at);

-- Partial index for active sessions (common query pattern)
CREATE INDEX idx_sessions_active_sessions ON sessions(user_id, expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

-- Add comment to document the session_id column
COMMENT ON COLUMN sessions.session_id IS 'Unique session identifier for HTTP-Only cookie';
