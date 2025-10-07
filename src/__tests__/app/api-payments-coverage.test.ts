import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/monero", async () => {
    const actual = await vi.importActual<any>("@/lib/monero")
    return {
        ...actual,
        convertBrlToXmr: vi.fn(async (amount: number) => amount / 800),
        generateMoneroPayment: vi.fn((req: any) => ({
            address: "address",
            amount: req.amount,
            paymentUri: "uri",
            qrCode: "uri",
            orderId: req.orderId,
        })),
        isValidMoneroTxHash: vi.fn((h: string) => /^[a-fA-F0-9]{64}$/.test(h)),
        verifyMoneroTransaction: vi.fn(async () => ({
            isValid: true,
            amount: 0.1,
            confirmations: 12,
        })),
        getMoneroTransactionStatus: vi.fn(async () => ({
            status: "confirmed",
            confirmations: 12,
            requiredConfirmations: 10,
        })),
    }
})

vi.mock("@/lib/pix", () => ({
    generatePixQR: vi.fn(async (o: any) => ({
        qrCode: "qr",
        copyPasteCode: "pixcode",
        pixKey: "key",
        amount: o.amount,
    })),
    generateTrackingCode: vi.fn(() => "TRACK-TEST"),
}))

vi.mock("@/lib/db", () => ({
    db: {
        createOrder: vi.fn(async (o: any) => ({
            id: "1",
            tracking_code: o.tracking_code,
            service_type: o.service_type,
            amount: o.amount,
            status: o.status,
            payment_method: o.payment_method,
            whatsapp_number: o.whatsapp_number,
            created_at: new Date().toISOString(),
            expires_at: new Date().toISOString(),
        })),
        getOrderByTrackingCode: vi.fn(async (code: string) => ({
            id: "1",
            tracking_code: code,
            service_type: "svc",
            amount: 100,
            status: "pending",
            payment_method: code.includes("PIX") ? "pix" : "monero",
            created_at: new Date().toISOString(),
            expires_at: new Date().toISOString(),
        })),
        getOrdersByWhatsApp: vi.fn(async () => []),
        updateOrderStatus: vi.fn(async (_id: string, status: string) => ({
            id: "1",
            tracking_code: "TRACK-TEST",
            service_type: "svc",
            amount: 100,
            status,
        })),
        addPaymentConfirmation: vi.fn(async () => ({})),
        getOrderByTxHash: vi.fn(async () => null),
    },
}))

vi.stubGlobal(
    "fetch",
    vi.fn(
        async () =>
            ({ ok: true, json: async () => ({}), text: async () => "" }) as any
    ) as any
)

describe("api payments routes coverage", () => {
    beforeEach(() => {
        ;(fetch as any).mockClear?.()
    })

    it("monero create POST returns payload", async () => {
        const { POST } = await import("@/app/api/payments/monero/create/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                serviceType: "svc",
                amount: 100,
                whatsappNumber: "5599",
            }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(200)
    })

    it("monero create GET requires trackingCode", async () => {
        const { GET } = await import("@/app/api/payments/monero/create/route")
        const url = new URL("http://localhost?trackingCode=TRACK-TEST")
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(200)
    })

    it("pix create POST returns payload", async () => {
        const { POST } = await import("@/app/api/payments/pix/create/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                serviceType: "svc",
                amount: 100,
                whatsappNumber: "5599",
            }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(200)
    })

    it("pix create GET requires trackingCode", async () => {
        const { GET } = await import("@/app/api/payments/pix/create/route")
        const url = new URL("http://localhost?trackingCode=TRACK-TEST-PIX")
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(200)
    })
})
