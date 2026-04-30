# How to Apply Security Fixes

## Option 1: Using Supabase Dashboard (Recommended for Production)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Create a new query
5. Copy and paste the contents of `supabase/migrations/fix_security_issues.sql`
6. Click **Run**
7. Verify the changes were applied

## Option 2: Using Supabase CLI (Local Development)

```bash
# Start Supabase local development
npx supabase start

# Link to your project (if not already linked)
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push

# Verify changes
npx supabase db lint
```

## Option 3: Manual SQL Execution

### For Local Development:
```bash
# Connect to local Supabase PostgreSQL
psql postgresql://postgres:postgres@localhost:54322/postgres

# Run the migration
\i supabase/migrations/fix_security_issues.sql

# Verify
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### For Production (via Supabase Dashboard):
1. Navigate to SQL Editor
2. Execute each section of the migration file
3. Verify with linter: `npx supabase db lint`

## Verification Steps

After applying the migration, verify the fixes:

```sql
-- 1. Check SECURITY DEFINER function permissions
SELECT grantee, privilege_type 
FROM information_schema.role_routine_grants 
WHERE routine_name = 'rls_auto_enable';

-- 2. Check RLS status on tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 3. Check RLS policies
SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Run linter
-- Via CLI: npx supabase db lint
-- Via Dashboard: Database > Linter
```

## Rollback Plan

If you need to rollback the changes:

```sql
-- Drop all policies
DROP POLICY IF EXISTS audit_logs_select_own ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_own ON public.audit_logs;
-- ... (repeat for all policies)

-- Disable RLS on tables
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Re-grant EXECUTE permissions if needed
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO anon;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO authenticated;
```

## Testing After Application

### Test 1: Verify User Isolation
```bash
# Create test users
curl -X POST http://localhost:54321/auth/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"password123"}'

curl -X POST http://localhost:54321/auth/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@test.com","password":"password123"}'

# Test RLS policies
# User 1 should only see their own data
# User 2 should not see User 1's data
```

### Test 2: Verify Function Permissions
```bash
# Try to call rls_auto_enable as anon (should fail)
curl -X POST http://localhost:54321/rest/v1/rpc/rls_auto_enable \
  -H "Content-Type: application/json"
# Expected: 401 Unauthorized or 403 Forbidden
```

## Monitoring

After applying the fixes, monitor:

1. **Application Logs**: Check for any RLS-related errors
2. **Database Logs**: Monitor for policy violations
3. **Performance**: Monitor query performance with RLS enabled
4. **Audit Logs**: Review audit_logs table for suspicious activity

```sql
-- Check for recent errors
SELECT * FROM public.audit_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Support

If you encounter issues:

1. Check [Supabase Documentation](https://supabase.com/docs)
2. Review [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
3. Contact Supabase Support
4. Check application logs for specific error messages
