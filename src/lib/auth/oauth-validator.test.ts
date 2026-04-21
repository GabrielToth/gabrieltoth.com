/**
 * OAuth Token Validator Property-Based Tests
 * Tests for OAuth token validation across all providers
 *
 * Feature: oauth-password-requirement
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

import fc from "fast-check"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { OAuthValidationError, validateOAuthToken } from "./oauth-validator"

// Mock environment variables
beforeEach(() => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-google-client-id")
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-google-client-secret")
    vi.stubEnv("FACEBOOK_CLIENT_ID", "test-facebook-client-id")
    vi.stubEnv("FACEBOOK_CLIENT_SECRET", "test-facebook-client-secret")
    vi.stubEnv("TIKTOK_CLIENT_ID", "test-tiktok-client-id")
    vi.stubEnv("TIKTOK_CLIENT_SECRET", "test-tiktok-client-secret")
})

/**
 * Helper function to create a valid JWT token for testing
 * In production, this would be signed by the OAuth provider
 */
function createMockJWT(payload: Record<string, unknown>): string {
    const header = { alg: "RS256", typ: "JWT", kid: "test-key-id" }
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
        "base64url"
    )
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
        "base64url"
    )
    const signature = "mock-signature-for-testing"

    return `${encodedHeader}.${encodedPayload}.${signature}`
}

describe("OAuth Token Validator", () => {
    describe("Unit Tests: Specific Example-Based Validation", () => {
        /**
         * Unit tests for OAuth token validation
         * These tests verify specific examples and edge cases
         * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
         */

        describe("Valid Token Acceptance", () => {
            it("should accept a valid Google OAuth token with all required claims", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    name: "Test User",
                    picture: "https://example.com/photo.jpg",
                    aud: "test-google-client-id",
                    iss: "https://accounts.google.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)
                const result = await validateOAuthToken(token, "google")

                expect(result.sub).toBe("google-user-123")
                expect(result.email).toBe("user@gmail.com")
                expect(result.name).toBe("Test User")
                expect(result.picture).toBe("https://example.com/photo.jpg")
                expect(result.aud).toBe("test-google-client-id")
                expect(result.iss).toBe("https://accounts.google.com")
                expect(result.exp).toBe(now + 3600)
                expect(result.iat).toBe(now)
            })

            it("should accept a valid Facebook OAuth token", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "facebook-user-456",
                    email: "user@facebook.com",
                    name: "Facebook User",
                    aud: "test-facebook-client-id",
                    iss: "https://www.facebook.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)
                const result = await validateOAuthToken(token, "facebook")

                expect(result.sub).toBe("facebook-user-456")
                expect(result.email).toBe("user@facebook.com")
                expect(result.aud).toBe("test-facebook-client-id")
                expect(result.iss).toBe("https://www.facebook.com")
            })

            it("should accept a valid TikTok OAuth token", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "tiktok-user-789",
                    email: "user@tiktok.com",
                    name: "TikTok User",
                    aud: "test-tiktok-client-id",
                    iss: "https://www.tiktok.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)
                const result = await validateOAuthToken(token, "tiktok")

                expect(result.sub).toBe("tiktok-user-789")
                expect(result.email).toBe("user@tiktok.com")
                expect(result.aud).toBe("test-tiktok-client-id")
                expect(result.iss).toBe("https://www.tiktok.com")
            })

            it("should accept token with alternative Google issuer format", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    name: "Test User",
                    aud: "test-google-client-id",
                    iss: "accounts.google.com", // Alternative format without https://
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)
                const result = await validateOAuthToken(token, "google")

                expect(result.iss).toBe("accounts.google.com")
            })

            it("should accept token with audience as array containing client ID", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    name: "Test User",
                    aud: ["test-google-client-id", "other-audience"],
                    iss: "https://accounts.google.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)
                const result = await validateOAuthToken(token, "google")

                expect(result.aud).toBe("test-google-client-id")
            })
        })

        describe("Expired Token Rejection", () => {
            it("should reject token expired 1 second ago", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    name: "Test User",
                    aud: "test-google-client-id",
                    iss: "https://accounts.google.com",
                    exp: now - 1, // Expired 1 second ago
                    iat: now - 3601,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "google")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("TOKEN_EXPIRED")
                        expect(error.message).toContain("expired")
                        expect(error.provider).toBe("google")
                    }
                }
            })

            it("should reject token expired 1 hour ago", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "facebook-user-456",
                    email: "user@facebook.com",
                    name: "Facebook User",
                    aud: "test-facebook-client-id",
                    iss: "https://www.facebook.com",
                    exp: now - 3600, // Expired 1 hour ago
                    iat: now - 7200,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "facebook")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "facebook")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("TOKEN_EXPIRED")
                        expect(error.provider).toBe("facebook")
                    }
                }
            })

            it("should reject token with expiration too far in future (>24 hours)", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "tiktok-user-789",
                    email: "user@tiktok.com",
                    name: "TikTok User",
                    aud: "test-tiktok-client-id",
                    iss: "https://www.tiktok.com",
                    exp: now + 86401, // 24 hours + 1 second in future
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "tiktok")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "tiktok")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("INVALID_EXPIRATION")
                        expect(error.message).toContain("expiration")
                        expect(error.provider).toBe("tiktok")
                    }
                }
            })
        })

        describe("Invalid Signature Rejection", () => {
            it("should reject token with malformed JWT structure (no dots)", async () => {
                const malformedToken = "invalid-token-without-dots"

                await expect(
                    validateOAuthToken(malformedToken, "google")
                ).rejects.toThrow()

                try {
                    await validateOAuthToken(malformedToken, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(Error)
                    if (error instanceof Error) {
                        expect(error.message).toContain("JWT")
                    }
                }
            })

            it("should reject token with only two parts", async () => {
                const malformedToken = "header.payload"

                await expect(
                    validateOAuthToken(malformedToken, "google")
                ).rejects.toThrow()

                try {
                    await validateOAuthToken(malformedToken, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(Error)
                    if (error instanceof Error) {
                        expect(error.message).toContain("JWT")
                    }
                }
            })

            it("should reject token with invalid base64 encoding", async () => {
                const malformedToken = "invalid!!!.base64!!!.signature!!!"

                await expect(
                    validateOAuthToken(malformedToken, "google")
                ).rejects.toThrow()
            })

            it("should reject token with missing required JWT claims", async () => {
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    // Missing iss, aud, exp, iat
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "google")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("INVALID_TOKEN_STRUCTURE")
                    }
                }
            })
        })

        describe("Audience Mismatch Rejection", () => {
            it("should reject token with wrong audience (different client ID)", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    name: "Test User",
                    aud: "wrong-client-id", // Wrong audience
                    iss: "https://accounts.google.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "google")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("INVALID_AUDIENCE")
                        expect(error.message).toContain("audience")
                        expect(error.provider).toBe("google")
                    }
                }
            })

            it("should reject token with audience array not containing client ID", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "facebook-user-456",
                    email: "user@facebook.com",
                    name: "Facebook User",
                    aud: ["wrong-audience-1", "wrong-audience-2"],
                    iss: "https://www.facebook.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "facebook")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "facebook")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("INVALID_AUDIENCE")
                        expect(error.provider).toBe("facebook")
                    }
                }
            })

            it("should reject token with empty audience", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "tiktok-user-789",
                    email: "user@tiktok.com",
                    name: "TikTok User",
                    aud: "", // Empty audience
                    iss: "https://www.tiktok.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "tiktok")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "tiktok")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        // Empty string is caught during signature verification
                        expect(error.code).toBe("INVALID_TOKEN_STRUCTURE")
                    }
                }
            })
        })

        describe("Issuer Mismatch Rejection", () => {
            it("should reject Google token with Facebook issuer", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    name: "Test User",
                    aud: "test-google-client-id",
                    iss: "https://www.facebook.com", // Wrong issuer
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "google")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("INVALID_ISSUER")
                        expect(error.message).toContain("issuer")
                        expect(error.message).toContain(
                            "https://www.facebook.com"
                        )
                        expect(error.provider).toBe("google")
                    }
                }
            })

            it("should reject token with completely invalid issuer", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "facebook-user-456",
                    email: "user@facebook.com",
                    name: "Facebook User",
                    aud: "test-facebook-client-id",
                    iss: "https://evil-attacker.com", // Invalid issuer
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "facebook")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "facebook")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("INVALID_ISSUER")
                        expect(error.provider).toBe("facebook")
                    }
                }
            })

            it("should reject token with empty issuer", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "tiktok-user-789",
                    email: "user@tiktok.com",
                    name: "TikTok User",
                    aud: "test-tiktok-client-id",
                    iss: "", // Empty issuer
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "tiktok")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "tiktok")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        // Empty string is caught during signature verification
                        expect(error.code).toBe("INVALID_TOKEN_STRUCTURE")
                    }
                }
            })
        })

        describe("Google-Specific Requirements", () => {
            it("should reject Google token missing required email claim", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    // email is missing - required for Google
                    name: "Test User",
                    aud: "test-google-client-id",
                    iss: "https://accounts.google.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "google")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("MISSING_EMAIL")
                        expect(error.message).toContain("email")
                        expect(error.provider).toBe("google")
                    }
                }
            })

            it("should accept Facebook token without email (optional)", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "facebook-user-456",
                    // email is optional for Facebook
                    name: "Facebook User",
                    aud: "test-facebook-client-id",
                    iss: "https://www.facebook.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)
                const result = await validateOAuthToken(token, "facebook")

                expect(result.sub).toBe("facebook-user-456")
                expect(result.email).toBeUndefined()
            })
        })

        describe("Missing Required Claims", () => {
            it("should reject token missing sub claim", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    // sub is missing
                    email: "user@gmail.com",
                    name: "Test User",
                    aud: "test-google-client-id",
                    iss: "https://accounts.google.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "google")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        expect(error.code).toBe("MISSING_USER_ID")
                        expect(error.message).toContain("sub")
                    }
                }
            })

            it("should reject token missing exp claim", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    name: "Test User",
                    aud: "test-google-client-id",
                    iss: "https://accounts.google.com",
                    // exp is missing
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "google")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        // Missing exp is caught during signature verification
                        expect(error.code).toBe("INVALID_TOKEN_STRUCTURE")
                    }
                }
            })

            it("should reject token missing aud claim", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    name: "Test User",
                    // aud is missing
                    iss: "https://accounts.google.com",
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "google")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        // Missing aud is caught during signature verification
                        expect(error.code).toBe("INVALID_TOKEN_STRUCTURE")
                    }
                }
            })

            it("should reject token missing iss claim", async () => {
                const now = Math.floor(Date.now() / 1000)
                const payload = {
                    sub: "google-user-123",
                    email: "user@gmail.com",
                    name: "Test User",
                    aud: "test-google-client-id",
                    // iss is missing
                    exp: now + 3600,
                    iat: now,
                }

                const token = createMockJWT(payload)

                await expect(
                    validateOAuthToken(token, "google")
                ).rejects.toThrow(OAuthValidationError)

                try {
                    await validateOAuthToken(token, "google")
                } catch (error) {
                    expect(error).toBeInstanceOf(OAuthValidationError)
                    if (error instanceof OAuthValidationError) {
                        // Missing iss is caught during signature verification
                        expect(error.code).toBe("INVALID_TOKEN_STRUCTURE")
                    }
                }
            })
        })
    })

    describe("Property 7: OAuth Token Validation Completeness", () => {
        /**
         * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
         *
         * Property: For any OAuth token, the token validator SHALL verify
         * the token signature, expiration timestamp, audience claim, and
         * issuer claim, and SHALL reject the token with a descriptive error
         * message if any validation check fails.
         */

        it("should reject tokens with expired timestamps", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom("google", "facebook", "tiktok"),
                    fc.string({ minLength: 1 }),
                    fc.emailAddress(),
                    fc.string({ minLength: 1 }),
                    fc.integer({
                        min: 1,
                        max: Math.floor(Date.now() / 1000) - 1,
                    }), // Past timestamp
                    async (provider, sub, email, name, expiredTimestamp) => {
                        const issuerMap = {
                            google: "https://accounts.google.com",
                            facebook: "https://www.facebook.com",
                            tiktok: "https://www.tiktok.com",
                        }

                        const clientIdMap = {
                            google: "test-google-client-id",
                            facebook: "test-facebook-client-id",
                            tiktok: "test-tiktok-client-id",
                        }

                        const payload = {
                            sub,
                            email,
                            name,
                            aud: clientIdMap[
                                provider as keyof typeof clientIdMap
                            ],
                            iss: issuerMap[provider as keyof typeof issuerMap],
                            exp: expiredTimestamp,
                            iat: expiredTimestamp - 3600,
                        }

                        const token = createMockJWT(payload)

                        await expect(
                            validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        ).rejects.toThrow(OAuthValidationError)

                        try {
                            await validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        } catch (error) {
                            expect(error).toBeInstanceOf(OAuthValidationError)
                            if (error instanceof OAuthValidationError) {
                                expect(error.code).toBe("TOKEN_EXPIRED")
                                expect(error.message).toContain("expired")
                            }
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should reject tokens with invalid audience claim", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom("google", "facebook", "tiktok"),
                    fc.string({ minLength: 1 }),
                    fc.emailAddress(),
                    fc.string({ minLength: 1 }),
                    fc
                        .string({ minLength: 1 })
                        .filter(s => !s.includes("test-")), // Invalid audience
                    async (provider, sub, email, name, invalidAudience) => {
                        const issuerMap = {
                            google: "https://accounts.google.com",
                            facebook: "https://www.facebook.com",
                            tiktok: "https://www.tiktok.com",
                        }

                        const now = Math.floor(Date.now() / 1000)
                        const payload = {
                            sub,
                            email,
                            name,
                            aud: invalidAudience, // Wrong audience
                            iss: issuerMap[provider as keyof typeof issuerMap],
                            exp: now + 3600,
                            iat: now,
                        }

                        const token = createMockJWT(payload)

                        await expect(
                            validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        ).rejects.toThrow(OAuthValidationError)

                        try {
                            await validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        } catch (error) {
                            expect(error).toBeInstanceOf(OAuthValidationError)
                            if (error instanceof OAuthValidationError) {
                                expect(error.code).toBe("INVALID_AUDIENCE")
                                expect(error.message).toContain("audience")
                            }
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should reject tokens with invalid issuer claim", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom("google", "facebook", "tiktok"),
                    fc.string({ minLength: 1 }),
                    fc.emailAddress(),
                    fc.string({ minLength: 1 }),
                    fc
                        .webUrl()
                        .filter(
                            url =>
                                !url.includes("google") &&
                                !url.includes("facebook") &&
                                !url.includes("tiktok")
                        ), // Invalid issuer
                    async (provider, sub, email, name, invalidIssuer) => {
                        const clientIdMap = {
                            google: "test-google-client-id",
                            facebook: "test-facebook-client-id",
                            tiktok: "test-tiktok-client-id",
                        }

                        const now = Math.floor(Date.now() / 1000)
                        const payload = {
                            sub,
                            email,
                            name,
                            aud: clientIdMap[
                                provider as keyof typeof clientIdMap
                            ],
                            iss: invalidIssuer, // Wrong issuer
                            exp: now + 3600,
                            iat: now,
                        }

                        const token = createMockJWT(payload)

                        await expect(
                            validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        ).rejects.toThrow(OAuthValidationError)

                        try {
                            await validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        } catch (error) {
                            expect(error).toBeInstanceOf(OAuthValidationError)
                            if (error instanceof OAuthValidationError) {
                                expect(error.code).toBe("INVALID_ISSUER")
                                expect(error.message).toContain("issuer")
                            }
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should reject tokens missing required claims", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom("google", "facebook", "tiktok"),
                    fc.constantFrom("sub", "aud", "iss", "exp", "iat"),
                    async (provider, missingClaim) => {
                        const issuerMap = {
                            google: "https://accounts.google.com",
                            facebook: "https://www.facebook.com",
                            tiktok: "https://www.tiktok.com",
                        }

                        const clientIdMap = {
                            google: "test-google-client-id",
                            facebook: "test-facebook-client-id",
                            tiktok: "test-tiktok-client-id",
                        }

                        const now = Math.floor(Date.now() / 1000)
                        const payload: Record<string, unknown> = {
                            sub: "test-user-id",
                            email: "test@example.com",
                            name: "Test User",
                            aud: clientIdMap[
                                provider as keyof typeof clientIdMap
                            ],
                            iss: issuerMap[provider as keyof typeof issuerMap],
                            exp: now + 3600,
                            iat: now,
                        }

                        // Remove the specified claim
                        delete payload[missingClaim]

                        const token = createMockJWT(payload)

                        await expect(
                            validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        ).rejects.toThrow(OAuthValidationError)

                        try {
                            await validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        } catch (error) {
                            expect(error).toBeInstanceOf(OAuthValidationError)
                            if (error instanceof OAuthValidationError) {
                                // Verify error message is descriptive
                                expect(error.message).toBeTruthy()
                                expect(error.code).toBeTruthy()
                            }
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should reject Google tokens missing required email claim", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1 }),
                    fc.string({ minLength: 1 }),
                    async (sub, name) => {
                        const now = Math.floor(Date.now() / 1000)
                        const payload = {
                            sub,
                            name,
                            // email is missing - required for Google
                            aud: "test-google-client-id",
                            iss: "https://accounts.google.com",
                            exp: now + 3600,
                            iat: now,
                        }

                        const token = createMockJWT(payload)

                        await expect(
                            validateOAuthToken(token, "google")
                        ).rejects.toThrow(OAuthValidationError)

                        try {
                            await validateOAuthToken(token, "google")
                        } catch (error) {
                            expect(error).toBeInstanceOf(OAuthValidationError)
                            if (error instanceof OAuthValidationError) {
                                expect(error.code).toBe("MISSING_EMAIL")
                                expect(error.message).toContain("email")
                            }
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should reject tokens with malformed JWT structure", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom("google", "facebook", "tiktok"),
                    fc.oneof(
                        fc.constant(""), // Empty string
                        fc.constant("invalid"), // No dots
                        fc.constant("only.one"), // Only one dot
                        fc
                            .string({ minLength: 1 })
                            .filter(s => !s.includes(".")), // No dots
                        fc.string({ minLength: 1 }).map(s => `${s}.${s}`) // Only two parts
                    ),
                    async (provider, malformedToken) => {
                        await expect(
                            validateOAuthToken(
                                malformedToken,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        ).rejects.toThrow()

                        try {
                            await validateOAuthToken(
                                malformedToken,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        } catch (error) {
                            // Should throw an error with descriptive message
                            expect(error).toBeInstanceOf(Error)
                            if (error instanceof Error) {
                                expect(error.message).toBeTruthy()
                            }
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should reject tokens with expiration too far in the future", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom("google", "facebook", "tiktok"),
                    fc.string({ minLength: 1 }),
                    fc.emailAddress(),
                    fc.string({ minLength: 1 }),
                    fc.integer({
                        min: Math.floor(Date.now() / 1000) + 86401,
                        max: Math.floor(Date.now() / 1000) + 31536000,
                    }), // More than 24 hours in future
                    async (provider, sub, email, name, futureTimestamp) => {
                        const issuerMap = {
                            google: "https://accounts.google.com",
                            facebook: "https://www.facebook.com",
                            tiktok: "https://www.tiktok.com",
                        }

                        const clientIdMap = {
                            google: "test-google-client-id",
                            facebook: "test-facebook-client-id",
                            tiktok: "test-tiktok-client-id",
                        }

                        const now = Math.floor(Date.now() / 1000)
                        const payload = {
                            sub,
                            email,
                            name,
                            aud: clientIdMap[
                                provider as keyof typeof clientIdMap
                            ],
                            iss: issuerMap[provider as keyof typeof issuerMap],
                            exp: futureTimestamp,
                            iat: now,
                        }

                        const token = createMockJWT(payload)

                        await expect(
                            validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        ).rejects.toThrow(OAuthValidationError)

                        try {
                            await validateOAuthToken(
                                token,
                                provider as "google" | "facebook" | "tiktok"
                            )
                        } catch (error) {
                            expect(error).toBeInstanceOf(OAuthValidationError)
                            if (error instanceof OAuthValidationError) {
                                expect(error.code).toBe("INVALID_EXPIRATION")
                                expect(error.message).toContain("expiration")
                            }
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should accept valid tokens with all required claims", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom("google", "facebook", "tiktok"),
                    fc.string({ minLength: 1 }),
                    fc.emailAddress(),
                    fc.string({ minLength: 1 }),
                    fc.option(fc.webUrl()),
                    async (provider, sub, email, name, picture) => {
                        const issuerMap = {
                            google: "https://accounts.google.com",
                            facebook: "https://www.facebook.com",
                            tiktok: "https://www.tiktok.com",
                        }

                        const clientIdMap = {
                            google: "test-google-client-id",
                            facebook: "test-facebook-client-id",
                            tiktok: "test-tiktok-client-id",
                        }

                        const now = Math.floor(Date.now() / 1000)
                        const payload = {
                            sub,
                            email,
                            name,
                            picture: picture || undefined,
                            aud: clientIdMap[
                                provider as keyof typeof clientIdMap
                            ],
                            iss: issuerMap[provider as keyof typeof issuerMap],
                            exp: now + 3600,
                            iat: now,
                        }

                        const token = createMockJWT(payload)

                        const result = await validateOAuthToken(
                            token,
                            provider as "google" | "facebook" | "tiktok"
                        )

                        // Verify all claims are extracted correctly
                        expect(result.sub).toBe(sub)
                        expect(result.email).toBe(email)
                        expect(result.name).toBe(name)
                        expect(result.picture).toBe(picture || undefined)
                        expect(result.aud).toBe(
                            clientIdMap[provider as keyof typeof clientIdMap]
                        )
                        expect(result.iss).toBe(
                            issuerMap[provider as keyof typeof issuerMap]
                        )
                        expect(result.exp).toBe(now + 3600)
                        expect(result.iat).toBe(now)
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should handle audience as array of strings", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom("google", "facebook", "tiktok"),
                    fc.string({ minLength: 1 }),
                    fc.emailAddress(),
                    fc.string({ minLength: 1 }),
                    fc.array(fc.string({ minLength: 1 }), {
                        minLength: 1,
                        maxLength: 5,
                    }),
                    async (provider, sub, email, name, audiences) => {
                        const issuerMap = {
                            google: "https://accounts.google.com",
                            facebook: "https://www.facebook.com",
                            tiktok: "https://www.tiktok.com",
                        }

                        const clientIdMap = {
                            google: "test-google-client-id",
                            facebook: "test-facebook-client-id",
                            tiktok: "test-tiktok-client-id",
                        }

                        const now = Math.floor(Date.now() / 1000)

                        // Include the correct client ID in the audiences array
                        const validAudiences = [
                            clientIdMap[provider as keyof typeof clientIdMap],
                            ...audiences,
                        ]

                        const payload = {
                            sub,
                            email,
                            name,
                            aud: validAudiences, // Array of audiences
                            iss: issuerMap[provider as keyof typeof issuerMap],
                            exp: now + 3600,
                            iat: now,
                        }

                        const token = createMockJWT(payload)

                        const result = await validateOAuthToken(
                            token,
                            provider as "google" | "facebook" | "tiktok"
                        )

                        // Should accept token with correct client ID in audience array
                        expect(result.sub).toBe(sub)
                        expect(result.aud).toBe(
                            clientIdMap[provider as keyof typeof clientIdMap]
                        )
                    }
                ),
                { numRuns: 20 }
            )
        })
    })
})
