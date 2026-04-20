/**
 * Unit Tests: API CSRF Middleware
 * Tests for CSRF middleware helper functions
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it } from "vitest"
import {
    addCsrfTokenToResponse,
    createCsrfErrorResponse,
    getOrGenerateCsrfToken,
    regenerateCsrfToken,
    validateCsrfFromRequest,
} from "./api-csrf-middleware"
import {
    generateCsrfTokenForSession,
    invalidateCsrfToken,
} from "./csrf-protection"

describe("API CSRF Middleware", () => {
    const sessionToken = "test-session-token"

    beforeEach(() => {
        // Clear any existing tokens
        invalidateCsrfToken(sessionToken)
    })

    describe("validateCsrfFromRequest", () => {
        it("should validate CSRF token from header", async () => {
            // Generate a valid token
            const csrfToken = generateCsrfTokenForSession(sessionToken)

            // Create request with token in header
            const request = new NextRequest("http://localhost/api/test", {
                method: "POST",
                headers: {
                    "x-csrf-token": csrfToken,
                    cookie: `auth_session=${sessionToken}`,
                },
            })

            const result = await validateCsrfFromRequest(request)

            expect(result.valid).toBe(true)
            expect(result.csrfToken).toBe(csrfToken)
        })

        it("should validate CSRF token from JSON body", async () => {
            // Generate a valid token
            const csrfToken = generateCsrfTokenForSession(sessionToken)

            // Create request with token in body
            const request = new NextRequest("http://localhost/api/test", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    cookie: `auth_session=${sessionToken}`,
                },
                body: JSON.stringify({ csrfToken }),
            })

            const result = await validateCsrfFromRequest(request)

            expect(result.valid).toBe(true)
            expect(result.csrfToken).toBe(csrfToken)
        })

        it("should return invalid for missing session token", async () => {
            const request = new NextRequest("http://localhost/api/test", {
                method: "POST",
                headers: {
                    "x-csrf-token": "some-token",
                },
            })

            const result = await validateCsrfFromRequest(request)

            expect(result.valid).toBe(false)
            expect(result.csrfToken).toBeNull()
        })

        it("should return invalid for missing CSRF token", async () => {
            const request = new NextRequest("http://localhost/api/test", {
                method: "POST",
                headers: {
                    cookie: `auth_session=${sessionToken}`,
                },
            })

            const result = await validateCsrfFromRequest(request)

            expect(result.valid).toBe(false)
            expect(result.csrfToken).toBeNull()
        })

        it("should return invalid for incorrect CSRF token", async () => {
            // Generate a valid token
            generateCsrfTokenForSession(sessionToken)

            // Create request with wrong token
            const request = new NextRequest("http://localhost/api/test", {
                method: "POST",
                headers: {
                    "x-csrf-token": "wrong-token",
                    cookie: `auth_session=${sessionToken}`,
                },
            })

            const result = await validateCsrfFromRequest(request)

            expect(result.valid).toBe(false)
            expect(result.csrfToken).toBe("wrong-token")
        })
    })

    describe("getOrGenerateCsrfToken", () => {
        it("should return existing CSRF token", () => {
            // Generate a token first
            const existingToken = generateCsrfTokenForSession(sessionToken)

            const request = new NextRequest("http://localhost/api/test", {
                method: "GET",
                headers: {
                    cookie: `auth_session=${sessionToken}`,
                },
            })

            const token = getOrGenerateCsrfToken(request)

            expect(token).toBe(existingToken)
        })

        it("should generate new CSRF token if none exists", () => {
            const request = new NextRequest("http://localhost/api/test", {
                method: "GET",
                headers: {
                    cookie: `auth_session=${sessionToken}`,
                },
            })

            const token = getOrGenerateCsrfToken(request)

            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
            expect(token!.length).toBeGreaterThan(0)
        })

        it("should return null if no session token", () => {
            const request = new NextRequest("http://localhost/api/test", {
                method: "GET",
            })

            const token = getOrGenerateCsrfToken(request)

            expect(token).toBeNull()
        })
    })

    describe("regenerateCsrfToken", () => {
        it("should regenerate CSRF token", () => {
            // Generate initial token
            const oldToken = generateCsrfTokenForSession(sessionToken)

            const request = new NextRequest("http://localhost/api/test", {
                method: "POST",
                headers: {
                    cookie: `auth_session=${sessionToken}`,
                },
            })

            const newToken = regenerateCsrfToken(request)

            expect(newToken).toBeDefined()
            expect(newToken).not.toBe(oldToken)
        })

        it("should return null if no session token", () => {
            const request = new NextRequest("http://localhost/api/test", {
                method: "POST",
            })

            const token = regenerateCsrfToken(request)

            expect(token).toBeNull()
        })
    })

    describe("createCsrfErrorResponse", () => {
        it("should create 403 Forbidden response", async () => {
            const response = createCsrfErrorResponse()

            expect(response.status).toBe(403)

            const body = await response.json()
            expect(body).toEqual({
                success: false,
                error: "Invalid CSRF token",
            })
        })
    })

    describe("addCsrfTokenToResponse", () => {
        it("should add CSRF token to response headers", () => {
            const response = NextResponse.json({ success: true })
            const csrfToken = "test-csrf-token"

            const updatedResponse = addCsrfTokenToResponse(response, csrfToken)

            expect(updatedResponse.headers.get("X-CSRF-Token")).toBe(csrfToken)
        })
    })
})
