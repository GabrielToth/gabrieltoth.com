/**
 * Unit Tests: Example Protected API Endpoint
 * Tests for CSRF-protected API routes
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import {
    generateCsrfTokenForSession,
    invalidateCsrfToken,
} from "@/lib/middleware/csrf-protection"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it } from "vitest"
import { DELETE, GET, POST, PUT } from "./route"

describe("Example Protected API Endpoint", () => {
    const sessionToken = "test-session-token"

    beforeEach(() => {
        // Clear any existing tokens
        invalidateCsrfToken(sessionToken)
    })

    describe("GET /api/auth/example-protected", () => {
        it("should return CSRF token for authenticated session", async () => {
            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "GET",
                    headers: {
                        cookie: `auth_session=${sessionToken}`,
                    },
                }
            )

            const response = await GET(request)
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body.success).toBe(true)
            expect(body.data.csrfToken).toBeDefined()
            expect(response.headers.get("X-CSRF-Token")).toBe(
                body.data.csrfToken
            )
        })

        it("should return 401 for unauthenticated request", async () => {
            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "GET",
                }
            )

            const response = await GET(request)
            const body = await response.json()

            expect(response.status).toBe(401)
            expect(body.success).toBe(false)
        })
    })

    describe("POST /api/auth/example-protected", () => {
        it("should accept request with valid CSRF token", async () => {
            // Generate valid token
            const csrfToken = generateCsrfTokenForSession(sessionToken)

            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "x-csrf-token": csrfToken,
                        cookie: `auth_session=${sessionToken}`,
                    },
                    body: JSON.stringify({
                        data: "test data",
                    }),
                }
            )

            const response = await POST(request)
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body.success).toBe(true)
            expect(body.message).toBe("Data processed successfully")

            // Should have new CSRF token in header
            expect(response.headers.get("X-CSRF-Token")).toBeDefined()
        })

        it("should reject request without CSRF token", async () => {
            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        cookie: `auth_session=${sessionToken}`,
                    },
                    body: JSON.stringify({
                        data: "test data",
                    }),
                }
            )

            const response = await POST(request)
            const body = await response.json()

            expect(response.status).toBe(403)
            expect(body.success).toBe(false)
            expect(body.error).toBe("Invalid CSRF token")
        })

        it("should reject request with invalid CSRF token", async () => {
            // Generate valid token but send wrong one
            generateCsrfTokenForSession(sessionToken)

            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "x-csrf-token": "invalid-token",
                        cookie: `auth_session=${sessionToken}`,
                    },
                    body: JSON.stringify({
                        data: "test data",
                    }),
                }
            )

            const response = await POST(request)
            const body = await response.json()

            expect(response.status).toBe(403)
            expect(body.success).toBe(false)
        })

        it("should accept CSRF token from request body", async () => {
            // Generate valid token
            const csrfToken = generateCsrfTokenForSession(sessionToken)

            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        cookie: `auth_session=${sessionToken}`,
                    },
                    body: JSON.stringify({
                        csrfToken: csrfToken,
                        data: "test data",
                    }),
                }
            )

            const response = await POST(request)
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body.success).toBe(true)
        })
    })

    describe("PUT /api/auth/example-protected", () => {
        it("should accept request with valid CSRF token", async () => {
            const csrfToken = generateCsrfTokenForSession(sessionToken)

            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "PUT",
                    headers: {
                        "content-type": "application/json",
                        "x-csrf-token": csrfToken,
                        cookie: `auth_session=${sessionToken}`,
                    },
                    body: JSON.stringify({
                        data: "updated data",
                    }),
                }
            )

            const response = await PUT(request)
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body.success).toBe(true)
            expect(body.message).toBe("Data updated successfully")
        })

        it("should reject request without CSRF token", async () => {
            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "PUT",
                    headers: {
                        "content-type": "application/json",
                        cookie: `auth_session=${sessionToken}`,
                    },
                    body: JSON.stringify({
                        data: "updated data",
                    }),
                }
            )

            const response = await PUT(request)
            const body = await response.json()

            expect(response.status).toBe(403)
            expect(body.success).toBe(false)
        })
    })

    describe("DELETE /api/auth/example-protected", () => {
        it("should accept request with valid CSRF token", async () => {
            const csrfToken = generateCsrfTokenForSession(sessionToken)

            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "DELETE",
                    headers: {
                        "x-csrf-token": csrfToken,
                        cookie: `auth_session=${sessionToken}`,
                    },
                }
            )

            const response = await DELETE(request)
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body.success).toBe(true)
            expect(body.message).toBe("Data deleted successfully")
        })

        it("should reject request without CSRF token", async () => {
            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "DELETE",
                    headers: {
                        cookie: `auth_session=${sessionToken}`,
                    },
                }
            )

            const response = await DELETE(request)
            const body = await response.json()

            expect(response.status).toBe(403)
            expect(body.success).toBe(false)
        })
    })

    describe("CSRF Token Regeneration", () => {
        it("should regenerate CSRF token after successful POST", async () => {
            const oldToken = generateCsrfTokenForSession(sessionToken)

            const request = new NextRequest(
                "http://localhost/api/auth/example-protected",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "x-csrf-token": oldToken,
                        cookie: `auth_session=${sessionToken}`,
                    },
                    body: JSON.stringify({
                        data: "test data",
                    }),
                }
            )

            const response = await POST(request)
            const newToken = response.headers.get("X-CSRF-Token")

            expect(newToken).toBeDefined()
            expect(newToken).not.toBe(oldToken)
        })
    })
})
