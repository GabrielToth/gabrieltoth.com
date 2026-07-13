/**
 * Tests for Kick OAuth Service
 * Covers PKCE authorization flow, token exchange, refresh, API calls, singleton
 */

import {
    KickOAuthService,
    resetKickOAuthService,
} from "@/lib/kick/oauth-service"
import type { KickConfig } from "@/lib/kick/config"
import { ServiceError } from "@/lib/youtube/base-service"
import crypto from "crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function createMockConfig(overrides?: Partial<KickConfig>): KickConfig {
    return {
        oauth: {
            clientId: "kick-client-id",
            clientSecret: "kick-client-secret",
            redirectUri: "http://localhost:3000/callback/kick",
            scopes: ["user:read", "channel:read", "chat:write"],
        },
        apiBaseUrl: "https://api.kick.com",
        oauthAuthorizeUrl: "https://id.kick.com/oauth/authorize",
        oauthTokenUrl: "https://id.kick.com/oauth/token",
        websocketUrl: "wss://ws.kick.com",
        rateLimit: { linkingAttemptsPerHour: 5 },
        security: { tokenExpiryBufferMs: 5 * 60 * 1000 },
        ...overrides,
    }
}

describe("KickOAuthService", () => {
    let service: KickOAuthService
    let mockConfig: KickConfig
    let fetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        mockConfig = createMockConfig()
        service = new KickOAuthService(mockConfig)
        await service.initialize()
        fetchSpy = vi.spyOn(globalThis, "fetch")
    })

    afterEach(() => {
        vi.restoreAllMocks()
        resetKickOAuthService()
    })

    describe("generateAuthorizationUrl", () => {
        it("returns authorization URL with PKCE params", () => {
            const result = service.generateAuthorizationUrl("user_123")

            const url = new URL(result.authorizationUrl)
            expect(url.origin + url.pathname).toBe(
                "https://id.kick.com/oauth/authorize"
            )
            expect(url.searchParams.get("client_id")).toBe("kick-client-id")
            expect(url.searchParams.get("redirect_uri")).toBe(
                "http://localhost:3000/callback/kick"
            )
            expect(url.searchParams.get("response_type")).toBe("code")
            expect(url.searchParams.get("code_challenge_method")).toBe("S256")
            expect(url.searchParams.get("code_challenge")).toBeTruthy()
            expect(url.searchParams.get("state")).toBeTruthy()
        })

        it("generates state and PKCE values", () => {
            const result = service.generateAuthorizationUrl("user_123")

            expect(result.state).toBeTruthy()
            expect(result.state.length).toBe(64) // 32 bytes hex
            expect(result.codeVerifier).toBeTruthy()
            expect(result.codeChallenge).toBeTruthy()
            // code_challenge should be derived from codeVerifier
            const computedChallenge = crypto
                .createHash("sha256")
                .update(result.codeVerifier)
                .digest("base64url")
            expect(result.codeChallenge).toBe(computedChallenge)
        })

        it("throws ServiceError when not initialized", () => {
            const uninitService = new KickOAuthService(mockConfig)

            expect(() => uninitService.generateAuthorizationUrl("u")).toThrow(
                ServiceError
            )
        })
    })

    describe("exchangeCodeForToken", () => {
        it("exchanges code for token with code verifier", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    access_token: "kick-access-token",
                    refresh_token: "kick-refresh-token",
                    expires_in: 3600,
                    token_type: "bearer",
                }),
            } as Response)

            const result = await service.exchangeCodeForToken(
                "auth-code",
                "test-code-verifier"
            )

            expect(result.accessToken).toBe("kick-access-token")
            expect(result.refreshToken).toBe("kick-refresh-token")
            expect(result.expiresIn).toBe(3600)
            expect(result.tokenType).toBe("bearer")

            // Verify code_verifier was sent
            const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
            const body = options.body as string
            expect(body).toContain("code_verifier=test-code-verifier")
        })

        it("exchanges code for token without code verifier", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    access_token: "kick-access-token",
                    refresh_token: "kick-refresh-token",
                    expires_in: 3600,
                    token_type: "bearer",
                }),
            } as Response)

            const result = await service.exchangeCodeForToken("auth-code")

            expect(result.accessToken).toBe("kick-access-token")
            // Verify code_verifier is NOT sent
            const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
            const body = options.body as string
            expect(body).not.toContain("code_verifier")
        })

        it("throws ServiceError on failed exchange", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ error: "invalid_grant" }),
            } as Response)

            await expect(
                service.exchangeCodeForToken("bad-code")
            ).rejects.toThrow(ServiceError)
        })

        it("throws ServiceError when not initialized", async () => {
            const uninitService = new KickOAuthService(mockConfig)

            await expect(
                uninitService.exchangeCodeForToken("code")
            ).rejects.toThrow(ServiceError)
        })
    })

    describe("refreshAccessToken", () => {
        it("refreshes token successfully", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    access_token: "new-kick-token",
                    refresh_token: "new-kick-refresh",
                    expires_in: 7200,
                    token_type: "bearer",
                }),
            } as Response)

            const result = await service.refreshAccessToken("old-refresh")

            expect(result.accessToken).toBe("new-kick-token")
            expect(result.refreshToken).toBe("new-kick-refresh")
            expect(result.expiresIn).toBe(7200)
        })

        it("throws ServiceError on failed refresh", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({ error: "invalid_token" }),
            } as Response)

            await expect(
                service.refreshAccessToken("bad-token")
            ).rejects.toThrow(ServiceError)
        })
    })

    describe("getUser", () => {
        it("returns user on success", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            user_id: "kick_user_1",
                            username: "kickuser",
                            email: "kick@example.com",
                            profile_picture_url:
                                "https://example.com/avatar.png",
                        },
                    ],
                }),
            } as Response)

            const user = await service.getUser("access-token")

            expect(user).not.toBeNull()
            expect(user!.userId).toBe("kick_user_1")
            expect(user!.username).toBe("kickuser")
            expect(user!.email).toBe("kick@example.com")
        })

        it("returns null on API error", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 401,
            } as Response)

            const user = await service.getUser("bad-token")
            expect(user).toBeNull()
        })
    })

    describe("getChannel", () => {
        it("returns channel on success", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            channel_id: "kick_channel_1",
                            name: "KickStreamer",
                            slug: "kickstreamer",
                            followers_count: 1500,
                            live: true,
                        },
                    ],
                }),
            } as Response)

            const channel = await service.getChannel("access-token")

            expect(channel).not.toBeNull()
            expect(channel!.id).toBe("kick_channel_1")
            expect(channel!.name).toBe("KickStreamer")
            expect(channel!.slug).toBe("kickstreamer")
            expect(channel!.followersCount).toBe(1500)
            expect(channel!.isLive).toBe(true)
        })

        it("returns null on API error", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 404,
            } as Response)

            const channel = await service.getChannel("bad-token")
            expect(channel).toBeNull()
        })
    })

    describe("revokeToken", () => {
        it("revokes token and returns true", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
            } as Response)

            const result = await service.revokeToken("token-to-revoke")

            expect(result).toBe(true)
            const [url, options] = fetchSpy.mock.calls[0] as [
                string,
                RequestInit,
            ]
            expect(url).toBe("https://id.kick.com/oauth/token/revoke")
            expect(options.method).toBe("POST")
            const body = options.body as string
            expect(body).toContain("token=token-to-revoke")
        })

        it("returns false on failed revocation", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 400,
            } as Response)

            const result = await service.revokeToken("bad-token")
            expect(result).toBe(false)
        })

        it("returns false on fetch error", async () => {
            fetchSpy.mockRejectedValue(new Error("Network error"))

            const result = await service.revokeToken("token")
            expect(result).toBe(false)
        })
    })
})
