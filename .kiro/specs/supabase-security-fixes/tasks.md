# Implementation Plan

## Phase 1: Bug Condition Exploration Tests (BEFORE Fix)

- [x] 1. Write bug condition exploration test for SECURITY DEFINER function exposure
  - **Property 1: Bug Condition** - SECURITY DEFINER Function Accessible to Unauthorized Roles
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the security vulnerability exists
  - **Scoped PBT Approach**: Test concrete failing case - unauthenticated user calling `/rest/v1/rpc/rls_auto_enable`
  - Test implementation details from Bug Condition in design:
    - Check if function `public.rls_auto_enable()` exists in database
    - If exists, attempt to call `POST /rest/v1/rpc/rls_auto_enable` as unauthenticated user
    - Verify function has EXECUTE permissions for `anon` or `authenticated` roles
  - The test assertions should match the Expected Behavior Properties from design:
    - Function should NOT be accessible to `anon` role
    - Function should NOT be accessible to `authenticated` role
    - Only `service_role` should have access (if function is needed)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS if function exists and is accessible (this is correct - it proves the bug exists) OR test PASSES if function doesn't exist (no bug)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and result is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 2. Write bug condition exploration test for RLS blocking audit logs
  - **Property 1: Bug Condition** - RLS Blocks Legitimate Audit Log Access
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate RLS is blocking legitimate access
  - **Scoped PBT Approach**: Test concrete failing case - authenticated user querying their own audit logs
  - Test implementation details from Bug Condition in design:
    - Create test audit log entry for authenticated user
    - Attempt to query `SELECT * FROM audit_logs WHERE user_id = auth.uid()`
    - Verify query returns no rows despite data existing
  - The test assertions should match the Expected Behavior Properties from design:
    - Authenticated users should be able to view their own audit logs
    - Admin users should be able to view all audit logs
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (query returns no rows) - this confirms RLS is blocking access
  - Document counterexamples found (e.g., "User cannot view their own audit logs despite having user_id match")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.3, 1.4, 2.7_

- [x] 3. Write bug condition exploration test for RLS blocking login attempts
  - **Property 1: Bug Condition** - RLS Blocks Login Attempt Inserts for Rate Limiting
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate rate limiting is broken
  - **Scoped PBT Approach**: Test concrete failing case - system inserting login attempt record
  - Test implementation details from Bug Condition in design:
    - Attempt to insert into `login_attempts` table: `INSERT INTO login_attempts (email, ip_address, success) VALUES ('test@example.com', '127.0.0.1', false)`
    - Verify insert fails with permission denied error
  - The test assertions should match the Expected Behavior Properties from design:
    - System should be able to insert login attempts (for rate limiting)
    - Users should be able to view their own login attempts
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (insert is blocked by RLS) - this confirms rate limiting is broken
  - Document counterexamples found (e.g., "System cannot insert login attempts, breaking rate limiting functionality")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.5, 2.8_

- [x] 4. Write bug condition exploration test for RLS blocking sessions
  - **Property 1: Bug Condition** - RLS Blocks Session Management Operations
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate session management is broken
  - **Scoped PBT Approach**: Test concrete failing case - authenticated user querying their own sessions
  - Test implementation details from Bug Condition in design:
    - Create test session for authenticated user
    - Attempt to query `SELECT * FROM sessions WHERE user_id = auth.uid()`
    - Verify query returns no rows despite session existing
  - The test assertions should match the Expected Behavior Properties from design:
    - Users should be able to view their own sessions
    - Users should be able to manage (insert, update, delete) their own sessions
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (query returns no rows) - this confirms session management is broken
  - Document counterexamples found (e.g., "User cannot view their own sessions despite having user_id match")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.6, 2.9_

## Phase 2: Preservation Property Tests (BEFORE Fix)

- [x] 5. Write preservation property tests for existing RLS policies
  - **Property 2: Preservation** - Existing RLS Policies Continue to Work
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for tables with existing RLS policies:
    - `youtube_channels`: Users can view/update/delete their own channels
    - `oauth_tokens`: Users can view/update/delete their own tokens
    - `scheduled_posts`: Users can view/update/delete their own posts
    - `social_networks`: Users can view/update/delete their own networks
    - `publication_history`: Users can view/update/delete their own history
    - `network_groups`: Users can view/update/delete their own groups
    - `user_preferences`: Users can view/update/delete their own preferences
    - `linking_activity`: Users can view their own activity (immutable)
    - `recovery_tokens`: System can manage tokens
    - `unlink_revocation_window`: Users can view their own windows
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2_

- [x] 6. Write preservation property tests for database functions
  - **Property 2: Preservation** - Database Functions Continue to Execute
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for existing functions:
    - `archive_old_audit_logs()`: Archives audit logs older than 2 years
    - `archive_old_linking_activity()`: Archives linking activity older than 2 years
    - `cleanup_expired_recovery_tokens()`: Deletes expired recovery tokens
    - `cleanup_expired_unlink_revocation_windows()`: Marks expired revocation windows
    - `update_youtube_channel_last_activity()`: Trigger updates last activity timestamp
    - `update_youtube_channel_updated_at()`: Trigger updates updated_at timestamp
  - Write property-based tests capturing observed behavior patterns
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.5, 3.6_

- [x] 7. Write preservation property tests for foreign keys and triggers
  - **Property 2: Preservation** - Foreign Keys and Triggers Continue to Work
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code:
    - Foreign key cascades: Deleting user cascades to youtube_channels
    - Foreign key cascades: Deleting youtube_channel cascades to linking_activity
    - Triggers: Insert into linking_activity updates youtube_channels.last_activity_at
    - Triggers: Update on youtube_channels updates updated_at timestamp
  - Write property-based tests capturing observed behavior patterns
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.7, 3.8_

- [x] 8. Write preservation property tests for indexes and performance
  - **Property 2: Preservation** - Indexes Continue to Optimize Queries
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code:
    - Query performance on youtube_channels using indexes
    - Query performance on audit_logs using indexes
    - Query performance on linking_activity using indexes
  - Write property-based tests capturing observed performance patterns
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline performance to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.9, 3.10_

## Phase 3: Implementation

- [x] 9. Fix Supabase security vulnerabilities

  - [x] 9.1 Remove SECURITY DEFINER function (if exists)
    - Check if `public.rls_auto_enable()` function exists in current schema
    - If exists, remove it entirely from `supabase/schema.sql`
    - Add SQL comment documenting removal reason
    - _Bug_Condition: functionExists('public.rls_auto_enable') AND hasExecutePermission('public.rls_auto_enable', 'anon')_
    - _Expected_Behavior: Function does not exist OR function is not accessible to anon/authenticated roles_
    - _Preservation: All other database functions must continue to work_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

  - [x] 9.2 Add RLS policies for audit_logs table
    - Verify `audit_logs` table exists in schema (it does)
    - Add policy: "Users can view their own audit logs" - `FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role')::text = 'admin'))`
    - Verify existing policies are preserved: "System can insert audit logs", "Audit logs are immutable", "Audit logs cannot be deleted"
    - _Bug_Condition: tableHasRLS('audit_logs') AND NOT hasPolicies('audit_logs')_
    - _Expected_Behavior: Users can view their own audit logs, admins can view all logs_
    - _Preservation: Existing audit log policies must remain unchanged_
    - _Requirements: 1.3, 1.4, 2.7, 3.1_

  - [x] 9.3 Add RLS policies for login_attempts table
    - Verify `login_attempts` table exists in schema (it does - at end of schema.sql)
    - Enable RLS: `ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;`
    - Add policy: "System can insert login attempts" - `FOR INSERT WITH CHECK (true)`
    - Add policy: "Users can view their own login attempts" - `FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role')::text = 'admin'))`
    - Add policy: "Login attempts are immutable" - `FOR UPDATE USING (false)`
    - Add policy: "Login attempts cannot be deleted by users" - `FOR DELETE USING (auth.uid() IN (SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role')::text = 'admin'))`
    - _Bug_Condition: tableHasRLS('login_attempts') AND NOT hasPolicies('login_attempts')_
    - _Expected_Behavior: System can insert login attempts, users can view their own attempts_
    - _Preservation: No existing policies to preserve (new table)_
    - _Requirements: 1.5, 2.8_

  - [x] 9.4 Add RLS policies for sessions table
    - Verify `sessions` table exists in schema (it does - at end of schema.sql)
    - Enable RLS: `ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;`
    - Add policy: "Users can view their own sessions" - `FOR SELECT USING (auth.uid() = user_id)`
    - Add policy: "System can insert sessions" - `FOR INSERT WITH CHECK (auth.uid() = user_id)`
    - Add policy: "Users can update their own sessions" - `FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
    - Add policy: "Users can delete their own sessions" - `FOR DELETE USING (auth.uid() = user_id)`
    - Add policy: "System can cleanup expired sessions" - `FOR DELETE USING (expires_at < NOW())`
    - _Bug_Condition: tableHasRLS('sessions') AND NOT hasPolicies('sessions')_
    - _Expected_Behavior: Users can manage their own sessions, system can cleanup expired sessions_
    - _Preservation: No existing policies to preserve (new table)_
    - _Requirements: 1.6, 2.9_

  - [x] 9.5 Add RLS policies for remember_me_tokens table
    - Verify `remember_me_tokens` table exists in schema (it does - at end of schema.sql, incomplete in truncated view)
    - Enable RLS: `ALTER TABLE public.remember_me_tokens ENABLE ROW LEVEL SECURITY;`
    - Add policy: "Users can view their own remember me tokens" - `FOR SELECT USING (auth.uid() = user_id)`
    - Add policy: "System can insert remember me tokens" - `FOR INSERT WITH CHECK (auth.uid() = user_id)`
    - Add policy: "Users can delete their own remember me tokens" - `FOR DELETE USING (auth.uid() = user_id)`
    - Add policy: "System can cleanup expired tokens" - `FOR DELETE USING (expires_at < NOW())`
    - _Bug_Condition: tableHasRLS('remember_me_tokens') AND NOT hasPolicies('remember_me_tokens')_
    - _Expected_Behavior: Users can manage their own tokens, system can cleanup expired tokens_
    - _Preservation: No existing policies to preserve (new table)_
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 9.6 Delete old migration files
    - Delete `supabase/migrations/20260428_add_login_infrastructure.sql`
    - Delete `supabase/migrations/20260430_create_unified_auth_schema.sql`
    - Delete `supabase/migrations/fix_security_issues.sql`
    - Rationale: Schema dump approach - single `schema.sql` is source of truth
    - _Bug_Condition: Migration files reference tables not in schema.sql_
    - _Expected_Behavior: Single authoritative schema.sql file_
    - _Preservation: No migrations to preserve_
    - _Requirements: 1.7, 2.10, 2.11_

  - [x] 9.7 Verify SECURITY DEFINER exploration test now passes
    - **Property 1: Expected Behavior** - SECURITY DEFINER Function Not Accessible
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms function is removed or secured)
    - _Requirements: Expected Behavior Properties from design - 2.1, 2.2, 2.3_

  - [x] 9.8 Verify audit logs exploration test now passes
    - **Property 1: Expected Behavior** - Audit Logs Accessible to Users
    - **IMPORTANT**: Re-run the SAME test from task 2 - do NOT write a new test
    - The test from task 2 encodes the expected behavior
    - When this test passes, it confirms users can access their audit logs
    - Run bug condition exploration test from step 2
    - **EXPECTED OUTCOME**: Test PASSES (confirms RLS policies allow access)
    - _Requirements: Expected Behavior Properties from design - 2.7_

  - [x] 9.9 Verify login attempts exploration test now passes
    - **Property 1: Expected Behavior** - Login Attempts Insertable by System
    - **IMPORTANT**: Re-run the SAME test from task 3 - do NOT write a new test
    - The test from task 3 encodes the expected behavior
    - When this test passes, it confirms rate limiting works
    - Run bug condition exploration test from step 3
    - **EXPECTED OUTCOME**: Test PASSES (confirms RLS policies allow inserts)
    - _Requirements: Expected Behavior Properties from design - 2.8_

  - [x] 9.10 Verify sessions exploration test now passes
    - **Property 1: Expected Behavior** - Sessions Accessible to Users
    - **IMPORTANT**: Re-run the SAME test from task 4 - do NOT write a new test
    - The test from task 4 encodes the expected behavior
    - When this test passes, it confirms session management works
    - Run bug condition exploration test from step 4
    - **EXPECTED OUTCOME**: Test PASSES (confirms RLS policies allow access)
    - _Requirements: Expected Behavior Properties from design - 2.9_

  - [x] 9.11 Verify preservation tests still pass
    - **Property 2: Preservation** - All Existing Functionality Preserved
    - **IMPORTANT**: Re-run the SAME tests from tasks 5-8 - do NOT write new tests
    - Run preservation property tests from steps 5-8:
      - Existing RLS policies (task 5)
      - Database functions (task 6)
      - Foreign keys and triggers (task 7)
      - Indexes and performance (task 8)
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: Preservation Requirements from design - 3.1, 3.2, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

## Phase 4: Verification and Deployment

- [x] 10. Checkpoint - Ensure all tests pass
  - Run all exploration tests (tasks 1-4) - should now PASS
  - Run all preservation tests (tasks 5-8) - should still PASS
  - Verify no test failures
  - If any test fails, investigate and fix before proceeding
  - Ask the user if questions arise

- [x] 11. Generate TypeScript types from updated schema
  - Run: `npx supabase gen types typescript --local > src/types/supabase.ts`
  - Verify file was created and contains updated types
  - Run: `npm run type-check` to verify TypeScript compilation
  - _Requirements: Database migration workflow from best-practices.md_

- [x] 12. Apply schema to local Supabase instance
  - Run: `npx supabase db reset` to apply complete schema
  - Verify all tables exist
  - Verify all RLS policies are applied
  - Verify SECURITY DEFINER function is removed or secured
  - Run: `npm run test` to verify application tests pass
  - _Requirements: 2.10, 2.11_

- [-] 13. Commit changes with descriptive message
  - Stage files: `git add supabase/schema.sql src/types/supabase.ts`
  - Remove old migrations: `git rm supabase/migrations/*.sql`
  - Commit: `git commit -m "fix(#issue): secure Supabase database with RLS policies and remove SECURITY DEFINER function"`
  - Include in commit message:
    - Removed SECURITY DEFINER function (if existed)
    - Added RLS policies for audit_logs, login_attempts, sessions, remember_me_tokens
    - Replaced migrations with schema dump
    - Generated TypeScript types
  - _Requirements: Commit workflow from best-practices.md_

- [~] 14. Documentation and deployment preparation
  - Update `.agent/SUPABASE_DEPLOYMENT_GUIDE.md` if needed
  - Document RLS policy changes
  - Document security improvements
  - Prepare deployment checklist for production
  - _Requirements: Documentation best practices_
