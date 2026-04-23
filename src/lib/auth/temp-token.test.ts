/**
 * Unit Tests: Temporary Token Manager
 *
 * Tests for JWT-based temporary token generation and validation
 * used in the OAuth account completion flow.
 *
 * Requirements:
 * - 1.1, 1.2, 1.3, 1.4: Account completion flow with temporary tokens
 * - 2.1, 2.2, 2.3, 2.4: Middleware and token validation
 *
 * @module temp-token.test
 */

import jwt from "jsonwebtoken"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
    generateTempToken,
    hashToken,
    validateTempToken,
    verifyTempToken,
    verifyTokenHash,
} from "./temp-token"

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

        it("should set expiration to 30 minutes from now", () => {
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

            // Token should expire 30 minutes (1800 seconds) from now
            // Allow 2 seconds tolerance for test execution time
            const expectedExpMin = beforeGeneration + 1800
            const expectedExpMax = afterGeneration + 1800

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

    describe("verifyTempToken", () => {
        it("should validate and decode a valid token", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
            }

            const token = generateTempToken(payload)
            const decoded = verifyTempToken(token)

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
                expiresIn: "30m",
            })

            expect(() => verifyTempToken(token)).toThrow("Invalid token")
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
                    expect(() => verifyTempToken(token)).toThrow(
                        "Account completion session expired"
                    )
                    resolve(undefined)
                }, 100)
            })
        })

        it("should reject malformed token (not a JWT)", () => {
            const malformedToken = "not-a-valid-jwt-token"

            expect(() => verifyTempToken(malformedToken)).toThrow(
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
                expiresIn: "30m",
            })

            expect(() => verifyTempToken(token)).toThrow(
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
            const decoded = verifyTempToken(token)

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

            expect(() => verifyTempToken(token)).toThrow(
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
                expiresIn: "30m",
            })

            expect(() => verifyTempToken(token)).toThrow("Invalid token")
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
            const decoded = verifyTempToken(token)

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

            const decoded1 = verifyTempToken(token1)
            const decoded2 = verifyTempToken(token2)

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
                    const decoded1 = verifyTempToken(token1)
                    const decoded2 = verifyTempToken(token2)

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
                        verifyTempToken(token)
                        expect.fail("Should have thrown an error")
                    } catch (error) {
                        expect(error).toBeInstanceOf(Error)
                        if (error instanceof Error) {
                            expect(error.message).toContain(
                                "Account completion session expired"
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
                verifyTempToken(malformedToken)
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
                expiresIn: "30m",
            })

            try {
                verifyTempToken(token)
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

    describe("Token Hashing for Secure Storage", () => {
        it("should hash a token consistently", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            const token = generateTempToken(payload)
            const hash1 = hashToken(token)
            const hash2 = hashToken(token)

            // Same token should produce same hash
            expect(hash1).toBe(hash2)
        })

        it("should produce different hashes for different tokens", () => {
            const payload1 = {
                email: "user1@example.com",
                oauth_provider: "google",
                oauth_id: "google-1",
                name: "User One",
            }

            const payload2 = {
                email: "user2@example.com",
                oauth_provider: "google",
                oauth_id: "google-2",
                name: "User Two",
            }

            const token1 = generateTempToken(payload1)
            const token2 = generateTempToken(payload2)

            const hash1 = hashToken(token1)
            const hash2 = hashToken(token2)

            // Different tokens should produce different hashes
            expect(hash1).not.toBe(hash2)
        })

        it("should verify token hash correctly", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            const token = generateTempToken(payload)
            const hash = hashToken(token)

            // Token should match its hash
            expect(verifyTokenHash(token, hash)).toBe(true)
        })

        it("should reject token that does not match hash", () => {
            const payload1 = {
                email: "user1@example.com",
                oauth_provider: "google",
                oauth_id: "google-1",
                name: "User One",
            }

            const payload2 = {
                email: "user2@example.com",
                oauth_provider: "google",
                oauth_id: "google-2",
                name: "User Two",
            }

            const token1 = generateTempToken(payload1)
            const token2 = generateTempToken(payload2)

            const hash1 = hashToken(token1)

            // Token2 should not match hash1
            expect(verifyTokenHash(token2, hash1)).toBe(false)
        })

        it("should produce SHA-256 hashes", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            const token = generateTempToken(payload)
            const hash = hashToken(token)

            // SHA-256 produces 64 character hex string
            expect(hash).toMatch(/^[a-f0-9]{64}$/)
        })

        it("should support secure storage workflow", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
                picture: "https://example.com/photo.jpg",
            }

            // 1. Generate token
            const token = generateTempToken(payload)

            // 2. Hash token for storage
            const tokenHash = hashToken(token)

            // 3. Store hash in database (not the token)
            const storedHash = tokenHash

            // 4. Later, verify token against stored hash
            const isValid = verifyTokenHash(token, storedHash)
            expect(isValid).toBe(true)

            // 5. Verify token content
            const decoded = verifyTempToken(token)
            expect(decoded.email).toBe(payload.email)
        })
    })

    describe("Backward Compatibility", () => {
        it("should support validateTempToken as alias for verifyTempToken", () => {
            const payload = {
                email: "user@example.com",
                oauth_provider: "google",
                oauth_id: "google-123",
                name: "John Doe",
            }

            const token = generateTempToken(payload)

            // Both functions should work identically
            const decoded1 = verifyTempToken(token)
            const decoded2 = validateTempToken(token)

            expect(decoded1).toEqual(decoded2)
        })
    })
})
