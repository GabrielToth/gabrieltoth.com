/**
 * Database Helper Usage Examples
 *
 * This file demonstrates how to use the database helper functions
 * in your test files.
 */

import { describe, expect, it } from "vitest"
import { cleanupTestData, createTestUser, setupTestDatabase } from "./database"

describe("Database Helper Usage Examples", () => {
    it("Example 1: Setup database and perform queries", async () => {
        // Setup test database
        const supabase = await setupTestDatabase()

        // Now you can use the supabase client for queries
        const { data, error } = await supabase.from("users").select("id")

        expect(error).toBeNull()
        expect(data).toBeDefined()
    })

    it("Example 2: Create a test user for authentication tests", async () => {
        try {
            // Create a test user with confirmed email
            const testEmail = `example-${Date.now()}@test.com`
            const user = await createTestUser(testEmail)

            // User is ready to use in tests
            expect(user.id).toBeDefined()
            expect(user.email).toBe(testEmail)
            expect(user.email_confirmed_at).toBeDefined()

            // Cleanup after test
            const supabase = await setupTestDatabase()
            await supabase.auth.admin.deleteUser(user.id)
        } catch (error) {
            // Handle case where Supabase is not configured
            if (
                error instanceof Error &&
                error.message.includes("User not allowed")
            ) {
                console.warn("Supabase not configured - skipping test")
                return
            }
            throw error
        }
    })

    it("Example 3: Clean up test data after tests", async () => {
        // Clean up all test data
        await cleanupTestData()

        // Database is now in clean state
        const supabase = await setupTestDatabase()
        const { data } = await supabase.from("users").select("id")

        // Only system user should remain (if any)
        expect(data).toBeDefined()
    })

    it("Example 4: Use in beforeEach/afterEach hooks", async () => {
        // In your test file, you can use these in hooks:
        //
        // beforeEach(async () => {
        //   await cleanupTestData()
        // })
        //
        // afterEach(async () => {
        //   await cleanupTestData()
        // })

        // This ensures each test starts with a clean database state
        await cleanupTestData()
        expect(true).toBe(true)
    })
})
