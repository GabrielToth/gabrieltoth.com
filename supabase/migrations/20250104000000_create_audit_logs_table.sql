-- Create audit_logs table with the correct schema
-- This migration creates the audit_logs table as specified in the OAuth Google Authentication spec
-- Columns: id (UUID), user_id (UUID FK nullable), event_type (VARCHAR), timestamp (TIMESTAMP), ip_address (VARCHAR), user_agent (TEXT)

-- Drop the existing audit_logs table if it exists (from the initial migration)
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create the new audit_logs table with the correct schema
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create indexes as specified in the requirements
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Additional composite indexes for common query patterns
CREATE INDEX idx_audit_logs_user_event ON audit_logs(user_id, event_type, timestamp DESC);
CREATE INDEX idx_audit_logs_event_timestamp ON audit_logs(event_type, timestamp DESC);

-- Add comments to document the table and columns
COMMENT ON TABLE audit_logs IS 'Audit log table for recording authentication events (login, logout, login_failed, user_created)';
COMMENT ON COLUMN audit_logs.id IS 'Unique identifier for the audit log entry';
COMMENT ON COLUMN audit_logs.user_id IS 'Reference to the user who triggered the event (nullable for failed logins)';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event: login, logout, login_failed, user_created';
COMMENT ON COLUMN audit_logs.timestamp IS 'Timestamp when the event occurred';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the client that triggered the event';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string from the client that triggered the event';
