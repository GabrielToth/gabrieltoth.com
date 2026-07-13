/**
 * Tests for Twitch OAuth Service
 * Covers authorization URL generation, token exchange, refresh, API calls, singleton
 */

import {
    TwitchOAuthService,
    resetTwitchOAuthService,
} from "@/lib/twitch/oauth-service"
import type { TwitchConfig } from "@/lib/twitch/config"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function createMockConfig(overrides?: Partial<TwitchConfig>): TwitchConfig {
    return {
        oauth: {
            clientId: "test-client-id",
            clientSecret: "test-client-secret",
            redirectUri: "http://localhost:3000/callback/twitch",
            scopes: ["chat:read", "chat:edit"],
        },
        apiBaseUrl: "https://api.twitch.tv/helix",
        oauthAuthorizeUrl: "https://id.twitch.tv/oauth2/authorize",
        oauthTokenUrl: "https://id.twitch.tv/oauth2/token",
        oauthRevokeUrl: "https://id.twitch.tv/oauth2/revoke",
        ircUrl: "irc.chat.twitch.tv",
        ircPort: 6667,
        eventsubWsUrl: "wss://eventsub.wss.twitch.tv",
        rateLimit: { requestsPerMinute: 800 },
        security: { tokenExpiryBufferMs: 5 * 60 * 1000 },
        ...overrides,
    }
}

describe("TwitchOAuthService", () => {
    let service: TwitchOAuthService
    let mockConfig: TwitchConfig
    let fetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        mockConfig = createMockConfig()
        service = new TwitchOAuthService(mockConfig)
        await service.initialize()
        fetchSpy = vi.spyOn(globalThis, "fetch")
    })

    afterEach(() => {
        vi.restoreAllMocks()
        resetTwitchOAuthService()
    })

    describe("generateAuthorizationUrl", () => {
        it("returns authorization URL with correct params", () => {
            const result = service.generateAuthorizationUrl("test-state")

            const url = new URL(result.authorizationUrl)
            expect(url.origin + url.pathname).toBe(
                "https://id.twitch.tv/oauth2/authorize"
            )
            expect(url.searchParams.get("client_id")).toBe("test-client-id")
            expect(url.searchParams.get("redirect_uri")).toBe(
                "http://localhost:3000/callback/twitch"
            )
            expect(url.searchParams.get("response_type")).toBe("code")
            expect(url.searchParams.get("scope")).toBe("chat:read chat:edit")
            expect(url.searchParams.get("state")).toBe("test-state")
        })

        it("returns the same state", () => {
            const result = service.generateAuthorizationUrl("my-state")

            expect(result.state).toBe("my-state")
            expect(result.authorizationUrl).toContain("state=my-state")
        })
    })

    describe("exchangeCodeForToken", () => {
        it("exchanges code for token successfully", async () => {
            const mockResponse = {
                ok: true,
                json: async () => ({
                    access_token: "test-access-token",
                    refresh_token: "test-refresh-token",
                    expires_in: 3600,
                    token_type: "bearer",
                    scope: "chat:read chat:edit",
                }),
            }
            fetchSpy.mockResolvedValue(mockResponse as Response)

            const result = await service.exchangeCodeForToken("auth-code")

            expect(result.accessToken).toBe("test-access-token")
            expect(result.refreshToken).toBe("test-refresh-token")
            expect(result.expiresIn).toBe(3600)
            expect(result.tokenType).toBe("bearer")
            expect(result.scope).toBe("chat:read chat:edit")
        })

        it("sends correct POST request", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({ access_token: "tok" }),
            } as Response)

            await service.exchangeCodeForToken("auth-code-123")

            expect(fetchSpy).toHaveBeenCalledTimes(1)
            const [url, options] = fetchSpy.mock.calls[0] as [
                string,
                RequestInit,
            ]
            expect(url).toBe("https://id.twitch.tv/oauth2/token")
            expect(options.method).toBe("POST")
            expect(options.headers).toEqual({
                "Content-Type": "application/x-www-form-urlencoded",
            })
            const body = options.body as string
            expect(body).toContain("client_id=test-client-id")
            expect(body).toContain("code=auth-code-123")
            expect(body).toContain("grant_type=authorization_code")
        })

        it("throws on failed exchange", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 400,
                text: async () => "bad request",
            } as Response)

            await expect(
                service.exchangeCodeForToken("bad-code")
            ).rejects.toThrow("Twitch token exchange failed: 400")
        })
    })

    describe("refreshAccessToken", () => {
        it("refreshes token successfully", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    access_token: "new-access-token",
                    refresh_token: "new-refresh-token",
                    expires_in: 7200,
                    token_type: "bearer",
                    scope: "chat:read",
                }),
            } as Response)

            const result = await service.refreshAccessToken("old-refresh-token")

            expect(result.accessToken).toBe("new-access-token")
            expect(result.refreshToken).toBe("new-refresh-token")
            expect(result.expiresIn).toBe(7200)
        })

        it("throws on failed refresh", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 401,
                text: async () => "invalid refresh token",
            } as Response)

            await expect(
                service.refreshAccessToken("invalid-token")
            ).rejects.toThrow("Twitch token refresh failed: 401")
        })
    })

    describe("getUser", () => {
        it("returns user on success", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: "123",
                            login: "testuser",
                            display_name: "TestUser",
                            type: "",
                            broadcaster_type: "partner",
                            description: "A test channel",
                            profile_image_url: "https://example.com/avatar.png",
                            offline_image_url:
                                "https://example.com/offline.png",
                            email: "test@example.com",
                            created_at: "2024-01-01T00:00:00Z",
                        },
                    ],
                }),
            } as Response)

            const user = await service.getUser("access-token")

            expect(user).not.toBeNull()
            expect(user!.id).toBe("123")
            expect(user!.login).toBe("testuser")
            expect(user!.displayName).toBe("TestUser")
            expect(user!.email).toBe("test@example.com")
        })

        it("sends correct authorization headers", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: "1",
                            login: "u",
                            display_name: "U",
                            type: "",
                            broadcaster_type: "",
                            description: "",
                            profile_image_url: "",
                            offline_image_url: "",
                            created_at: "",
                        },
                    ],
                }),
            } as Response)

            await service.getUser("my-access-token")

            const [url, options] = fetchSpy.mock.calls[0] as [
                string,
                RequestInit,
            ]
            expect(url).toBe("https://api.twitch.tv/helix/users")
            expect(options.headers).toMatchObject({
                Authorization: "Bearer my-access-token",
                "Client-Id": "test-client-id",
            })
        })

        it("returns null on API error", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 401,
            } as Response)

            const user = await service.getUser("bad-token")
            expect(user).toBeNull()
        })

        it("returns null when data array is empty", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] }),
            } as Response)

            const user = await service.getUser("token")
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
                            broadcaster_id: "123",
                            broadcaster_login: "testuser",
                            broadcaster_name: "TestUser",
                            broadcaster_language: "en",
                            game_id: "12345",
                            game_name: "Just Chatting",
                            title: "My Stream",
                            delay: 0,
                            tags: ["tag1"],
                            content_classification_labels: [],
                        },
                    ],
                }),
            } as Response)

            const channel = await service.getChannel("token", "123")

            expect(channel).not.toBeNull()
            expect(channel!.broadcasterId).toBe("123")
            expect(channel!.broadcasterName).toBe("TestUser")
            expect(channel!.title).toBe("My Stream")
            expect(channel!.gameName).toBe("Just Chatting")
        })

        it("returns null on API error", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 404,
            } as Response)

            const channel = await service.getChannel("token", "999")
            expect(channel).toBeNull()
        })
    })

    describe("getStream", () => {
        it("returns stream on success", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: "stream1",
                            user_id: "123",
                            user_login: "testuser",
                            user_name: "TestUser",
                            game_id: "12345",
                            game_name: "Just Chatting",
                            type: "live",
                            title: "Live Stream!",
                            viewer_count: 42,
                            started_at: "2024-01-01T00:00:00Z",
                            language: "en",
                            thumbnail_url: "https://example.com/thumb.jpg",
                            tag_ids: ["tag1"],
                            is_mature: false,
                        },
                    ],
                }),
            } as Response)

            const stream = await service.getStream("token", "123")

            expect(stream).not.toBeNull()
            expect(stream!.id).toBe("stream1")
            expect(stream!.userName).toBe("TestUser")
            expect(stream!.title).toBe("Live Stream!")
            expect(stream!.viewerCount).toBe(42)
        })

        it("returns null when not live", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] }),
            } as Response)

            const stream = await service.getStream("token", "123")
            expect(stream).toBeNull()
        })
    })

    describe("modifyChannel", () => {
        it("modifies channel successfully", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
            } as Response)

            const result = await service.modifyChannel("token", "123", {
                title: "New Title",
                game_id: "99999",
            })

            expect(result).toBe(true)
            const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
            expect(options.method).toBe("PATCH")
            const body = JSON.parse(options.body as string)
            expect(body.title).toBe("New Title")
            expect(body.game_id).toBe("99999")
        })

        it("returns false on failure", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 400,
                text: async () => "error",
            } as Response)

            const result = await service.modifyChannel("token", "123", {
                title: "Bad Title",
            })
            expect(result).toBe(false)
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
            expect(url).toBe("https://id.twitch.tv/oauth2/revoke")
            expect(options.method).toBe("POST")
            const body = options.body as string
            expect(body).toContain("token=token-to-revoke")
        })

        it("returns true even on non-200 response", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 404,
            } as Response)

            const result = await service.revokeToken("bad-token")
            expect(result).toBe(true)
        })
    })

    describe("getTopGames", () => {
        it("returns top games without query", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: "1",
                            name: "Just Chatting",
                            box_art_url: "https://example.com/1.jpg",
                        },
                        {
                            id: "2",
                            name: "Grand Theft Auto V",
                            box_art_url: "https://example.com/2.jpg",
                        },
                    ],
                }),
            } as Response)

            const games = await service.getTopGames("token")

            expect(games).toHaveLength(2)
            expect(games[0].name).toBe("Just Chatting")
            expect(games[1].id).toBe("2")
            const [url] = fetchSpy.mock.calls[0] as [string]
            expect(url).toContain("/games/top")
        })

        it("returns searched games with query", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: "3",
                            name: "Minecraft",
                            box_art_url: "https://example.com/mc.jpg",
                        },
                    ],
                }),
            } as Response)

            const games = await service.getTopGames("token", "minecraft", 10)

            expect(games).toHaveLength(1)
            const [url] = fetchSpy.mock.calls[0] as [string]
            expect(url).toContain("/search/categories")
            expect(url).toContain("query=minecraft")
            expect(url).toContain("first=10")
        })

        it("returns empty array on API error", async () => {
            fetchSpy.mockResolvedValue({
                ok: false,
                status: 500,
            } as Response)

            const games = await service.getTopGames("token")
            expect(games).toEqual([])
        })
    })
})
