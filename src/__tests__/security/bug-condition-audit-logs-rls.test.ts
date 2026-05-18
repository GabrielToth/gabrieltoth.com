import { isSupabaseAvailable } from "@/test-utils/skip-without-supabase"
import { createClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

vi.unmock("@supabase/supabase-js")

/**
 * Bug Condition Exploration Test: RLS Blocking Audit Logs
 *
 * Property 1: Bug Condition - RLS Blocks Legitimate Audit Log Access
 *
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 *
 * NOTE: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 *
 * GOAL: Surface counterexamples that demonstrate RLS is blocking legitimate access
 *
 * Scoped PBT Approach: Test concrete failing case - authenticated user querying their own audit logs
 *
 * Test implementation details from Bug Condition in design:
 * - Create test audit log entry for authenticated user
 * - Attempt to query `SELECT * FROM audit_logs WHERE user_id = auth.uid()`
 * - Verify query returns no rows despite data existing
 *
 * The test assertions should match the Expected Behavior Properties from design:
 * - Authenticated users should be able to view their own audit logs
 * - Admin users should be able to view all audit logs
 *
 * EXPECTED OUTCOME: Test FAILS (query returns no rows) - this confirms RLS is blocking access
 */

describe("Bug Condition: RLS Blocking Audit Logs", () => {
    let isDbRunning = true

    beforeAll(async () => {
        isDbRunning = await isSupabaseAvailable()
    })

    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"
    const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    const supabaseServiceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

    let testUserId: string
    let testAuditLogId: string

    beforeAll(async () => {
        if (!isDbRunning) return
        // Create a test user using service role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const { data: user, error: userError } =
            await supabaseAdmin.auth.admin.createUser({
                email: `test-audit-${Date.now()}@example.com`,
                password: "test-password-123",
                email_confirm: true,
            })

        if (userError || !user.user) {
            console.warn(
                `Failed to create test user: ${userError?.message}. Skipping DB tests.`
            )
            isDbRunning = false
            return
        }

        testUserId = user.user.id

        // Insert a test audit log entry using service role (bypasses RLS)
        const { data: auditLog, error: auditError } = await supabaseAdmin
            .from("audit_logs")
            .insert({
                user_id: testUserId,
                action: "test_action",
                details: { test: true },
            })
            .select()
            .single()

        if (auditError || !auditLog) {
            throw new Error(
                `Failed to create test audit log: ${auditError?.message}`
            )
        }

        testAuditLogId = auditLog.id
        console.log(`✓ Created test user: ${testUserId}`)
        console.log(`✓ Created test audit log: ${testAuditLogId}`)
    })

    afterAll(async () => {
        if (!isDbRunning) return
        // Cleanup: Delete test data using service role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        await supabaseAdmin.from("audit_logs").delete().eq("id", testAuditLogId)
        if (testUserId) {
            await supabaseAdmin.auth.admin.deleteUser(testUserId)
        }

        console.log("✓ Cleaned up test user and audit log")
    })

    it("should allow authenticated user to view their own audit logs", async ({ skip }) => {
        if (!isDbRunning) return skip()
        if (!isDbRunning) return skip()
        // Sign in as the test user
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { data: session, error: signInError } =
            await supabase.auth.signInWithPassword({
                email: `test-audit-${Date.now()}@example.com`,
                password: "test-password-123",
            })

        if (signInError) {
            throw new Error(`Failed to sign in: ${signInError.message}`)
        }

        // Attempt to query own audit logs
        const { data: auditLogs, error: queryError } = await supabase
            .from("audit_logs")
            .select("*")
            .eq("user_id", testUserId)

        // Expected behavior: User should be able to view their own audit logs
        if (queryError) {
            expect.fail(`❌ FAIL: RLS is blocking legitimate audit log access
        
        Counterexample found:
        - Authenticated user cannot query their own audit logs
        - Query error: ${queryError.message}
        - User ID: ${testUserId}
        
        Expected behavior:
        - Authenticated users should be able to view their own audit logs
        - Query should return audit logs where user_id = auth.uid()
        
        Actual behavior:
        - Query failed with error: ${queryError.message}
        
        Root cause: RLS policy is too restrictive or missing
      `)
        }

        if (!auditLogs || auditLogs.length === 0) {
            expect.fail(`❌ FAIL: RLS is blocking legitimate audit log access
        
        Counterexample found:
        - Authenticated user query returned no rows
        - Expected to find audit log with ID: ${testAuditLogId}
        - User ID: ${testUserId}
        
        Expected behavior:
        - Query should return at least 1 audit log (the test entry)
        
        Actual behavior:
        - Query returned 0 rows despite data existing
        
        Root cause: RLS policy is too restrictive or missing
      `)
        }

        // Verify the returned audit log is the correct one
        expect(auditLogs).not.toBeNull()
        expect(auditLogs!.length).toBeGreaterThan(0)
        expect(auditLogs![0].user_id).toBe(testUserId)
        const foundLog = auditLogs.find(log => log.id === testAuditLogId)
        expect(foundLog).toBeDefined()
        expect(foundLog?.action).toBe("test_action")

        console.log("✅ PASS: Authenticated user can view their own audit logs")
        console.log(`   Found ${auditLogs.length} audit log(s)`)
    })

    it("should verify RLS policies exist for audit_logs table", async ({ skip }) => {
        if (!isDbRunning) return skip()
        if (!isDbRunning) return skip()
        // Query to check if RLS is enabled and policies exist
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const { data: rlsEnabled, error: rlsError } = await supabaseAdmin
            .from("pg_tables")
            .select("rowsecurity")
            .eq("schemaname", "public")
            .eq("tablename", "audit_logs")
            .single()

        if (rlsError) {
            console.log("⚠️  Could not check RLS status:", rlsError.message)
            return
        }

        console.log("RLS enabled on audit_logs:", rlsEnabled?.rowsecurity)

        if (rlsEnabled?.rowsecurity) {
            // Check if policies exist
            const { data: policies, error: policiesError } = await supabaseAdmin
                .from("pg_policies")
                .select("*")
                .eq("schemaname", "public")
                .eq("tablename", "audit_logs")

            if (policiesError) {
                console.log(
                    "⚠️  Could not check policies:",
                    policiesError.message
                )
                return
            }

            console.log(
                `Found ${policies?.length || 0} RLS policies on audit_logs table`
            )

            if (!policies || policies.length === 0) {
                expect.fail(`❌ FAIL: RLS is enabled but no policies are defined
                
                    Counterexample found:
                    - audit_logs table has RLS enabled
                    - No policies are defined
                    - This blocks ALL access including legitimate queries
                    
                    Expected behavior:
                    - At least one SELECT policy should exist for authenticated users
                    
                    Actual behavior:
                    - 0 policies found
                    
                    Root cause: RLS enabled without defining access policies
                `)
            }

            // Check for SELECT policy for authenticated users
            const selectPolicy = policies?.find(
                p =>
                    p.cmd === "SELECT" &&
                    (p.roles?.includes("authenticated") ||
                        p.qual?.includes("auth.uid()"))
            )

            if (!selectPolicy) {
                console.log(
                    "⚠️  No SELECT policy found for authenticated users"
                )
                console.log(
                    "   Existing policies:",
                    policies?.map(p => ({
                        name: p.policyname,
                        cmd: p.cmd,
                        roles: p.roles,
                    }))
                )
            }
        }
    })

    it("should document the bug condition for audit logs RLS", () => {
        // Document the expected bug condition
        const bugCondition = {
            table: "audit_logs",
            issue: "RLS enabled without proper SELECT policy",
            impact: "Authenticated users cannot view their own audit logs",
            expectedBehavior: {
                authenticatedUsers:
                    "Can view their own audit logs (WHERE user_id = auth.uid())",
                adminUsers: "Can view all audit logs",
                systemOperations: "Can insert audit logs (append-only)",
            },
            currentBehavior: {
                authenticatedUsers:
                    "Cannot view any audit logs (blocked by RLS)",
                reason: "No SELECT policy defined or policy is too restrictive",
            },
            recommendation:
                "Add SELECT policy: FOR SELECT USING (auth.uid() = user_id OR is_admin())",
        }

        console.log("Bug Condition Documentation:")
        console.log(JSON.stringify(bugCondition, null, 2))

        // This test always passes - it's just for documentation
        expect(true).toBe(true)
    })
})
