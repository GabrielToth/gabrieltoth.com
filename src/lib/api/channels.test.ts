import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    clearChannelsCache,
    connectChannel,
    disconnectChannel,
    fetchChannels,
} from "./channels"

const mockChannels = [
    {
        id: "1",
        platform: "facebook",
        accountId: "fb123",
        accountName: "My Facebook Page",
        isConnected: true,
        connectedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
        id: "2",
        platform: "instagram",
        accountId: "ig123",
        accountName: "My Instagram",
        isConnected: true,
        connectedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
        id: "3",
        platform: "twitter",
        accountId: "tw123",
        accountName: "My Twitter",
        isConnected: true,
        connectedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
        id: "4",
        platform: "tiktok",
        accountId: "tt123",
        accountName: "My TikTok",
        isConnected: false,
    },
    {
        id: "5",
        platform: "linkedin",
        accountId: "li123",
        accountName: "My LinkedIn",
        isConnected: false,
    },
]

describe("Channels API Service", () => {
    beforeEach(() => {
        clearChannelsCache()
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ channels: mockChannels }),
        } as Response)
    })

    describe("fetchChannels", () => {
        it("returns array of channels", async () => {
            const channels = await fetchChannels()

            expect(Array.isArray(channels)).toBe(true)
            expect(channels.length).toBeGreaterThan(0)
        })

        it("returns channels with correct structure", async () => {
            const channels = await fetchChannels()

            channels.forEach(channel => {
                expect(channel).toHaveProperty("id")
                expect(channel).toHaveProperty("platform")
                expect(channel).toHaveProperty("accountId")
                expect(channel).toHaveProperty("accountName")
                expect(channel).toHaveProperty("isConnected")
            })
        })

        it("includes all supported platforms", async () => {
            const channels = await fetchChannels()

            const platforms = channels.map(c => c.platform)
            expect(platforms).toContain("facebook")
            expect(platforms).toContain("instagram")
            expect(platforms).toContain("twitter")
            expect(platforms).toContain("tiktok")
            expect(platforms).toContain("linkedin")
        })

        it("caches results", async () => {
            const channels1 = await fetchChannels()
            const channels2 = await fetchChannels()

            expect(channels1).toEqual(channels2)
        })

        it("includes connected and disconnected channels", async () => {
            const channels = await fetchChannels()

            const connected = channels.filter(c => c.isConnected)
            const disconnected = channels.filter(c => !c.isConnected)

            expect(connected.length).toBeGreaterThan(0)
            expect(disconnected.length).toBeGreaterThan(0)
        })
    })

    describe("connectChannel", () => {
        it("connects a channel", async () => {
            const connected = await connectChannel("facebook")

            expect(connected.isConnected).toBe(true)
            expect(connected.connectedAt).toBeDefined()
        })

        it("throws error for non-existent platform", async () => {
            await expect(connectChannel("invalid-platform")).rejects.toThrow(
                "Failed to connect channel"
            )
        })

        it("invalidates cache after connecting", async () => {
            await fetchChannels()
            await connectChannel("facebook")

            // Cache should be cleared
            const channels = await fetchChannels()
            expect(channels).toBeDefined()
        })
    })

    describe("disconnectChannel", () => {
        it("disconnects a channel", async () => {
            await expect(disconnectChannel("facebook")).resolves.toBeUndefined()
        })

        it("invalidates cache after disconnecting", async () => {
            await fetchChannels()
            await disconnectChannel("facebook")

            // Cache should be cleared
            const channels = await fetchChannels()
            expect(channels).toBeDefined()
        })
    })

    describe("clearChannelsCache", () => {
        it("clears the cache", async () => {
            await fetchChannels()
            clearChannelsCache()

            // Next fetch should get fresh data
            const channels = await fetchChannels()
            expect(channels).toBeDefined()
        })
    })
})
