/**
 * Tests for Discord Stream Notifier
 * Covers embed format, colors, and notification types
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock the discord notification function
vi.mock("@/lib/discord", () => ({
    sendDiscordNotification: vi.fn(),
}))

import { sendDiscordNotification } from "@/lib/discord"
import {
    notifyStreamScheduled,
    notifyStreamStarting,
    notifyStreamLive,
} from "./discord-stream-notifier"

describe("Discord Stream Notifier", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe("notifyStreamScheduled", () => {
        it("should send correct embed format", async () => {
            await notifyStreamScheduled(
                "Test Stream",
                ["twitch"],
                new Date(Date.now() + 86400000).toISOString(),
                60
            )

            expect(sendDiscordNotification).toHaveBeenCalledTimes(1)
            const call = vi.mocked(sendDiscordNotification).mock.calls[0][0]
            expect(call.title).toContain("Stream Scheduled")
            expect(call.fields).toBeDefined()
            expect(call.fields!.length).toBeGreaterThan(0)
            expect(call.color).toBe(0x7289da)
        })

        it("should include platform names", async () => {
            await notifyStreamScheduled(
                "Test Stream",
                ["twitch", "kick"],
                new Date(Date.now() + 86400000).toISOString(),
                90
            )

            const call = vi.mocked(sendDiscordNotification).mock.calls[0][0]
            const platformField = call.fields!.find(
                f => f.name === "🎮 Platform"
            )
            expect(platformField).toBeDefined()
            expect(platformField!.value).toContain("Twitch")
            expect(platformField!.value).toContain("Kick")
        })

        it("should include duration field", async () => {
            await notifyStreamScheduled(
                "Test Stream",
                ["twitch"],
                new Date(Date.now() + 86400000).toISOString(),
                120
            )

            const call = vi.mocked(sendDiscordNotification).mock.calls[0][0]
            const durationField = call.fields!.find(
                f => f.name === "📊 Duration"
            )
            expect(durationField).toBeDefined()
            expect(durationField!.value).toContain("2h")
        })
    })

    describe("notifyStreamStarting", () => {
        it("should send embed with 'Starting soon'", async () => {
            await notifyStreamStarting(
                "Test Stream",
                ["kick"],
                new Date(Date.now() + 300000).toISOString()
            )

            expect(sendDiscordNotification).toHaveBeenCalledTimes(1)
            const call = vi.mocked(sendDiscordNotification).mock.calls[0][0]
            expect(call.title).toContain("Starting Soon")
            expect(call.color).toBe(0x53fc18) // Kick green
        })

        it("should use Twitch purple for twitch platform", async () => {
            await notifyStreamStarting(
                "Test Stream",
                ["twitch"],
                new Date(Date.now() + 300000).toISOString()
            )

            const call = vi.mocked(sendDiscordNotification).mock.calls[0][0]
            expect(call.color).toBe(0x9146ff) // Twitch purple
        })
    })

    describe("notifyStreamLive", () => {
        it("should send embed with 'LIVE'", async () => {
            await notifyStreamLive("Test Stream", ["twitch"])

            expect(sendDiscordNotification).toHaveBeenCalledTimes(1)
            const call = vi.mocked(sendDiscordNotification).mock.calls[0][0]
            expect(call.title).toContain("LIVE NOW")
        })

        it("should use correct embed color for each platform", async () => {
            // Twitch
            await notifyStreamLive("Twitch Stream", ["twitch"])
            let call = vi.mocked(sendDiscordNotification).mock.calls[0][0]
            expect(call.color).toBe(0x9146ff)

            vi.clearAllMocks()

            // Kick
            await notifyStreamLive("Kick Stream", ["kick"])
            call = vi.mocked(sendDiscordNotification).mock.calls[0][0]
            expect(call.color).toBe(0x53fc18)
        })

        it("should include watch link", async () => {
            await notifyStreamLive("Test Stream", ["twitch"])

            const call = vi.mocked(sendDiscordNotification).mock.calls[0][0]
            const watchField = call.fields!.find(f => f.name === "🔗 Watch Now")
            expect(watchField).toBeDefined()
            expect(watchField!.value).toContain("twitch.tv/broadcast")
        })
    })
})
