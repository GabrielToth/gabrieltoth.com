/**
 * POST /api/auth/logout Tests
 * Unit tests for the logout endpoint
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5, 3.1, 7.1, 7.2, 7.3, 7.4, 7.5,
 *            8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies BEFORE importing the module under test
vi.mock("@/lib/auth/audit-logging", () => ({
    logAuditEvent: vi.fn(),
}))

vi.mock("@/lib/auth/session", () => ({
    removeSession: vi.fn(),
    validateSession: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
    db: {
        queryOne: vi.fn(),
    },
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

vi.mock("@/lib/middleware/csrf-protection", () => ({
    validateCsrfToken: vi.fn(),
}))

// Import after mocks
import { logAuditEvent } from "@/lib/auth/audit-logging"
import { removeSession, validateSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { validateCsrfToken } from "@/lib/middleware/csrf-protection"
import { POST } from "./route"

describe("POST /api/auth/logout", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns 401 when session cookie is missing", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe("No active session")
    })

    it("returns 403 when CSRF token is missing", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                },
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Invalid CSRF token")
    })

    it("returns 403 when CSRF token is invalid", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(false)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                    "X-CSRF-Token": "invalid-csrf-token",
                },
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Invalid CSRF token")
    })

    it("returns 401 when session is not found", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(true)
        ;(validateSession as any).mockResolvedValueOnce(null)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=invalid-session-id",
                    "X-CSRF-Token": "valid-csrf-token",
                },
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Invalid session")
    })

    it("successfully logs out user and returns redirect instruction", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(true)
        ;(validateSession as any).mockResolvedValueOnce({
            id: "session-123",
            user_id: "user-123",
            session_id: "valid-session-id",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 86400000),
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
            email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                    "X-CSRF-Token": "valid-csrf-token",
                },
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.redirect).toBe("/auth/login")
    })

    it("removes session from database", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(true)
        ;(validateSession as any).mockResolvedValueOnce({
            id: "session-123",
            user_id: "user-123",
            session_id: "valid-session-id",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 86400000),
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
            email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                    "X-CSRF-Token": "valid-csrf-token",
                },
            }
        )

        await POST(request)

        expect(removeSession).toHaveBeenCalledWith("valid-session-id")
    })

    it("logs logout event with user email and IP", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(true)
        ;(validateSession as any).mockResolvedValueOnce({
            id: "session-123",
            user_id: "user-123",
            session_id: "valid-session-id",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 86400000),
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
            email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                    "X-CSRF-Token": "valid-csrf-token",
                },
            }
        )

        await POST(request)

        expect(logAuditEvent).toHaveBeenCalledWith(
            "LOGOUT",
            "user@example.com",
            "192.168.1.1",
            expect.any(Object),
            "user-123"
        )
    })

    it("clears session cookie with maxAge=0 and secure attributes", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(true)
        ;(validateSession as any).mockResolvedValueOnce({
            id: "session-123",
            user_id: "user-123",
            session_id: "valid-session-id",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 86400000),
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
            email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                    "X-CSRF-Token": "valid-csrf-token",
                },
            }
        )

        const response = await POST(request)

        // Check that session cookie is cleared with proper attributes
        const setCookieHeader = response.headers.get("set-cookie")
        expect(setCookieHeader).toContain("session=")
        expect(setCookieHeader).toContain("Max-Age=0")
        expect(setCookieHeader).toContain("HttpOnly")
        expect(setCookieHeader).toContain("SameSite=strict")
        expect(setCookieHeader).toContain("Path=/")
    })

    it("handles database errors gracefully", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(true)
        ;(validateSession as any).mockRejectedValueOnce(
            new Error("Database error")
        )

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                    "X-CSRF-Token": "valid-csrf-token",
                },
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toContain("An error occurred")
    })

    it("continues logout even if session removal fails", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(true)
        ;(validateSession as any).mockResolvedValueOnce({
            id: "session-123",
            user_id: "user-123",
            session_id: "valid-session-id",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 86400000),
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
            email: "user@example.com",
        })
        ;(removeSession as any).mockRejectedValueOnce(
            new Error("Database error")
        )

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                    "X-CSRF-Token": "valid-csrf-token",
                },
            }
        )

        const response = await POST(request)
        const data = await response.json()

        // Should still succeed even if session removal fails
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.redirect).toBe("/auth/login")
    })

    it("continues logout even if audit logging fails", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(true)
        ;(validateSession as any).mockResolvedValueOnce({
            id: "session-123",
            user_id: "user-123",
            session_id: "valid-session-id",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 86400000),
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
            email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)
        ;(logAuditEvent as any).mockRejectedValueOnce(
            new Error("Audit log error")
        )

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                    "X-CSRF-Token": "valid-csrf-token",
                },
            }
        )

        const response = await POST(request)
        const data = await response.json()

        // Should still succeed even if audit logging fails
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.redirect).toBe("/auth/login")
    })

    it("validates CSRF token before processing logout", async () => {
        ;(validateCsrfToken as any).mockReturnValueOnce(true)
        ;(validateSession as any).mockResolvedValueOnce({
            id: "session-123",
            user_id: "user-123",
            session_id: "valid-session-id",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 86400000),
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
            email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                    "X-CSRF-Token": "valid-csrf-token",
                },
            }
        )

        await POST(request)

        expect(validateCsrfToken).toHaveBeenCalledWith(
            "valid-session-id",
            "valid-csrf-token"
        )
    })
})
