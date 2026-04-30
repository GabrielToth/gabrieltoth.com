# Supabase Security Fixes Bugfix Design

## Overview

This design addresses critical security vulnerabilities identified by the Supabase database linter. The primary issues are:

1. **SECURITY DEFINER Function Exposure**: The function `public.rls_auto_enable()` is executable by `anon` and `authenticated` roles via REST API endpoint `/rest/v1/rpc/rls_auto_enable`, creating unauthorized access risk.

2. **RLS Without Policies**: Multiple tables have Row Level Security enabled but no policies defined, blocking all access including legitimate operations. Affected tables: `audit_logs`, `email_verification_tokens`, `login_attempts`, `password_reset_tokens`, `registration_sessions`, `sessions`, `users`.

3. **Schema Inconsistency**: Migration files reference tables (`email_verification_tokens`, `password_reset_tokens`, `registration_sessions`, `sessions`, `users`, `login_attempts`) not present in the main `schema.sql`, creating deployment and maintenance issues.

The fix strategy involves: (1) removing or securing the SECURITY DEFINER function, (2) implementing comprehensive RLS policies for all affected tables, and (3) consolidating schema to ensure consistency between migrations and the authoritative schema dump.

## Glossary

- **Bug_Condition (C)**: The condition that triggers security vulnerabilities - when SECURITY DEFINER functions are accessible to unauthorized roles OR when RLS-enabled tables lack policies
- **Property (P)**: The desired secure behavior - SECURITY DEFINER functions are not accessible via REST API to unauthorized roles AND all RLS-enabled tables have appropriate policies
- **Preservation**: Existing RLS policies and database functions that must remain unchanged by the fix
- **SECURITY DEFINER**: PostgreSQL function attribute that executes with privileges of the function owner, not the caller
- **RLS (Row Level Security)**: PostgreSQL feature that restricts row-level access based on policies
- **auth.uid()**: Supabase helper function that returns the authenticated user's UUID from JWT token
- **anon role**: Unauthenticated users accessing the database
- **authenticated role**: Authenticated users accessing the database
- **service_role**: Backend service with elevated privileges (bypasses RLS)

## Bug Details

### Bug Condition

The security vulnerabilities manifest in three distinct scenarios:

**Scenario 1: SECURITY DEFINER Function Exposure**
The function `public.rls_auto_enable()` (if it exists) is accessible to both `anon` and `authenticated` roles through the Supabase REST API endpoint `/rest/v1/rpc/rls_auto_enable`. This allows unauthorized users to execute privileged operations.

**Scenario 2: RLS Without Policies**
Tables have RLS enabled but no policies defined, causing all operations (SELECT, INSERT, UPDATE, DELETE) to be blocked even for legitimate users. The affected tables are referenced in migration files but some don't exist in the current schema.

**Scenario 3: Schema Inconsistency**
Migration files reference tables that don't exist in `schema.sql`, creating deployment failures and maintenance confusion.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type DatabaseState
  OUTPUT: boolean
  
  RETURN (
    -- Condition 1: SECURITY DEFINER function is accessible
    (functionExists('public.rls_auto_enable') AND
     hasExecutePermission('public.rls_auto_enable', 'anon') OR
     hasExecutePermission('public.rls_auto_enable', 'authenticated'))
    
    OR
    
    -- Condition 2: RLS enabled without policies
    (tableHasRLS(input.tableName) AND
     NOT hasPolicies(input.tableName) AND
     input.tableName IN [
       'audit_logs',
       'email_verification_tokens',
       'login_attempts',
       'password_reset_tokens',
       'registration_sessions',
       'sessions',
       'users'
     ])
    
    OR
    
    -- Condition 3: Schema inconsistency
    (tableReferencedInMigrations(input.tableName) AND
     NOT tableExistsInSchema(input.tableName))
  )
END FUNCTION
```

### Examples

**Example 1: SECURITY DEFINER Function Exposure**
- **Current Behavior**: Unauthenticated user calls `POST /rest/v1/rpc/rls_auto_enable` → Function executes with elevated privileges → Security breach
- **Expected Behavior**: Unauthenticated user calls `POST /rest/v1/rpc/rls_auto_enable` → 403 Forbidden → Access denied

**Example 2: RLS Blocking Legitimate Access**
- **Current Behavior**: Authenticated user queries `SELECT * FROM audit_logs WHERE user_id = auth.uid()` → No rows returned (blocked by RLS) → User cannot view their own audit logs
- **Expected Behavior**: Authenticated user queries `SELECT * FROM audit_logs WHERE user_id = auth.uid()` → Returns user's audit logs → Access granted

**Example 3: Login Attempts Rate Limiting Broken**
- **Current Behavior**: System tries to `INSERT INTO login_attempts` → RLS blocks insert → Rate limiting fails → Security feature broken
- **Expected Behavior**: System inserts into `login_attempts` → Insert succeeds → Rate limiting works correctly

**Example 4: Schema Deployment Failure**
- **Current Behavior**: Deploy migration referencing `email_verification_tokens` → Table doesn't exist in schema → Migration fails → Deployment blocked
- **Expected Behavior**: Deploy consolidated schema → All tables exist → Deployment succeeds

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

**1. Existing RLS Policies**
- All existing RLS policies on tables like `youtube_channels`, `oauth_tokens`, `scheduled_posts`, `social_networks`, `publication_history`, `network_groups`, `group_networks`, `scheduled_post_networks`, `user_preferences`, `linking_activity`, `recovery_tokens`, `unlink_revocation_window` must continue to work exactly as before
- Users must continue to access their own data through existing policies
- Admin users must continue to have elevated access where configured

**2. Database Functions**
- Legitimate database functions (`archive_old_audit_logs`, `archive_old_linking_activity`, `cleanup_expired_recovery_tokens`, `cleanup_expired_unlink_revocation_windows`, `update_youtube_channel_last_activity`, `update_youtube_channel_updated_at`) must continue to execute with appropriate permissions
- Triggers must continue to fire correctly

**3. Foreign Key Relationships**
- All foreign key constraints must continue to enforce referential integrity
- Cascade deletes must continue to propagate correctly

**4. Indexes and Performance**
- Existing indexes must continue to optimize queries
- Query performance must not degrade

**5. Authentication and Authorization**
- Authenticated users must continue to access protected resources using `auth.uid()`
- JWT token validation must continue to work correctly

**Scope:**
All database operations that do NOT involve the affected tables (`audit_logs`, `email_verification_tokens`, `login_attempts`, `password_reset_tokens`, `registration_sessions`, `sessions`, `users`) or the `rls_auto_enable()` function should be completely unaffected by this fix.

## Hypothesized Root Cause

Based on the bug description and schema analysis, the most likely issues are:

### 1. **SECURITY DEFINER Function Misconfiguration**

The function `public.rls_auto_enable()` was likely created during development or by a migration tool with SECURITY DEFINER attribute and default EXECUTE permissions granted to PUBLIC (which includes `anon` and `authenticated` roles). This is a common mistake when developers:
- Copy function definitions without understanding security implications
- Use migration tools that don't properly restrict permissions
- Fail to explicitly revoke default permissions after function creation

**Evidence**: The Supabase linter specifically flags this function as accessible via REST API endpoint `/rest/v1/rpc/rls_auto_enable`.

### 2. **Incomplete Migration Application**

The tables referenced in migration files (`email_verification_tokens`, `password_reset_tokens`, `registration_sessions`, `sessions`, `users`, `login_attempts`) don't exist in the current `schema.sql`. This suggests:
- Migrations were created but never applied to the database
- Schema dump was taken before migrations were run
- Tables were created in a different schema or dropped later
- Migration files are outdated or incorrect

**Evidence**: Migration file `fix_security_issues.sql` attempts to create policies for tables that don't exist in `schema.sql`. The `schema.sql` file shows `public.sessions` and `public.login_attempts` are defined at the end (lines 2700+), suggesting they were added later but not properly integrated.

### 3. **RLS Enabled Without Policy Definition**

When RLS is enabled on a table without defining policies, PostgreSQL's default behavior is to deny all access. This likely happened because:
- Developer enabled RLS as a security best practice
- Forgot to define policies before deploying
- Assumed default policies would be created automatically
- Migration order was incorrect (RLS enabled before policies created)

**Evidence**: The `audit_logs` table has RLS enabled in `schema.sql` (line 2277) with some policies defined, but the bugfix requirements indicate policies are missing or incomplete.

### 4. **Schema Consolidation Never Performed**

The project appears to have accumulated migrations over time without consolidating them into a single authoritative `schema.sql`. This creates:
- Confusion about actual database state
- Deployment failures when migrations reference non-existent tables
- Difficulty maintaining consistency between environments

**Evidence**: Multiple migration files exist (`fix_security_issues.sql`, `20260430_create_unified_auth_schema.sql`, `20260428_add_login_infrastructure.sql`) that attempt to create overlapping tables and policies.

## Correctness Properties

Property 1: Bug Condition - SECURITY DEFINER Function Security

_For any_ database state where the function `public.rls_auto_enable()` exists, the fixed schema SHALL ensure that `anon` and `authenticated` roles do NOT have EXECUTE permission on this function, preventing unauthorized access via REST API endpoint `/rest/v1/rpc/rls_auto_enable`.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Bug Condition - RLS Policies Completeness

_For any_ table where RLS is enabled (`audit_logs`, `email_verification_tokens`, `login_attempts`, `password_reset_tokens`, `registration_sessions`, `sessions`, `users`), the fixed schema SHALL define appropriate policies that allow users to access their own data and system operations to function correctly, preventing the blocking of legitimate access.

**Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

Property 3: Bug Condition - Schema Consistency

_For any_ table referenced in migration files, the fixed schema SHALL include that table definition in the authoritative `schema.sql` file, ensuring deployment consistency and eliminating migration failures.

**Validates: Requirements 2.10, 2.11**

Property 4: Preservation - Existing RLS Policies

_For any_ table with existing RLS policies (`youtube_channels`, `oauth_tokens`, `scheduled_posts`, etc.), the fixed schema SHALL preserve those policies exactly as they are, ensuring no regression in existing access control.

**Validates: Requirements 3.1, 3.2**

Property 5: Preservation - Database Functions and Triggers

_For any_ existing database function or trigger, the fixed schema SHALL preserve its definition and permissions, ensuring continued operation of archival, cleanup, and update operations.

**Validates: Requirements 3.5, 3.6**

Property 6: Preservation - Foreign Keys and Indexes

_For any_ existing foreign key constraint or index, the fixed schema SHALL preserve its definition, ensuring referential integrity and query performance are maintained.

**Validates: Requirements 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

The fix will be implemented through a consolidated schema approach, replacing all migrations with a single authoritative `schema.sql` file.

#### **Phase 1: Remove or Secure SECURITY DEFINER Function**

**File**: `supabase/schema.sql`

**Action**: Remove the `public.rls_auto_enable()` function entirely

**Rationale**: The function is not used in the current codebase and poses a security risk. If it was created by a migration tool, it's safe to remove.

**SQL**:
```sql
-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.rls_auto_enable();
```

**Alternative (if function is needed)**: If the function serves a legitimate purpose, change it to SECURITY INVOKER and revoke permissions:
```sql
-- Recreate as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Execute with caller's privileges
AS $$
BEGIN
  -- Function implementation
END;
$$;

-- Revoke from public roles
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- Grant only to service_role
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
```

#### **Phase 2: Consolidate Schema - Remove Orphaned Tables**

**Analysis**: The tables `email_verification_tokens`, `password_reset_tokens`, `registration_sessions`, `users` referenced in migration files don't exist in the current schema because:
1. The application uses Supabase Auth (`auth.users`) instead of custom `public.users`
2. Email verification and password reset are handled by Supabase Auth
3. Registration sessions are not needed with Supabase Auth

**Action**: Remove references to these non-existent tables from the consolidated schema

**Tables to KEEP** (they exist and are used):
- `public.audit_logs` - Already exists in schema
- `public.login_attempts` - Defined at end of schema
- `public.sessions` - Defined at end of schema (for custom session management)

**Tables to IGNORE** (don't exist, not needed):
- `public.email_verification_tokens` - Handled by Supabase Auth
- `public.password_reset_tokens` - Handled by Supabase Auth
- `public.registration_sessions` - Not needed with Supabase Auth
- `public.users` - Using `auth.users` instead

#### **Phase 3: Define RLS Policies for Existing Tables**

**File**: `supabase/schema.sql`

**Table 1: `public.audit_logs`**

Current state: RLS enabled, some policies exist but incomplete

**Policies to Add/Update**:
```sql
-- Enable RLS (already enabled)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE (raw_user_meta_data->>'role')::text = 'admin'
  )
);

-- Policy 2: System can insert audit logs (already exists as "System can insert audit logs")
-- Keep existing policy

-- Policy 3: Audit logs are immutable (already exists)
-- Keep existing policy

-- Policy 4: Audit logs cannot be deleted (already exists)
-- Keep existing policy
```

**Table 2: `public.login_attempts`**

Current state: Table exists at end of schema, RLS enabled, needs policies

**Policies to Add**:
```sql
-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy 1: System can insert login attempts (for rate limiting)
CREATE POLICY "System can insert login attempts" 
ON public.login_attempts 
FOR INSERT 
WITH CHECK (true);

-- Policy 2: Users can view their own login attempts
CREATE POLICY "Users can view their own login attempts" 
ON public.login_attempts 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE (raw_user_meta_data->>'role')::text = 'admin'
  )
);

-- Policy 3: Login attempts are immutable
CREATE POLICY "Login attempts are immutable" 
ON public.login_attempts 
FOR UPDATE 
USING (false);

-- Policy 4: Login attempts cannot be deleted by users
CREATE POLICY "Login attempts cannot be deleted by users" 
ON public.login_attempts 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE (raw_user_meta_data->>'role')::text = 'admin'
  )
);
```

**Table 3: `public.sessions`**

Current state: Table exists at end of schema, RLS enabled, needs policies

**Policies to Add**:
```sql
-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own sessions
CREATE POLICY "Users can view their own sessions" 
ON public.sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: System can insert sessions
CREATE POLICY "System can insert sessions" 
ON public.sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own sessions (for logout)
CREATE POLICY "Users can update their own sessions" 
ON public.sessions 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own sessions (for logout)
CREATE POLICY "Users can delete their own sessions" 
ON public.sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy 5: System can cleanup expired sessions
CREATE POLICY "System can cleanup expired sessions" 
ON public.sessions 
FOR DELETE 
USING (expires_at < NOW());
```

**Table 4: `public.remember_me_tokens`**

Current state: Table exists at end of schema (incomplete in truncated view), RLS enabled, needs policies

**Policies to Add**:
```sql
-- Enable RLS
ALTER TABLE public.remember_me_tokens ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own remember me tokens
CREATE POLICY "Users can view their own remember me tokens" 
ON public.remember_me_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: System can insert remember me tokens
CREATE POLICY "System can insert remember me tokens" 
ON public.remember_me_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can delete their own remember me tokens
CREATE POLICY "Users can delete their own remember me tokens" 
ON public.remember_me_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy 4: System can cleanup expired tokens
CREATE POLICY "System can cleanup expired remember me tokens" 
ON public.remember_me_tokens 
FOR DELETE 
USING (expires_at < NOW());
```

#### **Phase 4: Schema Consolidation**

**Action**: Create a single authoritative `schema.sql` that includes:
1. All existing tables with their current definitions
2. All existing RLS policies (preserved)
3. New RLS policies for `audit_logs`, `login_attempts`, `sessions`, `remember_me_tokens`
4. Removal of `public.rls_auto_enable()` function
5. All existing functions, triggers, indexes, foreign keys (preserved)

**Process**:
1. Start with current `schema.sql` as base
2. Remove `public.rls_auto_enable()` function if present
3. Add missing RLS policies for affected tables
4. Ensure `login_attempts`, `sessions`, `remember_me_tokens` table definitions are complete
5. Verify all existing policies are preserved
6. Delete all migration files in `supabase/migrations/` directory
7. This single `schema.sql` becomes the source of truth

#### **Phase 5: Verification**

**Verification Steps**:
1. Apply schema to local Supabase instance
2. Verify `public.rls_auto_enable()` does not exist or is not accessible
3. Test each RLS policy:
   - Authenticated user can view their own audit logs
   - Authenticated user can view their own login attempts
   - Authenticated user can manage their own sessions
   - Unauthenticated user cannot access any protected data
   - Admin user can view all audit logs and login attempts
4. Verify existing policies still work:
   - Test `youtube_channels` access
   - Test `oauth_tokens` access
   - Test `scheduled_posts` access
5. Verify foreign keys and triggers still work
6. Run application tests to ensure no regressions

## Testing Strategy

### Validation Approach

The testing strategy follows a three-phase approach:

1. **Exploratory Bug Condition Checking**: Surface counterexamples demonstrating the bugs on unfixed schema
2. **Fix Checking**: Verify the fixed schema resolves all security issues
3. **Preservation Checking**: Verify existing functionality remains unchanged

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the security bugs BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write tests that attempt to exploit the security vulnerabilities on the UNFIXED schema. Run these tests to observe failures and understand the root cause.

**Test Cases**:

1. **SECURITY DEFINER Function Exposure Test** (will fail on unfixed schema if function exists)
   - Attempt to call `POST /rest/v1/rpc/rls_auto_enable` as unauthenticated user
   - Expected: Function executes (security breach) OR function doesn't exist
   - Confirms: Whether the function exists and is exploitable

2. **RLS Blocking Audit Logs Test** (will fail on unfixed schema)
   - Authenticated user queries `SELECT * FROM audit_logs WHERE user_id = auth.uid()`
   - Expected: No rows returned despite data existing (RLS blocks access)
   - Confirms: RLS is enabled but policies are missing

3. **RLS Blocking Login Attempts Test** (will fail on unfixed schema)
   - System attempts `INSERT INTO login_attempts (email, ip_address, success) VALUES ('test@example.com', '127.0.0.1', false)`
   - Expected: Insert fails with permission denied (RLS blocks system operation)
   - Confirms: Rate limiting is broken due to missing RLS policies

4. **RLS Blocking Sessions Test** (will fail on unfixed schema)
   - Authenticated user queries `SELECT * FROM sessions WHERE user_id = auth.uid()`
   - Expected: No rows returned despite session existing (RLS blocks access)
   - Confirms: Session management is broken due to missing RLS policies

**Expected Counterexamples**:
- SECURITY DEFINER function is accessible to unauthorized roles (if function exists)
- RLS-enabled tables block all access including legitimate operations
- System operations (rate limiting, session management) fail due to RLS
- Possible causes: Missing policies, incorrect policy definitions, function misconfiguration

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed schema produces the expected secure behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := applyFixedSchema(input)
  ASSERT expectedSecureBehavior(result)
END FOR
```

**Test Cases**:

1. **SECURITY DEFINER Function Secured**
   - Attempt to call `POST /rest/v1/rpc/rls_auto_enable` as unauthenticated user
   - Expected: 403 Forbidden OR function doesn't exist
   - Validates: Property 1

2. **Audit Logs RLS Policies Work**
   - Authenticated user queries `SELECT * FROM audit_logs WHERE user_id = auth.uid()`
   - Expected: Returns user's audit logs
   - Admin user queries `SELECT * FROM audit_logs`
   - Expected: Returns all audit logs
   - Validates: Property 2 (Requirements 2.7)

3. **Login Attempts RLS Policies Work**
   - System inserts `INSERT INTO login_attempts (email, ip_address, success) VALUES ('test@example.com', '127.0.0.1', false)`
   - Expected: Insert succeeds
   - Authenticated user queries `SELECT * FROM login_attempts WHERE user_id = auth.uid()`
   - Expected: Returns user's login attempts
   - Validates: Property 2 (Requirements 2.8)

4. **Sessions RLS Policies Work**
   - Authenticated user queries `SELECT * FROM sessions WHERE user_id = auth.uid()`
   - Expected: Returns user's sessions
   - Authenticated user deletes `DELETE FROM sessions WHERE id = 'user-session-id'`
   - Expected: Delete succeeds for own session
   - Validates: Property 2 (Requirements 2.9)

5. **Schema Consistency Verified**
   - Deploy schema to fresh database
   - Expected: All tables exist, no migration failures
   - Validates: Property 3

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed schema produces the same result as the original schema.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalSchema(input) = fixedSchema(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED schema first for existing tables and operations, then write property-based tests capturing that behavior.

**Test Cases**:

1. **YouTube Channels RLS Preservation**
   - Observe: User can view/update/delete their own YouTube channels on unfixed schema
   - Test: Verify same behavior on fixed schema
   - Validates: Property 4 (Requirements 3.1, 3.2)

2. **OAuth Tokens RLS Preservation**
   - Observe: User can view/update/delete their own OAuth tokens on unfixed schema
   - Test: Verify same behavior on fixed schema
   - Validates: Property 4

3. **Scheduled Posts RLS Preservation**
   - Observe: User can view/update/delete their own scheduled posts on unfixed schema
   - Test: Verify same behavior on fixed schema
   - Validates: Property 4

4. **Database Functions Preservation**
   - Observe: `archive_old_audit_logs()` executes successfully on unfixed schema
   - Test: Verify same behavior on fixed schema
   - Validates: Property 5 (Requirements 3.5)

5. **Triggers Preservation**
   - Observe: `update_youtube_channel_last_activity` trigger fires on insert to `linking_activity`
   - Test: Verify same behavior on fixed schema
   - Validates: Property 5 (Requirements 3.6)

6. **Foreign Keys Preservation**
   - Observe: Deleting a user cascades to `youtube_channels` on unfixed schema
   - Test: Verify same behavior on fixed schema
   - Validates: Property 6 (Requirements 3.7, 3.8)

7. **Indexes Preservation**
   - Observe: Query performance on `youtube_channels` using indexes on unfixed schema
   - Test: Verify same performance on fixed schema
   - Validates: Property 6 (Requirements 3.9, 3.10)

### Unit Tests

- Test RLS policies for each affected table (`audit_logs`, `login_attempts`, `sessions`, `remember_me_tokens`)
- Test that unauthenticated users cannot access protected data
- Test that authenticated users can access their own data
- Test that admin users can access all data where appropriate
- Test that system operations (inserts, cleanups) work correctly
- Test edge cases (expired sessions, invalid user IDs, null values)

### Property-Based Tests

- Generate random user IDs and verify RLS policies allow access only to own data
- Generate random admin users and verify they can access all data
- Generate random system operations and verify they succeed
- Test that all existing RLS policies continue to work across many scenarios
- Test that foreign key cascades work correctly across many deletion scenarios

### Integration Tests

- Test full authentication flow with session creation and RLS policies
- Test rate limiting with login attempts table and RLS policies
- Test audit logging with audit logs table and RLS policies
- Test that application code works correctly with new RLS policies
- Test that Supabase REST API respects RLS policies
- Test that Supabase Realtime subscriptions respect RLS policies
- Test schema deployment to fresh database (no migration failures)
