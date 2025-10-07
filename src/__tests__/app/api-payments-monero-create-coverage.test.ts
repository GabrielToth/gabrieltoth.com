import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/monero", () => ({
    convertBrlToXmr: vi.fn(async (amount: number) => amount / 800),
    generateMoneroPayment: vi.fn((req: any) => ({
        address: "address",
        amount: req.amount,
        paymentUri: "uri",
        qrCode: "qr",
        orderId: req.orderId,
    })),
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
            created_at: new Date().toISOString(),
            expires_at: new Date().toISOString(),
        })),
        getOrderByTrackingCode: vi.fn(async (code: string) => ({
            id: "1",
            tracking_code: code,
            service_type: "svc",
            amount: 100,
            status: "pending",
            payment_method: "monero",
            created_at: new Date().toISOString(),
            expires_at: new Date().toISOString(),
        })),
    },
}))

describe("api payments monero/create coverage", () => {
    beforeEach(() => {
        ;(console as any).error = vi.fn()
    })

    it("POST returns 400 when missing fields", async () => {
        const { POST } = await import("@/app/api/payments/monero/create/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ serviceType: "", amount: 0 }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it("POST returns 500 when conversion throws", async () => {
        const monero = await import("@/lib/monero")
        ;(monero.convertBrlToXmr as any).mockRejectedValueOnce(
            new Error("fail")
        )
        const { POST } = await import("@/app/api/payments/monero/create/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ serviceType: "svc", amount: 100 }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(500)
    })

    it("GET returns 400 when trackingCode missing", async () => {
        const { GET } = await import("@/app/api/payments/monero/create/route")
        const url = new URL("http://localhost")
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(400)
    })

    it("GET returns 404 when order not found", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce(null)
        const { GET } = await import("@/app/api/payments/monero/create/route")
        const url = new URL("http://localhost?trackingCode=NOPE")
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(404)
    })

    it("GET returns 400 when order is not monero", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce({
            tracking_code: "TRACK-PIX",
            service_type: "svc",
            amount: 100,
            status: "pending",
            payment_method: "pix",
            created_at: new Date().toISOString(),
            expires_at: new Date().toISOString(),
        })
        const { GET } = await import("@/app/api/payments/monero/create/route")
        const url = new URL("http://localhost?trackingCode=TRACK-PIX")
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(400)
    })
})
