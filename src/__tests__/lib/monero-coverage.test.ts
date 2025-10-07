import { describe, expect, it, vi } from "vitest"

describe("lib/monero coverage smoke", () => {
    it("imports and exercises basic helpers without network", async () => {
        const mod = await import("@/lib/monero")

        expect(mod.isValidMoneroTxHash("a".repeat(64))).toBe(true)
        expect(mod.isValidMoneroTxHash("zz")).toBe(false)

        expect(mod.isValidMoneroAddress("4" + "A".repeat(94))).toBe(true)
        expect(mod.isValidMoneroAddress("1bad")).toBe(false)

        // Stub network to fail to reach fallback branch in convertBrlToXmr
        // @ts-ignore
        global.fetch = vi.fn().mockResolvedValue({ ok: false })
        const xmr = await mod.convertBrlToXmr(800)
        // With fallback 1 XMR = 800 BRL, expect ~1
        expect(xmr).toBeCloseTo(1, 2)

        // getMoneroTransactionStatus with failing detail fetch returns failed
        // @ts-ignore
        global.fetch = vi.fn().mockResolvedValue({ ok: false })
        const status = await mod.getMoneroTransactionStatus("a".repeat(64))
        expect(status.status === "failed" || status.status === "pending").toBe(
            true
        )
    })
})
