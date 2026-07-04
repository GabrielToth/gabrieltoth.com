/**
 * POST /api/auth/refresh Tests
 * Unit tests for the session refresh endpoint (Keep Me Logged In)
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 5.1, 5.2
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies
vi.mock("@/lib/auth/session", () => ({
    getRememberMeToken: vi.fn(),
    createRememberMeToken: vi.fn(),
    deleteRememberMeToken: vi.fn(),
    createSession: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
    db: {
        queryOne: vi.fn(),
    },
}))

vi.mock("@/lib/logger", () => ({
    logger: {
        debug: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock("@/lib/middleware/security-headers", () => ({
    getClientIp: vi.fn(() => "127.0.0.1"),
}))

vi.mock("@/lib/auth/error-handling", () => ({
    handleUnexpectedError: vi.fn(err =>
        Response.json(
            { success: false, error: "An unexpected error occurred" },
            { status: 500 }
        )
    ),
}))

// Import route AFTER mocks
import { POST } from "./route"

const {
    getRememberMeToken,
    createRememberMeToken,
    deleteRememberMeToken,
    createSession,
} = await import("@/lib/auth/session")
const { db } = await import("@/lib/db")

describe("POST /api/auth/refresh", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should return 401 when no remember_me_token cookie", async () => {
        const request = new NextRequest("http://localhost/api/auth/refresh", {
            method: "POST",
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data).toEqual({
            success: false,
            error: "No remember me token",
        })
    })

    it("should return 401 and clear cookies when token not found or expired", async () => {
        vi.mocked(getRememberMeToken).mockResolvedValueOnce(null)

        const request = new NextRequest("http://localhost/api/auth/refresh", {
            method: "POST",
            headers: { cookie: "remember_me_token=expired-token" },
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data).toEqual({
            success: false,
            error: "Invalid or expired remember me token",
        })

        // Verify cookies are cleared
        const setCookie = response.headers.get("set-cookie")
        expect(setCookie).toContain("auth_session=;")
        expect(setCookie).toContain("remember_me_token=;")
        expect(setCookie).toContain("Max-Age=0")
    })

    it("should return 401 and clean up orphaned token when user not found", async () => {
        const tokenRow = {
            id: "token-123",
            user_id: "user-123",
            token_hash: "remember-me-token-hash",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            ip_address: "127.0.0.1",
            user_agent: "test-agent",
        }

        vi.mocked(getRememberMeToken).mockResolvedValueOnce(tokenRow)
        vi.mocked(db.queryOne).mockResolvedValueOnce(null)

        const request = new NextRequest("http://localhost/api/auth/refresh", {
            method: "POST",
            headers: { cookie: "remember_me_token=remember-me-token-hash" },
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data).toEqual({
            success: false,
            error: "User not found",
        })
        // Orphaned token should be cleaned up
        expect(deleteRememberMeToken).toHaveBeenCalledWith(
            "remember-me-token-hash"
        )
    })

    it("should return 200 with new session and rotated remember_me_token", async () => {
        const tokenRow = {
            id: "token-123",
            user_id: "user-123",
            token_hash: "old-remember-me-token",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            ip_address: "127.0.0.1",
            user_agent: "test-agent",
        }

        const user = { id: "user-123", email: "user@example.com" }

        const newRememberMeToken = {
            id: "new-token-456",
            user_id: "user-123",
            token_hash: "new-remember-me-token-hash",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            ip_address: "127.0.0.1",
            user_agent: "test-agent",
        }

        const newSession = {
            id: "session-789",
            user_id: "user-123",
            session_id: "new-session-token",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
        }

        vi.mocked(getRememberMeToken).mockResolvedValueOnce(tokenRow)
        vi.mocked(db.queryOne).mockResolvedValueOnce(user)
        vi.mocked(createRememberMeToken).mockResolvedValueOnce(
            newRememberMeToken
        )
        vi.mocked(createSession).mockResolvedValueOnce(newSession)

        const request = new NextRequest("http://localhost/api/auth/refresh", {
            method: "POST",
            headers: { cookie: "remember_me_token=old-remember-me-token" },
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
            success: true,
            user: { id: "user-123", email: "user@example.com" },
        })

        // Verify token rotation
        expect(createRememberMeToken).toHaveBeenCalledWith(
            "user-123",
            "127.0.0.1",
            undefined
        )
        expect(deleteRememberMeToken).toHaveBeenCalledWith(
            "old-remember-me-token"
        )
        expect(createSession).toHaveBeenCalledWith("user-123")

        // Verify cookies are set
        const setCookie = response.headers.get("set-cookie")
        expect(setCookie).toContain("auth_session=new-session-token")
        expect(setCookie).toContain(
            "remember_me_token=new-remember-me-token-hash"
        )
    })

    it("should pass user-agent to createRememberMeToken", async () => {
        const tokenRow = {
            id: "token-123",
            user_id: "user-123",
            token_hash: "old-remember-me-token",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            ip_address: "127.0.0.1",
            user_agent: "test-agent",
        }

        const user = { id: "user-123", email: "user@example.com" }
        const newRememberMeToken = {
            id: "new-token-456",
            user_id: "user-123",
            token_hash: "new-hash",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            ip_address: "127.0.0.1",
            user_agent: "Mozilla/5.0",
        }

        const newSession = {
            id: "session-789",
            user_id: "user-123",
            session_id: "new-session-token",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
        }

        vi.mocked(getRememberMeToken).mockResolvedValueOnce(tokenRow)
        vi.mocked(db.queryOne).mockResolvedValueOnce(user)
        vi.mocked(createRememberMeToken).mockResolvedValueOnce(
            newRememberMeToken
        )
        vi.mocked(createSession).mockResolvedValueOnce(newSession)

        const request = new NextRequest("http://localhost/api/auth/refresh", {
            method: "POST",
            headers: {
                cookie: "remember_me_token=old-remember-me-token",
                "user-agent": "Mozilla/5.0",
            },
        })

        await POST(request)

        expect(createRememberMeToken).toHaveBeenCalledWith(
            "user-123",
            "127.0.0.1",
            "Mozilla/5.0"
        )
    })

    it("should handle unexpected errors gracefully", async () => {
        vi.mocked(getRememberMeToken).mockRejectedValueOnce(
            new Error("Database connection failed")
        )

        const request = new NextRequest("http://localhost/api/auth/refresh", {
            method: "POST",
            headers: { cookie: "remember_me_token=some-token" },
        })

        const response = await POST(request)

        expect(response.status).toBe(500)
    })

    it("should call deleteRememberMeToken for the old token after new token is created", async () => {
        const tokenRow = {
            id: "token-123",
            user_id: "user-123",
            token_hash: "old-token",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            ip_address: "127.0.0.1",
            user_agent: "test-agent",
        }

        const user = { id: "user-123", email: "user@example.com" }
        const newRememberMeToken = {
            id: "new-token-456",
            user_id: "user-123",
            token_hash: "new-token",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            ip_address: "127.0.0.1",
            user_agent: "test-agent",
        }

        const newSession = {
            id: "session-789",
            user_id: "user-123",
            session_id: "session-token",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
        }

        vi.mocked(getRememberMeToken).mockResolvedValueOnce(tokenRow)
        vi.mocked(db.queryOne).mockResolvedValueOnce(user)
        vi.mocked(createRememberMeToken).mockResolvedValueOnce(
            newRememberMeToken
        )
        vi.mocked(createSession).mockResolvedValueOnce(newSession)

        const request = new NextRequest("http://localhost/api/auth/refresh", {
            method: "POST",
            headers: { cookie: "remember_me_token=old-token" },
        })

        await POST(request)

        // Verify order: new token created BEFORE old is deleted (token rotation)
        const createCallOrder = vi.mocked(createRememberMeToken).mock
            .invocationCallOrder[0]
        const deleteCallOrder = vi.mocked(deleteRememberMeToken).mock
            .invocationCallOrder[0]
        expect(createCallOrder).toBeLessThan(deleteCallOrder)
    })

    it("should set cookie SameSite=strict and HttpOnly for security", async () => {
        const tokenRow = {
            id: "token-123",
            user_id: "user-123",
            token_hash: "old-token",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            ip_address: "127.0.0.1",
            user_agent: "test-agent",
        }

        const user = { id: "user-123", email: "user@example.com" }
        const newRememberMeToken = {
            id: "new-token-456",
            user_id: "user-123",
            token_hash: "new-hash",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            created_at: new Date(),
            ip_address: "127.0.0.1",
            user_agent: "test-agent",
        }

        const newSession = {
            id: "session-789",
            user_id: "user-123",
            session_id: "session-token",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
        }

        vi.mocked(getRememberMeToken).mockResolvedValueOnce(tokenRow)
        vi.mocked(db.queryOne).mockResolvedValueOnce(user)
        vi.mocked(createRememberMeToken).mockResolvedValueOnce(
            newRememberMeToken
        )
        vi.mocked(createSession).mockResolvedValueOnce(newSession)

        const request = new NextRequest("http://localhost/api/auth/refresh", {
            method: "POST",
            headers: { cookie: "remember_me_token=old-token" },
        })

        const response = await POST(request)
        const setCookie = response.headers.get("set-cookie")

        expect(setCookie).toContain("HttpOnly")
        expect(setCookie).toContain("SameSite=strict")
    })
})
