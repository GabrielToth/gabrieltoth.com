# RLS Policies Quick Reference Guide

## What is RLS?

Row-Level Security (RLS) is a PostgreSQL feature that automatically filters database queries to only return rows that match the current user's permissions. In the Universal Posting Scheduler, RLS ensures users can only access their own data.

## Tables with RLS Enabled

| Table | Purpose | User Isolation |
|-------|---------|-----------------|
| `social_networks` | Linked social media accounts | Users see only their own networks |
| `network_groups` | User-defined network groups | Users see only their own groups |
| `scheduled_posts` | Scheduled posts | Users see only their own posts |
| `publication_history` | Published post records | Users see only their own history |
| `oauth_tokens` | Encrypted OAuth tokens | Users see only their own tokens |
| `user_preferences` | User settings | Users see only their own preferences |

## How RLS Works

### For Authenticated Users (Anon Key)

```typescript
// User A's request
const { data } = await userAClient
  .from('social_networks')
  .select('*');
// Returns: Only User A's networks

// User B's request
const { data } = await userBClient
  .from('social_networks')
  .select('*');
// Returns: Only User B's networks
```

### For Backend Services (Service Role Key)

```typescript
// Backend service with service role key
const { data } = await adminClient
  .from('social_networks')
  .select('*');
// Returns: ALL networks (RLS bypassed)
```

## Common Operations

### Insert Data (User's Own Data)

```typescript
// ✅ WORKS - User inserting their own data
const { data, error } = await userClient
  .from('social_networks')
  .insert({
    platform: 'youtube',
    status: 'connected'
  })
  .select();
```

### View Data (User's Own Data)

```typescript
// ✅ WORKS - User viewing their own data
const { data } = await userClient
  .from('social_networks')
  .select('*');
// Returns only this user's networks
```

### Update Data (User's Own Data)

```typescript
// ✅ WORKS - User updating their own data
const { data } = await userClient
  .from('social_networks')
  .update({ status: 'disconnected' })
  .eq('id', networkId)
  .select();
```

### Delete Data (User's Own Data)

```typescript
// ✅ WORKS - User deleting their own data
const { error } = await userClient
  .from('social_networks')
  .delete()
  .eq('id', networkId);
```

## What RLS Prevents

### Cross-User Data Access

```typescript
// ❌ BLOCKED - User B cannot see User A's data
const { data } = await userBClient
  .from('social_networks')
  .select('*')
  .eq('user_id', userAId);
// Returns: Empty array (RLS blocks this)
```

### Unauthorized Modifications

```typescript
// ❌ BLOCKED - User B cannot modify User A's data
const { error } = await userBClient
  .from('social_networks')
  .update({ status: 'disconnected' })
  .eq('id', userANetworkId);
// Error: RLS policy violation
```

## Testing RLS Policies

### Quick Test

```typescript
import { createClient } from '@supabase/supabase-js';

const userAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const userBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User A inserts data
const { data: userAData } = await userAClient
  .from('social_networks')
  .insert({ platform: 'youtube', status: 'connected' })
  .select();

// User B tries to view User A's data
const { data: userBView } = await userBClient
  .from('social_networks')
  .select('*')
  .eq('user_id', userAData[0].user_id);

// Verify RLS is working
console.assert(userBView.length === 0, 'RLS FAILED!');
console.log('✅ RLS is working correctly');
```

### Run Full Test Suite

```bash
# Run all RLS tests
npm run test -- supabase/tests/rls-policies.test.ts

# Run with coverage
npm run test:coverage -- supabase/tests/rls-policies.test.ts
```

### Validate SQL Policies

```bash
# Run SQL validation script
npx supabase db execute < supabase/tests/rls-policies-validation.sql
```

## Troubleshooting

### Issue: Users can see other users' data

**Check**:
1. Is RLS enabled? `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Do policies exist? `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
3. Are policies correct? Should use `auth.uid() = user_id`

### Issue: Service role cannot access data

**Check**:
1. Service role should bypass RLS by default
2. Verify you're using the service role key, not anon key
3. Check if RLS is incorrectly configured

### Issue: Queries are slow

**Check**:
1. Indexes exist on `user_id` columns
2. Use `EXPLAIN ANALYZE` to check query plans
3. Consider partitioning large tables

## Policy Details

### social_networks Policies

```sql
-- SELECT: Users can view their own networks
USING (auth.uid() = user_id)

-- INSERT: Users can insert their own networks
WITH CHECK (auth.uid() = user_id)

-- UPDATE: Users can update their own networks
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)

-- DELETE: Users can delete their own networks
USING (auth.uid() = user_id)
```

### network_groups Policies

```sql
-- SELECT: Users can view their own groups
USING (auth.uid() = user_id)

-- INSERT: Users can insert their own groups
WITH CHECK (auth.uid() = user_id)

-- UPDATE: Users can update their own groups
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)

-- DELETE: Users can delete their own groups
USING (auth.uid() = user_id)
```

### scheduled_posts Policies

```sql
-- SELECT: Users can view their own posts
USING (auth.uid() = user_id)

-- INSERT: Users can insert their own posts
WITH CHECK (auth.uid() = user_id)

-- UPDATE: Users can update their own posts
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)

-- DELETE: Users can delete their own posts
USING (auth.uid() = user_id)
```

### publication_history Policies

```sql
-- SELECT: Users can view their own history
USING (auth.uid() = user_id)

-- INSERT: Users can insert their own history
WITH CHECK (auth.uid() = user_id)

-- UPDATE: Users can update their own history
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)

-- DELETE: Users can delete their own history
USING (auth.uid() = user_id)
```

### oauth_tokens Policies

```sql
-- SELECT: Users can view their own tokens
USING (auth.uid() = user_id)

-- INSERT: Users can insert their own tokens
WITH CHECK (auth.uid() = user_id)

-- UPDATE: Users can update their own tokens
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)

-- DELETE: Users can delete their own tokens
USING (auth.uid() = user_id)
```

### user_preferences Policies

```sql
-- SELECT: Users can view their own preferences
USING (auth.uid() = user_id)

-- INSERT: Users can insert their own preferences
WITH CHECK (auth.uid() = user_id)

-- UPDATE: Users can update their own preferences
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)

-- DELETE: Users can delete their own preferences
USING (auth.uid() = user_id)
```

## Key Concepts

### auth.uid()
Returns the current authenticated user's ID from the JWT token. Used in all RLS policies to identify the user.

### USING Clause
Filters which rows can be accessed for SELECT and DELETE operations.

### WITH CHECK Clause
Filters which rows can be modified for INSERT and UPDATE operations.

### Service Role Key
Bypasses RLS policies. Use only for trusted backend services. Never expose to clients.

### Anon Key
Respects RLS policies. Safe to use in client-side code.

## Best Practices

1. **Always use RLS for user data**: Protect sensitive data at the database level
2. **Use service role key only in backend**: Never expose to client-side code
3. **Test RLS policies**: Verify users cannot access other users' data
4. **Monitor RLS performance**: Ensure indexes are in place for efficient queries
5. **Document policies**: Keep documentation up-to-date with policy changes

## Related Documentation

- [Full RLS Documentation](./RLS_POLICIES.md)
- [RLS Verification Report](./RLS_VERIFICATION_REPORT.md)
- [Requirements Document](../.kiro/specs/universal-posting-scheduler/requirements.md)
- [Design Document](../.kiro/specs/universal-posting-scheduler/design.md)

## Support

For issues or questions about RLS policies:
1. Check the [Full RLS Documentation](./RLS_POLICIES.md)
2. Review the [Verification Report](./RLS_VERIFICATION_REPORT.md)
3. Run the test suite: `npm run test -- supabase/tests/rls-policies.test.ts`
4. Check PostgreSQL logs for policy violations
