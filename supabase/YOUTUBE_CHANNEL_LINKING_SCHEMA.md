# YouTube Channel Linking Database Schema

This document describes the database schema for the YouTube Channel Linking feature.

## Overview

The YouTube Channel Linking feature enables users to securely link their YouTube channels to their platform accounts. The database schema supports:

- Secure storage of YouTube channel information and OAuth tokens
- Tracking of linking/unlinking activities with device and location information
- Recovery mechanisms for channel ownership disputes
- Comprehensive audit trails for compliance
- Unlink revocation windows for suspicious activity protection

## Tables

### 1. youtube_channels

Stores YouTube channel information linked to users.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users, NOT NULL
- `youtube_channel_id` (VARCHAR 255): YouTube channel ID, UNIQUE, NOT NULL
- `channel_name` (VARCHAR 255): Channel name, NOT NULL
- `channel_description` (TEXT): Channel description
- `custom_url` (VARCHAR 255): Custom URL
- `subscriber_count` (INTEGER): Subscriber count
- `access_token` (TEXT): AES-256 encrypted OAuth access token, NOT NULL
- `refresh_token` (TEXT): AES-256 encrypted OAuth refresh token
- `token_expires_at` (TIMESTAMP): Token expiration time
- `linked_at` (TIMESTAMP): When the channel was linked, NOT NULL, DEFAULT NOW()
- `last_activity_at` (TIMESTAMP): Last activity timestamp, DEFAULT NOW()
- `is_active` (BOOLEAN): Whether the channel is active, DEFAULT TRUE
- `created_at` (TIMESTAMP): Record creation time, NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMP): Record update time, NOT NULL, DEFAULT NOW()

**Constraints:**
- PRIMARY KEY: id
- UNIQUE: youtube_channel_id (prevents same channel from being linked twice)
- UNIQUE: (user_id, youtube_channel_id) (prevents user from linking same channel twice)
- FOREIGN KEY: user_id → auth.users(id) ON DELETE CASCADE

**Indexes:**
- idx_youtube_channels_user_id: For querying channels by user
- idx_youtube_channels_youtube_channel_id: For querying by channel ID
- idx_youtube_channels_is_active: For filtering active channels

**RLS Policies:**
- Users can only view their own channels
- Users can only insert/update/delete their own channels

### 2. linking_activity

Tracks all linking and unlinking activities with device/location information.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users, NOT NULL
- `youtube_channel_id` (VARCHAR 255): Foreign key to youtube_channels, NOT NULL
- `activity_type` (VARCHAR 50): Type of activity ('link', 'unlink', 'recovery_attempt', 'suspicious_detected'), NOT NULL
- `ip_address` (INET): IP address, NOT NULL
- `user_agent` (TEXT): User agent string, NOT NULL
- `device_type` (VARCHAR 50): Device type ('mobile', 'tablet', 'desktop')
- `country` (VARCHAR 100): Country from GeoIP
- `city` (VARCHAR 100): City from GeoIP
- `latitude` (DECIMAL 10,8): Latitude from GeoIP
- `longitude` (DECIMAL 11,8): Longitude from GeoIP
- `is_suspicious` (BOOLEAN): Whether activity is suspicious, DEFAULT FALSE
- `suspicious_reason` (VARCHAR 255): Reason for suspicious flag
- `status` (VARCHAR 50): Activity status ('pending', 'completed', 'failed', 'blocked')
- `metadata` (JSONB): Additional metadata
- `created_at` (TIMESTAMP): Record creation time, NOT NULL, DEFAULT NOW()

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: youtube_channel_id → youtube_channels(youtube_channel_id) ON DELETE CASCADE

**Indexes:**
- idx_linking_activity_user_id: For querying activities by user
- idx_linking_activity_youtube_channel_id: For querying activities by channel
- idx_linking_activity_created_at: For time-based queries
- idx_linking_activity_is_suspicious: For filtering suspicious activities

**RLS Policies:**
- Users can only view their own activities
- Only system can insert activity records
- Activity records are immutable (cannot be updated or deleted)

### 3. recovery_tokens

Stores recovery tokens for channel ownership recovery.

**Columns:**
- `id` (UUID): Primary key
- `youtube_channel_id` (VARCHAR 255): Foreign key to youtube_channels, NOT NULL
- `token_hash` (VARCHAR 255): Bcrypt hash of recovery token, UNIQUE, NOT NULL
- `user_email` (VARCHAR 255): Email address for recovery, NOT NULL
- `initiated_by_user_id` (UUID): Foreign key to auth.users (who initiated recovery)
- `expires_at` (TIMESTAMP): Token expiration time, NOT NULL
- `used_at` (TIMESTAMP): When token was used
- `used_by_user_id` (UUID): Foreign key to auth.users (who used the token)
- `status` (VARCHAR 50): Token status ('pending', 'used', 'expired', 'revoked'), DEFAULT 'pending'
- `created_at` (TIMESTAMP): Record creation time, NOT NULL, DEFAULT NOW()

**Constraints:**
- PRIMARY KEY: id
- UNIQUE: token_hash (prevents token reuse)
- FOREIGN KEY: youtube_channel_id → youtube_channels(youtube_channel_id) ON DELETE CASCADE
- FOREIGN KEY: initiated_by_user_id → auth.users(id) ON DELETE SET NULL
- FOREIGN KEY: used_by_user_id → auth.users(id) ON DELETE SET NULL

**Indexes:**
- idx_recovery_tokens_youtube_channel_id: For querying tokens by channel
- idx_recovery_tokens_expires_at: For finding expired tokens
- idx_recovery_tokens_status: For filtering by status

**RLS Policies:**
- System can view/insert/update/delete recovery tokens

### 4. audit_logs

Comprehensive audit trail for compliance and investigation.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users
- `youtube_channel_id` (VARCHAR 255): Foreign key to youtube_channels
- `action` (VARCHAR 100): Action type ('channel_linked', 'channel_unlinked', 'recovery_initiated', 'recovery_completed', 'suspicious_activity_detected'), NOT NULL
- `ip_address` (INET): IP address
- `user_agent` (TEXT): User agent string
- `device_type` (VARCHAR 50): Device type
- `country` (VARCHAR 100): Country from GeoIP
- `city` (VARCHAR 100): City from GeoIP
- `details` (JSONB): Additional details
- `created_at` (TIMESTAMP): Record creation time, NOT NULL, DEFAULT NOW()

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id → auth.users(id) ON DELETE SET NULL
- FOREIGN KEY: youtube_channel_id → youtube_channels(youtube_channel_id) ON DELETE SET NULL

**Indexes:**
- idx_audit_logs_user_id: For querying logs by user
- idx_audit_logs_youtube_channel_id: For querying logs by channel
- idx_audit_logs_action: For filtering by action
- idx_audit_logs_created_at: For time-based queries
- idx_audit_logs_user_created: Composite index for user + time queries
- idx_audit_logs_channel_created: Composite index for channel + time queries

**RLS Policies:**
- Users can view their own audit logs
- Admins can view all audit logs
- Only system can insert audit logs
- Audit logs are immutable (cannot be updated or deleted)

### 5. unlink_revocation_window

Allows users to revoke unlinking within 24 hours if suspicious activity detected.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users, NOT NULL
- `youtube_channel_id` (VARCHAR 255): Foreign key to youtube_channels, NOT NULL
- `unlink_initiated_at` (TIMESTAMP): When unlink was initiated, NOT NULL
- `revocation_expires_at` (TIMESTAMP): When revocation window expires (24 hours), NOT NULL
- `revoked_at` (TIMESTAMP): When unlink was revoked
- `status` (VARCHAR 50): Window status ('active', 'revoked', 'expired'), DEFAULT 'active'
- `created_at` (TIMESTAMP): Record creation time, NOT NULL, DEFAULT NOW()

**Constraints:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id → auth.users(id) ON DELETE CASCADE
- FOREIGN KEY: youtube_channel_id → youtube_channels(youtube_channel_id) ON DELETE CASCADE

**Indexes:**
- idx_unlink_revocation_window_user_id: For querying windows by user
- idx_unlink_revocation_window_revocation_expires_at: For finding expired windows
- idx_unlink_revocation_window_status: For filtering by status

**RLS Policies:**
- Users can view their own revocation windows
- System can insert/update/delete revocation windows

## Archive Tables

### linking_activity_archive

Archive table for old linking_activity records (older than 2 years).

**Columns:** Same as linking_activity

**Indexes:**
- idx_linking_activity_archive_created_at: For time-based queries
- idx_linking_activity_archive_user_id: For querying by user

### audit_logs_archive

Archive table for old audit_logs records (older than 2 years).

**Columns:** Same as audit_logs

**Indexes:**
- idx_audit_logs_archive_created_at: For time-based queries
- idx_audit_logs_archive_user_id: For querying by user

## Functions and Triggers

### archive_old_linking_activity()

Archives linking_activity records older than 2 years to linking_activity_archive table.

**Usage:**
```sql
SELECT archive_old_linking_activity();
```

### archive_old_audit_logs()

Archives audit_logs records older than 2 years to audit_logs_archive table.

**Usage:**
```sql
SELECT archive_old_audit_logs();
```

### cleanup_expired_recovery_tokens()

Deletes expired recovery tokens and marks used tokens as expired if older than 24 hours.

**Usage:**
```sql
SELECT cleanup_expired_recovery_tokens();
```

### cleanup_expired_unlink_revocation_windows()

Marks unlink revocation windows as expired if they've passed the expiration time.

**Usage:**
```sql
SELECT cleanup_expired_unlink_revocation_windows();
```

### update_youtube_channel_last_activity()

Trigger function that updates last_activity_at on youtube_channels when linking_activity is created.

### update_youtube_channel_updated_at()

Trigger function that updates updated_at on youtube_channels when the record is modified.

## Data Retention Policy

- **linking_activity**: Retained for 2 years, then archived
- **audit_logs**: Retained for 2 years, then archived
- **recovery_tokens**: Deleted after 24 hours if unused, or after use
- **unlink_revocation_window**: Deleted after 24 hours

## Scheduling Archival and Cleanup

In production, the archival and cleanup functions should be scheduled using pg_cron or an external scheduler:

```sql
-- Schedule archival of old linking activity (daily at 2 AM)
SELECT cron.schedule('archive_old_linking_activity', '0 2 * * *', 'SELECT archive_old_linking_activity()');

-- Schedule archival of old audit logs (daily at 3 AM)
SELECT cron.schedule('archive_old_audit_logs', '0 3 * * *', 'SELECT archive_old_audit_logs()');

-- Schedule cleanup of expired recovery tokens (every 15 minutes)
SELECT cron.schedule('cleanup_expired_recovery_tokens', '*/15 * * * *', 'SELECT cleanup_expired_recovery_tokens()');

-- Schedule cleanup of expired unlink revocation windows (every 15 minutes)
SELECT cron.schedule('cleanup_expired_unlink_revocation_windows', '*/15 * * * *', 'SELECT cleanup_expired_unlink_revocation_windows()');
```

## Migration Files

The schema is implemented through the following migration files:

1. `20250101000001_create_youtube_channels_table.sql` - Creates youtube_channels table with indexes and RLS policies
2. `20250101000002_create_linking_activity_table.sql` - Creates linking_activity table with indexes and RLS policies
3. `20250101000003_create_recovery_tokens_table.sql` - Creates recovery_tokens table with indexes and RLS policies
4. `20250101000004_create_audit_logs_table.sql` - Creates audit_logs table with indexes and RLS policies
5. `20250101000005_create_unlink_revocation_window_table.sql` - Creates unlink_revocation_window table with indexes and RLS policies
6. `20250101000006_create_data_retention_policies.sql` - Creates archive tables, functions, and triggers

## Running Migrations

To run the migrations locally:

```bash
# Start Supabase local development
npx supabase start

# Run migrations
npx supabase db push

# Reset database (runs migrations and seed)
npx supabase db reset
```

To run migrations in production:

```bash
# Deploy migrations to production
npx supabase db push --linked
```

## Testing

Comprehensive tests for the database schema are available in:

```
src/__tests__/integration/youtube-channel-linking-schema.test.ts
```

To run the tests:

```bash
npm run test -- youtube-channel-linking-schema.test.ts
```

## Security Considerations

1. **Token Encryption**: OAuth tokens are stored encrypted with AES-256. Encryption/decryption is handled by the application layer.

2. **Recovery Token Hashing**: Recovery tokens are hashed with bcrypt before storage. The actual token is never stored.

3. **RLS Policies**: Row-level security policies ensure users can only access their own data.

4. **Audit Trail**: All activities are logged to the audit_logs table for compliance and investigation.

5. **Data Retention**: Old records are archived after 2 years to comply with data retention policies.

6. **Immutable Logs**: Activity and audit logs cannot be modified or deleted, ensuring data integrity.

## Performance Considerations

1. **Indexes**: Composite indexes are created for common query patterns (user + time, channel + time).

2. **Partitioning**: For very large datasets, consider partitioning linking_activity and audit_logs tables by date.

3. **Archival**: Regular archival of old records keeps the main tables small and queries fast.

4. **Connection Pooling**: Use connection pooling (pgBouncer) for better performance under load.

## Compliance

The schema supports compliance with:

- **GDPR**: User data can be deleted via CASCADE constraints
- **CCPA**: Audit trails provide transparency
- **SOC 2**: Comprehensive audit logging and data retention policies
- **HIPAA**: Encrypted token storage and access controls

## Future Enhancements

1. **Partitioning**: Partition linking_activity and audit_logs by date for better performance
2. **Materialized Views**: Create materialized views for common queries
3. **Full-Text Search**: Add full-text search indexes for audit log queries
4. **Time-Series Data**: Consider using TimescaleDB for time-series data
5. **Replication**: Set up read replicas for analytics queries
