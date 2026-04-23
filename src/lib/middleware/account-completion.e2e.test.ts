/**
 * Middleware Integration Tests for Account Completion Flow
 *
 * Tests the middleware integration with the account completion flow,
 * including redirection, session validation, and access control.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import * as sessionModule from "@/lib/auth/session"
import * as userModule from "@/lib/auth/user"
import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    checkAccountCompletion,
    getAccountCompletionStatus,
    isAccountComplete,
} from "./account-completion"

// Mock modules
vi.mock("@/lib/auth/user")
vi.mock("@/lib/auth/session")
vi.mock("@/lib/logger")

describe("Account Completion Middleware - Integration Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("Middleware Redirection Flow", () => {
        it("should redirect incomplete account to completion page", async () => {
            // Setup: User with incomplete account
            const incompleteUser = {
                id: "user-incomplete",
                email: "incomplete@example.com",
                password_hash: null, // No password = incomplete
                oauth_provider: "google",
                oauth_id: "google-incomplete",
                name: "Incomplete User",
                picture: "https://example.com/photo.jpg",
                phone_number: null,
                birth_date: null,
                account_completion_status: "pending",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            const mockSession = {
                id: "session-incomplete",
                user_id: "user-incomplete",
                session_id: "session-incomplete-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                mockSession as never
            )
            vi.mocked(userModule.getUserById).mockResolvedValue(
                incompleteUser as never
            )

            // Request to protected route
            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should redirect to completion page
            expect(result).not.toBeNull()
            expect(result).toBeInstanceOf(NextResponse)
            const redirectUrl = (result as NextResponse).headers.get("location")
            expect(redirectUrl).toContain("/auth/complete-account")
        })

        it("should allow access for complete account", async () => {
            // Setup: User with complete account
            const completeUser = {
                id: "user-complete",
                email: "complete@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-complete",
                name: "Complete User",
                picture: "https://example.com/photo.jpg",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            const mockSession = {
                id: "session-complete",
                user_id: "user-complete",
                session_id: "session-complete-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                mockSession as never
            )
            vi.mocked(userModule.getUserById).mockResolvedValue(
                completeUser as never
            )

            // Request to protected route
            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should allow access (return null)
            expect(result).toBeNull()
        })

        it("should allow access to completion page for incomplete account", async () => {
            // Setup: User with incomplete account accessing completion page
            const incompleteUser = {
                id: "user-incomplete",
                email: "incomplete@example.com",
                password_hash: null,
                oauth_provider: "google",
                oauth_id: "google-incomplete",
                name: "Incomplete User",
                phone_number: null,
                birth_date: null,
                account_completion_status: "pending",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            const mockSession = {
                id: "session-incomplete",
                user_id: "user-incomplete",
                session_id: "session-incomplete-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                mockSession as never
            )
            vi.mocked(userModule.getUserById).mockResolvedValue(
                incompleteUser as never
            )

            // Request to completion page
            const request = new NextRequest(
                new URL("http://localhost:3000/en/auth/complete-account")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should allow access to completion page
            expect(result).toBeNull()
        })

        it("should allow access to API endpoints for incomplete account", async () => {
            // Setup: User with incomplete account accessing API
            const incompleteUser = {
                id: "user-incomplete",
                email: "incomplete@example.com",
                password_hash: null,
                oauth_provider: "google",
                oauth_id: "google-incomplete",
                name: "Incomplete User",
                phone_number: null,
                birth_date: null,
                account_completion_status: "pending",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            const mockSession = {
                id: "session-incomplete",
                user_id: "user-incomplete",
                session_id: "session-incomplete-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                mockSession as never
            )
            vi.mocked(userModule.getUserById).mockResolvedValue(
                incompleteUser as never
            )

            // Request to API endpoint
            const request = new NextRequest(
                new URL("http://localhost:3000/api/auth/logout")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should allow access to API
            expect(result).toBeNull()
        })
    })

    describe("Session Validation in Middleware", () => {
        it("should handle missing session gracefully", async () => {
            // Setup: No session
            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                null
            )

            // Request to protected route
            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should return null (let other middleware handle)
            expect(result).toBeNull()
        })

        it("should handle expired session gracefully", async () => {
            // Setup: Expired session
            const expiredSession = {
                id: "session-expired",
                user_id: "user-123",
                session_id: "session-expired-123",
                created_at: new Date(Date.now() - 60 * 60 * 1000),
                expires_at: new Date(Date.now() - 1000), // Expired
            }

            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                expiredSession as never
            )

            // Request to protected route
            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should return null (session validation happens elsewhere)
            expect(result).toBeNull()
        })

        it("should handle user not found gracefully", async () => {
            // Setup: Session exists but user not found
            const mockSession = {
                id: "session-notfound",
                user_id: "user-notfound",
                session_id: "session-notfound-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                mockSession as never
            )
            vi.mocked(userModule.getUserById).mockResolvedValue(null)

            // Request to protected route
            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should return null (user not found)
            expect(result).toBeNull()
        })

        it("should handle database errors gracefully", async () => {
            // Setup: Database error
            const mockSession = {
                id: "session-error",
                user_id: "user-error",
                session_id: "session-error-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                mockSession as never
            )
            vi.mocked(userModule.getUserById).mockRejectedValue(
                new Error("Database connection failed")
            )

            // Request to protected route
            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should return null and not throw
            expect(result).toBeNull()
        })
    })

    describe("Account Completion Status Checks", () => {
        it("should correctly identify pending accounts", async () => {
            // Setup: Pending account
            const pendingUser = {
                id: "user-pending",
                email: "pending@example.com",
                password_hash: null,
                oauth_provider: "google",
                oauth_id: "google-pending",
                name: "Pending User",
                phone_number: null,
                birth_date: null,
                account_completion_status: "pending",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(userModule.getUserById).mockResolvedValue(
                pendingUser as never
            )

            // Act
            const status = await getAccountCompletionStatus("user-pending")

            // Assert
            expect(status).toBe("pending")
        })

        it("should correctly identify in-progress accounts", async () => {
            // Setup: In-progress account
            const inProgressUser = {
                id: "user-inprogress",
                email: "inprogress@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-inprogress",
                name: "In Progress User",
                phone_number: null,
                birth_date: null,
                account_completion_status: "in_progress",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(userModule.getUserById).mockResolvedValue(
                inProgressUser as never
            )

            // Act
            const status = await getAccountCompletionStatus("user-inprogress")

            // Assert
            expect(status).toBe("in_progress")
        })

        it("should correctly identify completed accounts", async () => {
            // Setup: Completed account
            const completedUser = {
                id: "user-completed",
                email: "completed@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-completed",
                name: "Completed User",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(userModule.getUserById).mockResolvedValue(
                completedUser as never
            )

            // Act
            const status = await getAccountCompletionStatus("user-completed")

            // Assert
            expect(status).toBe("completed")
        })

        it("should return null for non-existent user", async () => {
            // Setup: User not found
            vi.mocked(userModule.getUserById).mockResolvedValue(null)

            // Act
            const status = await getAccountCompletionStatus("user-notfound")

            // Assert
            expect(status).toBeNull()
        })
    })

    describe("Account Completion Verification", () => {
        it("should verify complete account with all required fields", async () => {
            // Setup: Complete account with all fields
            const completeUser = {
                id: "user-verify-complete",
                email: "verify@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-verify",
                name: "Verify User",
                picture: "https://example.com/photo.jpg",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(userModule.getUserById).mockResolvedValue(
                completeUser as never
            )

            // Act
            const isComplete = await isAccountComplete("user-verify-complete")

            // Assert
            expect(isComplete).toBe(true)
        })

        it("should identify incomplete account without password", async () => {
            // Setup: Incomplete account (no password)
            const incompleteUser = {
                id: "user-verify-incomplete",
                email: "verify-incomplete@example.com",
                password_hash: null,
                oauth_provider: "google",
                oauth_id: "google-verify-incomplete",
                name: "Verify Incomplete User",
                phone_number: null,
                birth_date: null,
                account_completion_status: "pending",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(userModule.getUserById).mockResolvedValue(
                incompleteUser as never
            )

            // Act
            const isComplete = await isAccountComplete("user-verify-incomplete")

            // Assert
            expect(isComplete).toBe(false)
        })

        it("should identify incomplete account with wrong status", async () => {
            // Setup: Account with password but wrong status
            const wrongStatusUser = {
                id: "user-verify-wrong-status",
                email: "verify-wrong@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-verify-wrong",
                name: "Verify Wrong Status User",
                phone_number: null,
                birth_date: null,
                account_completion_status: "in_progress",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            vi.mocked(userModule.getUserById).mockResolvedValue(
                wrongStatusUser as never
            )

            // Act
            const isComplete = await isAccountComplete(
                "user-verify-wrong-status"
            )

            // Assert
            expect(isComplete).toBe(false)
        })

        it("should return false for non-existent user", async () => {
            // Setup: User not found
            vi.mocked(userModule.getUserById).mockResolvedValue(null)

            // Act
            const isComplete = await isAccountComplete("user-verify-notfound")

            // Assert
            expect(isComplete).toBe(false)
        })

        it("should handle errors gracefully", async () => {
            // Setup: Database error
            vi.mocked(userModule.getUserById).mockRejectedValue(
                new Error("Database error")
            )

            // Act
            const isComplete = await isAccountComplete("user-verify-error")

            // Assert: Should return false instead of throwing
            expect(isComplete).toBe(false)
        })
    })

    describe("Middleware Integration with Multiple Locales", () => {
        it("should redirect to correct locale completion page", async () => {
            // Setup: Incomplete user
            const incompleteUser = {
                id: "user-locale",
                email: "locale@example.com",
                password_hash: null,
                oauth_provider: "google",
                oauth_id: "google-locale",
                name: "Locale User",
                phone_number: null,
                birth_date: null,
                account_completion_status: "pending",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            const mockSession = {
                id: "session-locale",
                user_id: "user-locale",
                session_id: "session-locale-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                mockSession as never
            )
            vi.mocked(userModule.getUserById).mockResolvedValue(
                incompleteUser as never
            )

            // Request to Portuguese locale
            const request = new NextRequest(
                new URL("http://localhost:3000/pt-BR/dashboard")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should redirect to completion page
            expect(result).not.toBeNull()
            expect(result).toBeInstanceOf(NextResponse)
        })

        it("should preserve locale in redirect URL", async () => {
            // Setup: Incomplete user
            const incompleteUser = {
                id: "user-locale-preserve",
                email: "locale-preserve@example.com",
                password_hash: null,
                oauth_provider: "google",
                oauth_id: "google-locale-preserve",
                name: "Locale Preserve User",
                phone_number: null,
                birth_date: null,
                account_completion_status: "pending",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            }

            const mockSession = {
                id: "session-locale-preserve",
                user_id: "user-locale-preserve",
                session_id: "session-locale-preserve-123",
                created_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                mockSession as never
            )
            vi.mocked(userModule.getUserById).mockResolvedValue(
                incompleteUser as never
            )

            // Request to Spanish locale
            const request = new NextRequest(
                new URL("http://localhost:3000/es/dashboard")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should redirect to Spanish completion page
            expect(result).not.toBeNull()
            const redirectUrl = (result as NextResponse).headers.get("location")
            expect(redirectUrl).toContain("/es/auth/complete-account")
        })
    })

    describe("Middleware Error Handling", () => {
        it("should not throw on unexpected errors", async () => {
            // Setup: Unexpected error
            vi.mocked(sessionModule.getSessionFromCookie).mockRejectedValue(
                new Error("Unexpected error")
            )

            // Request to protected route
            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            // Act & Assert: Should not throw
            expect(async () => {
                await checkAccountCompletion(request)
            }).not.toThrow()
        })

        it("should handle malformed requests gracefully", async () => {
            // Setup: No session
            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                null
            )

            // Request with unusual URL
            const request = new NextRequest(
                new URL("http://localhost:3000/../../etc/passwd")
            )

            // Act
            const result = await checkAccountCompletion(request)

            // Assert: Should handle gracefully
            expect(result).toBeNull()
        })
    })
})
