import { describe, expect, it, vi } from "vitest"

describe("lib/pix coverage", () => {
    it("generates PIX QR and validates payload structure", async () => {
        vi.mock("qrcode", () => ({
            __esModule: true,
            default: {
                toDataURL: vi
                    .fn()
                    .mockResolvedValue("data:image/png;base64,AAA"),
            },
        }))

        const mod = await import("@/lib/pix")
        const res = await mod.generatePixQR({
            amount: 123.45,
            description: "Test",
            orderId: "ORDER123",
            pixKey: "test@pix.key",
        })
        expect(res.qrCode).toMatch(/^data:image\/png/)
        expect(res.copyPasteCode.includes("BR.GOV.BCB.PIX")).toBe(true)
        expect(res.copyPasteCode.includes("ORDER123".substring(0, 25))).toBe(
            true
        )
        vi.resetModules()
    })

    it("generateServicePixQR returns PIX payload for service", async () => {
        vi.mock("qrcode", () => ({
            __esModule: true,
            default: {
                toDataURL: vi
                    .fn()
                    .mockResolvedValue("data:image/png;base64,AAA"),
            },
        }))
        const mod = await import("@/lib/pix")
        const res = await mod.generateServicePixQR("service", 10)
        expect(res.qrCode).toMatch(/^data:image\/png/)
        expect(res.copyPasteCode).toContain("BR.GOV.BCB.PIX")
        expect(res.amount).toBe(10)
        vi.resetModules()
    })

    it("validatePixPayment returns true for valid inputs", async () => {
        const mod = await import("@/lib/pix")
        const ok = mod.validatePixPayment({
            orderId: "X",
            amount: 1,
            dateTime: new Date().toISOString(),
        })
        expect(ok).toBe(true)
    })

    it("checkPixPaymentStatus returns one of statuses and maps fields", async () => {
        const mod = await import("@/lib/pix")
        const res = await mod.checkPixPaymentStatus("ORD")
        expect(["pending", "confirmed", "failed"]).toContain(res.status)
        expect(res.orderId).toBe("ORD")
    })
})
