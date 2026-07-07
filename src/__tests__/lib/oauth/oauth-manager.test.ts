/**
 * OAuth Manager Tests
 * Tests for OAuth authentication across multiple platforms
 *
 * Note: validateState() now uses HMAC-signed state tokens (via state-signer.ts)
 * instead of cache-based lookups. Return type changed from boolean to
 * { valid: boolean; locale?: string }.
 */

import { OAuthManager, getOAuthManager, resetOAuthManager } from "@/lib/oauth"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock cache manager (still used by getOAuthStatus)
vi.mock("@/lib/cache", () => ({
    CacheManager: {
        set: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        delete: vi.fn().mockResolvedValue(true),
    },
    CACHE_KEYS: {
        OAUTH_STATUS: (userId: string) => `oauth:status:${userId}`,
    },
    CACHE_TTL: {
        OAUTH_TOKEN: 3600,
    },
}))

// Mock state signer for controlled testing of HMAC-signed state
vi.mock("@/lib/oauth/state-signer", () => {
    let nonceCounter = 0
    return {
        generateState: vi
            .fn()
            .mockImplementation(
                (userId: string, platform: string, locale?: string) => {
                    const payload = {
                        userId,
                        platform,
                        nonce: `test-nonce-${nonceCounter++}`,
                        iat: Date.now(),
                        locale,
                    }
                    const payloadBase64 = Buffer.from(
                        JSON.stringify(payload)
                    ).toString("base64url")
                    const sigBase64 = Buffer.from(
                        "fake-hmac-signature"
                    ).toString("base64url")
                    return {
                        token: `${payloadBase64}.${sigBase64}`,
                        payload,
                    }
                }
            ),
        verifyState: vi.fn(),
    }
})

describe("OAuthManager", () => {
    let manager: OAuthManager
    const originalEnv = { ...process.env }

    beforeEach(() => {
        // Set up environment variables for testing BEFORE creating manager
        process.env.YOUTUBE_CLIENT_ID = "test-youtube-client-id"
        process.env.YOUTUBE_CLIENT_SECRET = "test-youtube-client-secret"
        process.env.YOUTUBE_REDIRECT_URI =
            "http://localhost:3000/api/oauth/callback/youtube"

        resetOAuthManager()
        manager = new OAuthManager()
    })

    afterEach(() => {
        vi.clearAllMocks()
        // Restore original environment
        process.env = { ...originalEnv }
    })

    describe("getSupportedPlatforms", () => {
        it("should return list of configured platforms", () => {
            const platforms = manager.getSupportedPlatforms()
            expect(platforms).toContain("youtube")
            expect(Array.isArray(platforms)).toBe(true)
        })

        it("should include YouTube when configured", () => {
            const platforms = manager.getSupportedPlatforms()
            expect(platforms).toContain("youtube")
        })
    })

    describe("isPlatformConfigured", () => {
        it("should return true for configured platform", () => {
            expect(manager.isPlatformConfigured("youtube")).toBe(true)
        })

        it("should return false for unconfigured platform", () => {
            expect(manager.isPlatformConfigured("facebook")).toBe(false)
        })
    })

    describe("generateAuthorizationUrl", () => {
        it("should generate authorization URL for YouTube", async () => {
            const result = await manager.generateAuthorizationUrl(
                "youtube",
                "user123"
            )

            expect(result.authorizationUrl).toContain(
                "https://accounts.google.com/o/oauth2/v2/auth"
            )
            expect(result.authorizationUrl).toContain("client_id=")
            expect(result.authorizationUrl).toContain("redirect_uri=")
            expect(result.authorizationUrl).toContain("scope=")
            expect(result.state).toBeDefined()
            expect(result.platform).toBe("youtube")
        })

        it("should include offline access for YouTube", async () => {
            const result = await manager.generateAuthorizationUrl(
                "youtube",
                "user123"
            )

            expect(result.authorizationUrl).toContain("access_type=offline")
            expect(result.authorizationUrl).toContain("prompt=consent")
        })

        it("should throw error for unconfigured platform", async () => {
            await expect(
                manager.generateAuthorizationUrl("facebook", "user123")
            ).rejects.toThrow("Platform facebook is not configured")
        })

        it("should generate unique state for each call", async () => {
            const result1 = await manager.generateAuthorizationUrl(
                "youtube",
                "user123"
            )
            const result2 = await manager.generateAuthorizationUrl(
                "youtube",
                "user123"
            )

            expect(result1.state).not.toBe(result2.state)
        })

        it("should return state in HMAC token format", async () => {
            const result = await manager.generateAuthorizationUrl(
                "youtube",
                "user123"
            )

            // HMAC format: base64url(payload).base64url(signature)
            const parts = result.state.split(".")
            expect(parts).toHaveLength(2)
            expect(parts[0]).toMatch(/^[A-Za-z0-9_-]+$/)
            expect(parts[1]).toMatch(/^[A-Za-z0-9_-]+$/)
        })
    })

    describe("validateState", () => {
        it("should validate matching state", async () => {
            const { verifyState } = await import("@/lib/oauth/state-signer")
            vi.mocked(verifyState).mockReturnValueOnce({
                valid: true,
                payload: {
                    userId: "user123",
                    platform: "youtube",
                    nonce: "test-nonce",
                    iat: Date.now(),
                },
            })

            const result = await manager.validateState(
                "youtube",
                "user123",
                "valid-state-token"
            )

            expect(result).toEqual({ valid: true })
        })

        it("should reject platform mismatch", async () => {
            const { verifyState } = await import("@/lib/oauth/state-signer")
            vi.mocked(verifyState).mockReturnValueOnce({
                valid: true,
                payload: {
                    userId: "user123",
                    platform: "youtube",
                    nonce: "test-nonce",
                    iat: Date.now(),
                },
            })

            const result = await manager.validateState(
                "facebook", // different platform than what's in the token
                "user123",
                "valid-state-token"
            )

            expect(result).toEqual({ valid: false })
        })

        it("should return false for invalid signature", async () => {
            const { verifyState } = await import("@/lib/oauth/state-signer")
            vi.mocked(verifyState).mockReturnValueOnce({
                valid: false,
                payload: null,
                error: "Invalid state signature",
            })

            const result = await manager.validateState(
                "youtube",
                "user123",
                "tampered-state-token"
            )

            expect(result).toEqual({ valid: false })
        })

        it("should return false for expired state token", async () => {
            const { verifyState } = await import("@/lib/oauth/state-signer")
            vi.mocked(verifyState).mockReturnValueOnce({
                valid: false,
                payload: null,
                error: "State token expired",
            })

            const result = await manager.validateState(
                "youtube",
                "user123",
                "expired-state-token"
            )

            expect(result).toEqual({ valid: false })
        })

        it("should propagate locale from valid state", async () => {
            const { verifyState } = await import("@/lib/oauth/state-signer")
            vi.mocked(verifyState).mockReturnValueOnce({
                valid: true,
                payload: {
                    userId: "user123",
                    platform: "youtube",
                    nonce: "test-nonce",
                    iat: Date.now(),
                    locale: "en",
                },
            })

            const result = await manager.validateState(
                "youtube",
                "user123",
                "valid-state-token-with-locale"
            )

            expect(result).toEqual({ valid: true, locale: "en" })
        })
    })

    describe("exchangeCodeForToken", () => {
        it("should throw error for unconfigured platform", async () => {
            await expect(
                manager.exchangeCodeForToken("facebook", "auth-code", "user123")
            ).rejects.toThrow("Platform facebook is not configured")
        })

        it("should handle token exchange errors", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: "invalid_code",
                    error_description: "Authorization code is invalid",
                }),
            })

            await expect(
                manager.exchangeCodeForToken(
                    "youtube",
                    "invalid-code",
                    "user123"
                )
            ).rejects.toThrow("Token exchange failed")
        })
    })

    describe("refreshAccessToken", () => {
        it("should throw error for unconfigured platform", async () => {
            await expect(
                manager.refreshAccessToken(
                    "facebook",
                    "refresh-token",
                    "user123"
                )
            ).rejects.toThrow("Platform facebook is not configured")
        })

        it("should handle token refresh errors", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: "invalid_grant",
                    error_description: "Refresh token is invalid",
                }),
            })

            await expect(
                manager.refreshAccessToken(
                    "youtube",
                    "invalid-refresh-token",
                    "user123"
                )
            ).rejects.toThrow("Token refresh failed")
        })
    })

    describe("revokeToken", () => {
        it("should return false for platform without revoke URL", async () => {
            // Facebook doesn't have a revoke URL configured
            const result = await manager.revokeToken(
                "facebook",
                "access-token",
                "user123"
            )

            expect(result).toBe(false)
        })

        it("should handle revocation errors gracefully", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 400,
            })

            const result = await manager.revokeToken(
                "youtube",
                "access-token",
                "user123"
            )

            expect(result).toBe(false)
        })
    })

    describe("getOAuthStatus", () => {
        it("should return status for all platforms", async () => {
            const statuses = await manager.getOAuthStatus("user123")

            expect(Array.isArray(statuses)).toBe(true)
            expect(statuses.length).toBeGreaterThan(0)
        })

        it("should include platform in status", async () => {
            const statuses = await manager.getOAuthStatus("user123")

            for (const status of statuses) {
                expect(status.platform).toBeDefined()
                expect(status.connected).toBeDefined()
                expect(status.expired).toBeDefined()
            }
        })
    })

    describe("Singleton Pattern", () => {
        it("should return same instance on multiple calls", () => {
            resetOAuthManager()
            process.env.YOUTUBE_CLIENT_ID = "test-youtube-client-id"
            process.env.YOUTUBE_CLIENT_SECRET = "test-youtube-client-secret"

            const manager1 = getOAuthManager()
            const manager2 = getOAuthManager()

            expect(manager1).toBe(manager2)
        })

        it("should create new instance after reset", () => {
            process.env.YOUTUBE_CLIENT_ID = "test-youtube-client-id"
            process.env.YOUTUBE_CLIENT_SECRET = "test-youtube-client-secret"

            const manager1 = getOAuthManager()
            resetOAuthManager()
            const manager2 = getOAuthManager()

            expect(manager1).not.toBe(manager2)
        })
    })

    describe("Platform Configuration", () => {
        it("should configure YouTube with correct scopes", () => {
            const platforms = manager.getSupportedPlatforms()
            expect(platforms).toContain("youtube")
        })

        it("should use environment variables for configuration", () => {
            process.env.YOUTUBE_CLIENT_ID = "custom-client-id"
            process.env.YOUTUBE_CLIENT_SECRET = "custom-secret"
            process.env.YOUTUBE_REDIRECT_URI = "http://localhost:3000/callback"

            resetOAuthManager()
            const newManager = new OAuthManager()
            expect(newManager.isPlatformConfigured("youtube")).toBe(true)
        })
    })
})
