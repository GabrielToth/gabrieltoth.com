-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT token_not_empty CHECK (token != '')
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
-- Composite index for session validation queries (token + expires_at)
CREATE INDEX idx_sessions_token_expires ON sessions(token, expires_at);
-- Partial index for active sessions (common query pattern)
CREATE INDEX idx_sessions_active ON sessions(user_id, expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

-- Create password_reset_tokens table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT token_not_empty CHECK (token != '')
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
-- Composite index for token validation queries (token + expires_at)
CREATE INDEX idx_password_reset_tokens_token_expires ON password_reset_tokens(token, expires_at);
-- Partial index for active tokens (common query pattern)
CREATE INDEX idx_password_reset_tokens_active ON password_reset_tokens(user_id, expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

-- Create email_verification_tokens table
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT token_not_empty CHECK (token != '')
);

CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
-- Composite index for token validation queries (token + expires_at)
CREATE INDEX idx_email_verification_tokens_token_expires ON email_verification_tokens(token, expires_at);
-- Partial index for active tokens (common query pattern)
CREATE INDEX idx_email_verification_tokens_active ON email_verification_tokens(user_id, expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

-- Create login_attempts table
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  ip_address VARCHAR(45) NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT FALSE,
  reason VARCHAR(255)
);

CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at);
-- Composite index for rate limiting queries (email + attempted_at)
CREATE INDEX idx_login_attempts_email_attempted ON login_attempts(email, attempted_at DESC);
-- Partial index for failed attempts (common query pattern)
CREATE INDEX idx_login_attempts_failed ON login_attempts(email, attempted_at DESC) WHERE success = FALSE;

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  ip_address VARCHAR(45),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
-- Composite index for filtering audit logs by user and event type
CREATE INDEX idx_audit_logs_user_event ON audit_logs(user_id, event_type, created_at DESC);
-- Composite index for time-based queries with event type
CREATE INDEX idx_audit_logs_event_created ON audit_logs(event_type, created_at DESC);
