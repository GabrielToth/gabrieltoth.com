/**
 * POST /api/auth/logout Tests
 * Unit tests for the logout endpoint
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 13.1, 13.2, 13.3, 13.4
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

// Mock dependencies
vi.mock("@/lib/auth/audit-logging", () => ({
    logAuditEvent: vi.fn(),
}))

vi.mock("@/lib/auth/session", () => ({
    removeSession: vi.fn(),
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

import { logAuditEvent } from "@/lib/auth/audit-logging"
import { removeSession } from "@/lib/auth/session"
import { db } from "@/lib/db"

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

    it("returns 401 when session is not found", async () => {
        ;(db.queryOne as any).mockResolvedValueOnce(null)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=invalid-session-id",
                },
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Invalid session")
    })

    it("successfully logs out user", async () => {
        ;(db.queryOne as any).mockResolvedValueOnce({
            user_id: "user-123",
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)

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

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toBe("Logout successful")
    })

    it("removes session from database", async () => {
        ;(db.queryOne as any).mockResolvedValueOnce({
            user_id: "user-123",
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
                },
            }
        )

        await POST(request)

        expect(removeSession).toHaveBeenCalledWith("valid-session-id")
    })

    it("logs logout event", async () => {
        ;(db.queryOne as any).mockResolvedValueOnce({
            user_id: "user-123",
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)

        const request = new NextRequest(
            "http://localhost:3000/api/auth/logout",
            {
                method: "POST",
                headers: {
                    cookie: "session=valid-session-id",
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

    it("clears session cookie", async () => {
        ;(db.queryOne as any).mockResolvedValueOnce({
            user_id: "user-123",
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
        })
        ;(removeSession as any).mockResolvedValueOnce(true)

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

        // Check that session cookie is cleared
        const setCookieHeader = response.headers.get("set-cookie")
        expect(setCookieHeader).toContain("session=")
        expect(setCookieHeader).toContain("Max-Age=0")
    })

    it("handles database errors gracefully", async () => {
        ;(db.queryOne as any).mockRejectedValueOnce(new Error("Database error"))

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

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toContain("An error occurred")
    })

    it("continues logout even if session removal fails", async () => {
        ;(db.queryOne as any).mockResolvedValueOnce({
            user_id: "user-123",
        })
        ;(db.queryOne as any).mockResolvedValueOnce({
            google_email: "user@example.com",
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
                },
            }
        )

        const response = await POST(request)
        const data = await response.json()

        // Should still succeed even if session removal fails
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
    })
})
