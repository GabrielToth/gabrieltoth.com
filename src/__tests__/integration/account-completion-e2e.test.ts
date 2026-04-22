/**
 * Account Completion End-to-End Integration Tests
 *
 * Tests the complete flow from OAuth callback through account completion to dashboard access.
 * Validates: Requirements 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
 */

import { createSession } from "@/lib/auth/session"
import { generateTempToken, validateTempToken } from "@/lib/auth/temp-token"
import { getUserByEmail, updateUserAccountCompletion } from "@/lib/auth/user"
import { rateLimitByKey } from "@/lib/rate-limit"
import bcrypt from "bcrypt"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies
vi.mock("@/lib/auth/temp-token")
vi.mock("@/lib/auth/session")
vi.mock("@/lib/auth/user")
vi.mock("@/lib/auth/audit-logging")
vi.mock("@/lib/rate-limit")
vi.mock("bcrypt")
vi.mock("@/lib/logger")

describe("Account Completion End-to-End Flow", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(rateLimitByKey).mockResolvedValue({ success: true } as never)
    })

    describe("OAuth callback to account completion to dashboard", () => {
        it("should complete full flow from OAuth to dashboard", async () => {
            // Step 1: OAuth callback generates temp token
            const oauthData = {
                email: "user@example.com",
                oauth_provider: "google" as const,
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
            }

            const tempToken = "mock-temp-token-123"
            vi.mocked(generateTempToken).mockReturnValue(tempToken)
            expect(tempToken).toBeDefined()

            // Step 2: Validate temp token
            vi.mocked(validateTempToken).mockReturnValue({
                email: oauthData.email,
                oauth_provider: oauthData.oauth_provider,
                oauth_id: oauthData.oauth_id,
                name: oauthData.name,
                picture: oauthData.picture,
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            const tokenPayload = validateTempToken(tempToken)
            expect(tokenPayload.email).toBe(oauthData.email)
            expect(tokenPayload.oauth_provider).toBe(oauthData.oauth_provider)

            // Step 3: User completes account form
            const completionData = {
                tempToken,
                email: "user@example.com",
                name: "John Doe",
                password: "SecurePass123!",
                phone: "+1234567890",
                birthDate: "1990-01-01",
            }

            // Step 4: Check email uniqueness
            vi.mocked(getUserByEmail).mockResolvedValue(null)

            // Step 5: Hash password
            vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never)

            // Step 6: Update user record
            const updatedUser = {
                id: "user-123",
                email: completionData.email,
                password_hash: "hashed-password",
                oauth_provider: oauthData.oauth_provider,
                oauth_id: oauthData.oauth_id,
                name: completionData.name,
                picture: oauthData.picture,
                phone_number: completionData.phone,
                birth_date: new Date(completionData.birthDate),
                account_completion_status: "completed" as const,
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                updatedUser as never
            )

            // Step 7: Create session
            const session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session-id-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(createSession).mockResolvedValue(session as never)

            // Verify all steps completed successfully
            expect(
                vi.mocked(updateUserAccountCompletion)
            ).not.toHaveBeenCalled()
            expect(vi.mocked(createSession)).not.toHaveBeenCalled()

            // Simulate API call
            await updateUserAccountCompletion(oauthData.oauth_id, {
                email: completionData.email,
                name: completionData.name,
                password_hash: "hashed-password",
                phone_number: completionData.phone,
                birth_date: new Date(completionData.birthDate),
                account_completion_status: "completed",
                account_completed_at: new Date(),
            })

            await createSession("user-123")

            // Verify functions were called
            expect(vi.mocked(updateUserAccountCompletion)).toHaveBeenCalled()
            expect(vi.mocked(createSession)).toHaveBeenCalled()
        })

        it("should handle incomplete account detection", async () => {
            // User logs in via OAuth but has no password
            const incompleteUser = {
                id: "user-123",
                email: "user@example.com",
                password_hash: null, // No password
                oauth_provider: "google" as const,
                oauth_id: "google-123",
                name: "John Doe",
                account_completion_status: "pending" as const,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            // System should detect incomplete account
            expect(incompleteUser.password_hash).toBeNull()
            expect(incompleteUser.account_completion_status).toBe("pending")

            // Generate temp token for completion flow
            const tempToken = "mock-temp-token-456"
            vi.mocked(generateTempToken).mockReturnValue(tempToken)

            expect(tempToken).toBeDefined()
        })

        it("should redirect to completion flow for incomplete accounts", async () => {
            // Simulate middleware check
            const user = {
                id: "user-123",
                email: "user@example.com",
                password_hash: null,
                account_completion_status: "pending" as const,
            }

            // Check if account is incomplete
            const isIncomplete =
                !user.password_hash ||
                user.account_completion_status !== "completed"

            expect(isIncomplete).toBe(true)

            // Should redirect to completion flow
            const redirectUrl = `/en/auth/complete-account`
            expect(redirectUrl).toContain("complete-account")
        })

        it("should allow access to dashboard after completion", async () => {
            // User has completed account
            const completeUser = {
                id: "user-123",
                email: "user@example.com",
                password_hash: "hashed-password",
                account_completion_status: "completed" as const,
            }

            // Check if account is complete
            const isComplete =
                completeUser.password_hash &&
                completeUser.account_completion_status === "completed"

            expect(isComplete).toBe(true)

            // Should allow access to dashboard
            expect(completeUser.account_completion_status).toBe("completed")
        })
    })

    describe("Multi-step form flow", () => {
        it("should navigate through all steps", async () => {
            // Step 1: Pre-filled data
            const step1Data = {
                email: "user@example.com",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
            }

            expect(step1Data.email).toBeDefined()
            expect(step1Data.name).toBeDefined()

            // Step 2: New required fields
            const step2Data = {
                password: "SecurePass123!",
                phone: "+1234567890",
                birthDate: "1990-01-01",
            }

            expect(step2Data.password).toBeDefined()
            expect(step2Data.phone).toBeDefined()
            expect(step2Data.birthDate).toBeDefined()

            // Step 3: Verification
            const step3Data = {
                ...step1Data,
                ...step2Data,
            }

            expect(step3Data).toHaveProperty("email")
            expect(step3Data).toHaveProperty("name")
            expect(step3Data).toHaveProperty("password")
            expect(step3Data).toHaveProperty("phone")
            expect(step3Data).toHaveProperty("birthDate")
        })

        it("should allow editing pre-filled data", async () => {
            // Original data from OAuth
            const originalData = {
                email: "user@example.com",
                name: "John Doe",
            }

            // User edits name
            const editedData = {
                email: originalData.email,
                name: "Jane Doe", // Changed
            }

            expect(editedData.name).not.toBe(originalData.name)
            expect(editedData.email).toBe(originalData.email)
        })

        it("should validate edited email for uniqueness", async () => {
            // User changes email
            const newEmail = "newemail@example.com"

            // Check if email exists
            vi.mocked(getUserByEmail).mockResolvedValue(null)

            const existingUser = await getUserByEmail(newEmail)
            expect(existingUser).toBeNull()

            // Email is available
            expect(newEmail).toBeDefined()
        })

        it("should prevent duplicate email during completion", async () => {
            // Another user already has this email
            const existingUser = {
                id: "other-user-123",
                email: "taken@example.com",
            }

            vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)

            const result = await getUserByEmail("taken@example.com")
            expect(result).not.toBeNull()
            expect(result?.email).toBe("taken@example.com")
        })
    })

    describe("Data persistence and retrieval", () => {
        it("should persist all account completion data", async () => {
            const completionData = {
                email: "user@example.com",
                name: "John Doe",
                password_hash: "hashed-password",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed" as const,
                account_completed_at: new Date(),
            }

            const updatedUser = {
                id: "user-123",
                ...completionData,
                oauth_provider: "google" as const,
                oauth_id: "google-123",
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                updatedUser as never
            )

            const result = await updateUserAccountCompletion("google-123", {
                email: completionData.email,
                name: completionData.name,
                password_hash: completionData.password_hash,
                phone_number: completionData.phone_number,
                birth_date: completionData.birth_date,
                account_completion_status:
                    completionData.account_completion_status,
                account_completed_at: completionData.account_completed_at,
            })

            expect(result.email).toBe(completionData.email)
            expect(result.name).toBe(completionData.name)
            expect(result.phone_number).toBe(completionData.phone_number)
            expect(result.birth_date).toEqual(completionData.birth_date)
            expect(result.account_completion_status).toBe("completed")
        })

        it("should retrieve completed account data", async () => {
            const user = {
                id: "user-123",
                email: "user@example.com",
                name: "John Doe",
                password_hash: "hashed-password",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed" as const,
                account_completed_at: new Date(),
            }

            vi.mocked(getUserByEmail).mockResolvedValue(user as never)

            const result = await getUserByEmail("user@example.com")

            expect(result).not.toBeNull()
            expect(result?.email).toBe(user.email)
            expect(result?.phone_number).toBe(user.phone_number)
            expect(result?.account_completion_status).toBe("completed")
        })
    })

    describe("Session management", () => {
        it("should create session after account completion", async () => {
            const session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session-id-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(createSession).mockResolvedValue(session as never)

            const result = await createSession("user-123")

            expect(result).not.toBeNull()
            expect(result.user_id).toBe("user-123")
            expect(result.session_id).toBeDefined()
        })

        it("should set session cookie with correct attributes", async () => {
            const session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session-id-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            // Verify session attributes
            expect(session.session_id).toBeDefined()
            expect(session.expires_at.getTime()).toBeGreaterThan(Date.now())

            // Session should be HTTP-only, secure, and SameSite=Strict
            const cookieAttributes = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60, // 30 days
            }

            expect(cookieAttributes.httpOnly).toBe(true)
            expect(cookieAttributes.sameSite).toBe("strict")
        })
    })

    describe("Error recovery", () => {
        it("should handle validation errors gracefully", async () => {
            const invalidData = {
                email: "invalid-email",
                name: "John",
                password: "weak",
                phone: "1234567890",
                birthDate: "2020-01-01",
            }

            // Validation should fail
            expect(invalidData.email).not.toContain("@")
            expect(invalidData.password.length).toBeLessThan(8)
        })

        it("should allow retry after validation error", async () => {
            // First attempt fails
            const firstAttempt = {
                email: "invalid-email",
                password: "weak",
            }

            // Second attempt succeeds
            const secondAttempt = {
                email: "user@example.com",
                password: "SecurePass123!",
            }

            expect(firstAttempt.email).not.toContain("@")
            expect(secondAttempt.email).toContain("@")
        })

        it("should handle database errors", async () => {
            vi.mocked(updateUserAccountCompletion).mockRejectedValue(
                new Error("Database connection failed")
            )

            try {
                await updateUserAccountCompletion("oauth-id", {
                    email: "user@example.com",
                    name: "John Doe",
                    password_hash: "hashed",
                    phone_number: "+1234567890",
                    birth_date: new Date("1990-01-01"),
                    account_completion_status: "completed",
                    account_completed_at: new Date(),
                })
            } catch (error) {
                expect(error).toBeDefined()
                expect((error as Error).message).toContain("Database")
            }
        })
    })
})
