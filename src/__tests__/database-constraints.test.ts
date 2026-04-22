import { createClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

describe("Database Constraints and Foreign Keys", () => {
    let testUserId: string

    beforeAll(async () => {
        // Create a test user for constraint testing
        const { data, error } = await supabase
            .from("users")
            .insert({
                email: `test-constraints-${Date.now()}@example.com`,
                name: "Test User",
                password_hash: "hashed_password_123",
                email_verified: true,
            })
            .select()
            .single()

        if (error) {
            console.error("Failed to create test user:", error)
            throw error
        }

        testUserId = data.id
    })

    afterAll(async () => {
        // Clean up test data
        if (testUserId) {
            await supabase.from("users").delete().eq("id", testUserId)
        }
    })

    describe("Foreign Key Constraints", () => {
        it("should enforce foreign key constraint on sessions table", async () => {
            // Try to insert a session with non-existent user_id
            const { error } = await supabase.from("sessions").insert({
                user_id: "00000000-0000-0000-0000-000000000000", // Non-existent UUID
                token: "invalid_token_123",
                expires_at: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
            })

            expect(error).toBeDefined()
            expect(error?.code).toBe("23503") // Foreign key violation error code
        })

        it("should enforce foreign key constraint on password_reset_tokens table", async () => {
            // Try to insert a password reset token with non-existent user_id
            const { error } = await supabase
                .from("password_reset_tokens")
                .insert({
                    user_id: "00000000-0000-0000-0000-000000000000",
                    token: "reset_token_123",
                    expires_at: new Date(
                        Date.now() + 60 * 60 * 1000
                    ).toISOString(),
                })

            expect(error).toBeDefined()
            expect(error?.code).toBe("23503")
        })

        it("should enforce foreign key constraint on email_verification_tokens table", async () => {
            // Try to insert an email verification token with non-existent user_id
            const { error } = await supabase
                .from("email_verification_tokens")
                .insert({
                    user_id: "00000000-0000-0000-0000-000000000000",
                    token: "verify_token_123",
                    expires_at: new Date(
                        Date.now() + 60 * 60 * 1000
                    ).toISOString(),
                })

            expect(error).toBeDefined()
            expect(error?.code).toBe("23503")
        })
    })

    describe("ON DELETE CASCADE", () => {
        it("should cascade delete sessions when user is deleted", async () => {
            // Create a temporary user
            const { data: userData, error: userError } = await supabase
                .from("users")
                .insert({
                    email: `cascade-test-${Date.now()}@example.com`,
                    name: "Cascade Test User",
                    password_hash: "hashed_password_123",
                })
                .select()
                .single()

            if (userError) throw userError

            const tempUserId = userData.id

            // Create a session for this user
            const { error: sessionError } = await supabase
                .from("sessions")
                .insert({
                    user_id: tempUserId,
                    token: `session_token_${Date.now()}`,
                    expires_at: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                    ).toISOString(),
                })

            if (sessionError) throw sessionError

            // Delete the user
            await supabase.from("users").delete().eq("id", tempUserId)

            // Verify the session was deleted
            const { data: sessions, error: queryError } = await supabase
                .from("sessions")
                .select()
                .eq("user_id", tempUserId)

            if (queryError) throw queryError

            expect(sessions).toHaveLength(0)
        })

        it("should cascade delete password_reset_tokens when user is deleted", async () => {
            // Create a temporary user
            const { data: userData, error: userError } = await supabase
                .from("users")
                .insert({
                    email: `cascade-reset-${Date.now()}@example.com`,
                    name: "Cascade Reset User",
                    password_hash: "hashed_password_123",
                })
                .select()
                .single()

            if (userError) throw userError

            const tempUserId = userData.id

            // Create a password reset token for this user
            const { error: tokenError } = await supabase
                .from("password_reset_tokens")
                .insert({
                    user_id: tempUserId,
                    token: `reset_token_${Date.now()}`,
                    expires_at: new Date(
                        Date.now() + 60 * 60 * 1000
                    ).toISOString(),
                })

            if (tokenError) throw tokenError

            // Delete the user
            await supabase.from("users").delete().eq("id", tempUserId)

            // Verify the token was deleted
            const { data: tokens, error: queryError } = await supabase
                .from("password_reset_tokens")
                .select()
                .eq("user_id", tempUserId)

            if (queryError) throw queryError

            expect(tokens).toHaveLength(0)
        })

        it("should cascade delete email_verification_tokens when user is deleted", async () => {
            // Create a temporary user
            const { data: userData, error: userError } = await supabase
                .from("users")
                .insert({
                    email: `cascade-verify-${Date.now()}@example.com`,
                    name: "Cascade Verify User",
                    password_hash: "hashed_password_123",
                })
                .select()
                .single()

            if (userError) throw userError

            const tempUserId = userData.id

            // Create an email verification token for this user
            const { error: tokenError } = await supabase
                .from("email_verification_tokens")
                .insert({
                    user_id: tempUserId,
                    token: `verify_token_${Date.now()}`,
                    expires_at: new Date(
                        Date.now() + 60 * 60 * 1000
                    ).toISOString(),
                })

            if (tokenError) throw tokenError

            // Delete the user
            await supabase.from("users").delete().eq("id", tempUserId)

            // Verify the token was deleted
            const { data: tokens, error: queryError } = await supabase
                .from("email_verification_tokens")
                .select()
                .eq("user_id", tempUserId)

            if (queryError) throw queryError

            expect(tokens).toHaveLength(0)
        })
    })

    describe("CHECK Constraints - Email Format", () => {
        it("should accept valid email format", async () => {
            const { error } = await supabase
                .from("users")
                .insert({
                    email: `valid-email-${Date.now()}@example.com`,
                    name: "Valid Email User",
                    password_hash: "hashed_password_123",
                })
                .select()
                .single()

            expect(error).toBeNull()
        })

        it("should reject invalid email format (no @)", async () => {
            const { error } = await supabase
                .from("users")
                .insert({
                    email: `invalid-email-${Date.now()}`,
                    name: "Invalid Email User",
                    password_hash: "hashed_password_123",
                })
                .select()
                .single()

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514") // CHECK constraint violation
        })

        it("should reject invalid email format (no domain)", async () => {
            const { error } = await supabase
                .from("users")
                .insert({
                    email: `invalid@${Date.now()}`,
                    name: "Invalid Email User",
                    password_hash: "hashed_password_123",
                })
                .select()
                .single()

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514")
        })

        it("should reject invalid email format (no TLD)", async () => {
            const { error } = await supabase
                .from("users")
                .insert({
                    email: `invalid@domain${Date.now()}`,
                    name: "Invalid Email User",
                    password_hash: "hashed_password_123",
                })
                .select()
                .single()

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514")
        })
    })

    describe("CHECK Constraints - Non-Empty Tokens", () => {
        it("should reject empty session_id in sessions table", async () => {
            const { error } = await supabase.from("sessions").insert({
                user_id: testUserId,
                session_id: "", // Empty session_id
                expires_at: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
            })

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514") // CHECK constraint violation
        })

        it("should reject empty token in password_reset_tokens table", async () => {
            const { error } = await supabase
                .from("password_reset_tokens")
                .insert({
                    user_id: testUserId,
                    token: "", // Empty token
                    expires_at: new Date(
                        Date.now() + 60 * 60 * 1000
                    ).toISOString(),
                })

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514")
        })

        it("should reject empty token in email_verification_tokens table", async () => {
            const { error } = await supabase
                .from("email_verification_tokens")
                .insert({
                    user_id: testUserId,
                    token: "", // Empty token
                    expires_at: new Date(
                        Date.now() + 60 * 60 * 1000
                    ).toISOString(),
                })

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514")
        })

        it("should accept non-empty session_id in sessions table", async () => {
            const { data, error } = await supabase
                .from("sessions")
                .insert({
                    user_id: testUserId,
                    session_id: `valid_session_${Date.now()}`,
                    expires_at: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(error).toBeNull()
            expect(data).toBeDefined()

            // Clean up
            if (data) {
                await supabase.from("sessions").delete().eq("id", data.id)
            }
        })
    })

    describe("Unique Constraints", () => {
        it("should enforce unique email constraint", async () => {
            const email = `unique-test-${Date.now()}@example.com`

            // Insert first user
            const { error: firstError } = await supabase
                .from("users")
                .insert({
                    email,
                    name: "First User",
                    password_hash: "hashed_password_123",
                })
                .select()
                .single()

            expect(firstError).toBeNull()

            // Try to insert second user with same email
            const { error: secondError } = await supabase
                .from("users")
                .insert({
                    email,
                    name: "Second User",
                    password_hash: "hashed_password_123",
                })
                .select()
                .single()

            expect(secondError).toBeDefined()
            expect(secondError?.code).toBe("23505") // Unique constraint violation

            // Clean up
            await supabase.from("users").delete().eq("email", email)
        })

        it("should enforce unique session_id constraint in sessions table", async () => {
            const sessionId = `unique_session_${Date.now()}`

            // Insert first session
            const { data: session1, error: firstError } = await supabase
                .from("sessions")
                .insert({
                    user_id: testUserId,
                    session_id: sessionId,
                    expires_at: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(firstError).toBeNull()

            // Try to insert second session with same token
            const { error: secondError } = await supabase
                .from("sessions")
                .insert({
                    user_id: testUserId,
                    token,
                    expires_at: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(secondError).toBeDefined()
            expect(secondError?.code).toBe("23505")

            // Clean up
            if (session1) {
                await supabase.from("sessions").delete().eq("id", session1.id)
            }
        })
    })

    describe("Data Integrity", () => {
        it("should maintain referential integrity for sessions", async () => {
            // Create a session
            const { data: session, error: sessionError } = await supabase
                .from("sessions")
                .insert({
                    user_id: testUserId,
                    token: `integrity_test_${Date.now()}`,
                    expires_at: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(sessionError).toBeNull()
            expect(session?.user_id).toBe(testUserId)

            // Clean up
            if (session) {
                await supabase.from("sessions").delete().eq("id", session.id)
            }
        })

        it("should maintain referential integrity for password_reset_tokens", async () => {
            // Create a password reset token
            const { data: token, error: tokenError } = await supabase
                .from("password_reset_tokens")
                .insert({
                    user_id: testUserId,
                    token: `integrity_reset_${Date.now()}`,
                    expires_at: new Date(
                        Date.now() + 60 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(tokenError).toBeNull()
            expect(token?.user_id).toBe(testUserId)

            // Clean up
            if (token) {
                await supabase
                    .from("password_reset_tokens")
                    .delete()
                    .eq("id", token.id)
            }
        })

        it("should maintain referential integrity for email_verification_tokens", async () => {
            // Create an email verification token
            const { data: token, error: tokenError } = await supabase
                .from("email_verification_tokens")
                .insert({
                    user_id: testUserId,
                    token: `integrity_verify_${Date.now()}`,
                    expires_at: new Date(
                        Date.now() + 60 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(tokenError).toBeNull()
            expect(token?.user_id).toBe(testUserId)

            // Clean up
            if (token) {
                await supabase
                    .from("email_verification_tokens")
                    .delete()
                    .eq("id", token.id)
            }
        })
    })

    describe("Registration Fields - Birth Date and Auth Method", () => {
        it("should accept valid birth_date (user 13+ years old)", async () => {
            // Calculate a date for someone 13 years old
            const thirteenYearsAgo = new Date()
            thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13)

            const { error } = await supabase
                .from("users")
                .insert({
                    email: `birth-date-valid-${Date.now()}@example.com`,
                    name: "Valid Birth Date User",
                    password_hash: "hashed_password_123",
                    birth_date: thirteenYearsAgo.toISOString().split("T")[0],
                    auth_method: "email",
                })
                .select()
                .single()

            expect(error).toBeNull()

            // Clean up
            await supabase
                .from("users")
                .delete()
                .eq("email", `birth-date-valid-${Date.now()}@example.com`)
        })

        it("should reject future birth_date", async () => {
            // Calculate a future date
            const futureDate = new Date()
            futureDate.setFullYear(futureDate.getFullYear() + 1)

            const { error } = await supabase
                .from("users")
                .insert({
                    email: `birth-date-future-${Date.now()}@example.com`,
                    name: "Future Birth Date User",
                    password_hash: "hashed_password_123",
                    birth_date: futureDate.toISOString().split("T")[0],
                    auth_method: "email",
                })
                .select()
                .single()

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514") // CHECK constraint violation
        })

        it("should reject birth_date for user under 13 years old", async () => {
            // Calculate a date for someone 12 years old
            const twelveYearsAgo = new Date()
            twelveYearsAgo.setFullYear(twelveYearsAgo.getFullYear() - 12)

            const { error } = await supabase
                .from("users")
                .insert({
                    email: `birth-date-under-13-${Date.now()}@example.com`,
                    name: "Under 13 User",
                    password_hash: "hashed_password_123",
                    birth_date: twelveYearsAgo.toISOString().split("T")[0],
                    auth_method: "email",
                })
                .select()
                .single()

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514") // CHECK constraint violation
        })

        it("should accept valid auth_method values", async () => {
            const authMethods = ["email", "google", "facebook", "tiktok"]

            for (const method of authMethods) {
                const { error } = await supabase
                    .from("users")
                    .insert({
                        email: `auth-method-${method}-${Date.now()}@example.com`,
                        name: `${method} User`,
                        password_hash: "hashed_password_123",
                        auth_method: method,
                    })
                    .select()
                    .single()

                expect(error).toBeNull()

                // Clean up
                await supabase
                    .from("users")
                    .delete()
                    .eq(
                        "email",
                        `auth-method-${method}-${Date.now()}@example.com`
                    )
            }
        })

        it("should reject invalid auth_method values", async () => {
            const { error } = await supabase
                .from("users")
                .insert({
                    email: `auth-method-invalid-${Date.now()}@example.com`,
                    name: "Invalid Auth Method User",
                    password_hash: "hashed_password_123",
                    auth_method: "invalid_method",
                })
                .select()
                .single()

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514") // CHECK constraint violation
        })

        it("should allow NULL birth_date for existing users", async () => {
            const { error } = await supabase
                .from("users")
                .insert({
                    email: `birth-date-null-${Date.now()}@example.com`,
                    name: "Null Birth Date User",
                    password_hash: "hashed_password_123",
                    birth_date: null,
                    auth_method: "email",
                })
                .select()
                .single()

            expect(error).toBeNull()

            // Clean up
            await supabase
                .from("users")
                .delete()
                .eq("email", `birth-date-null-${Date.now()}@example.com`)
        })

        it("should allow NULL auth_method for existing users", async () => {
            const { error } = await supabase
                .from("users")
                .insert({
                    email: `auth-method-null-${Date.now()}@example.com`,
                    name: "Null Auth Method User",
                    password_hash: "hashed_password_123",
                    auth_method: null,
                })
                .select()
                .single()

            expect(error).toBeNull()

            // Clean up
            await supabase
                .from("users")
                .delete()
                .eq("email", `auth-method-null-${Date.now()}@example.com`)
        })
    })

    describe("Registration Sessions Table", () => {
        it("should create registration session with all required fields", async () => {
            const { data, error } = await supabase
                .from("registration_sessions")
                .insert({
                    session_id: `session_${Date.now()}`,
                    email: `session-test-${Date.now()}@example.com`,
                    name: "Test User",
                    phone: "+1234567890",
                    current_step: 1,
                    expires_at: new Date(
                        Date.now() + 30 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(error).toBeNull()
            expect(data?.session_id).toBeDefined()
            expect(data?.email).toBe(`session-test-${Date.now()}@example.com`)
            expect(data?.current_step).toBe(1)

            // Clean up
            if (data) {
                await supabase
                    .from("registration_sessions")
                    .delete()
                    .eq("id", data.id)
            }
        })

        it("should reject empty session_id in registration_sessions", async () => {
            const { error } = await supabase
                .from("registration_sessions")
                .insert({
                    session_id: "",
                    email: `session-empty-${Date.now()}@example.com`,
                    expires_at: new Date(
                        Date.now() + 30 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514") // CHECK constraint violation
        })

        it("should reject invalid current_step values", async () => {
            const { error } = await supabase
                .from("registration_sessions")
                .insert({
                    session_id: `session_invalid_step_${Date.now()}`,
                    email: `session-invalid-step-${Date.now()}@example.com`,
                    current_step: 5, // Invalid step (must be 1-4)
                    expires_at: new Date(
                        Date.now() + 30 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(error).toBeDefined()
            expect(error?.code).toBe("23514") // CHECK constraint violation
        })

        it("should enforce unique session_id constraint", async () => {
            const sessionId = `unique_session_${Date.now()}`

            // Insert first session
            const { data: session1, error: firstError } = await supabase
                .from("registration_sessions")
                .insert({
                    session_id: sessionId,
                    email: `session-unique-1-${Date.now()}@example.com`,
                    expires_at: new Date(
                        Date.now() + 30 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(firstError).toBeNull()

            // Try to insert second session with same session_id
            const { error: secondError } = await supabase
                .from("registration_sessions")
                .insert({
                    session_id: sessionId,
                    email: `session-unique-2-${Date.now()}@example.com`,
                    expires_at: new Date(
                        Date.now() + 30 * 60 * 1000
                    ).toISOString(),
                })
                .select()
                .single()

            expect(secondError).toBeDefined()
            expect(secondError?.code).toBe("23505") // Unique constraint violation

            // Clean up
            if (session1) {
                await supabase
                    .from("registration_sessions")
                    .delete()
                    .eq("id", session1.id)
            }
        })
    })
})
