/**
 * Unit tests for CSRF protection middleware
 *
 * CSRF tokens are now stateless HMAC-signed tokens.
 * No server-side storage — tokens are self-validating.
 */

import { describe, expect, it } from "vitest"
import {
    generateCsrfTokenForSession,
    getCsrfToken,
    injectCsrfToken,
    invalidateCsrfToken,
    validateCsrfToken,
} from "./csrf-protection"

describe("CSRF Protection", () => {
    const sessionToken = "test-session-token-123"

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

        it("should generate unique tokens on each call for same session", () => {
            const token1 = generateCsrfTokenForSession(sessionToken)
            const token2 = generateCsrfTokenForSession(sessionToken)

            // Each call includes a random nonce and different expiry
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
        it("should not throw error (stateless — no-op)", () => {
            // Stateless HMAC tokens cannot be invalidated server-side.
            // The token naturally expires after 24 hours.
            const token = generateCsrfTokenForSession(sessionToken)
            expect(() => {
                invalidateCsrfToken(sessionToken)
            }).not.toThrow()

            // Token remains valid since there's no server-side storage
            // to invalidate. On logout, the session cookie is cleared
            // which prevents the token from being useful.
            const isValid = validateCsrfToken(sessionToken, token)
            expect(isValid).toBe(true)
        })

        it("should not throw error when invalidating non-existent token", () => {
            expect(() => {
                invalidateCsrfToken("non-existent-session")
            }).not.toThrow()
        })
    })

    describe("getCsrfToken", () => {
        it("should generate a valid CSRF token for any session", () => {
            // getCsrfToken generates a fresh token (stateless — no storage)
            const token = getCsrfToken(sessionToken)

            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
            expect(token.length).toBeGreaterThan(0)

            // The generated token should be valid for the session
            const isValid = validateCsrfToken(sessionToken, token)
            expect(isValid).toBe(true)
        })

        it("should generate different tokens on each call", () => {
            const token1 = getCsrfToken(sessionToken)
            const token2 = getCsrfToken(sessionToken)

            // Each call generates a unique token (nonce + different expiry)
            expect(token1).not.toBe(token2)
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
        it("should complete full lifecycle: generate -> validate", () => {
            const session = "lifecycle-session"

            // Generate
            const token = generateCsrfTokenForSession(session)
            expect(token).toBeDefined()

            // Validate
            const isValid = validateCsrfToken(session, token)
            expect(isValid).toBe(true)
        })

        it("should handle multiple sessions independently", () => {
            const session1 = "session-1"
            const session2 = "session-2"

            const token1 = generateCsrfTokenForSession(session1)
            const token2 = generateCsrfTokenForSession(session2)

            // Validate session 1's token
            expect(validateCsrfToken(session1, token1)).toBe(true)
            expect(validateCsrfToken(session1, token2)).toBe(false)

            // Validate session 2's token
            expect(validateCsrfToken(session2, token2)).toBe(true)
            expect(validateCsrfToken(session2, token1)).toBe(false)
        })
    })
})
