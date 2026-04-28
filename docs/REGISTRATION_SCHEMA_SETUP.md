# Registration Flow Database Schema Setup

## Overview

This document describes the database schema setup for the Registration Flow Redesign feature. The schema supports both email/password and Google OAuth authentication paths with session persistence and audit logging.

## Database Schema

### Users Table

The `users` table stores user account information with support for multiple authentication methods.

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE NOT NULL | User email address (RFC 5322 format) |
| `password_hash` | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| `name` | VARCHAR(255) | NOT NULL | User full name |
| `phone` | VARCHAR(20) | - | User phone number (international format) |
| `birth_date` | DATE | - | User birth date (minimum 13 years old) |
| `auth_method` | VARCHAR(50) | CHECK | Authentication method (email, google, facebook, tiktok) |
| `email_verified` | BOOLEAN | DEFAULT FALSE | Email verification status |
| `oauth_provider` | VARCHAR(50) | CHECK | OAuth provider (google, facebook, tiktok) |
| `oauth_id` | VARCHAR(255) | UNIQUE (partial) | OAuth provider unique identifier |
| `google_id` | VARCHAR(255) | UNIQUE | Google OAuth ID (legacy) |
| `google_email` | VARCHAR(255) | - | Google OAuth email (legacy) |
| `google_name` | VARCHAR(255) | - | Google OAuth name (legacy) |
| `google_picture` | VARCHAR(255) | - | Google OAuth picture URL (legacy) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| `last_login` | TIMESTAMP | - | Last login timestamp |

#### Constraints

- **Email Format**: RFC 5322 standard validation
- **Birth Date**: Must not be in the future
- **Age Verification**: User must be at least 13 years old
- **Auth Method**: Must be one of: email, google, facebook, tiktok
- **OAuth Provider**: Must be one of: google, facebook, tiktok
- **OAuth ID**: Unique constraint only when not NULL (partial index)

#### Indexes

| Index Name | Columns | Type | Purpose |
|-----------|---------|------|---------|
| `idx_users_email` | email | Standard | Fast email lookups |
| `idx_users_birth_date` | birth_date | Standard | Age-based queries |
| `idx_users_auth_method` | auth_method | Standard | Filter by authentication method |
| `idx_users_email_auth_method` | email, auth_method | Composite | Combined email + auth method queries |
| `idx_users_oauth_provider` | oauth_provider | Standard | Filter by OAuth provider |
| `idx_users_oauth_id` | oauth_id | Partial | OAuth ID lookups (only non-NULL values) |
| `idx_users_google_id` | google_id | Standard | Legacy Google OAuth lookups |
| `idx_users_google_email` | google_email | Standard | Legacy Google email lookups |

### Registration Sessions Table

The `registration_sessions` table stores temporary session data during the multi-step registration process.

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique session identifier |
| `session_id` | VARCHAR(255) | UNIQUE NOT NULL | HTTP-only cookie session ID |
| `email` | VARCHAR(255) | NOT NULL | Email being registered |
| `name` | VARCHAR(255) | - | Full name provided during registration |
| `phone` | VARCHAR(20) | - | Phone number provided during registration |
| `current_step` | INTEGER | DEFAULT 1, CHECK (1-4) | Current registration step |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Session creation timestamp |
| `expires_at` | TIMESTAMP | NOT NULL | Session expiration timestamp (30 minutes) |

#### Constraints

- **Session ID**: Must not be empty
- **Current Step**: Must be between 1 and 4
- **Expiration**: Sessions expire after 30 minutes of inactivity

#### Indexes

| Index Name | Columns | Type | Purpose |
|-----------|---------|------|---------|
| `idx_registration_sessions_session_id` | session_id | Standard | Fast session lookups |
| `idx_registration_sessions_email` | email | Standard | Email-based session queries |
| `idx_registration_sessions_expires_at` | expires_at | Standard | Cleanup of expired sessions |
| `idx_registration_sessions_session_expires` | session_id, expires_at | Composite | Session validation queries |
| `idx_registration_sessions_active` | session_id, expires_at | Partial | Active sessions only |

### Related Tables

#### Sessions Table
Stores user authentication sessions after account creation.

- **Columns**: id, user_id (FK), session_id, expires_at, created_at
- **Indexes**: user_id, session_id, expires_at, composite indexes

#### Email Verification Tokens Table
Stores email verification tokens for account confirmation.

- **Columns**: id, user_id (FK), token, email, expires_at, created_at
- **Indexes**: user_id, token, expires_at, email, composite indexes

#### Audit Logs Table
Stores audit trail of registration and authentication events.

- **Columns**: id, user_id (FK), event_type, email, ip_address, details (JSONB), created_at
- **Indexes**: user_id, event_type, created_at, composite indexes

#### Login Attempts Table
Stores login attempt history for rate limiting and security monitoring.

- **Columns**: id, user_id (FK), email, ip_address, attempted_at, success, reason
- **Indexes**: user_id, email, ip_address, attempted_at, composite indexes

## Migrations

### Migration Files

1. **20250101000000_create_auth_schema.sql**
   - Creates initial users, sessions, password_reset_tokens, email_verification_tokens, login_attempts, and audit_logs tables
   - Sets up basic indexes and constraints

2. **20250102000000_add_google_oauth_to_users.sql**
   - Adds Google OAuth columns (google_id, google_email, google_name, google_picture)
   - Creates indexes for Google OAuth lookups

3. **20250103000000_create_sessions_table.sql**
   - Renames sessions.token to sessions.session_id
   - Updates indexes for session_id column

4. **20250104000000_create_audit_logs_table.sql**
   - Creates audit_logs table (already in initial migration)

5. **20250105000000_add_oauth_columns_nullable.sql**
   - Adds unified OAuth columns (oauth_provider, oauth_id)
   - Creates indexes for OAuth provider queries

6. **20250106000000_populate_oauth_from_google.sql**
   - Migrates existing Google OAuth users to unified OAuth schema
   - Populates oauth_provider and oauth_id from legacy google_* columns

7. **20250107000000_create_registration_tables.sql**
   - Creates registration_sessions table for session persistence
   - Adds phone column to users table
   - Adds email column to email_verification_tokens table

8. **20250108000000_add_registration_fields_to_users.sql** (NEW)
   - Adds birth_date column for age verification
   - Adds auth_method column to track authentication method
   - Creates indexes for birth_date and auth_method queries
   - Adds constraints for birth date validation and age verification
   - Populates auth_method for existing users

## Data Validation

### Email Validation
- Format: RFC 5322 standard
- Uniqueness: Enforced at database level
- Constraint: CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}')

### Password Validation
- Hashing: bcrypt with cost factor ≥ 10
- Storage: password_hash column (never plain text)
- Requirements: 8+ characters, uppercase, number, special character

### Birth Date Validation
- Format: DATE type (stored as YYYY-MM-DD)
- Constraints:
  - Must not be in the future: `birth_date <= CURRENT_DATE`
  - Minimum age 13 years: `EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) >= 13`

### Phone Number Validation
- Format: International format (E.164 standard)
- Storage: VARCHAR(20) to accommodate international numbers
- Normalization: Stored in E.164 format (+1234567890)

### Authentication Method
- Allowed values: email, google, facebook, tiktok
- Populated during registration based on authentication path
- Used for filtering and analytics

## Session Management

### Registration Sessions
- **Duration**: 30 minutes from creation
- **Storage**: HTTP-only cookies (not accessible to JavaScript)
- **Expiration**: Automatic cleanup of expired sessions
- **Data**: Email, name, phone, current step

### User Sessions
- **Duration**: Configurable (default 1 hour)
- **Storage**: HTTP-only cookies
- **Refresh**: Automatic token refresh
- **Cleanup**: Automatic removal of expired sessions

## Security Considerations

### Password Security
- Hashed using bcrypt with cost factor ≥ 10
- Never stored in plain text
- Never logged or displayed
- Transmitted over HTTPS only

### Session Security
- HTTP-only cookies (no JavaScript access)
- Secure flag set (HTTPS only)
- SameSite attribute set (CSRF protection)
- Session ID regeneration after login

### Data Protection
- All sensitive data transmitted over HTTPS
- Rate limiting on registration endpoints
- Audit logging of all registration events
- Email verification for account confirmation

## Performance Optimization

### Indexes
- Email index for fast uniqueness checks
- Session ID index for fast session lookups
- Birth date index for age-based queries
- Auth method index for filtering by authentication method
- Composite indexes for common query patterns
- Partial indexes for active sessions only

### Query Optimization
- Email uniqueness check: < 500ms
- Session validation: < 100ms
- User lookup by email: < 100ms
- Active sessions query: < 100ms (partial index)

## Deployment Checklist

- [ ] Run migrations: `npx supabase db push`
- [ ] Verify schema: `npx supabase db pull`
- [ ] Test email validation
- [ ] Test birth date validation
- [ ] Test age verification
- [ ] Test phone number validation
- [ ] Test session creation and expiration
- [ ] Test authentication method tracking
- [ ] Verify indexes are created
- [ ] Verify constraints are enforced
- [ ] Test with sample data
- [ ] Verify audit logging
- [ ] Performance test queries

## Troubleshooting

### Migration Failures

**Issue**: Constraint already exists
- **Solution**: Use `IF NOT EXISTS` clause or drop existing constraint first

**Issue**: Column already exists
- **Solution**: Use `IF NOT EXISTS` clause in ALTER TABLE

**Issue**: Index already exists
- **Solution**: Use `IF NOT EXISTS` clause in CREATE INDEX

### Data Issues

**Issue**: Existing users without auth_method
- **Solution**: Migration automatically populates auth_method based on password_hash and oauth_provider

**Issue**: Invalid birth dates
- **Solution**: Constraint prevents future dates and enforces minimum age of 13

**Issue**: Session expiration not working
- **Solution**: Verify expires_at timestamp is set correctly (current_time + 30 minutes)

## References

- [Requirements Document](../specs/registration-flow-redesign/requirements.md)
- [Design Document](../specs/registration-flow-redesign/design.md)
- [Database Constraints](DATABASE_CONSTRAINTS.md)
- [API Documentation](API_REGISTRATION.md)
