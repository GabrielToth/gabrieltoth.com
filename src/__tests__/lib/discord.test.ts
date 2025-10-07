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
        const allowReal = process.env.SEND_DISCORD_IN_TESTS === "true"

        // Prefer real webhook from env if present, otherwise fallback to dummy
        process.env.DISCORD_WEBHOOK_URL =
            process.env.DISCORD_WEBHOOK_URL || "https://example.com/webhook"

        let fetchSpy: ReturnType<typeof vi.spyOn> | null = null

        if (allowReal) {
            // Spy (do not stub) to assert it was called while still performing the request
            fetchSpy = vi.spyOn(global, "fetch")
        } else {
            // @ts-ignore
            global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })
        }

        // When enabled via env flag, also send a synthetic performance message
        const shouldSendPerf = allowReal

        await sendDiscordNotification({ title: "t", description: "d" })

        if (shouldSendPerf) {
            await sendDiscordNotification({
                title: "Test Perf Report",
                description: `Synthetic metrics at ${new Date().toISOString()}`,
            })
        }

        if (allowReal && fetchSpy) {
            expect(fetchSpy).toHaveBeenCalled()
            fetchSpy.mockRestore()
        } else {
            expect(global.fetch).toHaveBeenCalled()
        }

        process.env.DISCORD_WEBHOOK_URL = originalWebhook
    })
})
