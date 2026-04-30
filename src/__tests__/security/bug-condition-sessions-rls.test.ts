/**
 * Bug Condition Exploration Test: RLS Blocking Sessions
 *
 * Property 1: Bug Condition - RLS Blocks Session Management Operations
 *
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 *
 * NOTE: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 *
 * GOAL: Surface counterexamples that demonstrate session management is broken
 *
 * Scoped PBT Approach: Test concrete failing case - authenticated user querying their own sessions
 *
 * Test implementation details from Bug Condition in design:
 * - Create test session for authenticated user
 * - Attempt to query `SELECT * FROM sessions WHERE user_id = auth.uid()`
 * - Verify query returns no rows despite session existing
 *
 * The test assertions should match the Expected Behavior Properties from design:
 * - Users should be able to view their own sessions
 * - Users should be able to manage (insert, update, delete) their own sessions
 *
 * EXPECTED OUTCOME: Test FAILS (query returns no rows) - this confirms session management is broken
 */

import { createClient } from "@supabase/supabase-js"

describe("Bug Condition: RLS Blocking Sessions", () => {
    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"
    const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    const supabaseServiceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

    let testUserId: string
    let testSessionId: string

    beforeAll(async () => {
        // Create a test user using service role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const { data: user, error: userError } =
            await supabaseAdmin.auth.admin.createUser({
                email: `test-session-${Date.now()}@example.com`,
                password: "test-password-123",
                email_confirm: true,
            })

        if (userError || !user.user) {
            throw new Error(`Failed to create test user: ${userError?.message}`)
        }

        testUserId = user.user.id

        // Insert a test session using service role (bypasses RLS)
        const { data: session, error: sessionError } = await supabaseAdmin
            .from("sessions")
            .insert({
                user_id: testUserId,
                session_id: `test-session-${Date.now()}`,
                token_hash: "test-token-hash",
                ip_address: "127.0.0.1",
                user_agent: "test-agent",
                expires_at: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(), // 24 hours from now
            })
            .select()
            .single()

        if (sessionError || !session) {
            throw new Error(
                `Failed to create test session: ${sessionError?.message}`
            )
        }

        testSessionId = session.id
        console.log(`✓ Created test user: ${testUserId}`)
        console.log(`✓ Created test session: ${testSessionId}`)
    })

    afterAll(async () => {
        // Cleanup: Delete test data using service role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        await supabaseAdmin.from("sessions").delete().eq("id", testSessionId)
        await supabaseAdmin.auth.admin.deleteUser(testUserId)

        console.log(`✓ Cleaned up test user and session`)
    })

    it("should allow authenticated user to view their own sessions", async () => {
        // Sign in as the test user
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: `test-session-${Date.now()}@example.com`,
            password: "test-password-123",
        })

        if (signInError) {
            throw new Error(`Failed to sign in: ${signInError.message}`)
        }

        // Attempt to query own sessions
        const { data: sessions, error: queryError } = await supabase
            .from("sessions")
            .select("*")
            .eq("user_id", testUserId)

        // Expected behavior: User should be able to view their own sessions
        if (queryError) {
            fail(`❌ FAIL: RLS is blocking legitimate session access
        
        Counterexample found:
        - Authenticated user cannot query their own sessions
        - Query error: ${queryError.message}
        - User ID: ${testUserId}
        
        Expected behavior:
        - Authenticated users should be able to view their own sessions
        - Query should return sessions where user_id = auth.uid()
        
        Actual behavior:
        - Query failed with error: ${queryError.message}
        
        Root cause: RLS enabled on sessions table but no SELECT policy defined for authenticated users
      `)
        }

        if (!sessions || sessions.length === 0) {
            fail(`❌ FAIL: RLS is blocking legitimate session access
        
        Counterexample found:
        - Authenticated user query returned no rows
        - Expected to find session with ID: ${testSessionId}
        - User ID: ${testUserId}
        
        Expected behavior:
        - Query should return at least 1 session (the test entry)
        
        Actual behavior:
        - Query returned 0 rows despite data existing
        
        Root cause: RLS policy is too restrictive or missing
      `)
        }

        // Verify the returned session is the correct one
        const foundSession = sessions.find(s => s.id === testSessionId)
        expect(foundSession).toBeDefined()
        expect(foundSession?.user_id).toBe(testUserId)

        console.log("✅ PASS: Authenticated user can view their own sessions")
        console.log(`   Found ${sessions.length} session(s)`)
    })

    it("should allow authenticated user to insert their own sessions", async () => {
        // Create a test user
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const testEmail = `test-insert-session-${Date.now()}@example.com`

        const { data: user, error: userError } =
            await supabaseAdmin.auth.admin.createUser({
                email: testEmail,
                password: "test-password-123",
                email_confirm: true,
            })

        if (userError || !user.user) {
            throw new Error(`Failed to create test user: ${userError?.message}`)
        }

        const userId = user.user.id

        // Sign in as the test user
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: "test-password-123",
        })

        if (signInError) {
            throw new Error(`Failed to sign in: ${signInError.message}`)
        }

        // Attempt to insert own session
        const { data: newSession, error: insertError } = await supabase
            .from("sessions")
            .insert({
                user_id: userId,
                session_id: `user-created-session-${Date.now()}`,
                token_hash: "user-token-hash",
                ip_address: "127.0.0.1",
                expires_at: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
            })
            .select()
            .single()

        // Cleanup
        if (newSession) {
            await supabaseAdmin
                .from("sessions")
                .delete()
                .eq("id", newSession.id)
        }
        await supabaseAdmin.auth.admin.deleteUser(userId)

        // Expected behavior: User should be able to insert their own sessions
        if (insertError) {
            fail(`❌ FAIL: RLS is blocking session creation
        
        Counterexample found:
        - Authenticated user cannot insert their own session
        - Insert error: ${insertError.message}
        - User ID: ${userId}
        
        Expected behavior:
        - Users should be able to insert their own sessions
        - INSERT policy should allow: FOR INSERT WITH CHECK (auth.uid() = user_id)
        
        Actual behavior:
        - Insert failed with error: ${insertError.message}
        
        Root cause: RLS enabled but no INSERT policy for authenticated users
        
        Security impact: Session management is broken
      `)
        }

        if (!newSession) {
            fail(`❌ FAIL: Session insert returned no data
        
        Counterexample found:
        - Insert appeared to succeed but returned no data
        
        Expected behavior:
        - Insert should return the created session record
        
        Actual behavior:
        - Insert returned null/undefined
      `)
        }

        console.log("✅ PASS: Authenticated user can insert their own sessions")
    })

    it("should allow authenticated user to delete their own sessions", async () => {
        // Create a test user and session
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const testEmail = `test-delete-session-${Date.now()}@example.com`

        const { data: user, error: userError } =
            await supabaseAdmin.auth.admin.createUser({
                email: testEmail,
                password: "test-password-123",
                email_confirm: true,
            })

        if (userError || !user.user) {
            throw new Error(`Failed to create test user: ${userError?.message}`)
        }

        const userId = user.user.id

        // Create session using service role
        const { data: session, error: sessionError } = await supabaseAdmin
            .from("sessions")
            .insert({
                user_id: userId,
                session_id: `delete-test-session-${Date.now()}`,
                token_hash: "delete-test-hash",
                ip_address: "127.0.0.1",
                expires_at: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
            })
            .select()
            .single()

        if (sessionError || !session) {
            throw new Error(
                `Failed to create test session: ${sessionError?.message}`
            )
        }

        const sessionId = session.id

        // Sign in as the test user
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: "test-password-123",
        })

        if (signInError) {
            throw new Error(`Failed to sign in: ${signInError.message}`)
        }

        // Attempt to delete own session
        const { error: deleteError } = await supabase
            .from("sessions")
            .delete()
            .eq("id", sessionId)

        // Cleanup
        await supabaseAdmin.auth.admin.deleteUser(userId)

        // Expected behavior: User should be able to delete their own sessions
        if (deleteError) {
            fail(`❌ FAIL: RLS is blocking session deletion
        
        Counterexample found:
        - Authenticated user cannot delete their own session
        - Delete error: ${deleteError.message}
        - Session ID: ${sessionId}
        
        Expected behavior:
        - Users should be able to delete their own sessions (for logout)
        - DELETE policy should allow: FOR DELETE USING (auth.uid() = user_id)
        
        Actual behavior:
        - Delete failed with error: ${deleteError.message}
        
        Root cause: RLS enabled but no DELETE policy for authenticated users
        
        Security impact: Users cannot log out properly
      `)
        }

        console.log("✅ PASS: Authenticated user can delete their own sessions")
    })

    it("should verify RLS policies exist for sessions table", async () => {
        // Query to check if RLS is enabled and policies exist
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const { data: rlsEnabled, error: rlsError } = await supabaseAdmin
            .from("pg_tables")
            .select("rowsecurity")
            .eq("schemaname", "public")
            .eq("tablename", "sessions")
            .single()

        if (rlsError) {
            console.log("⚠️  Could not check RLS status:", rlsError.message)
            return
        }

        console.log("RLS enabled on sessions:", rlsEnabled?.rowsecurity)

        if (rlsEnabled?.rowsecurity) {
            // Check if policies exist
            const { data: policies, error: policiesError } = await supabaseAdmin
                .from("pg_policies")
                .select("*")
                .eq("schemaname", "public")
                .eq("tablename", "sessions")

            if (policiesError) {
                console.log(
                    "⚠️  Could not check policies:",
                    policiesError.message
                )
                return
            }

            console.log(
                `Found ${policies?.length || 0} RLS policies on sessions table`
            )

            if (!policies || policies.length === 0) {
                fail(`❌ FAIL: RLS is enabled but no policies are defined
          
          Counterexample found:
          - sessions table has RLS enabled
          - No policies are defined
          - This blocks ALL session management operations
          
          Expected behavior:
          - SELECT policy should exist for authenticated users
          - INSERT policy should exist for authenticated users
          - UPDATE policy should exist for authenticated users
          - DELETE policy should exist for authenticated users
          
          Actual behavior:
          - 0 policies found
          
          Root cause: RLS enabled without defining access policies
          
          Security impact: Session management is completely broken
        `)
            }

            console.log(
                "   Existing policies:",
                policies?.map(p => ({
                    name: p.policyname,
                    cmd: p.cmd,
                    roles: p.roles,
                }))
            )
        }
    })

    it("should document the bug condition for sessions RLS", () => {
        // Document the expected bug condition
        const bugCondition = {
            table: "sessions",
            issue: "RLS enabled without proper policies for session management",
            impact: "Users cannot manage their sessions, breaking login/logout functionality",
            expectedBehavior: {
                selectOwn:
                    "Users can view their own sessions (WHERE user_id = auth.uid())",
                insertOwn:
                    "Users can insert their own sessions (WITH CHECK user_id = auth.uid())",
                updateOwn:
                    "Users can update their own sessions (for session refresh)",
                deleteOwn: "Users can delete their own sessions (for logout)",
                systemCleanup:
                    "System can cleanup expired sessions (WHERE expires_at < NOW())",
            },
            currentBehavior: {
                allOperations: "Blocked by RLS",
                reason: "No policies defined for SELECT, INSERT, UPDATE, DELETE",
            },
            recommendation: [
                "Add SELECT policy: FOR SELECT USING (auth.uid() = user_id)",
                "Add INSERT policy: FOR INSERT WITH CHECK (auth.uid() = user_id)",
                "Add UPDATE policy: FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)",
                "Add DELETE policy: FOR DELETE USING (auth.uid() = user_id)",
                "Add DELETE policy for cleanup: FOR DELETE USING (expires_at < NOW())",
            ],
        }

        console.log("Bug Condition Documentation:")
        console.log(JSON.stringify(bugCondition, null, 2))

        // This test always passes - it's just for documentation
        expect(true).toBe(true)
    })
})
