import { describe, expect, it, vi } from "vitest"

import {
    convertBrlToXmr,
    generateMoneroPayment,
    isValidMoneroAddress,
    isValidMoneroTxHash,
} from "@/lib/monero"

describe("lib/monero branches", () => {
    it("validates hash and address", () => {
        expect(isValidMoneroTxHash("a".repeat(64))).toBe(true)
        expect(isValidMoneroTxHash("z".repeat(64))).toBe(false)
        // Simplistic address format test
        expect(isValidMoneroAddress("4" + "A".repeat(94))).toBe(true)
        expect(isValidMoneroAddress("1" + "A".repeat(94))).toBe(false)
    })

    it("generates payment data", () => {
        const info = generateMoneroPayment({ amount: 1.23, orderId: "ABC" })
        expect(info.address).toBeTruthy()
        expect(info.paymentUri).toContain("monero:")
        expect(info.viewKey.endsWith("...")).toBe(true)
    })

    it("converts BRL to XMR with fallback when API fails", async () => {
        const mock = vi
            // @ts-ignore
            .spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({ ok: false } as any)
        const xmr = await convertBrlToXmr(800)
        expect(xmr).toBeCloseTo(1)
        mock.mockRestore()
    })

    it("converts BRL to XMR using CoinGecko response", async () => {
        const mock = vi
            // @ts-ignore
            .spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ monero: { brl: 1000 } }),
            } as any)
        const xmr = await convertBrlToXmr(500)
        expect(xmr).toBeCloseTo(0.5)
        mock.mockRestore()
    })

    it("falls back when API returns ok but missing price field", async () => {
        const mock = vi
            // @ts-ignore
            .spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as any)
        const xmr = await convertBrlToXmr(800)
        expect(xmr).toBeCloseTo(1)
        mock.mockRestore()
    })
})
