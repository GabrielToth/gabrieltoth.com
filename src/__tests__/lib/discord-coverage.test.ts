import { beforeEach, describe, expect, it, vi } from "vitest"

describe("lib/discord coverage", () => {
    const fetchSpy = vi.spyOn(globalThis as any, "fetch")
    const env = process.env

    beforeEach(() => {
        fetchSpy.mockReset()
    })

    it("skips when webhook is not configured", async () => {
        process.env = { ...env }
        delete process.env.DISCORD_WEBHOOK_URL
        const mod = await import("@/lib/discord")
        const log = vi.spyOn(console, "log").mockImplementation(() => {})
        await mod.sendDiscordNotification({ title: "t", description: "d" })
        expect(log).toHaveBeenCalledWith(
            "Discord webhook not configured, skipping notification"
        )
        log.mockRestore()
        process.env = env
    })

    it("posts notification and logs success", async () => {
        process.env = { ...env, DISCORD_WEBHOOK_URL: "https://discord/webhook" }
        fetchSpy.mockResolvedValue({ ok: true } as any)
        const mod = await import("@/lib/discord")
        const log = vi.spyOn(console, "log").mockImplementation(() => {})
        await mod.notifyNewOrder({
            trackingCode: "T",
            serviceType: "S",
            amount: 1,
            paymentMethod: "pix",
        })
        expect(fetchSpy).toHaveBeenCalled()
        expect(log).toHaveBeenCalledWith(
            "Discord notification sent successfully"
        )
        log.mockRestore()
        process.env = env
    })
})

import {
    notifyError,
    notifyNewOrder,
    notifyPaymentConfirmed,
    notifyWhatsAppMessage,
} from "@/lib/discord"
import { afterEach } from "vitest"

describe("lib/discord coverage", () => {
    const originalWebhook = process.env.DISCORD_WEBHOOK_URL

    beforeEach(() => {
        process.env.DISCORD_WEBHOOK_URL =
            process.env.DISCORD_WEBHOOK_URL || "https://example.com/webhook"
        // @ts-ignore
        global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    })

    afterEach(() => {
        process.env.DISCORD_WEBHOOK_URL = originalWebhook
        vi.restoreAllMocks()
    })

    it("sends new order notifications (with and without whatsapp)", async () => {
        await notifyNewOrder({
            trackingCode: "T-1",
            serviceType: "Service A",
            amount: 123.45,
            paymentMethod: "pix",
            whatsappNumber: "+55 11 99999-9999",
        })

        await notifyNewOrder({
            trackingCode: "T-2",
            serviceType: "Service B",
            amount: 10,
            paymentMethod: "monero",
        } as any)

        expect(global.fetch).toHaveBeenCalled()
    })

    it("sends payment confirmed notifications (with and without tx hash)", async () => {
        await notifyPaymentConfirmed({
            trackingCode: "T-3",
            serviceType: "Service C",
            amount: 999.99,
            paymentMethod: "pix",
            txHash: "a".repeat(64),
        })

        await notifyPaymentConfirmed({
            trackingCode: "T-4",
            serviceType: "Service D",
            amount: 1,
            paymentMethod: "monero",
        } as any)

        expect(global.fetch).toHaveBeenCalled()
    })

    it("sends whatsapp message notifications (long message truncated)", async () => {
        const longMessage = "x".repeat(150)
        await notifyWhatsAppMessage({
            from: "+55 21 90000-0000",
            message: longMessage,
            action: "test",
        })
        expect(global.fetch).toHaveBeenCalled()
    })

    it("sends error notifications (with and without details)", async () => {
        await notifyError({ type: "TypeA", message: "m" })
        await notifyError({
            type: "TypeB",
            message: "m2",
            details: "d".repeat(600),
        })
        expect(global.fetch).toHaveBeenCalled()
    })

    it("logs error when response is not ok", async () => {
        // @ts-ignore
        global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 })
        const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
        await notifyError({ type: "X", message: "Y" })
        expect(errSpy).toHaveBeenCalled()
        errSpy.mockRestore()
    })

    it("logs error when fetch throws", async () => {
        // @ts-ignore
        global.fetch = vi.fn().mockRejectedValue(new Error("net"))
        const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
        await notifyError({ type: "Z", message: "W" })
        expect(errSpy).toHaveBeenCalled()
        errSpy.mockRestore()
    })
})
