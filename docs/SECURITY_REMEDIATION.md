# Security Remediation Guide

## Overview

This document addresses security issues identified by Supabase Database Linter.

## Issues Identified

### 1. SECURITY DEFINER Function Vulnerabilities

**Issue**: `public.rls_auto_enable()` function is marked as `SECURITY DEFINER` and is executable by both `anon` and `authenticated` roles.

**Risk Level**: WARN

**Impact**: 
- Unauthenticated users can execute functions with elevated privileges
- Potential for privilege escalation attacks
- Unauthorized access to sensitive operations

**Remediation**:
```sql
-- Revoke EXECUTE permissions from public roles
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- Option 1: Switch to SECURITY INVOKER (recommended)
-- This requires recreating the function
ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;

-- Option 2: Grant EXECUTE only to specific roles
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
```

**Status**: ✅ Fixed in `supabase/migrations/fix_security_issues.sql`

---

### 2. RLS Enabled But No Policies

**Issue**: Multiple tables have Row Level Security (RLS) enabled but no policies defined.

**Affected Tables**:
- `public.audit_logs`
- `public.email_verification_tokens`
- `public.login_attempts`
- `public.password_reset_tokens`
- `public.registration_sessions`
- `public.sessions`
- `public.users`

**Risk Level**: INFO (but important for security)

**Impact**:
- RLS enabled without policies blocks ALL access (including authenticated users)
- Users cannot access their own data
- Application functionality breaks

**Remediation**:

For each table, create appropriate RLS policies:

```sql
-- Example for audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own audit logs
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Status**: ✅ Fixed in `supabase/migrations/fix_security_issues.sql`

---

## Implementation Steps

### Step 1: Review Migration
Review `supabase/migrations/fix_security_issues.sql` to ensure all policies match your application requirements.

### Step 2: Test Locally
```bash
# Start Supabase local development
npx supabase start

# Apply migration
npx supabase db push

# Test RLS policies
npx supabase test db
```

### Step 3: Verify Policies
```sql
-- Check RLS status on tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies on a table
SELECT * FROM pg_policies 
WHERE tablename = 'audit_logs';
```

### Step 4: Deploy to Production
```bash
# Push to production Supabase project
npx supabase db push --project-ref your-project-ref
```

### Step 5: Run Linter Again
```bash
# Check for remaining issues
npx supabase db lint
```

---

## Policy Design Patterns

### Pattern 1: User-Owned Data
```sql
-- Users can only access their own records
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);
```

### Pattern 2: Admin Access
```sql
-- Admins can access all records
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );
```

### Pattern 3: Public Read, Authenticated Write
```sql
-- Anyone can read, only authenticated users can write
CREATE POLICY "posts_select_public" ON public.posts
  FOR SELECT
  USING (true);

CREATE POLICY "posts_insert_authenticated" ON public.posts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

---

## Testing RLS Policies

### Test 1: Verify User Isolation
```sql
-- As user 1, should only see their own data
SELECT * FROM public.audit_logs;
-- Result: Only records where user_id = auth.uid()

-- As user 2, should not see user 1's data
SELECT * FROM public.audit_logs WHERE user_id = 'user-1-id';
-- Result: 0 rows (access denied)
```

### Test 2: Verify Insert Restrictions
```sql
-- User can insert their own data
INSERT INTO public.audit_logs (user_id, action, resource)
VALUES (auth.uid(), 'test', 'test');
-- Result: Success

-- User cannot insert data for another user
INSERT INTO public.audit_logs (user_id, action, resource)
VALUES ('other-user-id', 'test', 'test');
-- Result: Error (policy violation)
```

---

## Monitoring and Maintenance

### Regular Security Audits
```bash
# Run linter monthly
npx supabase db lint

# Review audit logs
SELECT * FROM public.audit_logs 
ORDER BY created_at DESC 
LIMIT 100;
```

### Performance Considerations
- RLS policies can impact query performance
- Monitor slow queries with `pg_stat_statements`
- Consider indexing on `user_id` columns

### Documentation
- Document all RLS policies in your schema
- Keep a changelog of policy changes
- Review policies during code reviews

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [OWASP Database Security](https://owasp.org/www-community/attacks/SQL_Injection)

---

## Checklist

- [ ] Review all RLS policies
- [ ] Test policies locally
- [ ] Verify user isolation
- [ ] Test insert/update/delete restrictions
- [ ] Deploy to staging
- [ ] Run linter on staging
- [ ] Deploy to production
- [ ] Monitor audit logs
- [ ] Document all policies
- [ ] Schedule monthly security audits
