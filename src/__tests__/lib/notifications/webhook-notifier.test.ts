import { describe, expect, it, vi } from "vitest"
import {
    formatDiscordEmbed,
    formatTelegramMessage,
    NotificationEvent,
    sendDiscordNotification,
    sendTelegramNotification,
} from "@/lib/notifications/webhook-notifier"

describe("webhook-notifier", () => {
    const sampleEvent: NotificationEvent = {
        title: "Stream Went Live!",
        description: "Playing Minecraft on Twitch",
        eventType: "stream_live",
        platform: "Twitch",
        metadata: { viewers: 120, category: "Gaming" },
    }

    describe("formatDiscordEmbed", () => {
        it("should format a valid Discord embed with colors and fields", () => {
            const result = formatDiscordEmbed(sampleEvent)
            expect(result.embeds).toHaveLength(1)
            const embed = result.embeds[0]
            expect(embed.title).toBe("Stream Went Live!")
            expect(embed.color).toBe(0x57f287)
            expect(embed.fields).toHaveLength(3)
            expect(embed.fields?.[0].name).toBe("Platform")
            expect(embed.fields?.[0].value).toBe("Twitch")
        })
    })

    describe("formatTelegramMessage", () => {
        it("should format markdown message for Telegram", () => {
            const result = formatTelegramMessage("chat123", sampleEvent)
            expect(result.chat_id).toBe("chat123")
            expect(result.parse_mode).toBe("Markdown")
            expect(result.text).toContain("*Stream Went Live!*")
            expect(result.text).toContain("• viewers: 120")
        })
    })

    describe("sendDiscordNotification", () => {
        it("should return error if webhook URL is missing", async () => {
            const res = await sendDiscordNotification("", sampleEvent)
            expect(res.success).toBe(false)
            expect(res.error).toBe("Missing webhook URL")
        })

        it("should send HTTP POST request to discord webhook URL", async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true })
            const res = await sendDiscordNotification(
                "https://discord.com/api/webhooks/123/abc",
                sampleEvent
            )
            expect(res.success).toBe(true)
            expect(global.fetch).toHaveBeenCalledWith(
                "https://discord.com/api/webhooks/123/abc",
                expect.objectContaining({ method: "POST" })
            )
        })
    })

    describe("sendTelegramNotification", () => {
        it("should return error if bot token or chat ID is missing", async () => {
            const res = await sendTelegramNotification(
                "",
                "chat123",
                sampleEvent
            )
            expect(res.success).toBe(false)
            expect(res.error).toBe("Missing bot token or chat ID")
        })

        it("should send HTTP POST request to Telegram API", async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true })
            const res = await sendTelegramNotification(
                "bot12345:token",
                "chat999",
                sampleEvent
            )
            expect(res.success).toBe(true)
            expect(global.fetch).toHaveBeenCalledWith(
                "https://api.telegram.org/botbot12345:token/sendMessage",
                expect.objectContaining({ method: "POST" })
            )
        })
    })
})
