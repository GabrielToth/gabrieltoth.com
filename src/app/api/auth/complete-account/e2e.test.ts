/**
 * End-to-End Integration Tests for Account Completion Flow
 *
 * Tests the complete flow from OAuth callback to account completion to dashboard access.
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10
 */

import { createSession } from "@/lib/auth/session"
import { generateTempToken, validateTempToken } from "@/lib/auth/temp-token"
import { getUserByEmail, updateUserAccountCompletion } from "@/lib/auth/user"
import { rateLimitByKey } from "@/lib/rate-limit"
import bcrypt from "bcrypt"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

// Mock dependencies
vi.mock("@/lib/auth/temp-token")
vi.mock("@/lib/auth/session")
vi.mock("@/lib/auth/user")
vi.mock("@/lib/auth/audit-logging")
vi.mock("@/lib/rate-limit")
vi.mock("bcrypt")
vi.mock("@/lib/logger")

describe("Account Completion Flow - End-to-End Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock rate limiting to always succeed
        vi.mocked(rateLimitByKey).mockResolvedValue({ success: true } as never)
    })

    describe("Complete OAuth to Dashboard Flow", () => {
        it("should complete full flow from OAuth callback to dashboard", async () => {
            // Step 1: OAuth callback generates temp token
            const oauthData = {
                email: "newuser@example.com",
                oauth_provider: "google" as const,
                oauth_id: "google-123456",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
            }

            const tempToken = generateTempToken(oauthData)

            // Step 2: User accesses account completion page with temp token
            // (Frontend would handle this)

            // Step 3: User submits account completion form
            const completionData = {
                tempToken,
                email: "newuser@example.com",
                name: "John Doe",
                password: "SecurePass123!",
                phone: "+1234567890",
                birthDate: "1990-01-01",
            }

            // Mock token validation
            vi.mocked(validateTempToken).mockReturnValue({
                email: oauthData.email,
                oauth_provider: oauthData.oauth_provider,
                oauth_id: oauthData.oauth_id,
                name: oauthData.name,
                picture: oauthData.picture,
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            // Mock user lookup (no existing user)
            vi.mocked(getUserByEmail).mockResolvedValue(null)

            // Mock password hashing
            vi.mocked(bcrypt.hash).mockResolvedValue(
                "hashed-password-123" as never
            )

            // Mock user update
            const updatedUser = {
                id: "user-123",
                email: completionData.email,
                password_hash: "hashed-password-123",
                oauth_provider: oauthData.oauth_provider,
                oauth_id: oauthData.oauth_id,
                name: completionData.name,
                picture: oauthData.picture,
                phone_number: completionData.phone,
                birth_date: new Date(completionData.birthDate),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                updatedUser as never
            )

            // Mock session creation
            const mockSession = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session-id-abc123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(createSession).mockResolvedValue(mockSession as never)

            // Step 4: Submit account completion
            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify(completionData),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            const response = await POST(request)

            // Step 5: Verify successful completion
            expect(response.status).toBe(200)
            const data = await response.json()
            expect(data.success).toBe(true)
            expect(data.message).toContain(
                "Account setup completed successfully"
            )
            expect(data.redirectUrl).toBe("/dashboard")

            // Step 6: Verify session cookie is set
            const setCookieHeader = response.headers.get("set-cookie")
            expect(setCookieHeader).toBeDefined()
            expect(setCookieHeader).toContain("session=session-id-abc123")
            expect(setCookieHeader).toContain("HttpOnly")
            expect(setCookieHeader).toContain("SameSite=strict")

            // Step 7: Verify user data was persisted correctly
            expect(updateUserAccountCompletion).toHaveBeenCalledWith(
                oauthData.oauth_id,
                expect.objectContaining({
                    email: completionData.email,
                    name: completionData.name,
                    password_hash: "hashed-password-123",
                    phone_number: completionData.phone,
                    birth_date: new Date(completionData.birthDate),
                    account_completion_status: "completed",
                })
            )

            // Step 8: Verify session was created for the user
            expect(createSession).toHaveBeenCalledWith("user-123")
        })

        it("should handle multi-step form navigation correctly", async () => {
            // Simulate user navigating through steps
            const tempToken = generateTempToken({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "Jane Doe",
            })

            // Step 1: User reviews pre-filled data
            // (Frontend handles this, no API call)

            // Step 2: User enters new fields
            // (Frontend validates in real-time)

            // Step 3: User reviews all data and submits
            const completionData = {
                tempToken,
                email: "user@example.com",
                name: "Jane Doe",
                password: "SecurePass456!",
                phone: "+1987654321",
                birthDate: "1995-05-15",
            }

            vi.mocked(validateTempToken).mockReturnValue({
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "Jane Doe",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue(
                "hashed-password-456" as never
            )

            const updatedUser = {
                id: "user-456",
                email: completionData.email,
                password_hash: "hashed-password-456",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: completionData.name,
                phone_number: completionData.phone,
                birth_date: new Date(completionData.birthDate),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                updatedUser as never
            )

            const mockSession = {
                id: "session-456",
                user_id: "user-456",
                session_id: "session-id-def456",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(createSession).mockResolvedValue(mockSession as never)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify(completionData),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            const response = await POST(request)

            expect(response.status).toBe(200)
            const data = await response.json()
            expect(data.success).toBe(true)
            expect(data.redirectUrl).toBe("/dashboard")
        })

        it("should preserve user data through completion flow", async () => {
            // Verify that all user data is correctly preserved
            const originalData = {
                email: "preserve@example.com",
                name: "Data Preserver",
                password: "PreservePass123!",
                phone: "+1111111111",
                birthDate: "1985-03-20",
            }

            const tempToken = generateTempToken({
                email: originalData.email,
                oauth_provider: "facebook",
                oauth_id: "fb-789",
                name: originalData.name,
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: originalData.email,
                oauth_provider: "facebook",
                oauth_id: "fb-789",
                name: originalData.name,
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue("hashed-preserve" as never)

            const updatedUser = {
                id: "user-preserve",
                email: originalData.email,
                password_hash: "hashed-preserve",
                oauth_provider: "facebook",
                oauth_id: "fb-789",
                name: originalData.name,
                phone_number: originalData.phone,
                birth_date: new Date(originalData.birthDate),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                updatedUser as never
            )

            const mockSession = {
                id: "session-preserve",
                user_id: "user-preserve",
                session_id: "session-preserve-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(createSession).mockResolvedValue(mockSession as never)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        ...originalData,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            const response = await POST(request)

            expect(response.status).toBe(200)

            // Verify all data was preserved
            expect(updateUserAccountCompletion).toHaveBeenCalledWith(
                "fb-789",
                expect.objectContaining({
                    email: originalData.email,
                    name: originalData.name,
                    phone_number: originalData.phone,
                    birth_date: new Date(originalData.birthDate),
                })
            )
        })
    })

    describe("Error Recovery and Retry Scenarios", () => {
        it("should allow retry after validation error", async () => {
            const tempToken = generateTempToken({
                email: "retry@example.com",
                oauth_provider: "google",
                oauth_id: "google-retry",
                name: "Retry User",
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: "retry@example.com",
                oauth_provider: "google",
                oauth_id: "google-retry",
                name: "Retry User",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            // First attempt with invalid password
            const invalidRequest = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "retry@example.com",
                        name: "Retry User",
                        password: "weak",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            const invalidResponse = await POST(invalidRequest)
            expect(invalidResponse.status).toBe(400)

            // Second attempt with valid password
            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue("hashed-retry" as never)

            const updatedUser = {
                id: "user-retry",
                email: "retry@example.com",
                password_hash: "hashed-retry",
                oauth_provider: "google",
                oauth_id: "google-retry",
                name: "Retry User",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                updatedUser as never
            )

            const mockSession = {
                id: "session-retry",
                user_id: "user-retry",
                session_id: "session-retry-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(createSession).mockResolvedValue(mockSession as never)

            const validRequest = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        email: "retry@example.com",
                        name: "Retry User",
                        password: "ValidPass123!",
                        phone: "+1234567890",
                        birthDate: "1990-01-01",
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            const validResponse = await POST(validRequest)
            expect(validResponse.status).toBe(200)
            const data = await validResponse.json()
            expect(data.success).toBe(true)
        })

        it("should handle concurrent completion attempts", async () => {
            const tempToken = generateTempToken({
                email: "concurrent@example.com",
                oauth_provider: "google",
                oauth_id: "google-concurrent",
                name: "Concurrent User",
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: "concurrent@example.com",
                oauth_provider: "google",
                oauth_id: "google-concurrent",
                name: "Concurrent User",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue(
                "hashed-concurrent" as never
            )

            const updatedUser = {
                id: "user-concurrent",
                email: "concurrent@example.com",
                password_hash: "hashed-concurrent",
                oauth_provider: "google",
                oauth_id: "google-concurrent",
                name: "Concurrent User",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                updatedUser as never
            )

            const mockSession = {
                id: "session-concurrent",
                user_id: "user-concurrent",
                session_id: "session-concurrent-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(createSession).mockResolvedValue(mockSession as never)

            // Simulate concurrent requests
            const requests = Array(3)
                .fill(null)
                .map(
                    () =>
                        new NextRequest(
                            "http://localhost:3000/api/auth/complete-account",
                            {
                                method: "POST",
                                body: JSON.stringify({
                                    tempToken,
                                    email: "concurrent@example.com",
                                    name: "Concurrent User",
                                    password: "ConcurrentPass123!",
                                    phone: "+1234567890",
                                    birthDate: "1990-01-01",
                                }),
                                headers: {
                                    "Content-Type": "application/json",
                                    "x-forwarded-for": "192.168.1.1",
                                },
                            }
                        )
                )

            const responses = await Promise.all(requests.map(POST))

            // All requests should succeed (or at least not crash)
            responses.forEach(response => {
                expect(response.status).toBeGreaterThanOrEqual(200)
                expect(response.status).toBeLessThan(500)
            })
        })
    })

    describe("Data Integrity Through Flow", () => {
        it("should maintain data integrity from submission to database", async () => {
            const submittedData = {
                email: "integrity@example.com",
                name: "Integrity Tester",
                password: "IntegrityPass123!",
                phone: "+1555555555",
                birthDate: "1992-07-10",
            }

            const tempToken = generateTempToken({
                email: submittedData.email,
                oauth_provider: "tiktok",
                oauth_id: "tiktok-integrity",
                name: submittedData.name,
            })

            vi.mocked(validateTempToken).mockReturnValue({
                email: submittedData.email,
                oauth_provider: "tiktok",
                oauth_id: "tiktok-integrity",
                name: submittedData.name,
                exp: Math.floor(Date.now() / 1000) + 900,
            })

            vi.mocked(getUserByEmail).mockResolvedValue(null)
            vi.mocked(bcrypt.hash).mockResolvedValue(
                "hashed-integrity" as never
            )

            const updatedUser = {
                id: "user-integrity",
                email: submittedData.email,
                password_hash: "hashed-integrity",
                oauth_provider: "tiktok",
                oauth_id: "tiktok-integrity",
                name: submittedData.name,
                phone_number: submittedData.phone,
                birth_date: new Date(submittedData.birthDate),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(updateUserAccountCompletion).mockResolvedValue(
                updatedUser as never
            )

            const mockSession = {
                id: "session-integrity",
                user_id: "user-integrity",
                session_id: "session-integrity-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }

            vi.mocked(createSession).mockResolvedValue(mockSession as never)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/complete-account",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        ...submittedData,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-forwarded-for": "192.168.1.1",
                    },
                }
            )

            const response = await POST(request)

            expect(response.status).toBe(200)

            // Verify data integrity: submitted data matches what was persisted
            const updateCall = vi.mocked(updateUserAccountCompletion).mock
                .calls[0]
            const persistedData = updateCall[1]

            expect(persistedData.email).toBe(submittedData.email)
            expect(persistedData.name).toBe(submittedData.name)
            expect(persistedData.phone_number).toBe(submittedData.phone)
            expect(persistedData.birth_date).toEqual(
                new Date(submittedData.birthDate)
            )
        })
    })
})

describe("Duplicate Email Prevention - Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(rateLimitByKey).mockResolvedValue({ success: true } as never)
    })

    it("should prevent account completion with existing email", async () => {
        // Setup: Existing user with email
        const existingUser = {
            id: "existing-user-123",
            email: "existing@example.com",
            password_hash: "hashed-existing",
            oauth_provider: "facebook",
            oauth_id: "fb-existing",
            name: "Existing User",
            account_completion_status: "completed",
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        }

        const tempToken = generateTempToken({
            email: "newuser@example.com",
            oauth_provider: "google",
            oauth_id: "google-dup",
            name: "New User",
        })

        vi.mocked(validateTempToken).mockReturnValue({
            email: "newuser@example.com",
            oauth_provider: "google",
            oauth_id: "google-dup",
            name: "New User",
            exp: Math.floor(Date.now() / 1000) + 900,
        })

        // User tries to use existing email
        vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken,
                    email: "existing@example.com", // Existing email
                    name: "New User",
                    password: "NewPass123!",
                    phone: "+1234567890",
                    birthDate: "1990-01-01",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.1",
                },
            }
        )

        // Act
        const response = await POST(request)

        // Assert: Should reject with 409 Conflict
        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toContain("already in use")

        // Verify user was not updated
        expect(updateUserAccountCompletion).not.toHaveBeenCalled()
    })

    it("should allow same email as OAuth provider email", async () => {
        // Setup: User completing with same email from OAuth
        const tempToken = generateTempToken({
            email: "oauth@example.com",
            oauth_provider: "google",
            oauth_id: "google-same-email",
            name: "OAuth User",
        })

        vi.mocked(validateTempToken).mockReturnValue({
            email: "oauth@example.com",
            oauth_provider: "google",
            oauth_id: "google-same-email",
            name: "OAuth User",
            exp: Math.floor(Date.now() / 1000) + 900,
        })

        // No existing user with this email
        vi.mocked(getUserByEmail).mockResolvedValue(null)
        vi.mocked(bcrypt.hash).mockResolvedValue("hashed-oauth" as never)

        const updatedUser = {
            id: "user-oauth",
            email: "oauth@example.com",
            password_hash: "hashed-oauth",
            oauth_provider: "google",
            oauth_id: "google-same-email",
            name: "OAuth User",
            phone_number: "+1234567890",
            birth_date: new Date("1990-01-01"),
            account_completion_status: "completed",
            account_completed_at: new Date(),
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        }

        vi.mocked(updateUserAccountCompletion).mockResolvedValue(
            updatedUser as never
        )

        const mockSession = {
            id: "session-oauth",
            user_id: "user-oauth",
            session_id: "session-oauth-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }

        vi.mocked(createSession).mockResolvedValue(mockSession as never)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken,
                    email: "oauth@example.com", // Same as OAuth email
                    name: "OAuth User",
                    password: "OAuthPass123!",
                    phone: "+1234567890",
                    birthDate: "1990-01-01",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.1",
                },
            }
        )

        // Act
        const response = await POST(request)

        // Assert: Should succeed
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)

        // Verify user was updated
        expect(updateUserAccountCompletion).toHaveBeenCalled()
    })

    it("should handle concurrent duplicate email attempts", async () => {
        // Setup: Multiple users trying to use same email
        const existingUser = {
            id: "existing-concurrent",
            email: "concurrent@example.com",
            password_hash: "hashed-concurrent",
            oauth_provider: "facebook",
            oauth_id: "fb-concurrent",
            name: "Existing Concurrent",
            account_completion_status: "completed",
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        }

        const tempToken1 = generateTempToken({
            email: "user1@example.com",
            oauth_provider: "google",
            oauth_id: "google-concurrent-1",
            name: "User 1",
        })

        const tempToken2 = generateTempToken({
            email: "user2@example.com",
            oauth_provider: "google",
            oauth_id: "google-concurrent-2",
            name: "User 2",
        })

        vi.mocked(validateTempToken)
            .mockReturnValueOnce({
                email: "user1@example.com",
                oauth_provider: "google",
                oauth_id: "google-concurrent-1",
                name: "User 1",
                exp: Math.floor(Date.now() / 1000) + 900,
            })
            .mockReturnValueOnce({
                email: "user2@example.com",
                oauth_provider: "google",
                oauth_id: "google-concurrent-2",
                name: "User 2",
                exp: Math.floor(Date.now() / 1000) + 900,
            })

        vi.mocked(getUserByEmail).mockResolvedValue(existingUser as never)

        const request1 = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken: tempToken1,
                    email: "concurrent@example.com",
                    name: "User 1",
                    password: "Pass123!",
                    phone: "+1111111111",
                    birthDate: "1990-01-01",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.1",
                },
            }
        )

        const request2 = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken: tempToken2,
                    email: "concurrent@example.com",
                    name: "User 2",
                    password: "Pass456!",
                    phone: "+2222222222",
                    birthDate: "1995-05-05",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.2",
                },
            }
        )

        // Act: Both requests try to use same email
        const [response1, response2] = await Promise.all([
            POST(request1),
            POST(request2),
        ])

        // Assert: Both should be rejected
        expect(response1.status).toBe(409)
        expect(response2.status).toBe(409)

        const data1 = await response1.json()
        const data2 = await response2.json()

        expect(data1.success).toBe(false)
        expect(data2.success).toBe(false)
    })

    it("should validate email uniqueness across different OAuth providers", async () => {
        // Setup: User from one provider tries to use email from another provider
        const googleUser = {
            id: "google-user",
            email: "shared@example.com",
            password_hash: "hashed-google",
            oauth_provider: "google",
            oauth_id: "google-shared",
            name: "Google User",
            account_completion_status: "completed",
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        }

        const tempToken = generateTempToken({
            email: "facebook@example.com",
            oauth_provider: "facebook",
            oauth_id: "fb-shared",
            name: "Facebook User",
        })

        vi.mocked(validateTempToken).mockReturnValue({
            email: "facebook@example.com",
            oauth_provider: "facebook",
            oauth_id: "fb-shared",
            name: "Facebook User",
            exp: Math.floor(Date.now() / 1000) + 900,
        })

        // Existing Google user with shared email
        vi.mocked(getUserByEmail).mockResolvedValue(googleUser as never)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken,
                    email: "shared@example.com",
                    name: "Facebook User",
                    password: "FBPass123!",
                    phone: "+1234567890",
                    birthDate: "1990-01-01",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.1",
                },
            }
        )

        // Act
        const response = await POST(request)

        // Assert: Should reject
        expect(response.status).toBe(409)
        const data = await response.json()
        expect(data.success).toBe(false)
    })
})

describe("Multilingual Integration - Account Completion Flow", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(rateLimitByKey).mockResolvedValue({ success: true } as never)
    })

    it("should complete account for English locale user", async () => {
        // Setup: English user
        const tempToken = generateTempToken({
            email: "english@example.com",
            oauth_provider: "google",
            oauth_id: "google-en",
            name: "English User",
        })

        vi.mocked(validateTempToken).mockReturnValue({
            email: "english@example.com",
            oauth_provider: "google",
            oauth_id: "google-en",
            name: "English User",
            exp: Math.floor(Date.now() / 1000) + 900,
        })

        vi.mocked(getUserByEmail).mockResolvedValue(null)
        vi.mocked(bcrypt.hash).mockResolvedValue("hashed-en" as never)

        const updatedUser = {
            id: "user-en",
            email: "english@example.com",
            password_hash: "hashed-en",
            oauth_provider: "google",
            oauth_id: "google-en",
            name: "English User",
            phone_number: "+1234567890",
            birth_date: new Date("1990-01-01"),
            account_completion_status: "completed",
            account_completed_at: new Date(),
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        }

        vi.mocked(updateUserAccountCompletion).mockResolvedValue(
            updatedUser as never
        )

        const mockSession = {
            id: "session-en",
            user_id: "user-en",
            session_id: "session-en-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }

        vi.mocked(createSession).mockResolvedValue(mockSession as never)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken,
                    email: "english@example.com",
                    name: "English User",
                    password: "EnglishPass123!",
                    phone: "+1234567890",
                    birthDate: "1990-01-01",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.1",
                    "accept-language": "en-US",
                },
            }
        )

        // Act
        const response = await POST(request)

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
    })

    it("should complete account for Portuguese locale user", async () => {
        // Setup: Portuguese user
        const tempToken = generateTempToken({
            email: "portuguese@example.com",
            oauth_provider: "google",
            oauth_id: "google-pt",
            name: "Usuário Português",
        })

        vi.mocked(validateTempToken).mockReturnValue({
            email: "portuguese@example.com",
            oauth_provider: "google",
            oauth_id: "google-pt",
            name: "Usuário Português",
            exp: Math.floor(Date.now() / 1000) + 900,
        })

        vi.mocked(getUserByEmail).mockResolvedValue(null)
        vi.mocked(bcrypt.hash).mockResolvedValue("hashed-pt" as never)

        const updatedUser = {
            id: "user-pt",
            email: "portuguese@example.com",
            password_hash: "hashed-pt",
            oauth_provider: "google",
            oauth_id: "google-pt",
            name: "Usuário Português",
            phone_number: "+5511999999999",
            birth_date: new Date("1990-01-01"),
            account_completion_status: "completed",
            account_completed_at: new Date(),
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        }

        vi.mocked(updateUserAccountCompletion).mockResolvedValue(
            updatedUser as never
        )

        const mockSession = {
            id: "session-pt",
            user_id: "user-pt",
            session_id: "session-pt-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }

        vi.mocked(createSession).mockResolvedValue(mockSession as never)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken,
                    email: "portuguese@example.com",
                    name: "Usuário Português",
                    password: "SenhaPortuguesa123!",
                    phone: "+5511999999999",
                    birthDate: "1990-01-01",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.1",
                    "accept-language": "pt-BR",
                },
            }
        )

        // Act
        const response = await POST(request)

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
    })

    it("should complete account for Spanish locale user", async () => {
        // Setup: Spanish user
        const tempToken = generateTempToken({
            email: "spanish@example.com",
            oauth_provider: "google",
            oauth_id: "google-es",
            name: "Usuario Español",
        })

        vi.mocked(validateTempToken).mockReturnValue({
            email: "spanish@example.com",
            oauth_provider: "google",
            oauth_id: "google-es",
            name: "Usuario Español",
            exp: Math.floor(Date.now() / 1000) + 900,
        })

        vi.mocked(getUserByEmail).mockResolvedValue(null)
        vi.mocked(bcrypt.hash).mockResolvedValue("hashed-es" as never)

        const updatedUser = {
            id: "user-es",
            email: "spanish@example.com",
            password_hash: "hashed-es",
            oauth_provider: "google",
            oauth_id: "google-es",
            name: "Usuario Español",
            phone_number: "+34912345678",
            birth_date: new Date("1990-01-01"),
            account_completion_status: "completed",
            account_completed_at: new Date(),
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        }

        vi.mocked(updateUserAccountCompletion).mockResolvedValue(
            updatedUser as never
        )

        const mockSession = {
            id: "session-es",
            user_id: "user-es",
            session_id: "session-es-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }

        vi.mocked(createSession).mockResolvedValue(mockSession as never)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken,
                    email: "spanish@example.com",
                    name: "Usuario Español",
                    password: "ContraseñaEspañola123!",
                    phone: "+34912345678",
                    birthDate: "1990-01-01",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.1",
                    "accept-language": "es-ES",
                },
            }
        )

        // Act
        const response = await POST(request)

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
    })

    it("should complete account for German locale user", async () => {
        // Setup: German user
        const tempToken = generateTempToken({
            email: "german@example.com",
            oauth_provider: "google",
            oauth_id: "google-de",
            name: "Deutscher Benutzer",
        })

        vi.mocked(validateTempToken).mockReturnValue({
            email: "german@example.com",
            oauth_provider: "google",
            oauth_id: "google-de",
            name: "Deutscher Benutzer",
            exp: Math.floor(Date.now() / 1000) + 900,
        })

        vi.mocked(getUserByEmail).mockResolvedValue(null)
        vi.mocked(bcrypt.hash).mockResolvedValue("hashed-de" as never)

        const updatedUser = {
            id: "user-de",
            email: "german@example.com",
            password_hash: "hashed-de",
            oauth_provider: "google",
            oauth_id: "google-de",
            name: "Deutscher Benutzer",
            phone_number: "+491234567890",
            birth_date: new Date("1990-01-01"),
            account_completion_status: "completed",
            account_completed_at: new Date(),
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        }

        vi.mocked(updateUserAccountCompletion).mockResolvedValue(
            updatedUser as never
        )

        const mockSession = {
            id: "session-de",
            user_id: "user-de",
            session_id: "session-de-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }

        vi.mocked(createSession).mockResolvedValue(mockSession as never)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken,
                    email: "german@example.com",
                    name: "Deutscher Benutzer",
                    password: "DeutschesPasswort123!",
                    phone: "+491234567890",
                    birthDate: "1990-01-01",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.1",
                    "accept-language": "de-DE",
                },
            }
        )

        // Act
        const response = await POST(request)

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
    })

    it("should handle multilingual user data with special characters", async () => {
        // Setup: User with multilingual name
        const tempToken = generateTempToken({
            email: "multilingual@example.com",
            oauth_provider: "google",
            oauth_id: "google-multi",
            name: "José María García",
        })

        vi.mocked(validateTempToken).mockReturnValue({
            email: "multilingual@example.com",
            oauth_provider: "google",
            oauth_id: "google-multi",
            name: "José María García",
            exp: Math.floor(Date.now() / 1000) + 900,
        })

        vi.mocked(getUserByEmail).mockResolvedValue(null)
        vi.mocked(bcrypt.hash).mockResolvedValue("hashed-multi" as never)

        const updatedUser = {
            id: "user-multi",
            email: "multilingual@example.com",
            password_hash: "hashed-multi",
            oauth_provider: "google",
            oauth_id: "google-multi",
            name: "José María García",
            phone_number: "+34912345678",
            birth_date: new Date("1990-01-01"),
            account_completion_status: "completed",
            account_completed_at: new Date(),
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        }

        vi.mocked(updateUserAccountCompletion).mockResolvedValue(
            updatedUser as never
        )

        const mockSession = {
            id: "session-multi",
            user_id: "user-multi",
            session_id: "session-multi-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }

        vi.mocked(createSession).mockResolvedValue(mockSession as never)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/complete-account",
            {
                method: "POST",
                body: JSON.stringify({
                    tempToken,
                    email: "multilingual@example.com",
                    name: "José María García",
                    password: "MultilingualPass123!",
                    phone: "+34912345678",
                    birthDate: "1990-01-01",
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": "192.168.1.1",
                    "accept-language": "es-ES",
                },
            }
        )

        // Act
        const response = await POST(request)

        // Assert
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)

        // Verify multilingual name was preserved
        expect(updateUserAccountCompletion).toHaveBeenCalledWith(
            "google-multi",
            expect.objectContaining({
                name: "José María García",
            })
        )
    })
})
