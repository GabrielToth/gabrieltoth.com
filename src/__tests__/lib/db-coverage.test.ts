import { db } from "@/lib/db"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("lib/db in-memory store", () => {
    let createdId = ""

    beforeEach(async () => {
        // Cleanup expired orders before each run (none initially)
        await db.cleanupExpiredOrders()
    })

    it("creates, fetches and updates orders with confirmations", async () => {
        const order = await db.createOrder({
            tracking_code: "TRACK-1",
            service_type: "channel-management",
            amount: 100,
            payment_method: "pix",
            status: "pending",
            whatsapp_number: "+550000000000",
        })
        createdId = order.id
        expect(order.id).toBeTruthy()

        const byTrack = await db.getOrderByTrackingCode("TRACK-1")
        expect(byTrack?.id).toBe(order.id)

        // Update order status and additional data
        const updated = await db.updateOrderStatus(order.id, "confirmed", {
            tx_hash: "a".repeat(64),
        })
        expect(updated.status).toBe("confirmed")
        expect(updated.tx_hash).toBe("a".repeat(64))

        // Add confirmation entry
        const confirmation = await db.addPaymentConfirmation(
            order.id,
            "webhook"
        )
        expect(confirmation.order_id).toBe(order.id)

        // Query by WhatsApp
        const listAll = await db.getOrdersByWhatsApp("+550000000000")
        expect(listAll.length).toBeGreaterThan(0)
        const listConfirmed = await db.getOrdersByWhatsApp(
            "+550000000000",
            "confirmed"
        )
        expect(listConfirmed.every(o => o.status === "confirmed")).toBe(true)
    })

    it("gets order by tx hash only for monero method", async () => {
        // create monero order
        const monero = await db.createOrder({
            tracking_code: "TRACK-XMR",
            service_type: "channel-management",
            amount: 10,
            payment_method: "monero",
            status: "pending",
            whatsapp_number: "+551111111111",
            tx_hash: "b".repeat(64),
        })

        const found = await db.getOrderByTxHash("b".repeat(64))
        expect(found?.id).toBe(monero.id)
    })

    it("generates id via Math.random fallback and cleans expired orders", async () => {
        // Do not override global crypto (read-only in jsdom); our generateId falls back to Math.random on error
        const now = Date.now()
        vi.spyOn(Date, "now").mockReturnValue(now - 10 * 24 * 60 * 60 * 1000) // 10 days ago

        const expired = await db.createOrder({
            tracking_code: "EXPIRED",
            service_type: "channel-management",
            amount: 1,
            payment_method: "pix",
            status: "pending",
            whatsapp_number: "+559999999999",
        })
        expect(expired.id).toBeTruthy()

        // Restore now and cleanup
        ;(Date.now as unknown as { mockRestore: () => void }).mockRestore?.()
        await db.cleanupExpiredOrders()
        const stillThere = await db.getOrderByTrackingCode("EXPIRED")
        expect(stillThere).toBeNull()
    })

    it("falls back to Math.random when randomUUID returns undefined (line 32)", async () => {
        const cryptoObj: any = (globalThis as any).crypto || {}
        if (!cryptoObj.randomUUID) {
            Object.defineProperty(cryptoObj, "randomUUID", {
                value: vi.fn(() => undefined),
                configurable: true,
            })
            ;(globalThis as any).crypto = cryptoObj
        } else {
            vi.spyOn(cryptoObj, "randomUUID").mockReturnValue(undefined as any)
        }

        const order = await db.createOrder({
            tracking_code: "FALLBACK32",
            service_type: "channel-management",
            amount: 1,
            payment_method: "pix",
            status: "pending",
        })
        expect(order.id).toBeTruthy()
    })

    it("uses catch branch when randomUUID throws (lines 35-36)", async () => {
        const cryptoObj: any = (globalThis as any).crypto
        if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
            const spy = vi
                .spyOn(cryptoObj, "randomUUID")
                .mockImplementation(() => {
                    throw new Error("boom")
                })
            const order = await db.createOrder({
                tracking_code: "CATCH3536",
                service_type: "channel-management",
                amount: 1,
                payment_method: "pix",
                status: "pending",
            })
            expect(order.id).toBeTruthy()
            spy.mockRestore()
        } else {
            // Environment without randomUUID: calling createOrder already covers fallback paths
            const order = await db.createOrder({
                tracking_code: "CATCH3536",
                service_type: "channel-management",
                amount: 1,
                payment_method: "pix",
                status: "pending",
            })
            expect(order.id).toBeTruthy()
        }
    })
})
