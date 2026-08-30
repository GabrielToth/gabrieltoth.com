/**
 * POST /api/auth/google/callback Tests
 * Unit tests for the Google OAuth callback endpoint
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5,
 *            4.1, 4.2, 4.3, 4.4, 11.1, 11.2, 11.3, 13.1, 13.2, 13.3, 13.4, 14.2, 14.3, 14.4
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET, POST } from "./route"

// Mock dependencies
vi.mock("@/lib/auth/google-auth", () => ({
    exchangeCodeForToken: vi.fn(),
    validateGoogleToken: vi.fn(),
}))

vi.mock("@/lib/auth/user", () => ({
    upsertUser: vi.fn(),
}))

vi.mock("@/lib/auth/session", () => ({
    createSession: vi.fn(),
}))

vi.mock("@/lib/auth/audit-logging", () => ({
    logAuditEvent: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}))

vi.mock("@/lib/middleware/security-headers", () => ({
    getClientIp: vi.fn(() => "192.168.1.1"),
    getSecurityHeaders: vi.fn(() => ({})),
}))

import { logAuditEvent } from "@/lib/auth/audit-logging"
import {
    exchangeCodeForToken,
    validateGoogleToken,
} from "@/lib/auth/google-auth"
import { createSession } from "@/lib/auth/session"
import { upsertUser } from "@/lib/auth/user"

describe("POST /api/auth/google/callback", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI =
            "http://localhost:3000/api/auth/google/callback"
        process.env.JWT_SECRET =
            process.env.JWT_SECRET || "test-secret-key-for-callback-tests"
    })

    it("returns 400 when authorization code is missing", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback",
            {
                method: "POST",
                body: JSON.stringify({}),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("Authorization code is required")
    })

    it("returns 500 when redirect URI is not configured", async () => {
        delete process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI

        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback",
            {
                method: "POST",
                body: JSON.stringify({ code: "test-code" }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
    })

    it("returns 401 when code exchange fails", async () => {
        ;(exchangeCodeForToken as any).mockRejectedValueOnce(
            new Error("Invalid authorization code")
        )

        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback",
            {
                method: "POST",
                body: JSON.stringify({ code: "invalid-code" }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(logAuditEvent).toHaveBeenCalledWith(
            "LOGIN_FAILED",
            undefined,
            "192.168.1.1",
            expect.any(Object)
        )
    })

    it("returns 401 when token validation fails", async () => {
        ;(exchangeCodeForToken as any).mockResolvedValueOnce("valid-token")
        ;(validateGoogleToken as any).mockRejectedValueOnce(
            new Error("Invalid token")
        )

        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback",
            {
                method: "POST",
                body: JSON.stringify({ code: "test-code" }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(logAuditEvent).toHaveBeenCalledWith(
            "LOGIN_FAILED",
            undefined,
            "192.168.1.1",
            expect.any(Object)
        )
    })

    it("returns 500 when user creation fails", async () => {
        ;(exchangeCodeForToken as any).mockResolvedValueOnce("valid-token")
        ;(validateGoogleToken as any).mockResolvedValueOnce({
            sub: "google-123",
            email: "user@example.com",
            name: "Test User",
            picture: "https://example.com/pic.jpg",
        })
        ;(upsertUser as any).mockRejectedValueOnce(new Error("Database error"))

        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback",
            {
                method: "POST",
                body: JSON.stringify({ code: "test-code" }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
    })

    it("returns 500 when session creation fails", async () => {
        ;(exchangeCodeForToken as any).mockResolvedValueOnce("valid-token")
        ;(validateGoogleToken as any).mockResolvedValueOnce({
            sub: "google-123",
            email: "user@example.com",
            name: "Test User",
            picture: "https://example.com/pic.jpg",
        })
        ;(upsertUser as any).mockResolvedValueOnce({
            id: "user-123",
            google_id: "google-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
            account_completion_status: "completed",
        })
        ;(createSession as any).mockRejectedValueOnce(
            new Error("Database error")
        )

        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback",
            {
                method: "POST",
                body: JSON.stringify({ code: "test-code" }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
    })

    it("successfully authenticates user and creates session", async () => {
        ;(exchangeCodeForToken as any).mockResolvedValueOnce("valid-token")
        ;(validateGoogleToken as any).mockResolvedValueOnce({
            sub: "google-123",
            email: "user@example.com",
            name: "Test User",
            picture: "https://example.com/pic.jpg",
        })
        ;(upsertUser as any).mockResolvedValueOnce({
            id: "user-123",
            google_id: "google-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
            account_completion_status: "completed",
        })
        ;(createSession as any).mockResolvedValueOnce({
            id: "session-123",
            user_id: "user-123",
            session_id: "session-token-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })

        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback",
            {
                method: "POST",
                body: JSON.stringify({ code: "test-code" }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.redirectUrl).toBe("/dashboard")
        expect(logAuditEvent).toHaveBeenCalledWith(
            "LOGIN_SUCCESS",
            "user@example.com",
            "192.168.1.1",
            expect.any(Object),
            "user-123"
        )
    })

    it("sets HTTP-Only session cookie", async () => {
        ;(exchangeCodeForToken as any).mockResolvedValueOnce("valid-token")
        ;(validateGoogleToken as any).mockResolvedValueOnce({
            sub: "google-123",
            email: "user@example.com",
            name: "Test User",
            picture: "https://example.com/pic.jpg",
        })
        ;(upsertUser as any).mockResolvedValueOnce({
            id: "user-123",
            google_id: "google-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
            account_completion_status: "completed",
        })
        ;(createSession as any).mockResolvedValueOnce({
            id: "session-123",
            user_id: "user-123",
            session_id: "session-token-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })

        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback",
            {
                method: "POST",
                body: JSON.stringify({ code: "test-code" }),
            }
        )

        const response = await POST(request)

        // Check that session cookie is set
        const setCookieHeader = response.headers.get("set-cookie")
        expect(setCookieHeader).toContain("session=session-token-123")
        expect(setCookieHeader).toContain("HttpOnly")
        expect(setCookieHeader?.toLowerCase()).toContain("samesite=lax")
    })

    it("redirects to account completion when OAuth account is pending", async () => {
        ;(exchangeCodeForToken as any).mockResolvedValueOnce("valid-token")
        ;(validateGoogleToken as any).mockResolvedValueOnce({
            sub: "google-123",
            email: "user@example.com",
            name: "Test User",
            picture: "https://example.com/pic.jpg",
        })
        ;(upsertUser as any).mockResolvedValueOnce({
            id: "user-123",
            google_id: "google-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
            account_completion_status: "pending",
        })

        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback",
            {
                method: "POST",
                body: JSON.stringify({ code: "test-code" }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.requiresCompletion).toBe(true)
        expect(data.tempToken).toBeTruthy()
        expect(data.redirectUrl).toContain("/auth/complete-account")
        // No session cookie should be set for incomplete accounts
        expect(response.headers.get("set-cookie")).toBeNull()
    })

    it("GET redirects to account completion page when OAuth account is pending", async () => {
        ;(exchangeCodeForToken as any).mockResolvedValueOnce("valid-token")
        ;(validateGoogleToken as any).mockResolvedValueOnce({
            sub: "google-123",
            email: "user@example.com",
            name: "Test User",
            picture: "https://example.com/pic.jpg",
        })
        ;(upsertUser as any).mockResolvedValueOnce({
            id: "user-123",
            google_id: "google-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
            account_completion_status: "pending",
        })

        const request = new NextRequest(
            "http://localhost:3000/api/auth/google/callback?code=test-code",
            { method: "GET" }
        )

        const response = await GET(request)

        expect(response.status).toBe(307)
        expect(response.headers.get("location")).toContain(
            "/auth/complete-account"
        )
        // No session cookie should be set for incomplete accounts
        expect(response.headers.get("set-cookie")).toBeNull()
    })
})
