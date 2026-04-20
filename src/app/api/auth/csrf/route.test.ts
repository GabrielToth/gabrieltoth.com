/**
 * Unit Tests: CSRF Token API Endpoint
 * Tests for GET /api/auth/csrf endpoint
 *
 * Requirements: 6.1, 6.4
 */

import {
    generateCsrfTokenForSession,
    invalidateCsrfToken,
} from "@/lib/middleware/csrf-protection"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it } from "vitest"
import { GET } from "./route"

describe("GET /api/auth/csrf", () => {
    const sessionToken = "test-session-token"

    beforeEach(() => {
        // Clear any existing tokens
        invalidateCsrfToken(sessionToken)
    })

    it("should return CSRF token for authenticated session", async () => {
        const request = new NextRequest("http://localhost/api/auth/csrf", {
            method: "GET",
            headers: {
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const response = await GET(request)
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.csrfToken).toBeDefined()
        expect(typeof body.data.csrfToken).toBe("string")
        expect(body.data.csrfToken.length).toBeGreaterThan(0)

        // Check header
        expect(response.headers.get("X-CSRF-Token")).toBe(body.data.csrfToken)
    })

    it("should return existing CSRF token if already generated", async () => {
        // Generate a token first
        const existingToken = generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest("http://localhost/api/auth/csrf", {
            method: "GET",
            headers: {
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const response = await GET(request)
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.csrfToken).toBe(existingToken)
    })

    it("should return 401 for unauthenticated request", async () => {
        const request = new NextRequest("http://localhost/api/auth/csrf", {
            method: "GET",
        })

        const response = await GET(request)
        const body = await response.json()

        expect(response.status).toBe(401)
        expect(body.success).toBe(false)
        expect(body.error).toBe("No active session")
    })

    it("should generate different tokens for different sessions", async () => {
        const session1 = "session-1"
        const session2 = "session-2"

        const request1 = new NextRequest("http://localhost/api/auth/csrf", {
            method: "GET",
            headers: {
                cookie: `auth_session=${session1}`,
            },
        })

        const request2 = new NextRequest("http://localhost/api/auth/csrf", {
            method: "GET",
            headers: {
                cookie: `auth_session=${session2}`,
            },
        })

        const response1 = await GET(request1)
        const body1 = await response1.json()

        const response2 = await GET(request2)
        const body2 = await response2.json()

        expect(body1.data.csrfToken).not.toBe(body2.data.csrfToken)

        // Cleanup
        invalidateCsrfToken(session1)
        invalidateCsrfToken(session2)
    })
})
