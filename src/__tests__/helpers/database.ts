/**
 * Test Database Helper
 *
 * Provides reusable database utilities for test setup and cleanup,
 * ensuring tests have a clean database state.
 *
 * @module test-helpers/database
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * Setup test database with clean state
 *
 * Creates a Supabase client with service role key and cleans up test data.
 *
 * @returns {Promise<SupabaseClient>} Configured Supabase client with admin privileges
 * @throws {Error} If required environment variables are missing
 *
 * @example
 * ```typescript
 * const supabase = await setupTestDatabase()
 * // Use supabase client for test operations
 * ```
 */
export async function setupTestDatabase(): Promise<SupabaseClient> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
            "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        )
    }

    // Create Supabase client with service role key (admin privileges)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Clean up test data
    await cleanupTestData(supabase)

    return supabase
}

/**
 * Create a test user with confirmed email
 *
 * Uses admin API to create a user with email already confirmed,
 * bypassing the email verification flow for testing.
 *
 * @param {string} email - Email address for the test user
 * @returns {Promise<any>} Created user object
 * @throws {Error} If user creation fails
 *
 * @example
 * ```typescript
 * const user = await createTestUser('test@example.com')
 * console.log(user.id) // UUID of created user
 * ```
 */
export async function createTestUser(email: string): Promise<any> {
    const supabase = await setupTestDatabase()

    const { data, error } = await supabase
        .from("users")
        .insert({
            email: email.toLowerCase(),
            name: "Test User",
            phone: "+5511999999999",
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create test user: ${error.message}`)
    }

    return data
}

/**
 * Clean up test data from database
 *
 * Deletes all test users, sessions, and resets sequences if needed.
 * Preserves the system user (00000000-0000-0000-0000-000000000000).
 *
 * @param {SupabaseClient} [supabase] - Optional Supabase client. If not provided, creates a new one.
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await cleanupTestData()
 * // All test data removed from database
 * ```
 */
export async function cleanupTestData(
    supabase?: SupabaseClient
): Promise<void> {
    const client = supabase || (await setupTestDatabase())

    // Delete all test sessions (preserve system session if exists)
    await client
        .from("sessions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

    // Delete all test users (preserve system user)
    await client
        .from("users")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

    // Note: Sequences are auto-managed by PostgreSQL and don't need manual reset
    // If specific sequence reset is needed in the future, add here:
    // await client.rpc('reset_sequence', { sequence_name: 'table_id_seq' })
}
