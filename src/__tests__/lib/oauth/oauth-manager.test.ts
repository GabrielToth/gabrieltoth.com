/**
 * OAuth Manager Tests
 * Tests OAuth authentication across multiple platforms using HMAC state signing.
 *
 * Mocks state-signer for deterministic state tokens.
 * Coverage: All OAuthManager methods and branches.
 */

import { OAuthManager, getOAuthManager, resetOAuthManager } from "@/lib/oauth"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock state-signer for deterministic testing
const mockGenerateState = vi.fn()
const mockVerifyState = vi.fn()

vi.mock("@/lib/oauth/state-signer", () => ({
    generateState: (...args: unknown[]) => mockGenerateState(...args),
    verifyState: (...args: unknown[]) => mockVerifyState(...args),
}))

// Mock cache (for getOAuthStatus which still uses CacheManager)
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

describe("OAuthManager", () => {
    let manager: OAuthManager
    const originalEnv = { ...process.env }

    beforeEach(() => {
        // Set up environment variables for testing BEFORE creating manager
        process.env.YOUTUBE_CLIENT_ID = "test-youtube-client-id"
        process.env.YOUTUBE_CLIENT_SECRET = "test-youtube-client-secret"
        process.env.YOUTUBE_REDIRECT_URI =
            "http://localhost:3000/api/oauth/callback/youtube"
        process.env.FACEBOOK_APP_ID = "test-facebook-app-id"
        process.env.FACEBOOK_APP_SECRET = "test-facebook-app-secret"
        process.env.FACEBOOK_REDIRECT_URI =
            "http://localhost:3000/api/oauth/callback/facebook"

        // Ensure unconfigured platforms stay unconfigured
        delete process.env.INSTAGRAM_APP_ID
        delete process.env.INSTAGRAM_APP_SECRET
        delete process.env.TWITTER_CLIENT_ID
        delete process.env.TWITTER_CLIENT_SECRET
        delete process.env.LINKEDIN_CLIENT_ID
        delete process.env.LINKEDIN_CLIENT_SECRET

        resetOAuthManager()
        manager = new OAuthManager()

        // Reset mocks
        mockGenerateState.mockReset()
        mockVerifyState.mockReset()
    })

    afterEach(() => {
        vi.clearAllMocks()
        process.env = { ...originalEnv }
    })

    describe("getSupportedPlatforms", () => {
        it("should return list of configured platforms", () => {
            const platforms = manager.getSupportedPlatforms()
            expect(Array.isArray(platforms)).toBe(true)
            expect(platforms).toContain("youtube")
            expect(platforms).toContain("facebook")
        })

        it("should not include unconfigured platforms", () => {
            // Only YouTube and Facebook are configured
            const platforms = manager.getSupportedPlatforms()
            expect(platforms).not.toContain("twitter")
            expect(platforms).not.toContain("linkedin")
        })
    })

    describe("isPlatformConfigured", () => {
        it("should return true for configured platform", () => {
            expect(manager.isPlatformConfigured("youtube")).toBe(true)
            expect(manager.isPlatformConfigured("facebook")).toBe(true)
        })

        it("should return false for unconfigured platform", () => {
            expect(manager.isPlatformConfigured("twitter")).toBe(false)
            expect(manager.isPlatformConfigured("instagram")).toBe(false)
        })
    })

    describe("generateAuthorizationUrl", () => {
        const mockStateToken = "mock-state-token.abc123signature"

        beforeEach(() => {
            mockGenerateState.mockReturnValue({
                token: mockStateToken,
                payload: {
                    userId: "user123",
                    platform: "youtube",
                    nonce: "test-nonce",
                    iat: Date.now(),
                },
            })
        })

        it("should call generateState with correct parameters", async () => {
            await manager.generateAuthorizationUrl(
                "youtube",
                "user123",
                "pt-BR"
            )

            expect(mockGenerateState).toHaveBeenCalledWith(
                "user123",
                "youtube",
                "pt-BR"
            )
        })

        it("should return correct URL format for YouTube", async () => {
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
            expect(result.authorizationUrl).toContain("state=")
            expect(result.authorizationUrl).toContain("access_type=offline")
            expect(result.authorizationUrl).toContain("prompt=consent")
        })

        it("should return correct URL format for Facebook", async () => {
            mockGenerateState.mockReturnValue({
                token: "fb-state-token.signature",
                payload: {
                    userId: "user123",
                    platform: "facebook",
                    nonce: "fb-nonce",
                    iat: Date.now(),
                },
            })

            const result = await manager.generateAuthorizationUrl(
                "facebook",
                "user123"
            )

            expect(result.authorizationUrl).toContain(
                "https://www.facebook.com/v25.0/dialog/oauth"
            )
            expect(result.authorizationUrl).toContain("display=popup")
            expect(result.authorizationUrl).toContain("client_id=")
            expect(result.platform).toBe("facebook")
        })

        it("should store the state in the response", async () => {
            const result = await manager.generateAuthorizationUrl(
                "youtube",
                "user123"
            )

            expect(result.state).toBe(mockStateToken)
        })

        it("should throw for unconfigured platform", async () => {
            await expect(
                manager.generateAuthorizationUrl("twitter", "user123")
            ).rejects.toThrow("Platform twitter is not configured")
        })

        it("should generate unique state for each call", async () => {
            mockGenerateState
                .mockReturnValueOnce({
                    token: "state-1.signature1",
                    payload: {
                        userId: "user123",
                        platform: "youtube",
                        nonce: "nonce1",
                        iat: Date.now(),
                    },
                })
                .mockReturnValueOnce({
                    token: "state-2.signature2",
                    payload: {
                        userId: "user123",
                        platform: "youtube",
                        nonce: "nonce2",
                        iat: Date.now(),
                    },
                })

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
        it("should return { valid: true } when verifyState succeeds with matching payload", async () => {
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "user123",
                    platform: "youtube",
                    nonce: "nonce-1",
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

        it("should return { valid: true, locale } when locale is in payload", async () => {
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "user123",
                    platform: "youtube",
                    nonce: "nonce-1",
                    iat: Date.now(),
                    locale: "pt-BR",
                },
            })

            const result = await manager.validateState(
                "youtube",
                "user123",
                "valid-state-token"
            )

            expect(result).toEqual({ valid: true, locale: "pt-BR" })
        })

        it("should return { valid: false } when verifyState fails", async () => {
            mockVerifyState.mockReturnValue({
                valid: false,
                payload: null,
                error: "Invalid state signature",
            })

            const result = await manager.validateState(
                "youtube",
                "user123",
                "invalid-signature"
            )

            expect(result).toEqual({ valid: false })
        })

        it("should return { valid: false } when userId does not match", async () => {
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "different-user",
                    platform: "youtube",
                    nonce: "nonce-1",
                    iat: Date.now(),
                },
            })

            const result = await manager.validateState(
                "youtube",
                "user123",
                "valid-state"
            )

            expect(result).toEqual({ valid: false })
        })

        it("should return { valid: false } when platform does not match", async () => {
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "user123",
                    platform: "facebook",
                    nonce: "nonce-1",
                    iat: Date.now(),
                },
            })

            const result = await manager.validateState(
                "youtube",
                "user123",
                "valid-state"
            )

            expect(result).toEqual({ valid: false })
        })

        it("should handle errors thrown from verifyState gracefully", async () => {
            mockVerifyState.mockImplementation(() => {
                throw new Error("Unexpected error")
            })

            const result = await manager.validateState(
                "youtube",
                "user123",
                "some-state"
            )

            expect(result).toEqual({ valid: false })
        })
    })

    describe("getOAuthStatus", () => {
        it("should return status array with all supported platforms", async () => {
            const { CacheManager } = await import("@/lib/cache")
            vi.mocked(CacheManager.get).mockResolvedValue(null)

            const statuses = await manager.getOAuthStatus("user123")

            expect(Array.isArray(statuses)).toBe(true)
            expect(statuses.length).toBeGreaterThan(0)
        })

        it("should include platform, connected, and expired fields", async () => {
            const statuses = await manager.getOAuthStatus("user123")

            for (const status of statuses) {
                expect(status).toHaveProperty("platform")
                expect(status).toHaveProperty("connected")
                expect(status).toHaveProperty("expired")
            }
        })

        it("should return cached status when available", async () => {
            const { CacheManager } = await import("@/lib/cache")
            const cachedStatus = {
                platform: "youtube" as const,
                connected: true,
                expired: false,
                linkedAt: Date.now(),
                expiresAt: Date.now() + 3600000,
            }
            vi.mocked(CacheManager.get).mockResolvedValue(cachedStatus)

            const statuses = await manager.getOAuthStatus("user123")

            const youtubeStatus = statuses.find(s => s.platform === "youtube")
            expect(youtubeStatus?.connected).toBe(true)
            expect(youtubeStatus?.linkedAt).toBeDefined()
        })
    })

    describe("exchangeCodeForToken", () => {
        it("should throw for unconfigured platform", async () => {
            await expect(
                manager.exchangeCodeForToken("twitter", "auth-code", "user123")
            ).rejects.toThrow("Platform twitter is not configured")
        })

        it("should throw when API returns error", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: "invalid_grant",
                    error_description: "Authorization code expired",
                }),
            })

            await expect(
                manager.exchangeCodeForToken(
                    "youtube",
                    "expired-code",
                    "user123"
                )
            ).rejects.toThrow("Token exchange failed")
        })

        it("should return OAuthTokenResponse on success", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: "ya29.new-token",
                    refresh_token: "1//refresh-token",
                    expires_in: 3600,
                    token_type: "Bearer",
                    scope: "youtube.upload email",
                }),
            })

            const result = await manager.exchangeCodeForToken(
                "youtube",
                "valid-code",
                "user123"
            )

            expect(result.accessToken).toBe("ya29.new-token")
            expect(result.refreshToken).toBe("1//refresh-token")
            expect(result.expiresIn).toBe(3600)
            expect(result.platform).toBe("youtube")
            expect(result.userId).toBe("user123")
            expect(result.linkedAt).toBeGreaterThan(0)
        })
    })

    describe("refreshAccessToken", () => {
        it("should throw for unconfigured platform", async () => {
            await expect(
                manager.refreshAccessToken(
                    "twitter",
                    "refresh-token",
                    "user123"
                )
            ).rejects.toThrow("Platform twitter is not configured")
        })

        it("should throw when API returns error", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: "invalid_grant",
                    error_description: "Refresh token revoked",
                }),
            })

            await expect(
                manager.refreshAccessToken(
                    "youtube",
                    "invalid-refresh",
                    "user123"
                )
            ).rejects.toThrow("Token refresh failed")
        })

        it("should return new OAuthTokenResponse on success", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: "ya29.new-access",
                    refresh_token: "1//new-refresh",
                    expires_in: 3600,
                    token_type: "Bearer",
                    scope: "youtube.upload",
                }),
            })

            const result = await manager.refreshAccessToken(
                "youtube",
                "valid-refresh",
                "user123"
            )

            expect(result.accessToken).toBe("ya29.new-access")
            expect(result.refreshToken).toBe("1//new-refresh")
            expect(result.platform).toBe("youtube")
            expect(result.userId).toBe("user123")
        })

        it("should use old refresh token when new one is not returned", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: "ya29.new-access",
                    expires_in: 3600,
                    token_type: "Bearer",
                    scope: "youtube.upload",
                }),
            })

            const result = await manager.refreshAccessToken(
                "youtube",
                "original-refresh",
                "user123"
            )

            expect(result.refreshToken).toBe("original-refresh")
        })
    })

    describe("revokeToken", () => {
        it("should return false for platform without revoke URL", async () => {
            const result = await manager.revokeToken(
                "facebook",
                "access-token",
                "user123"
            )

            expect(result).toBe(false)
        })

        it("should return false when API call fails", async () => {
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

        it("should return true on successful revocation", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
            })

            const result = await manager.revokeToken(
                "youtube",
                "access-token",
                "user123"
            )

            expect(result).toBe(true)
        })

        it("should handle network errors gracefully", async () => {
            global.fetch = vi
                .fn()
                .mockRejectedValueOnce(new Error("Network error"))

            const result = await manager.revokeToken(
                "youtube",
                "access-token",
                "user123"
            )

            expect(result).toBe(false)
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
})
