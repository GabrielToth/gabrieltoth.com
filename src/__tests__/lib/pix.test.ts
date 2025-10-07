import {
    generateServicePixQR,
    generateTrackingCode,
    validatePixPayment,
} from "@/lib/pix"
import { describe, expect, it, vi } from "vitest"

vi.mock("qrcode", () => ({
    default: {
        toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
    },
}))

describe("lib/pix", () => {
    it("generateTrackingCode returns TRACK- segments", () => {
        const code = generateTrackingCode()
        expect(code.startsWith("TRACK-")).toBe(true)
        expect(code.split("-").length).toBe(4)
    })

    it("validatePixPayment true for valid data", () => {
        expect(
            validatePixPayment({
                orderId: "X",
                amount: 10,
                dateTime: new Date().toISOString(),
            })
        ).toBe(true)
    })

    it("generateServicePixQR returns QR with data", async () => {
        const res = await generateServicePixQR("Service", 100)
        expect(res.qrCode.startsWith("data:image/")).toBe(true)
        expect(res.amount).toBe(100)
        expect(res.orderId).toBeTruthy()
    })
})
