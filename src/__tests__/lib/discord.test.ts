import { sendDiscordNotification } from "@/lib/discord"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("lib/discord", () => {
    const originalWebhook = process.env.DISCORD_WEBHOOK_URL

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it("skips when webhook URL not configured", async () => {
        // @ts-ignore
        delete process.env.DISCORD_WEBHOOK_URL
        const spy = vi.spyOn(console, "log").mockImplementation(() => {})
        await sendDiscordNotification({ title: "t", description: "d" })
        expect(spy).toHaveBeenCalled()
        process.env.DISCORD_WEBHOOK_URL = originalWebhook
    })

    it("posts to webhook when configured", async () => {
        process.env.DISCORD_WEBHOOK_URL = "https://example.com/webhook"
        // @ts-ignore
        global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })

        await sendDiscordNotification({ title: "t", description: "d" })

        expect(global.fetch).toHaveBeenCalled()
        process.env.DISCORD_WEBHOOK_URL = originalWebhook
    })
})
