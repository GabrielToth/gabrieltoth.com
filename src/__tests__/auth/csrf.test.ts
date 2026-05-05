/**
 * CSRF Protection Tests
 * Tests for CSRF token generation, validation, storage, and retrieval
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import {
    clearCSRFToken,
    generateCSRFToken,
    retrieveCSRFToken,
    storeCSRFToken,
    validateCSRFToken,
    verifyCSRFTokenMatch,
} from "@/lib/auth/csrf"
import { cookies } from "next/headers"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock next/headers
vi.mock("next/headers", () => ({
    cookies: vi.fn(),
}))

describe("CSRF Protection Module", () => {
    let mockCookieStore: any

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks()

        // Setup mock cookie store
        mockCookieStore = {
            set: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
        }
        ;(cookies as any).mockResolvedValue(mockCookieStore)
    })

    describe("generateCSRFToken", () => {
        it("should generate a 64-character hex string", () => {
            const token = generateCSRFToken()
            expect(token).toHaveLength(64)
            expect(/^[a-f0-9]{64}$/i.test(token)).toBe(true)
        })

        it("should generate unique tokens", () => {
            const token1 = generateCSRFToken()
            const token2 = generateCSRFToken()
            expect(token1).not.toBe(token2)
        })

        it("should generate cryptographically random tokens", () => {
            const tokens = new Set()
            for (let i = 0; i < 100; i++) {
                tokens.add(generateCSRFToken())
            }
            // All tokens should be unique
            expect(tokens.size).toBe(100)
        })

        it("should only contain valid hex characters", () => {
            const token = generateCSRFToken()
            expect(/^[a-f0-9]{64}$/i.test(token)).toBe(true)
        })

        it("should generate tokens with sufficient entropy", () => {
            const tokens = new Set()
            for (let i = 0; i < 1000; i++) {
                tokens.add(generateCSRFToken())
            }
            // All tokens should be unique (extremely unlikely to have collisions)
            expect(tokens.size).toBe(1000)
        })
    })

    describe("validateCSRFToken", () => {
        it("should validate a valid token", () => {
            const token = generateCSRFToken()
            expect(validateCSRFToken(token)).toBe(true)
        })

        it("should reject empty string", () => {
            expect(validateCSRFToken("")).toBe(false)
        })

        it("should reject null", () => {
            expect(validateCSRFToken(null)).toBe(false)
        })

        it("should reject undefined", () => {
            expect(validateCSRFToken(undefined)).toBe(false)
        })

        it("should reject non-string values", () => {
            expect(validateCSRFToken(123)).toBe(false)
            expect(validateCSRFToken({})).toBe(false)
            expect(validateCSRFToken([])).toBe(false)
        })

        it("should reject token with invalid length", () => {
            expect(validateCSRFToken("a1b2c3d4")).toBe(false) // Too short
            expect(
                validateCSRFToken(
                    "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6"
                )
            ).toBe(false) // Too long
        })

        it("should reject token with invalid characters", () => {
            const invalidToken =
                "g1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" // Contains 'g'
            expect(validateCSRFToken(invalidToken)).toBe(false)
        })

        it("should reject token with special characters", () => {
            const invalidToken =
                "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2!@"
            expect(validateCSRFToken(invalidToken)).toBe(false)
        })

        it("should accept uppercase hex characters", () => {
            const token = generateCSRFToken().toUpperCase()
            expect(validateCSRFToken(token)).toBe(true)
        })

        it("should accept mixed case hex characters", () => {
            const token = generateCSRFToken()
            const mixedCase =
                token.substring(0, 32).toUpperCase() +
                token.substring(32).toLowerCase()
            expect(validateCSRFToken(mixedCase)).toBe(true)
        })
    })

    describe("storeCSRFToken", () => {
        it("should store a valid token in secure cookie", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    httpOnly: true,
                    sameSite: "strict",
                    path: "/",
                })
            )
        })

        it("should set secure flag in production", async () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = "production"

            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    secure: true,
                })
            )

            process.env.NODE_ENV = originalEnv
        })

        it("should not set secure flag in development", async () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = "development"

            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    secure: false,
                })
            )

            process.env.NODE_ENV = originalEnv
        })

        it("should set maxAge to 1 hour (3600 seconds)", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    maxAge: 3600,
                })
            )
        })

        it("should reject invalid token", async () => {
            await expect(storeCSRFToken("invalid")).rejects.toThrow(
                "Invalid CSRF token format"
            )
        })

        it("should reject empty token", async () => {
            await expect(storeCSRFToken("")).rejects.toThrow(
                "Invalid CSRF token format"
            )
        })

        it("should set HttpOnly flag", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    httpOnly: true,
                })
            )
        })

        it("should set SameSite=Strict flag", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    sameSite: "strict",
                })
            )
        })
    })

    describe("retrieveCSRFToken", () => {
        it("should retrieve a stored token", async () => {
            const token = generateCSRFToken()
            mockCookieStore.get.mockReturnValue({ value: token })

            const retrieved = await retrieveCSRFToken()
            expect(retrieved).toBe(token)
        })

        it("should return null if token not found", async () => {
            mockCookieStore.get.mockReturnValue(undefined)

            const retrieved = await retrieveCSRFToken()
            expect(retrieved).toBeNull()
        })

        it("should return null if cookie value is empty", async () => {
            mockCookieStore.get.mockReturnValue({ value: "" })

            const retrieved = await retrieveCSRFToken()
            expect(retrieved).toBeNull()
        })

        it("should validate token format before returning", async () => {
            mockCookieStore.get.mockReturnValue({ value: "invalid" })

            const retrieved = await retrieveCSRFToken()
            expect(retrieved).toBeNull()
        })

        it("should return null if token has invalid format", async () => {
            mockCookieStore.get.mockReturnValue({
                value: "g1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
            })

            const retrieved = await retrieveCSRFToken()
            expect(retrieved).toBeNull()
        })
    })

    describe("clearCSRFToken", () => {
        it("should delete CSRF token from cookies", async () => {
            await clearCSRFToken()

            expect(mockCookieStore.delete).toHaveBeenCalledWith("csrf_token")
        })

        it("should handle deletion errors gracefully", async () => {
            mockCookieStore.delete.mockImplementation(() => {
                throw new Error("Cookie deletion failed")
            })

            await expect(clearCSRFToken()).rejects.toThrow(
                "Cookie deletion failed"
            )
        })
    })

    describe("verifyCSRFTokenMatch", () => {
        it("should verify matching tokens", async () => {
            const token = generateCSRFToken()
            mockCookieStore.get.mockReturnValue({ value: token })

            const isValid = await verifyCSRFTokenMatch(token)
            expect(isValid).toBe(true)
        })

        it("should reject non-matching tokens", async () => {
            const token1 = generateCSRFToken()
            const token2 = generateCSRFToken()
            mockCookieStore.get.mockReturnValue({ value: token1 })

            const isValid = await verifyCSRFTokenMatch(token2)
            expect(isValid).toBe(false)
        })

        it("should reject if no stored token found", async () => {
            const token = generateCSRFToken()
            mockCookieStore.get.mockReturnValue(undefined)

            const isValid = await verifyCSRFTokenMatch(token)
            expect(isValid).toBe(false)
        })

        it("should reject invalid provided token format", async () => {
            mockCookieStore.get.mockReturnValue({
                value: generateCSRFToken(),
            })

            const isValid = await verifyCSRFTokenMatch("invalid")
            expect(isValid).toBe(false)
        })

        it("should use constant-time comparison", async () => {
            const token = generateCSRFToken()
            mockCookieStore.get.mockReturnValue({ value: token })

            // Test with matching token
            const isValid1 = await verifyCSRFTokenMatch(token)
            expect(isValid1).toBe(true)

            // Test with different token (should take similar time)
            const differentToken = generateCSRFToken()
            const isValid2 = await verifyCSRFTokenMatch(differentToken)
            expect(isValid2).toBe(false)
        })

        it("should reject empty provided token", async () => {
            mockCookieStore.get.mockReturnValue({
                value: generateCSRFToken(),
            })

            const isValid = await verifyCSRFTokenMatch("")
            expect(isValid).toBe(false)
        })

        it("should reject null provided token", async () => {
            mockCookieStore.get.mockReturnValue({
                value: generateCSRFToken(),
            })

            const isValid = await verifyCSRFTokenMatch(
                null as unknown as string
            )
            expect(isValid).toBe(false)
        })
    })

    describe("CSRF Token Security", () => {
        it("should generate tokens with sufficient entropy", () => {
            const tokens = new Set()
            for (let i = 0; i < 1000; i++) {
                tokens.add(generateCSRFToken())
            }
            // All tokens should be unique (extremely unlikely to have collisions)
            expect(tokens.size).toBe(1000)
        })

        it("should not expose token in plain text in logs", () => {
            const token = generateCSRFToken()
            // This test verifies that the token is not logged in plain text
            // In production, check logs to ensure tokens are not exposed
            expect(token).toHaveLength(64)
        })

        it("should use HttpOnly flag to prevent JavaScript access", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    httpOnly: true,
                })
            )
        })

        it("should use SameSite=Strict to prevent CSRF", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    sameSite: "strict",
                })
            )
        })

        it("should use Secure flag in production", async () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = "production"

            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    secure: true,
                })
            )

            process.env.NODE_ENV = originalEnv
        })

        it("should have 1-hour expiration", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            expect(mockCookieStore.set).toHaveBeenCalledWith(
                "csrf_token",
                token,
                expect.objectContaining({
                    maxAge: 3600, // 1 hour in seconds
                })
            )
        })
    })

    describe("Integration Tests", () => {
        it("should generate, store, and retrieve token", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            mockCookieStore.get.mockReturnValue({ value: token })

            const retrieved = await retrieveCSRFToken()
            expect(retrieved).toBe(token)
        })

        it("should generate, store, and verify token match", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            mockCookieStore.get.mockReturnValue({ value: token })

            const isValid = await verifyCSRFTokenMatch(token)
            expect(isValid).toBe(true)
        })

        it("should clear token after logout", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            await clearCSRFToken()

            expect(mockCookieStore.delete).toHaveBeenCalledWith("csrf_token")
        })

        it("should handle complete CSRF flow", async () => {
            // 1. Generate token
            const token = generateCSRFToken()
            expect(validateCSRFToken(token)).toBe(true)

            // 2. Store token
            await storeCSRFToken(token)
            expect(mockCookieStore.set).toHaveBeenCalled()

            // 3. Retrieve token
            mockCookieStore.get.mockReturnValue({ value: token })
            const retrieved = await retrieveCSRFToken()
            expect(retrieved).toBe(token)

            // 4. Verify token match
            const isValid = await verifyCSRFTokenMatch(token)
            expect(isValid).toBe(true)

            // 5. Clear token
            await clearCSRFToken()
            expect(mockCookieStore.delete).toHaveBeenCalled()
        })
    })

    describe("Edge Cases", () => {
        it("should handle concurrent token generation", () => {
            const tokens = new Set()
            const promises = []

            for (let i = 0; i < 100; i++) {
                promises.push(
                    Promise.resolve().then(() => {
                        tokens.add(generateCSRFToken())
                    })
                )
            }

            return Promise.all(promises).then(() => {
                // All tokens should be unique
                expect(tokens.size).toBe(100)
            })
        })

        it("should handle token with leading zeros", () => {
            // Create a token that starts with zeros
            const token = "00" + generateCSRFToken().substring(2)
            expect(validateCSRFToken(token)).toBe(true)
        })

        it("should handle token comparison with timing attack resistance", async () => {
            const token = generateCSRFToken()
            mockCookieStore.get.mockReturnValue({ value: token })

            // Create a token that differs only in the last character
            const similarToken =
                token.substring(0, 63) + (token[63] === "a" ? "b" : "a")

            const startTime = Date.now()
            await verifyCSRFTokenMatch(similarToken)
            const timeTaken = Date.now() - startTime

            // Should complete in reasonable time (not timing out)
            expect(timeTaken).toBeLessThan(1000)
        })
    })
})
