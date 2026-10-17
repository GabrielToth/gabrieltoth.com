import { describe, expect, it, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/platform/analytics/route"
import { NextRequest } from "next/server"

// Mock of platform stats returned by getRealPlatformStats
const realStatsByPlatform: Record<
    string,
    {
        platform: string
        followers: number | null
        views: number | null
        channelName: string | null
        fetchedAt: number
    }
> = {}

vi.mock("@/lib/analytics/real-platform-stats", () => ({
    getRealPlatformStats: vi.fn(async (userId: string, platform: string) => {
        return realStatsByPlatform[platform] || null
    }),
}))

// Mock of connected networks stored in Supabase
const networksRows: Array<{
    platform: string
    platform_username: string
}> = []

vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        from: vi.fn((table: string) => {
            if (table === "social_networks") {
                // Chainable select -> eq -> eq -> Promise
                const selectChain = {
                    eq: vi.fn(() => selectChain),
                    then: (resolve: any, reject: any) =>
                        Promise.resolve({ data: networksRows }).then(
                            resolve,
                            reject
                        ),
                }
                return {
                    select: vi.fn(() => selectChain),
                }
            }
            if (table === "channel_group_members") {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => Promise.resolve({ data: [] })),
                    })),
                }
            }
            // platform_stats_snapshots (delete/insert/select chains)
            return {
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        gte: vi.fn(() =>
                            Promise.resolve({ data: [], error: null })
                        ),
                    })),
                })),
                delete: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        gte: vi.fn(() => Promise.resolve({ error: null })),
                    })),
                })),
                insert: vi.fn(() => Promise.resolve({ error: null })),
            }
        }),
    })),
}))

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: vi.fn(async (req: NextRequest) => {
        const auth = req.headers.get("authorization")
        if (auth === "Bearer valid-token") {
            return { user: { id: "user-123", email: "test@example.com" } }
        }
        return null
    }),
}))

describe("Platform Analytics API Route", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        networksRows.length = 0
        for (const key of Object.keys(realStatsByPlatform)) {
            delete realStatsByPlatform[key]
        }
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
        vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key")
    })

    it("should return 401 for unauthenticated requests", async () => {
        const req = new NextRequest("http://localhost/api/platform/analytics")
        const res = await GET(req)
        expect(res.status).toBe(401)
        const json = await res.json()
        expect(json.success).toBe(false)
    })

    it("should return honest zeros when no platforms connected", async () => {
        const req = new NextRequest("http://localhost/api/platform/analytics", {
            headers: { authorization: "Bearer valid-token" },
        })
        const res = await GET(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.simpleMetrics[0].value).toBe(0)
        expect(json.data.platformStats).toEqual({})
    })

    it("should aggregate real follower stats across connected platforms", async () => {
        networksRows.push(
            { platform: "twitch", platform_username: "ogabrieltoth" },
            { platform: "kick", platform_username: "ogabrieltoth" }
        )
        realStatsByPlatform.twitch = {
            platform: "twitch",
            followers: 1000,
            views: 25000,
            channelName: "GabrielToth",
            fetchedAt: Date.now(),
        }
        realStatsByPlatform.kick = {
            platform: "kick",
            followers: 250,
            views: null,
            channelName: "ogabrieltoth",
            fetchedAt: Date.now(),
        }

        const req = new NextRequest("http://localhost/api/platform/analytics", {
            headers: { authorization: "Bearer valid-token" },
        })
        const res = await GET(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.data.simpleMetrics[0].value).toBe(1250)
        expect(json.data.platformStats.twitch.followers).toBe(1000)
        expect(json.data.platformStats.kick.followers).toBe(250)
        expect(json.data.channelsCount).toBe(2)
    })

    it("should respect platform filter", async () => {
        networksRows.push(
            { platform: "twitch", platform_username: "ogabrieltoth" },
            { platform: "kick", platform_username: "ogabrieltoth" }
        )
        realStatsByPlatform.twitch = {
            platform: "twitch",
            followers: 1000,
            views: 25000,
            channelName: "GabrielToth",
            fetchedAt: Date.now(),
        }
        realStatsByPlatform.kick = {
            platform: "kick",
            followers: 250,
            views: null,
            channelName: "ogabrieltoth",
            fetchedAt: Date.now(),
        }

        const req = new NextRequest(
            "http://localhost/api/platform/analytics?platform=twitch",
            { headers: { authorization: "Bearer valid-token" } }
        )
        const res = await GET(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.data.simpleMetrics[0].value).toBe(1000)
        expect(Object.keys(json.data.platformStats)).toEqual(["twitch"])
    })

    it("should handle platform API failures gracefully (null stats)", async () => {
        networksRows.push({
            platform: "twitch",
            platform_username: "ogabrieltoth",
        })
        // No stats mocked -> getRealPlatformStats returns null

        const req = new NextRequest("http://localhost/api/platform/analytics", {
            headers: { authorization: "Bearer valid-token" },
        })
        const res = await GET(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.simpleMetrics[0].value).toBe(0)
        expect(json.data.platformStats.twitch.followers).toBeNull()
    })
})
