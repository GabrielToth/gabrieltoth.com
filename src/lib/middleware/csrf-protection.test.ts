/**
 * Unit tests for CSRF protection middleware
 */

import { beforeEach, describe, expect, it } from "vitest"
import {
    generateCsrfTokenForSession,
    getCsrfToken,
    injectCsrfToken,
    invalidateCsrfToken,
    validateCsrfToken,
} from "./csrf-protection"

describe("CSRF Protection", () => {
    const sessionToken = "test-session-token-123"

    beforeEach(() => {
        // Clear tokens before each test
        invalidateCsrfToken(sessionToken)
    })

    describe("generateCsrfTokenForSession", () => {
        it("should generate a CSRF token for a session", () => {
            const token = generateCsrfTokenForSession(sessionToken)

            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
            expect(token.length).toBeGreaterThan(0)
        })

        it("should generate different tokens for different sessions", () => {
            const token1 = generateCsrfTokenForSession(sessionToken)
            const token2 = generateCsrfTokenForSession("different-session")

            expect(token1).not.toBe(token2)
        })

        it("should overwrite existing token for same session", () => {
            const token1 = generateCsrfTokenForSession(sessionToken)
            const token2 = generateCsrfTokenForSession(sessionToken)

            expect(token1).not.toBe(token2)
        })
    })

    describe("validateCsrfToken", () => {
        it("should validate a correct CSRF token", () => {
            const token = generateCsrfTokenForSession(sessionToken)
            const isValid = validateCsrfToken(sessionToken, token)

            expect(isValid).toBe(true)
        })

        it("should reject an invalid CSRF token", () => {
            generateCsrfTokenForSession(sessionToken)
            const isValid = validateCsrfToken(sessionToken, "invalid-token")

            expect(isValid).toBe(false)
        })

        it("should reject validation for non-existent session", () => {
            const isValid = validateCsrfToken(
                "non-existent-session",
                "any-token"
            )

            expect(isValid).toBe(false)
        })

        it("should reject validation with empty token", () => {
            generateCsrfTokenForSession(sessionToken)
            const isValid = validateCsrfToken(sessionToken, "")

            expect(isValid).toBe(false)
        })
    })

    describe("invalidateCsrfToken", () => {
        it("should invalidate a CSRF token", () => {
            const token = generateCsrfTokenForSession(sessionToken)
            invalidateCsrfToken(sessionToken)

            const isValid = validateCsrfToken(sessionToken, token)
            expect(isValid).toBe(false)
        })

        it("should not throw error when invalidating non-existent token", () => {
            expect(() => {
                invalidateCsrfToken("non-existent-session")
            }).not.toThrow()
        })
    })

    describe("getCsrfToken", () => {
        it("should retrieve a stored CSRF token", () => {
            const generatedToken = generateCsrfTokenForSession(sessionToken)
            const retrievedToken = getCsrfToken(sessionToken)

            expect(retrievedToken).toBe(generatedToken)
        })

        it("should return null for non-existent session", () => {
            const token = getCsrfToken("non-existent-session")

            expect(token).toBeNull()
        })

        it("should return null after token is invalidated", () => {
            generateCsrfTokenForSession(sessionToken)
            invalidateCsrfToken(sessionToken)

            const token = getCsrfToken(sessionToken)
            expect(token).toBeNull()
        })
    })

    describe("injectCsrfToken", () => {
        it("should inject CSRF token into response object", () => {
            const csrfToken = "test-csrf-token"
            const result = injectCsrfToken(csrfToken)

            expect(result).toEqual({ csrfToken })
        })

        it("should preserve token value", () => {
            const csrfToken = "complex-token-with-special-chars-123!@#"
            const result = injectCsrfToken(csrfToken)

            expect(result.csrfToken).toBe(csrfToken)
        })
    })

    describe("CSRF token lifecycle", () => {
        it("should complete full lifecycle: generate -> validate -> invalidate", () => {
            // Generate
            const token = generateCsrfTokenForSession(sessionToken)
            expect(token).toBeDefined()

            // Validate
            let isValid = validateCsrfToken(sessionToken, token)
            expect(isValid).toBe(true)

            // Invalidate
            invalidateCsrfToken(sessionToken)

            // Validate after invalidation
            isValid = validateCsrfToken(sessionToken, token)
            expect(isValid).toBe(false)
        })

        it("should handle multiple sessions independently", () => {
            const session1 = "session-1"
            const session2 = "session-2"

            const token1 = generateCsrfTokenForSession(session1)
            const token2 = generateCsrfTokenForSession(session2)

            // Validate session 1
            expect(validateCsrfToken(session1, token1)).toBe(true)
            expect(validateCsrfToken(session1, token2)).toBe(false)

            // Validate session 2
            expect(validateCsrfToken(session2, token2)).toBe(true)
            expect(validateCsrfToken(session2, token1)).toBe(false)

            // Invalidate session 1
            invalidateCsrfToken(session1)

            // Session 1 should be invalid, session 2 should still be valid
            expect(validateCsrfToken(session1, token1)).toBe(false)
            expect(validateCsrfToken(session2, token2)).toBe(true)
        })
    })
})
