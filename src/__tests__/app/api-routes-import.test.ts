// @vitest-environment node
import { describe, expect, it, vi } from "vitest"

// Mock db module (in-memory) for imports
vi.mock("@/lib/db", () => ({
    db: {
        createOrder: async () => ({}),
        getOrderByTrackingCode: async () => ({}),
        getOrdersByWhatsApp: async () => [],
        updateOrderStatus: async () => ({}),
        addPaymentConfirmation: async () => ({}),
        cleanupExpiredOrders: async () => {},
        getOrderByTxHash: async () => null,
    },
}))

describe("app api routes import", () => {
    it("imports contact route handlers", async () => {
        const mod = await import("@/app/api/contact/route")
        expect(mod).toBeTruthy()
    })
    it("imports payments/monero routes", async () => {
        const mods = await Promise.all([
            import("@/app/api/payments/monero/create/route"),
            import("@/app/api/payments/monero/verify/route"),
        ])
        expect(mods.length).toBe(2)
    })
    it("imports payments/pix route", async () => {
        const mod = await import("@/app/api/payments/pix/create/route")
        expect(mod).toBeTruthy()
    })
    it("imports whatsapp webhook route", async () => {
        const mod = await import("@/app/api/whatsapp/webhook/route")
        expect(mod).toBeTruthy()
    })
})
