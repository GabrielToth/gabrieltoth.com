# Authentication Database Schema

## Overview

This document describes the database schema for the unified authentication system.

## Tables

### Users Table

Stores user account information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_active ON users(is_active);
```

**Columns:**
- `id`: Unique user identifier (UUID)
- `email`: User email address (unique)
- `email_verified`: Whether email has been verified
- `password_hash`: Hashed password (bcrypt)
- `first_name`: User's first name
- `last_name`: User's last name
- `avatar_url`: Profile picture URL
- `phone_number`: User's phone number
- `birth_date`: User's date of birth
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp
- `last_login_at`: Last login timestamp
- `is_active`: Whether account is active
- `is_deleted`: Soft delete flag

### Sessions Table

Stores user session information.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

**Columns:**
- `id`: Unique session identifier
- `user_id`: Reference to users table
- `token`: Session token
- `refresh_token`: Refresh token for token renewal
- `expires_at`: Session expiration timestamp
- `created_at`: Session creation timestamp
- `updated_at`: Last update timestamp
- `ip_address`: IP address of session creator
- `user_agent`: Browser/client user agent
- `is_active`: Whether session is active

### Email Verification Tokens Table

Stores email verification tokens.

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_used BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
```

**Columns:**
- `id`: Unique token identifier
- `user_id`: Reference to users table
- `token`: Verification token
- `expires_at`: Token expiration timestamp
- `created_at`: Token creation timestamp
- `is_used`: Whether token has been used

### Password Reset Tokens Table

Stores password reset tokens.

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_used BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

**Columns:**
- `id`: Unique token identifier
- `user_id`: Reference to users table
- `token`: Reset token
- `expires_at`: Token expiration timestamp
- `created_at`: Token creation timestamp
- `is_used`: Whether token has been used

### Login Attempts Table

Tracks login attempts for rate limiting and security.

```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);
```

**Columns:**
- `id`: Unique attempt identifier
- `email`: Email address attempted
- `ip_address`: IP address of attempt
- `success`: Whether attempt was successful
- `created_at`: Attempt timestamp

### OAuth Accounts Table

Stores OAuth provider connections.

```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Indexes
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider);
```

**Columns:**
- `id`: Unique OAuth account identifier
- `user_id`: Reference to users table
- `provider`: OAuth provider name (google, github, etc.)
- `provider_user_id`: User ID from OAuth provider
- `provider_email`: Email from OAuth provider
- `access_token`: OAuth access token
- `refresh_token`: OAuth refresh token
- `token_expires_at`: Token expiration timestamp
- `created_at`: Connection creation timestamp
- `updated_at`: Last update timestamp

### Registration Sessions Table

Stores incomplete registration sessions.

```sql
CREATE TABLE registration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  step TEXT NOT NULL,
  data JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_registration_sessions_email ON registration_sessions(email);
CREATE INDEX idx_registration_sessions_expires_at ON registration_sessions(expires_at);
```

**Columns:**
- `id`: Unique session identifier
- `email`: Email being registered
- `step`: Current registration step
- `data`: Session data (JSON)
- `expires_at`: Session expiration timestamp
- `created_at`: Session creation timestamp
- `updated_at`: Last update timestamp

### Audit Logs Table

Tracks authentication-related events for security auditing.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**Columns:**
- `id`: Unique log entry identifier
- `user_id`: Reference to users table
- `event_type`: Type of event (login, logout, signup, etc.)
- `event_data`: Event details (JSON)
- `ip_address`: IP address of event
- `user_agent`: Browser/client user agent
- `created_at`: Event timestamp

## Row Level Security (RLS)

### Users Table RLS Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Service role can manage all users
CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (auth.role() = 'service_role');
```

### Sessions Table RLS Policies

```sql
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all sessions
CREATE POLICY "Service role can manage sessions" ON sessions
  FOR ALL USING (auth.role() = 'service_role');
```

### Email Verification Tokens RLS Policies

```sql
-- Users can view their own tokens
CREATE POLICY "Users can view own tokens" ON email_verification_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all tokens
CREATE POLICY "Service role can manage tokens" ON email_verification_tokens
  FOR ALL USING (auth.role() = 'service_role');
```

### Password Reset Tokens RLS Policies

```sql
-- Users can view their own tokens
CREATE POLICY "Users can view own tokens" ON password_reset_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all tokens
CREATE POLICY "Service role can manage tokens" ON password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');
```

### Login Attempts RLS Policies

```sql
-- Service role can manage login attempts
CREATE POLICY "Service role can manage attempts" ON login_attempts
  FOR ALL USING (auth.role() = 'service_role');
```

### OAuth Accounts RLS Policies

```sql
-- Users can view their own OAuth accounts
CREATE POLICY "Users can view own accounts" ON oauth_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can delete their own OAuth accounts
CREATE POLICY "Users can delete own accounts" ON oauth_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all accounts
CREATE POLICY "Service role can manage accounts" ON oauth_accounts
  FOR ALL USING (auth.role() = 'service_role');
```

### Audit Logs RLS Policies

```sql
-- Users can view their own audit logs
CREATE POLICY "Users can view own logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all logs
CREATE POLICY "Service role can manage logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');
```

## Migrations

### Create Schema Migration

```bash
npx supabase migration new create_auth_schema
```

### Apply Migrations

```bash
npx supabase db push
```

### Generate TypeScript Types

```bash
npx supabase gen types typescript --local > src/types/supabase.ts
```

## Data Retention

### Session Cleanup
- Sessions expire after 30 days
- Automatic cleanup job runs daily
- Expired sessions are deleted

### Token Cleanup
- Email verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Automatic cleanup job runs hourly

### Login Attempts Cleanup
- Login attempts older than 24 hours are deleted
- Automatic cleanup job runs daily

### Audit Logs Retention
- Audit logs retained for 90 days
- Automatic archival after 30 days
- Automatic deletion after 90 days

## Backup and Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery available
- Backups stored in multiple regions

### Recovery Procedures
1. Identify backup point
2. Restore from backup
3. Verify data integrity
4. Update application

## Performance Optimization

### Indexes
- Email index for fast lookups
- User ID indexes for foreign key queries
- Timestamp indexes for range queries
- Token indexes for verification

### Query Optimization
- Use prepared statements
- Batch operations when possible
- Avoid N+1 queries
- Use connection pooling

### Caching Strategy
- Cache user profiles (5 minutes)
- Cache session data (1 minute)
- Cache OAuth tokens (until expiry)
- Invalidate on updates

## Monitoring

### Key Metrics
- Failed login attempts
- Session creation rate
- Token generation rate
- Database query performance
- Storage usage

### Alerts
- High failed login rate
- Unusual session activity
- Token generation spikes
- Database performance degradation
- Storage capacity warnings

## Compliance

### GDPR
- User data deletion on request
- Data export functionality
- Consent tracking
- Privacy policy compliance

### CCPA
- User data access rights
- Data deletion rights
- Opt-out functionality
- Privacy policy compliance

### SOC 2
- Access controls
- Encryption at rest and in transit
- Audit logging
- Incident response procedures
