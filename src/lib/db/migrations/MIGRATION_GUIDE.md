# Database Migration Guide

## Overview

This directory contains database migrations for the platform. Migrations are SQL files that modify the database schema incrementally.

## Migration Files

### 001_create_auth_tables.sql

**Purpose**: Creates the initial authentication tables for email/password registration

**Tables Created**:
- `auth_users` - Stores user account information for email/password authentication
- `email_verification_tokens` - Stores verification tokens for email confirmation
- `registration_sessions` - Stores registration session data for multi-step forms
- `audit_logs` - Stores audit logs for account creation, email verification, and failed attempts

**Status**: Applied

### 002_add_account_completion_fields.sql

**Purpose**: Adds account completion fields to support legacy OAuth users who need to complete their account setup

**Changes to `users` table**:
- `password_hash VARCHAR(255)` - Hashed password for account security
- `phone_number VARCHAR(20)` - User's contact phone number
- `birth_date DATE` - User's date of birth
- `account_completion_status VARCHAR(20) DEFAULT 'pending'` - Tracks completion status (pending, in_progress, completed)
- `account_completed_at TIMESTAMP WITH TIME ZONE` - Timestamp when account was completed
- `email VARCHAR(255)` - User's email address
- `oauth_provider VARCHAR(20)` - OAuth provider (google, facebook, tiktok)
- `oauth_id VARCHAR(255)` - OAuth provider's user ID
- `name VARCHAR(255)` - User's full name
- `picture VARCHAR(255)` - User's profile picture URL
- `email_verified BOOLEAN DEFAULT FALSE` - Email verification status

**Indexes Created**:
- `idx_users_account_completion_status` - For efficient querying by completion status
- `idx_users_email` - For email lookups
- `idx_users_oauth_provider_id` - For OAuth provider lookups

**Tables Created**:
- `temp_tokens` - Stores temporary tokens for account completion flow
  - `id UUID PRIMARY KEY` - Token ID
  - `user_id UUID` - Reference to user
  - `token_hash VARCHAR(255) UNIQUE` - Hashed token value
  - `oauth_provider VARCHAR(20)` - OAuth provider
  - `oauth_id VARCHAR(255)` - OAuth provider's user ID
  - `email VARCHAR(255)` - User's email
  - `name VARCHAR(255)` - User's name
  - `picture TEXT` - User's profile picture
  - `created_at TIMESTAMP WITH TIME ZONE` - Token creation time
  - `expires_at TIMESTAMP WITH TIME ZONE` - Token expiration time
  - `used_at TIMESTAMP WITH TIME ZONE` - When token was used

**Indexes on temp_tokens**:
- `idx_temp_tokens_expires_at` - For cleanup of expired tokens
- `idx_temp_tokens_user_id` - For user lookups
- `idx_temp_tokens_token_hash` - For token lookups

**Status**: Applied

**Rollback**: Use `002_add_account_completion_fields_rollback.sql`

## How to Apply Migrations

### Local Development

1. **Start Docker containers**:
   ```bash
   docker-compose up -d
   ```

2. **Apply migrations manually**:
   ```bash
   psql -U platform -d platform_test -f src/lib/db/migrations/001_create_auth_tables.sql
   psql -U platform -d platform_test -f src/lib/db/migrations/002_add_account_completion_fields.sql
   ```

3. **Or use the schema test**:
   ```bash
   npm run test -- src/lib/db/schema.test.ts
   ```

### Production

For production deployments, use your database migration tool (e.g., Supabase, Flyway, Liquibase).

## How to Rollback Migrations

### Local Development

1. **Rollback the latest migration**:
   ```bash
   psql -U platform -d platform_test -f src/lib/db/migrations/002_add_account_completion_fields_rollback.sql
   ```

2. **Verify rollback**:
   ```bash
   psql -U platform -d platform_test -c "\d users"
   ```

### Production

Contact your database administrator or use your migration tool's rollback feature.

## Testing Migrations

### Run Migration Tests

```bash
npm run test -- src/lib/db/migrations/002_add_account_completion_fields.test.ts
```

### Manual Testing

1. **Apply migration**:
   ```bash
   psql -U platform -d platform_test -f src/lib/db/migrations/002_add_account_completion_fields.sql
   ```

2. **Verify columns exist**:
   ```bash
   psql -U platform -d platform_test -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;"
   ```

3. **Verify indexes exist**:
   ```bash
   psql -U platform -d platform_test -c "SELECT indexname FROM pg_indexes WHERE tablename = 'users';"
   ```

4. **Test insert with new columns**:
   ```sql
   INSERT INTO users (
       id, google_id, google_email, google_name,
       email, password_hash, phone_number, birth_date,
       account_completion_status, oauth_provider, oauth_id, name, email_verified
   ) VALUES (
       gen_random_uuid(), 'google-123', 'test@example.com', 'Test User',
       'test@example.com', '$2b$12$hash', '+1234567890', '1990-01-01',
       'completed', 'google', 'google-123', 'Test User', true
   );
   ```

5. **Rollback migration**:
   ```bash
   psql -U platform -d platform_test -f src/lib/db/migrations/002_add_account_completion_fields_rollback.sql
   ```

## Migration Best Practices

1. **Always test migrations locally first** before applying to production
2. **Keep migrations small and focused** on a single feature or change
3. **Use IF NOT EXISTS and IF EXISTS** to make migrations idempotent
4. **Create indexes for frequently queried columns** to improve performance
5. **Document the purpose and changes** in migration files
6. **Create rollback migrations** for all forward migrations
7. **Test rollback migrations** to ensure they work correctly
8. **Use transactions** when possible to ensure atomicity
9. **Monitor migration performance** on large tables
10. **Backup database** before applying migrations to production

## Troubleshooting

### Migration fails with "column already exists"

This usually means the migration was already applied. Check the current schema:

```bash
psql -U platform -d platform_test -c "\d users"
```

### Migration fails with "permission denied"

Ensure you have the correct database user and permissions:

```bash
psql -U platform -d platform_test -c "SELECT current_user;"
```

### Rollback fails with "cannot drop column"

This usually means there are dependent objects (like indexes or constraints). The rollback migration should handle this with CASCADE.

### Performance issues after migration

If queries are slow after migration, rebuild indexes:

```bash
psql -U platform -d platform_test -c "REINDEX TABLE users;"
```

## References

- [PostgreSQL ALTER TABLE Documentation](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL CREATE INDEX Documentation](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PostgreSQL Constraints Documentation](https://www.postgresql.org/docs/current/ddl-constraints.html)
