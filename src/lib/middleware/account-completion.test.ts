/**
 * Account Completion Middleware Tests
 *
 * Tests for the account completion middleware that intercepts requests
 * and redirects incomplete accounts to the completion flow.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import * as sessionModule from "@/lib/auth/session"
import * as userModule from "@/lib/auth/user"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    checkAccountCompletion,
    getAccountCompletionStatus,
    isAccountComplete,
} from "./account-completion"

// Mock modules
vi.mock("@/lib/auth/user")
vi.mock("@/lib/auth/session")

describe("Account Completion Middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("checkAccountCompletion", () => {
        it("should return null for public routes", async () => {
            const request = new NextRequest(
                new URL("http://localhost:3000/auth/login")
            )

            const result = await checkAccountCompletion(request)

            expect(result).toBeNull()
        })

        it("should return null for account completion flow routes", async () => {
            const request = new NextRequest(
                new URL("http://localhost:3000/en/auth/complete-account")
            )

            const result = await checkAccountCompletion(request)

            expect(result).toBeNull()
        })

        it("should return null when no session exists", async () => {
            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue(
                null
            )

            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            const result = await checkAccountCompletion(request)

            expect(result).toBeNull()
        })

        it("should return null when user not found", async () => {
            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
                user_id: "user-123",
                session_id: "session-123",
                id: "id-123",
                created_at: new Date(),
                expires_at: new Date(),
            })

            vi.mocked(userModule.getUserById).mockResolvedValue(null)

            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            const result = await checkAccountCompletion(request)

            expect(result).toBeNull()
        })

        it("should return null for complete accounts", async () => {
            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
                user_id: "user-123",
                session_id: "session-123",
                id: "id-123",
                created_at: new Date(),
                expires_at: new Date(),
            })

            vi.mocked(userModule.getUserById).mockResolvedValue({
                id: "user-123",
                email: "user@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            })

            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            const result = await checkAccountCompletion(request)

            expect(result).toBeNull()
        })

        it("should handle errors gracefully", async () => {
            vi.mocked(sessionModule.getSessionFromCookie).mockResolvedValue({
                user_id: "user-123",
                session_id: "session-123",
                id: "id-123",
                created_at: new Date(),
                expires_at: new Date(),
            })

            vi.mocked(userModule.getUserById).mockRejectedValue(
                new Error("Database error")
            )

            const request = new NextRequest(
                new URL("http://localhost:3000/en/dashboard")
            )

            const result = await checkAccountCompletion(request)

            // Should return null and not throw
            expect(result).toBeNull()
        })

        it("should allow access to API endpoints for incomplete accounts", async () => {
            const request = new NextRequest(
                new URL("http://localhost:3000/api/auth/logout")
            )

            const result = await checkAccountCompletion(request)

            expect(result).toBeNull()
        })
    })

    describe("getAccountCompletionStatus", () => {
        it("should return completion status for existing user", async () => {
            vi.mocked(userModule.getUserById).mockResolvedValue({
                id: "user-123",
                email: "user@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            })

            const status = await getAccountCompletionStatus("user-123")

            expect(status).toBe("completed")
        })

        it("should return null for non-existent user", async () => {
            vi.mocked(userModule.getUserById).mockResolvedValue(null)

            const status = await getAccountCompletionStatus("user-123")

            expect(status).toBeNull()
        })

        it("should return pending status", async () => {
            vi.mocked(userModule.getUserById).mockResolvedValue({
                id: "user-123",
                email: "user@example.com",
                password_hash: null,
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
                phone_number: null,
                birth_date: null,
                account_completion_status: "pending",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            })

            const status = await getAccountCompletionStatus("user-123")

            expect(status).toBe("pending")
        })

        it("should handle errors gracefully", async () => {
            vi.mocked(userModule.getUserById).mockRejectedValue(
                new Error("Database error")
            )

            const status = await getAccountCompletionStatus("user-123")

            expect(status).toBeNull()
        })
    })

    describe("isAccountComplete", () => {
        it("should return true for complete accounts", async () => {
            vi.mocked(userModule.getUserById).mockResolvedValue({
                id: "user-123",
                email: "user@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
                phone_number: "+1234567890",
                birth_date: new Date("1990-01-01"),
                account_completion_status: "completed",
                account_completed_at: new Date(),
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            })

            const isComplete = await isAccountComplete("user-123")

            expect(isComplete).toBe(true)
        })

        it("should return false for incomplete accounts without password", async () => {
            vi.mocked(userModule.getUserById).mockResolvedValue({
                id: "user-123",
                email: "user@example.com",
                password_hash: null,
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
                phone_number: null,
                birth_date: null,
                account_completion_status: "pending",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            })

            const isComplete = await isAccountComplete("user-123")

            expect(isComplete).toBe(false)
        })

        it("should return false for accounts with password but not completed status", async () => {
            vi.mocked(userModule.getUserById).mockResolvedValue({
                id: "user-123",
                email: "user@example.com",
                password_hash: "hashed-password",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
                phone_number: null,
                birth_date: null,
                account_completion_status: "in_progress",
                account_completed_at: null,
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            })

            const isComplete = await isAccountComplete("user-123")

            expect(isComplete).toBe(false)
        })

        it("should return false for non-existent user", async () => {
            vi.mocked(userModule.getUserById).mockResolvedValue(null)

            const isComplete = await isAccountComplete("user-123")

            expect(isComplete).toBe(false)
        })

        it("should handle errors gracefully", async () => {
            vi.mocked(userModule.getUserById).mockRejectedValue(
                new Error("Database error")
            )

            const isComplete = await isAccountComplete("user-123")

            expect(isComplete).toBe(false)
        })
    })
})
