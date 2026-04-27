# Row-Level Security (RLS) Policies Documentation

## Overview

This document describes the Row-Level Security (RLS) policies implemented for the Universal Posting Scheduler feature. RLS policies ensure that users can only access their own data across all tables in the system.

**Requirements**: 20.1, 20.2, 20.4

## What is Row-Level Security?

Row-Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access based on policies defined at the table level. When RLS is enabled on a table, all queries are automatically filtered to only return rows that match the active policies.

## RLS Policies Implemented

### 1. social_networks Table

Stores linked social media accounts for users.

**Policies**:
- **SELECT**: Users can only view their own networks (`auth.uid() = user_id`)
- **INSERT**: Users can only insert networks for themselves (`auth.uid() = user_id`)
- **UPDATE**: Users can only update their own networks (`auth.uid() = user_id`)
- **DELETE**: Users can only delete their own networks (`auth.uid() = user_id`)

**Example**:
```sql
-- User A can only see their own networks
SELECT * FROM social_networks WHERE user_id = auth.uid();

-- User B cannot see User A's networks
SELECT * FROM social_networks WHERE user_id = 'user-a-id'; -- Returns empty
```

### 2. network_groups Table

Stores user-defined groups of social networks.

**Policies**:
- **SELECT**: Users can only view their own groups (`auth.uid() = user_id`)
- **INSERT**: Users can only insert groups for themselves (`auth.uid() = user_id`)
- **UPDATE**: Users can only update their own groups (`auth.uid() = user_id`)
- **DELETE**: Users can only delete their own groups (`auth.uid() = user_id`)

**Example**:
```sql
-- User A can only see their own groups
SELECT * FROM network_groups WHERE user_id = auth.uid();

-- User B cannot see User A's groups
SELECT * FROM network_groups WHERE user_id = 'user-a-id'; -- Returns empty
```

### 3. scheduled_posts Table

Stores scheduled posts with content and metadata.

**Policies**:
- **SELECT**: Users can only view their own posts (`auth.uid() = user_id`)
- **INSERT**: Users can only insert posts for themselves (`auth.uid() = user_id`)
- **UPDATE**: Users can only update their own posts (`auth.uid() = user_id`)
- **DELETE**: Users can only delete their own posts (`auth.uid() = user_id`)

**Example**:
```sql
-- User A can only see their own scheduled posts
SELECT * FROM scheduled_posts WHERE user_id = auth.uid();

-- User B cannot see User A's posts
SELECT * FROM scheduled_posts WHERE user_id = 'user-a-id'; -- Returns empty
```

### 4. publication_history Table

Records all published posts with status and external references.

**Policies**:
- **SELECT**: Users can only view their own publication history (`auth.uid() = user_id`)
- **INSERT**: Users can only insert history records for themselves (`auth.uid() = user_id`)
- **UPDATE**: Users can only update their own history records (`auth.uid() = user_id`)
- **DELETE**: Users can only delete their own history records (`auth.uid() = user_id`)

**Example**:
```sql
-- User A can only see their own publication history
SELECT * FROM publication_history WHERE user_id = auth.uid();

-- User B cannot see User A's publication history
SELECT * FROM publication_history WHERE user_id = 'user-a-id'; -- Returns empty
```

### 5. oauth_tokens Table

Stores encrypted OAuth tokens for each network.

**Policies**:
- **SELECT**: Users can only view their own tokens (`auth.uid() = user_id`)
- **INSERT**: Users can only insert tokens for themselves (`auth.uid() = user_id`)
- **UPDATE**: Users can only update their own tokens (`auth.uid() = user_id`)
- **DELETE**: Users can only delete their own tokens (`auth.uid() = user_id`)

**Example**:
```sql
-- User A can only see their own OAuth tokens
SELECT * FROM oauth_tokens WHERE user_id = auth.uid();

-- User B cannot see User A's tokens
SELECT * FROM oauth_tokens WHERE user_id = 'user-a-id'; -- Returns empty
```

### 6. user_preferences Table

Stores user preferences for timezone, default networks, and notification settings.

**Policies**:
- **SELECT**: Users can only view their own preferences (`auth.uid() = user_id`)
- **INSERT**: Users can only insert preferences for themselves (`auth.uid() = user_id`)
- **UPDATE**: Users can only update their own preferences (`auth.uid() = user_id`)
- **DELETE**: Users can only delete their own preferences (`auth.uid() = user_id`)

**Example**:
```sql
-- User A can only see their own preferences
SELECT * FROM user_preferences WHERE user_id = auth.uid();

-- User B cannot see User A's preferences
SELECT * FROM user_preferences WHERE user_id = 'user-a-id'; -- Returns empty
```

## How RLS Works

### Authentication Context

RLS policies use `auth.uid()` to get the current authenticated user's ID. This function returns the user ID from the JWT token in the request.

### Policy Evaluation

When a query is executed:
1. PostgreSQL checks if RLS is enabled on the table
2. If enabled, it evaluates all applicable policies for the operation (SELECT, INSERT, UPDATE, DELETE)
3. Only rows that match the policy conditions are returned or modified
4. If no policies match, the operation is denied

### Service Role Bypass

The service role key (used by backend services) bypasses RLS policies. This allows backend services to perform administrative operations without being restricted by user-level policies.

## Testing RLS Policies

### SQL Validation Script

Run the SQL validation script to verify all RLS policies are correctly configured:

```bash
# Using Supabase CLI
supabase db push
supabase db execute < supabase/tests/rls-policies-validation.sql

# Or using psql directly
psql -h localhost -U postgres -d postgres -f supabase/tests/rls-policies-validation.sql
```

### TypeScript Test Suite

Run the comprehensive TypeScript test suite:

```bash
# Install dependencies
npm install

# Run RLS policy tests
npm run test -- supabase/tests/rls-policies.test.ts

# Run with coverage
npm run test:coverage -- supabase/tests/rls-policies.test.ts
```

### Manual Testing

To manually test RLS policies:

1. **Create test users** in Supabase Authentication
2. **Authenticate as User A** and insert data
3. **Authenticate as User B** and verify they cannot see User A's data
4. **Use service role key** and verify you can see all data

Example using Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';

// Create authenticated clients for different users
const userAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

const userBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

// User A inserts a network
const { data: userANetwork } = await userAClient
  .from('social_networks')
  .insert({ platform: 'youtube', status: 'connected' })
  .select();

// User B tries to view User A's network
const { data: userBView } = await userBClient
  .from('social_networks')
  .select('*')
  .eq('user_id', userANetwork[0].user_id);

// userBView should be empty due to RLS
console.assert(userBView.length === 0, 'RLS policy failed!');
```

## Verification Checklist

- [x] RLS is enabled on all tables
- [x] social_networks table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [x] network_groups table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [x] scheduled_posts table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [x] publication_history table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [x] oauth_tokens table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [x] user_preferences table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [x] All policies use `auth.uid() = user_id` condition
- [x] All policies are permissive (not restrictive)
- [x] Service role key bypasses RLS for administrative operations

## Security Considerations

### 1. Token Encryption

OAuth tokens are encrypted before storage. Even if a user somehow bypasses RLS, they would only see encrypted tokens that they cannot decrypt.

### 2. Audit Logging

All data access is logged through the audit logger. Any attempts to access unauthorized data are recorded.

### 3. Foreign Key Constraints

Foreign key constraints ensure data integrity. For example, a publication_history record can only reference a network_id that belongs to the same user.

### 4. Service Role Usage

The service role key should only be used by trusted backend services. Never expose the service role key to the client.

## Troubleshooting

### Issue: Users can see other users' data

**Cause**: RLS policies may not be enabled or configured correctly.

**Solution**:
1. Verify RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
3. Check policy conditions: Ensure all policies use `auth.uid() = user_id`

### Issue: Service role cannot access data

**Cause**: Service role is being restricted by RLS policies.

**Solution**:
1. Service role should bypass RLS by default
2. If not, check if RLS is incorrectly configured
3. Verify service role key is being used correctly

### Issue: Performance degradation with RLS

**Cause**: RLS policies may not be optimized.

**Solution**:
1. Ensure indexes exist on user_id columns
2. Use EXPLAIN ANALYZE to check query plans
3. Consider partitioning large tables by user_id

## References

- [PostgreSQL Row-Level Security Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Universal Posting Scheduler Requirements](../requirements.md)
- [Universal Posting Scheduler Design](../design.md)

## Related Tasks

- Task 1: Set up database schema and migrations
- Task 2: Add database indexes and constraints
- Task 3: Configure row-level security (RLS) policies (this task)
