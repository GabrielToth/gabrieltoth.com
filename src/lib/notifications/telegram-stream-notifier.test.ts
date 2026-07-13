/**
 * Tests for Telegram Stream Notifier
 * Covers message format, API calls, and rate limiting
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock environment config
vi.mock("@/config/environment", () => ({
    getConfig: vi.fn(() => ({
        notifications: {
            telegramBotToken: "test-token-123",
            telegramChatId: "test-chat-456",
        },
    })),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

import {
    notifyStreamScheduled,
    notifyStreamStarting,
    notifyStreamLive,
} from "./telegram-stream-notifier"

describe("Telegram Stream Notifier", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockResolvedValue({
            ok: true,
            text: vi.fn().mockResolvedValue(""),
        })
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe("notifyStreamScheduled", () => {
        it("should send correct HTML message to Telegram API", async () => {
            await notifyStreamScheduled(
                "Test Stream",
                ["twitch"],
                new Date(Date.now() + 86400000).toISOString()
            )

            // Wait for rate limiter
            await vi.waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1)
            })

            const call = mockFetch.mock.calls[0]
            const url = call[0]
            const body = JSON.parse(call[1].body)

            expect(url).toContain("api.telegram.org/bot")
            expect(url).toContain("sendMessage")
            expect(body.chat_id).toBe("test-chat-456")
            expect(body.parse_mode).toBe("HTML")
            expect(body.text).toContain("<b>📅 Stream Scheduled</b>")
            expect(body.text).toContain("Twitch")
            expect(body.text).toContain("Test Stream")
        })

        it("should include stream details in message", async () => {
            await notifyStreamScheduled(
                "Important Stream",
                ["twitch", "kick"],
                new Date(Date.now() + 86400000).toISOString()
            )

            await vi.waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1)
            })

            const body = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(body.text).toContain("Twitch")
            expect(body.text).toContain("Kick")
        })

        it("should handle multiple platforms", async () => {
            await notifyStreamScheduled(
                "Multi Platform Stream",
                ["twitch", "kick"],
                new Date(Date.now() + 86400000).toISOString()
            )

            await vi.waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1)
            })

            const body = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(body.text).toContain("Twitch")
            expect(body.text).toContain("Kick")
        })
    })

    describe("notifyStreamStarting", () => {
        it("should send bold 'Starting soon' message", async () => {
            await notifyStreamStarting("Test Stream", ["twitch"])

            await vi.waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1)
            })

            const body = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(body.text).toContain("<b>🚀 Starting Soon</b>")
            expect(body.text).toContain("Twitch")
        })
    })

    describe("notifyStreamLive", () => {
        it("should send 'LIVE NOW' message", async () => {
            await notifyStreamLive("Test Stream", ["twitch"])

            await vi.waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1)
            })

            const body = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(body.text).toContain("<b>🔴 LIVE NOW</b>")
            expect(body.text).toContain("twitch.tv/broadcast")
        })

        it("should include Kick watch link for Kick streams", async () => {
            await notifyStreamLive("Kick Stream", ["kick"])

            await vi.waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1)
            })

            const body = JSON.parse(mockFetch.mock.calls[0][1].body)
            expect(body.text).toContain("kick.com")
        })
    })

    describe("error handling", () => {
        it("should log error and not throw on API error", async () => {
            mockFetch.mockRejectedValue(new Error("Network error"))

            // Should not throw
            await expect(
                notifyStreamScheduled(
                    "Test Stream",
                    ["twitch"],
                    new Date(Date.now() + 86400000).toISOString()
                )
            ).resolves.toBeUndefined()
        })

        it("should handle non-ok response gracefully", async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 429,
                text: vi.fn().mockResolvedValue("Too Many Requests"),
            })

            // Should not throw
            await expect(
                notifyStreamScheduled(
                    "Test Stream",
                    ["twitch"],
                    new Date(Date.now() + 86400000).toISOString()
                )
            ).resolves.toBeUndefined()
        })
    })

    describe("rate limiting", () => {
        it("should queue messages sent in quick succession", async () => {
            // Send 3 messages quickly
            await Promise.all([
                notifyStreamScheduled(
                    "Stream 1",
                    ["twitch"],
                    new Date(Date.now() + 86400000).toISOString()
                ),
                notifyStreamStarting("Stream 2", ["kick"]),
                notifyStreamLive("Stream 3", ["twitch"]),
            ])

            // Wait for all to be sent
            await vi.waitFor(
                () => {
                    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(
                        3
                    )
                },
                { timeout: 20000, interval: 1000 }
            )
        }, 30000)
    })
})
