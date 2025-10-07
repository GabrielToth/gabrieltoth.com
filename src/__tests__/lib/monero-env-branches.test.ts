import { describe, expect, it, vi } from "vitest"

describe("lib/monero env branches", () => {
    it("generates payment using fallback defaults when env is missing", async () => {
        const prevAddress = process.env.MONERO_ADDRESS
        const prevViewKey = process.env.MONERO_VIEW_KEY

        delete process.env.MONERO_ADDRESS
        delete process.env.MONERO_VIEW_KEY

        vi.resetModules()
        const mod = await import("@/lib/monero")
        const res = mod.generateMoneroPayment({
            amount: 1.11,
            orderId: "ORD-FALL",
        })

        expect(res.address).toBe("your_monero_address_here")
        expect(
            res.viewKey.startsWith("your_view_key_here".substring(0, 16))
        ).toBe(true)
        expect(res.viewKey.endsWith("...")).toBe(true)

        // Restore env
        if (prevAddress !== undefined) {
            process.env.MONERO_ADDRESS = prevAddress
        } else {
            delete process.env.MONERO_ADDRESS
        }
        if (prevViewKey !== undefined) {
            process.env.MONERO_VIEW_KEY = prevViewKey
        } else {
            delete process.env.MONERO_VIEW_KEY
        }
        vi.resetModules()
    })

    it("generates payment using provided env variables", async () => {
        const prevAddress = process.env.MONERO_ADDRESS
        const prevViewKey = process.env.MONERO_VIEW_KEY

        process.env.MONERO_ADDRESS = "4" + "B".repeat(94)
        process.env.MONERO_VIEW_KEY = "1234567890abcdef1234567890abcdef"

        vi.resetModules()
        const mod = await import("@/lib/monero")
        const res = mod.generateMoneroPayment({
            amount: 1.23,
            orderId: "ORD-ENV",
            description: "env desc",
        })

        expect(res.address).toBe(process.env.MONERO_ADDRESS)
        expect(
            res.viewKey.startsWith(process.env.MONERO_VIEW_KEY.substring(0, 16))
        ).toBe(true)
        expect(res.viewKey.endsWith("...")).toBe(true)
        expect(res.paymentUri).toContain(`monero:${process.env.MONERO_ADDRESS}`)
        expect(res.paymentUri).toContain("recipient_name=Gabriel Toth")
        expect(decodeURIComponent(res.paymentUri)).toContain(
            "tx_description=env desc"
        )

        // Restore env
        if (prevAddress !== undefined) {
            process.env.MONERO_ADDRESS = prevAddress
        } else {
            delete process.env.MONERO_ADDRESS
        }
        if (prevViewKey !== undefined) {
            process.env.MONERO_VIEW_KEY = prevViewKey
        } else {
            delete process.env.MONERO_VIEW_KEY
        }
        vi.resetModules()
    })
})
