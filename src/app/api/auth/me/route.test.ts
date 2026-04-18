/**
 * GET /api/auth/me Tests
 * Unit tests for the get current user endpoint
 *
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route"

// Mock dependencies
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
    getSecurityHeaders: vi.fn(() => ({})),
}))

import { db } from "@/lib/db"

describe("GET /api/auth/me", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns 401 when session cookie is missing", async () => {
        const request = new NextRequest("http://localhost:3000/api/auth/me", {
            method: "GET",
        })

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Unauthorized")
    })

    it("returns 401 when session is not found", async () => {
        ;(db.queryOne as any).mockResolvedValueOnce(null)

        const request = new NextRequest("http://localhost:3000/api/auth/me", {
            method: "GET",
            headers: {
                cookie: "session=invalid-session-id",
            },
        })

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Unauthorized")
    })

    it("returns 401 when session is expired", async () => {
        ;(db.queryOne as any).mockResolvedValueOnce({
            user_id: "user-123",
            expires_at: new Date(Date.now() - 1000), // Expired 1 second ago
        })

        const request = new NextRequest("http://localhost:3000/api/auth/me", {
            method: "GET",
            headers: {
                cookie: "session=valid-session-id",
            },
        })

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Unauthorized")
    })

    it("returns 401 when user is not found", async () => {
        ;(db.queryOne as any)
            .mockResolvedValueOnce({
                user_id: "user-123",
                expires_at: new Date(Date.now() + 1000), // Expires in 1 second
            })
            .mockResolvedValueOnce(null) // User not found

        const request = new NextRequest("http://localhost:3000/api/auth/me", {
            method: "GET",
            headers: {
                cookie: "session=valid-session-id",
            },
        })

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Unauthorized")
    })

    it("returns user data when session is valid", async () => {
        ;(db.queryOne as any)
            .mockResolvedValueOnce({
                user_id: "user-123",
                expires_at: new Date(Date.now() + 1000), // Expires in 1 second
            })
            .mockResolvedValueOnce({
                id: "user-123",
                google_email: "user@example.com",
                google_name: "Test User",
                google_picture: "https://example.com/pic.jpg",
            })

        const request = new NextRequest("http://localhost:3000/api/auth/me", {
            method: "GET",
            headers: {
                cookie: "session=valid-session-id",
            },
        })

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toEqual({
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
        })
    })

    it("returns user data without picture when not available", async () => {
        ;(db.queryOne as any)
            .mockResolvedValueOnce({
                user_id: "user-123",
                expires_at: new Date(Date.now() + 1000),
            })
            .mockResolvedValueOnce({
                id: "user-123",
                google_email: "user@example.com",
                google_name: "Test User",
                google_picture: null,
            })

        const request = new NextRequest("http://localhost:3000/api/auth/me", {
            method: "GET",
            headers: {
                cookie: "session=valid-session-id",
            },
        })

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.google_picture).toBeUndefined()
    })

    it("handles database errors", async () => {
        ;(db.queryOne as any).mockRejectedValueOnce(new Error("Database error"))

        const request = new NextRequest("http://localhost:3000/api/auth/me", {
            method: "GET",
            headers: {
                cookie: "session=valid-session-id",
            },
        })

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toContain("An error occurred")
    })
})
