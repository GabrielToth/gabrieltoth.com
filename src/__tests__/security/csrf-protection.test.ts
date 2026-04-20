/**
 * Unit Tests: CSRF Protection
 * Tests CSRF token generation, validation, and middleware
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import {
    addCsrfTokenToResponse,
    createCsrfErrorResponse,
    getOrGenerateCsrfToken,
    regenerateCsrfToken,
    validateCsrfFromRequest,
} from "@/lib/middleware/api-csrf-middleware"
import {
    createForgotPasswordFormResponse,
    createLoginFormResponse,
    createPasswordResetFormResponse,
    createRegistrationFormResponse,
    extractCsrfFromFormData,
    injectCsrfIntoFormResponse,
} from "@/lib/middleware/csrf-form-injection"
import {
    generateCsrfTokenForSession,
    getCsrfToken,
    invalidateCsrfToken,
    validateCsrfToken,
} from "@/lib/middleware/csrf-protection"
import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock logger to avoid console output during tests
vi.mock("@/lib/logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

describe("CSRF Protection - Token Generation", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should generate a CSRF token for a session", () => {
        const sessionToken = "test-session-token-123"
        const csrfToken = generateCsrfTokenForSession(sessionToken)

        expect(csrfToken).toBeDefined()
        expect(typeof csrfToken).toBe("string")
        expect(csrfToken.length).toBeGreaterThan(0)
    })

    it("should generate unique CSRF tokens for different sessions", () => {
        const session1 = "session-token-1"
        const session2 = "session-token-2"

        const token1 = generateCsrfTokenForSession(session1)
        const token2 = generateCsrfTokenForSession(session2)

        expect(token1).not.toBe(token2)
    })

    it("should retrieve existing CSRF token for a session", () => {
        const sessionToken = "test-session-token-456"
        const generatedToken = generateCsrfTokenForSession(sessionToken)

        const retrievedToken = getCsrfToken(sessionToken)

        expect(retrievedToken).toBe(generatedToken)
    })

    it("should return null when retrieving token for non-existent session", () => {
        const token = getCsrfToken("non-existent-session")

        expect(token).toBeNull()
    })
})

describe("CSRF Protection - Token Validation", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should validate correct CSRF token", () => {
        const sessionToken = "test-session-789"
        const csrfToken = generateCsrfTokenForSession(sessionToken)

        const isValid = validateCsrfToken(sessionToken, csrfToken)

        expect(isValid).toBe(true)
    })

    it("should reject invalid CSRF token", () => {
        const sessionToken = "test-session-abc"
        generateCsrfTokenForSession(sessionToken)

        const isValid = validateCsrfToken(sessionToken, "invalid-token")

        expect(isValid).toBe(false)
    })

    it("should reject CSRF token for non-existent session", () => {
        const isValid = validateCsrfToken("non-existent-session", "some-token")

        expect(isValid).toBe(false)
    })

    it("should reject CSRF token with mismatched session", () => {
        const session1 = "session-1"
        const session2 = "session-2"

        const token1 = generateCsrfTokenForSession(session1)
        generateCsrfTokenForSession(session2)

        // Try to use session1's token with session2
        const isValid = validateCsrfToken(session2, token1)

        expect(isValid).toBe(false)
    })
})

describe("CSRF Protection - Token Expiration", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should reject expired CSRF token", () => {
        const sessionToken = "test-session-expired"
        const csrfToken = generateCsrfTokenForSession(sessionToken)

        // Mock time to 25 hours in the future (past 24h expiration)
        const originalNow = Date.now
        Date.now = vi.fn(() => originalNow() + 25 * 60 * 60 * 1000)

        const isValid = validateCsrfToken(sessionToken, csrfToken)

        expect(isValid).toBe(false)

        // Restore Date.now
        Date.now = originalNow
    })

    it("should return null when retrieving expired token", () => {
        const sessionToken = "test-session-expired-2"
        generateCsrfTokenForSession(sessionToken)

        // Mock time to 25 hours in the future
        const originalNow = Date.now
        Date.now = vi.fn(() => originalNow() + 25 * 60 * 60 * 1000)

        const token = getCsrfToken(sessionToken)

        expect(token).toBeNull()

        // Restore Date.now
        Date.now = originalNow
    })
})

describe("CSRF Protection - Token Invalidation", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should invalidate CSRF token", () => {
        const sessionToken = "test-session-invalidate"
        const csrfToken = generateCsrfTokenForSession(sessionToken)

        // Verify token exists
        expect(getCsrfToken(sessionToken)).toBe(csrfToken)

        // Invalidate token
        invalidateCsrfToken(sessionToken)

        // Verify token is gone
        expect(getCsrfToken(sessionToken)).toBeNull()
    })

    it("should not throw error when invalidating non-existent token", () => {
        expect(() => {
            invalidateCsrfToken("non-existent-session")
        }).not.toThrow()
    })
})

describe("CSRF Middleware - Request Validation", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should validate CSRF token from request header", async () => {
        const sessionToken = "test-session-header"
        const csrfToken = generateCsrfTokenForSession(sessionToken)

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

    it("should validate CSRF token from request body", async () => {
        const sessionToken = "test-session-body"
        const csrfToken = generateCsrfTokenForSession(sessionToken)

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

    it("should reject request without session cookie", async () => {
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

    it("should reject request without CSRF token", async () => {
        const sessionToken = "test-session-no-csrf"
        generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest("http://localhost/api/test", {
            method: "POST",
            headers: {
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const result = await validateCsrfFromRequest(request)

        expect(result.valid).toBe(false)
    })

    it("should reject request with invalid CSRF token", async () => {
        const sessionToken = "test-session-invalid"
        generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest("http://localhost/api/test", {
            method: "POST",
            headers: {
                "x-csrf-token": "invalid-token",
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const result = await validateCsrfFromRequest(request)

        expect(result.valid).toBe(false)
    })
})

describe("CSRF Middleware - Token Generation for Requests", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should get or generate CSRF token for session", () => {
        const sessionToken = "test-session-get-or-gen"

        const request = new NextRequest("http://localhost/api/test", {
            headers: {
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const token1 = getOrGenerateCsrfToken(request)
        expect(token1).toBeDefined()

        // Second call should return same token
        const token2 = getOrGenerateCsrfToken(request)
        expect(token2).toBe(token1)
    })

    it("should return null when no session cookie", () => {
        const request = new NextRequest("http://localhost/api/test")

        const token = getOrGenerateCsrfToken(request)

        expect(token).toBeNull()
    })

    it("should regenerate CSRF token after successful request", () => {
        const sessionToken = "test-session-regen"
        const originalToken = generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest("http://localhost/api/test", {
            headers: {
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const newToken = regenerateCsrfToken(request)

        expect(newToken).toBeDefined()
        expect(newToken).not.toBe(originalToken)
    })
})

describe("CSRF Middleware - Response Helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should create CSRF error response", () => {
        const response = createCsrfErrorResponse()

        expect(response.status).toBe(403)

        // Parse response body
        response.json().then(body => {
            expect(body.success).toBe(false)
            expect(body.error).toBe("Invalid CSRF token")
        })
    })

    it("should add CSRF token to response headers", () => {
        const csrfToken = "test-token-123"
        const response = NextResponse.json({ success: true })

        const updatedResponse = addCsrfTokenToResponse(response, csrfToken)

        expect(updatedResponse.headers.get("X-CSRF-Token")).toBe(csrfToken)
    })
})

describe("CSRF Form Injection - Form Response Creation", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should inject CSRF token into form response", () => {
        const sessionToken = "test-session-form"
        generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest("http://localhost/api/form", {
            headers: {
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const response = injectCsrfIntoFormResponse(request)

        expect(response.status).toBe(200)

        response.json().then(body => {
            expect(body.success).toBe(true)
            expect(body.csrfToken).toBeDefined()
        })
    })

    it("should inject CSRF token with additional form data", () => {
        const sessionToken = "test-session-form-data"
        generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest("http://localhost/api/form", {
            headers: {
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const formData = { email: "test@example.com", name: "Test User" }
        const response = injectCsrfIntoFormResponse(request, formData)

        expect(response.status).toBe(200)

        response.json().then(body => {
            expect(body.success).toBe(true)
            expect(body.csrfToken).toBeDefined()
            expect(body.data).toEqual(formData)
        })
    })

    it("should return 401 when no session for form injection", () => {
        const request = new NextRequest("http://localhost/api/form")

        const response = injectCsrfIntoFormResponse(request)

        expect(response.status).toBe(401)

        response.json().then(body => {
            expect(body.success).toBe(false)
            expect(body.error).toContain("No active session")
        })
    })

    it("should create registration form response", () => {
        const sessionToken = "test-session-register"
        generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest("http://localhost/api/auth/register", {
            headers: {
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const response = createRegistrationFormResponse(request)

        expect(response.status).toBe(200)

        response.json().then(body => {
            expect(body.csrfToken).toBeDefined()
        })
    })

    it("should create login form response", () => {
        const sessionToken = "test-session-login"
        generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest("http://localhost/api/auth/login", {
            headers: {
                cookie: `auth_session=${sessionToken}`,
            },
        })

        const response = createLoginFormResponse(request)

        expect(response.status).toBe(200)

        response.json().then(body => {
            expect(body.csrfToken).toBeDefined()
        })
    })

    it("should create forgot password form response", () => {
        const sessionToken = "test-session-forgot"
        generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest(
            "http://localhost/api/auth/forgot-password",
            {
                headers: {
                    cookie: `auth_session=${sessionToken}`,
                },
            }
        )

        const response = createForgotPasswordFormResponse(request)

        expect(response.status).toBe(200)

        response.json().then(body => {
            expect(body.csrfToken).toBeDefined()
        })
    })

    it("should create password reset form response with token", () => {
        const sessionToken = "test-session-reset"
        generateCsrfTokenForSession(sessionToken)

        const request = new NextRequest(
            "http://localhost/api/auth/reset-password",
            {
                headers: {
                    cookie: `auth_session=${sessionToken}`,
                },
            }
        )

        const resetToken = "reset-token-abc123"
        const response = createPasswordResetFormResponse(request, resetToken)

        expect(response.status).toBe(200)

        response.json().then(body => {
            expect(body.csrfToken).toBeDefined()
            expect(body.data?.resetToken).toBe(resetToken)
        })
    })
})

describe("CSRF Form Injection - Utility Functions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should extract CSRF token from form data", () => {
        const formData = {
            csrfToken: "test-token-xyz",
            email: "user@example.com",
            password: "password123",
        }

        const { csrfToken, data } = extractCsrfFromFormData(formData)

        expect(csrfToken).toBe("test-token-xyz")
        expect(data).toEqual({
            email: "user@example.com",
            password: "password123",
        })
        expect(data).not.toHaveProperty("csrfToken")
    })

    it("should handle form data without CSRF token", () => {
        const formData = {
            email: "user@example.com",
            password: "password123",
        }

        const { csrfToken, data } = extractCsrfFromFormData(formData)

        expect(csrfToken).toBeUndefined()
        expect(data).toEqual({
            email: "user@example.com",
            password: "password123",
        })
    })
})
