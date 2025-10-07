import {
    convertBrlToXmr,
    generateMoneroPayment,
    isValidMoneroAddress,
    isValidMoneroTxHash,
} from "@/lib/monero"
import { describe, expect, it, vi } from "vitest"

describe("lib/monero", () => {
    it("validates tx hash and address formats", () => {
        expect(isValidMoneroTxHash("a".repeat(64))).toBe(true)
        expect(isValidMoneroTxHash("z".repeat(64))).toBe(false)
        expect(isValidMoneroAddress("4" + "A".repeat(94))).toBe(true)
        expect(isValidMoneroAddress("3" + "A".repeat(94))).toBe(false)
    })

    it("generates payment object with fields", () => {
        const res = generateMoneroPayment({ amount: 1.23, orderId: "ORDER" })
        expect(res.address).toBeTruthy()
        expect(res.paymentUri).toContain("monero:")
        expect(res.viewKey).toContain("...")
    })

    it("convertBrlToXmr falls back on error", async () => {
        // @ts-ignore
        global.fetch = vi.fn().mockRejectedValue(new Error("fail"))
        const spy = vi.spyOn(console, "error").mockImplementation(() => {})
        const val = await convertBrlToXmr(800)
        expect(val).toBeCloseTo(1)
        spy.mockRestore()
    })
})
