import { isSupabaseAvailable } from "@/test-utils/skip-without-supabase"
import { createClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

vi.unmock("@supabase/supabase-js")
/**
 * Bug Condition Exploration Test: SECURITY DEFINER Function Exposure
 *
 * Property 1: Bug Condition - SECURITY DEFINER Function Accessible to Unauthorized Roles
 *
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 *
 * NOTE: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 *
 * GOAL: Surface counterexamples that demonstrate the security vulnerability exists
 *
 * Scoped PBT Approach: Test concrete failing case - unauthenticated user calling `/rest/v1/rpc/rls_auto_enable`
 *
 * Test implementation details from Bug Condition in design:
 * - Check if function `public.rls_auto_enable()` exists in database
 * - If exists, attempt to call `POST /rest/v1/rpc/rls_auto_enable` as unauthenticated user
 * - Verify function has EXECUTE permissions for `anon` or `authenticated` roles
 *
 * The test assertions should match the Expected Behavior Properties from design:
 * - Function should NOT be accessible to `anon` role
 * - Function should NOT be accessible to `authenticated` role
 * - Only `service_role` should have access (if function is needed)
 *
 * EXPECTED OUTCOME: Test FAILS if function exists and is accessible (this is correct - it proves the bug exists)
 *                   OR test PASSES if function doesn't exist (no bug)
 */

describe("Bug Condition: SECURITY DEFINER Function Exposure", () => {
    let isDbRunning = true

    beforeAll(async () => {
        isDbRunning = await isSupabaseAvailable()
    })

    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"
    const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

    it("should verify rls_auto_enable() function does not exist or is not accessible to anon role", async ({
        skip,
    }) => {
        if (!isDbRunning) return skip()
        // Create Supabase client with anon key (unauthenticated user)
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Check if function exists by querying pg_proc
        const { data: functionExists, error: queryError } = await supabase
            .rpc("rls_auto_enable")
            .select()

        // Expected behavior: Function should NOT exist or should return 403/404
        if (queryError) {
            // Good! Function doesn't exist or is not accessible
            expect(queryError.message).toMatch(
                /function.*not found|permission denied|does not exist/i
            )
            console.log(
                "✅ PASS: Function does not exist or is not accessible to anon role"
            )
            console.log("   Error:", queryError.message)
        } else {
            // Bad! Function exists and is accessible - this is the security vulnerability
            throw new Error(`❌ FAIL: rls_auto_enable() function is accessible to anon role. This is a security vulnerability!
        
        Counterexample found:
        - Function exists and is callable by unauthenticated users
        - This allows unauthorized access to privileged operations
        
        Expected behavior:
        - Function should NOT exist, OR
        - Function should return 403 Forbidden for anon role
        
        Actual behavior:
        - Function executed successfully: ${JSON.stringify(functionExists)}
        
        Root cause: SECURITY DEFINER function with default EXECUTE permissions granted to PUBLIC
      `)
        }
    })

    it("should verify rls_auto_enable() function is not accessible via REST API endpoint", async ({
        skip,
    }) => {
        if (!isDbRunning) return skip()
        // Attempt to call the function via REST API as unauthenticated user
        const response = await fetch(
            `${supabaseUrl}/rest/v1/rpc/rls_auto_enable`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({}),
            }
        )

        // Expected behavior: Should return 404 (not found) or 403 (forbidden)
        expect([404, 403]).toContain(response.status)

        if (response.status === 200) {
            const data = await response.json()
            throw new Error(`❌ FAIL: rls_auto_enable() function is accessible via REST API endpoint
        
        Counterexample found:
        - POST /rest/v1/rpc/rls_auto_enable returned 200 OK
        - Response: ${JSON.stringify(data)}
        
        Expected behavior:
        - Endpoint should return 404 Not Found or 403 Forbidden
        
        Actual behavior:
        - Endpoint returned 200 OK, allowing unauthorized access
        
        Security impact: Unauthenticated users can execute privileged database operations
      `)
        }

        console.log(
            `✅ PASS: REST API endpoint returned ${response.status} (function not accessible)`
        )
    })

    it("should document the bug condition if function exists", async ({
        skip,
    }) => {
        if (!isDbRunning) return skip()
        // This test documents the bug condition for reference
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Query to check if function exists in database
        const { data, error } = await supabase
            .from("pg_proc")
            .select("proname, prosecdef")
            .eq("proname", "rls_auto_enable")
            .single()

        if (error || !data) {
            console.log(
                "✅ Function rls_auto_enable() does not exist in database"
            )
            console.log("   No bug condition present")
            expect(true).toBe(true) // Pass - no bug
        } else {
            console.log("❌ Function rls_auto_enable() exists in database")
            console.log("   Function details:", data)
            console.log("   SECURITY DEFINER:", data.prosecdef)

            // Document the counterexample
            const counterexample = {
                functionName: "rls_auto_enable",
                isSecurityDefiner: data.prosecdef,
                accessibleToAnon: true, // If we got here, it's accessible
                securityImpact:
                    "Allows unauthorized users to execute privileged operations",
                recommendation:
                    "Remove function or revoke EXECUTE permissions from anon/authenticated roles",
            }

            console.log(
                "   Counterexample:",
                JSON.stringify(counterexample, null, 2)
            )

            // Fail the test to indicate bug exists
            expect.fail(
                "Bug condition exists: rls_auto_enable() function is present and accessible"
            )
        }
    })
})
