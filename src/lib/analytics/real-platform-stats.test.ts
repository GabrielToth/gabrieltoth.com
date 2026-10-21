import { describe, expect, it, vi, beforeEach } from "vitest"
import {
    getRealPlatformStats,
    getCachedStats,
    clearRealStatsCache,
} from "./real-platform-stats"

// Mock token store: Twitch/YouTube need fresh OAuth tokens
vi.mock("@/lib/auth/token-refresh", () => ({
    getFreshPlatformToken: vi.fn(async (_userId: string, platform: string) => {
        if (platform === "twitch") {
            return {
                accessToken: "twitch-token",
                refreshToken: null,
                expiresAt: null,
                platform,
                userId: _userId,
            }
        }
        if (platform === "youtube") {
            return {
                accessToken: "yt-token",
                refreshToken: null,
                expiresAt: null,
                platform,
                userId: _userId,
            }
        }
        return null
    }),
}))

vi.mock("@/lib/twitch/config", () => ({
    getTwitchConfig: vi.fn(() => ({
        oauth: {
            clientId: "test-client-id",
            clientSecret: "",
            redirectUri: "",
            scopes: [],
        },
        apiBaseUrl: "https://api.twitch.tv/helix",
        oauthAuthorizeUrl: "",
        oauthTokenUrl: "",
        oauthRevokeUrl: "",
        ircUrl: "",
        ircPort: 6667,
        eventsubWsUrl: "",
        rateLimit: { requestsPerMinute: 800 },
        security: { tokenExpiryBufferMs: 300000 },
    })),
}))

describe("real-platform-stats", () => {
    beforeEach(() => {
        clearRealStatsCache()
        vi.clearAllMocks()
    })

    it("fetches Twitch followers and view count from Helix", async () => {
        const mockFetch = vi.fn(async (url: string, _init?: any) => {
            if (url.includes("/helix/users")) {
                return {
                    ok: true,
                    json: async () => ({
                        data: [
                            {
                                id: "12345",
                                login: "ogabrieltoth",
                                display_name: "GabrielToth",
                                view_count: 42000,
                            },
                        ],
                    }),
                }
            }
            if (url.includes("/channels/followers")) {
                return {
                    ok: true,
                    json: async () => ({ total: 1337 }),
                }
            }
            throw new Error("unexpected fetch: " + url)
        })
        vi.stubGlobal("fetch", mockFetch)

        const stats = await getRealPlatformStats("user-1", "twitch")

        expect(stats?.platform).toBe("twitch")
        expect(stats?.followers).toBe(1337)
        expect(stats?.views).toBe(42000)
        expect(stats?.channelName).toBe("GabrielToth")
    })

    it("fetches Kick followers from the public API by username", async () => {
        const mockFetch = vi.fn(async (url: string) => {
            if (url.includes("kick.com/api/v2/channels/ogabrieltoth")) {
                return {
                    ok: true,
                    json: async () => ({
                        user: { username: "ogabrieltoth", followersCount: 512 },
                    }),
                }
            }
            throw new Error("unexpected fetch: " + url)
        })
        vi.stubGlobal("fetch", mockFetch)

        const stats = await getRealPlatformStats(
            "user-1",
            "kick",
            "ogabrieltoth"
        )

        expect(stats?.platform).toBe("kick")
        expect(stats?.followers).toBe(512)
        expect(stats?.channelName).toBe("ogabrieltoth")
    })

    it("fetches YouTube subscribers via the Data API", async () => {
        const mockFetch = vi.fn(async (url: string) => {
            if (url.includes("youtube/v3/channels")) {
                return {
                    ok: true,
                    json: async () => ({
                        items: [
                            {
                                snippet: {
                                    title: "Gabriel Toth",
                                    customUrl: "@ogabrieltoth",
                                },
                                statistics: {
                                    subscriberCount: "9001",
                                    viewCount: "1234567",
                                },
                            },
                        ],
                    }),
                }
            }
            throw new Error("unexpected fetch: " + url)
        })
        vi.stubGlobal("fetch", mockFetch)

        const stats = await getRealPlatformStats("user-1", "youtube")

        expect(stats?.platform).toBe("youtube")
        expect(stats?.followers).toBe(9001)
        expect(stats?.views).toBe(1234567)
    })

    it("returns null for platforms without stats support", async () => {
        const stats = await getRealPlatformStats("user-1", "instagram")
        expect(stats).toBeNull()
    })

    it("returns null when the platform API call fails", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: false,
                status: 500,
                json: async () => ({}),
            }))
        )

        const stats = await getRealPlatformStats("user-1", "twitch")
        expect(stats).toBeNull()
    })

    it("caches results for 1 hour and serves them without refetching", async () => {
        const mockFetch = vi.fn(async (url: string) => {
            if (url.includes("/helix/users")) {
                return {
                    ok: true,
                    json: async () => ({
                        data: [
                            {
                                id: "1",
                                login: "x",
                                display_name: "X",
                                view_count: 10,
                            },
                        ],
                    }),
                }
            }
            return { ok: false, json: async () => ({}) }
        })
        vi.stubGlobal("fetch", mockFetch)

        await getRealPlatformStats("user-cache", "twitch")
        // Twitch stats = 2 API calls (helix/users + channels/followers)
        expect(mockFetch).toHaveBeenCalledTimes(2)

        // Second call hits the 1h cache — no additional fetch
        const cached = await getRealPlatformStats("user-cache", "twitch")
        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(getCachedStats("user-cache", "twitch")).toBe(cached)
    })
})
