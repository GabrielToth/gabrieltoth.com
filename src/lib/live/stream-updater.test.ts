import { describe, expect, it, vi, beforeEach } from "vitest"
import { updateUserStreams } from "@/lib/live/stream-updater"

vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    eq: () =>
                        Promise.resolve({
                            data: [
                                { platform: "twitch", platform_user_id: "70000" },
                                { platform: "kick", platform_user_id: "kick_u" },
                                { platform: "youtube", platform_user_id: "yt_u" },
                            ],
                            error: null,
                        }),
                }),
            }),
        }),
    }),
}))

// Mock platform HTTP calls
const mockFetch = vi.fn()
global.fetch = mockFetch
vi.mock("node-fetch", () => ({}))

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({
        getToken: async () => ({
            accessToken: "tok",
            expiresAt: Date.now() + 3600_000,
        }),
    }),
}))

vi.mock("@/lib/twitch/config", () => ({
    getTwitchConfig: () => ({ clientId: "cid" }),
}))
vi.mock("@/lib/twitch/oauth-service", () => ({
    getTwitchOAuthService: vi.fn(),
}))
vi.mock("@/lib/kick/config", () => ({
    getKickConfig: () => ({ clientId: "cid" }),
}))
vi.mock("@/lib/kick/oauth-service", () => ({
    getKickOAuthService: vi.fn(),
}))
vi.mock("@/lib/youtube/config", () => ({
    getYouTubeChannelLinkingConfig: () => ({}),
}))
vi.mock("@/lib/youtube/oauth-service", () => ({
    getYouTubeOAuthService: vi.fn(),
}))
vi.mock("@/lib/config/env", () => ({ validateEnv: () => ({}) }))

describe("updateUserStreams", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockImplementation(async (url) => {
            if (String(url).includes('liveBroadcasts')) {
                return { ok: true, status: 200, json: async () => ({ items: [{ id: 'b1', snippet: { title: 'x' } }] }), text: async () => '{}' }
            }
            if (String(url).includes('search/categories')) {
                return { ok: true, status: 200, json: async () => ({ data: [{ id: '509658' }] }), text: async () => '{}' }
            }
            if (String(url).includes('kick.com/public/v1/channels')) {
                return { ok: true, status: 200, json: async () => ({ data: [{ category: { id: 123 }, session_title: 'Old', slug: 'x' }] }), text: async () => '{}' }
            }
            return { ok: true, status: 200, json: async () => ({ data: [] }), text: async () => '{}' }
        })
    })

    it("updates title on all connected platforms", async () => {
        const results = await updateUserStreams("user-1", {
            title: "New stream title",
        })
        expect(results.length).toBeGreaterThanOrEqual(3)
        const platforms = results.map(r => r.platform)
        expect(platforms).toContain("twitch")
        expect(platforms).toContain("kick")
        expect(platforms).toContain("youtube")
        expect(results.every(r => r.success)).toBe(true)
    })

    it("updates category on twitch and kick only (skip youtube)", async () => {
        const results = await updateUserStreams("user-1", {
            category: "IRL",
        })
        const youtubeResult = results.find(r => r.platform === "youtube")
        expect(youtubeResult?.success).toBe(false)
        expect(youtubeResult?.error).toBe("YOUTUBE_NO_CATEGORY_SUPPORT")
    })
})
