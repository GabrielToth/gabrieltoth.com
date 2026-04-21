/**
 * Unit Tests: Temporary Token Manager
 *
 * Tests for JWT-based temporary token generation and validation
 * used in the OAuth registration flow.
 *
 * Requirements:
 * - 2.2: Temporary tokens for OAuth registration flow
 *
 * @module temp-token.test
 */

import jwt from "jsonwebtoken"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { generateTempToken, validateTempToken } from "./temp-token"

describe("Temporary Token Manager", () => {
    const originalEnv = process.env.JWT_SECRET

    beforeEach(() => {
        // Set a test JWT secret
        process.env.JWT_SECRET = "test-secret-key-for-temporary-tokens"
    })

    afterEach(() => {
        // Restore original environment
        process.env.JWT_SECRET = originalEnv
    })

    describe("generateTempToken", () => {
        it("should generate a valid JWT token", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
            }

            const token = generateTempToken(payload)

            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
            expect(token.split(".")).toHaveLength(3) // JWT has 3 parts
        })

        it("should include all payload fields in the token", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
            }

            const token = generateTempToken(payload)
            const decoded = jwt.decode(token) as Record<string, unknown>

            expect(decoded.email).toBe(payload.email)
            expect(decoded.oauth_provider).toBe(payload.oauth_provider)
            expect(decoded.oauth_id).toBe(payload.oauth_id)
            expect(decoded.name).toBe(payload.name)
            expect(decoded.picture).toBe(payload.picture)
        })

        it("should set expiration to 15 minutes from now", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            const beforeGeneration = Math.floor(Date.now() / 1000)
            const token = generateTempToken(payload)
            const afterGeneration = Math.floor(Date.now() / 1000)

            const decoded = jwt.decode(token) as Record<string, unknown>
            const exp = decoded.exp as number

            // Token should expire 15 minutes (900 seconds) from now
            // Allow 2 seconds tolerance for test execution time
            const expectedExpMin = beforeGeneration + 900
            const expectedExpMax = afterGeneration + 900

            expect(exp).toBeGreaterThanOrEqual(expectedExpMin)
            expect(exp).toBeLessThanOrEqual(expectedExpMax)
        })

        it("should use HS256 algorithm", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            const token = generateTempToken(payload)
            const decoded = jwt.decode(token, { complete: true })

            expect(decoded?.header.alg).toBe("HS256")
        })

        it("should handle payload without optional picture field", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "facebook",
                oauth_id: "facebook-456",
                name: "Jane Smith",
            }

            const token = generateTempToken(payload)
            const decoded = jwt.decode(token) as Record<string, unknown>

            expect(decoded.email).toBe(payload.email)
            expect(decoded.oauth_provider).toBe(payload.oauth_provider)
            expect(decoded.oauth_id).toBe(payload.oauth_id)
            expect(decoded.name).toBe(payload.name)
            expect(decoded.picture).toBeUndefined()
        })

        it("should throw error if JWT_SECRET is not configured", () => {
            delete process.env.JWT_SECRET

            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            expect(() => generateTempToken(payload)).toThrow(
                "JWT_SECRET environment variable is not configured"
            )
        })
    })

    describe("validateTempToken", () => {
        it("should validate and decode a valid token", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
            }

            const token = generateTempToken(payload)
            const decoded = validateTempToken(token)

            expect(decoded.email).toBe(payload.email)
            expect(decoded.oauth_provider).toBe(payload.oauth_provider)
            expect(decoded.oauth_id).toBe(payload.oauth_id)
            expect(decoded.name).toBe(payload.name)
            expect(decoded.picture).toBe(payload.picture)
            expect(decoded.exp).toBeDefined()
        })

        it("should reject token with invalid signature", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            // Generate token with different secret
            const token = jwt.sign(payload, "wrong-secret", {
                algorithm: "HS256",
                expiresIn: "15m",
            })

            expect(() => validateTempToken(token)).toThrow("Invalid token")
        })

        it("should reject expired token", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            // Generate token that expires immediately
            const token = jwt.sign(payload, process.env.JWT_SECRET!, {
                algorithm: "HS256",
                expiresIn: "0s",
            })

            // Wait a moment to ensure token is expired
            return new Promise(resolve => {
                setTimeout(() => {
                    expect(() => validateTempToken(token)).toThrow(
                        "Registration session expired"
                    )
                    resolve(undefined)
                }, 100)
            })
        })

        it("should reject malformed token (not a JWT)", () => {
            const malformedToken = "not-a-valid-jwt-token"

            expect(() => validateTempToken(malformedToken)).toThrow(
                "Invalid token"
            )
        })

        it("should reject token with missing required fields", () => {
            // Generate token with missing required fields
            const incompletePayload = {
                email: "user@example.com",
                // Missing oauth_provider, oauth_id, name
            }

            const token = jwt.sign(incompletePayload, process.env.JWT_SECRET!, {
                algorithm: "HS256",
                expiresIn: "15m",
            })

            expect(() => validateTempToken(token)).toThrow(
                "Invalid token payload: missing required fields"
            )
        })

        it("should accept token without optional picture field", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "tiktok",
                oauth_id: "tiktok-789",
                name: "Bob Johnson",
            }

            const token = generateTempToken(payload)
            const decoded = validateTempToken(token)

            expect(decoded.email).toBe(payload.email)
            expect(decoded.oauth_provider).toBe(payload.oauth_provider)
            expect(decoded.oauth_id).toBe(payload.oauth_id)
            expect(decoded.name).toBe(payload.name)
            expect(decoded.picture).toBeUndefined()
        })

        it("should throw error if JWT_SECRET is not configured", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            const token = generateTempToken(payload)

            // Remove JWT_SECRET after token generation
            delete process.env.JWT_SECRET

            expect(() => validateTempToken(token)).toThrow(
                "JWT_SECRET environment variable is not configured"
            )
        })

        it("should reject token signed with different algorithm", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            // Generate token with HS512 instead of HS256
            const token = jwt.sign(payload, process.env.JWT_SECRET!, {
                algorithm: "HS512",
                expiresIn: "15m",
            })

            expect(() => validateTempToken(token)).toThrow("Invalid token")
        })
    })

    describe("Token Generation and Validation Integration", () => {
        it("should successfully round-trip token generation and validation", () => {
            const payload = {
                email: "integration@example.com",
                oauth_provider: "google",
                oauth_id: "google-integration-123",
                name: "Integration Test User",
                picture: "https://example.com/integration.jpg",
            }

            const token = generateTempToken(payload)
            const decoded = validateTempToken(token)

            expect(decoded.email).toBe(payload.email)
            expect(decoded.oauth_provider).toBe(payload.oauth_provider)
            expect(decoded.oauth_id).toBe(payload.oauth_id)
            expect(decoded.name).toBe(payload.name)
            expect(decoded.picture).toBe(payload.picture)
        })

        it("should handle multiple tokens with different payloads", () => {
            const payload1 = {
                email: "user1@example.com",
                oauth_provider: "google",
                oauth_id: "google-1",
                name: "User One",
            }

            const payload2 = {
                email: "user2@example.com",
                oauth_provider: "facebook",
                oauth_id: "facebook-2",
                name: "User Two",
            }

            const token1 = generateTempToken(payload1)
            const token2 = generateTempToken(payload2)

            const decoded1 = validateTempToken(token1)
            const decoded2 = validateTempToken(token2)

            expect(decoded1.email).toBe(payload1.email)
            expect(decoded1.oauth_provider).toBe(payload1.oauth_provider)

            expect(decoded2.email).toBe(payload2.email)
            expect(decoded2.oauth_provider).toBe(payload2.oauth_provider)
        })

        it("should generate unique tokens for same payload at different times", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            const token1 = generateTempToken(payload)

            // Wait a moment to ensure different iat (issued at) timestamp
            return new Promise(resolve => {
                setTimeout(() => {
                    const token2 = generateTempToken(payload)

                    // Tokens should be different due to different iat
                    expect(token1).not.toBe(token2)

                    // But both should validate successfully
                    const decoded1 = validateTempToken(token1)
                    const decoded2 = validateTempToken(token2)

                    expect(decoded1.email).toBe(payload.email)
                    expect(decoded2.email).toBe(payload.email)

                    resolve(undefined)
                }, 1000)
            })
        })
    })

    describe("Error Messages", () => {
        it("should provide user-friendly error message for expired token", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            const token = jwt.sign(payload, process.env.JWT_SECRET!, {
                algorithm: "HS256",
                expiresIn: "0s",
            })

            return new Promise(resolve => {
                setTimeout(() => {
                    try {
                        validateTempToken(token)
                        expect.fail("Should have thrown an error")
                    } catch (error) {
                        expect(error).toBeInstanceOf(Error)
                        if (error instanceof Error) {
                            expect(error.message).toContain(
                                "Registration session expired"
                            )
                            expect(error.message).toContain(
                                "start the OAuth flow again"
                            )
                        }
                    }
                    resolve(undefined)
                }, 100)
            })
        })

        it("should provide user-friendly error message for invalid token", () => {
            const malformedToken = "invalid-token"

            try {
                validateTempToken(malformedToken)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                if (error instanceof Error) {
                    expect(error.message).toContain("Invalid token")
                    expect(error.message).toContain(
                        "start the OAuth flow again"
                    )
                }
            }
        })

        it("should provide specific error message for missing required fields", () => {
            const incompletePayload = {
                email: "user@example.com",
            }

            const token = jwt.sign(incompletePayload, process.env.JWT_SECRET!, {
                algorithm: "HS256",
                expiresIn: "15m",
            })

            try {
                validateTempToken(token)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                if (error instanceof Error) {
                    expect(error.message).toContain("missing required fields")
                    expect(error.message).toContain("email")
                    expect(error.message).toContain("oauth_provider")
                    expect(error.message).toContain("oauth_id")
                    expect(error.message).toContain("name")
                }
            }
        })
    })
})
