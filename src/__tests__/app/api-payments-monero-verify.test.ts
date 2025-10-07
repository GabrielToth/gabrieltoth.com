import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/monero", async () => {
    const actual = await vi.importActual<any>("@/lib/monero")
    return {
        ...actual,
        convertBrlToXmr: vi.fn(async (amount: number) => amount / 800),
        isValidMoneroTxHash: vi.fn((h: string) => /^[a-fA-F0-9]{64}$/.test(h)),
        verifyMoneroTransaction: vi.fn(async () => ({
            isValid: true,
            amount: 1,
            confirmations: 12,
        })),
        getMoneroTransactionStatus: vi.fn(async () => ({
            status: "confirmed",
            confirmations: 12,
            requiredConfirmations: 10,
        })),
    }
})

vi.mock("@/lib/db", () => ({
    db: {
        getOrderByTrackingCode: vi.fn(async () => null),
        getOrdersByWhatsApp: vi.fn(async () => []),
        updateOrderStatus: vi.fn(async () => ({})),
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

describe("api payments monero verify route", () => {
    beforeEach(() => {
        ;(fetch as any).mockClear?.()
        ;(console as any).error = vi.fn()
    })

    it("POST returns 400 when txHash is invalid", async () => {
        const { POST } = await import("@/app/api/payments/monero/verify/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                txHash: "zz",
            }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it("POST returns 404 when order not found by trackingCode", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce(null)
        const { POST } = await import("@/app/api/payments/monero/verify/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                txHash: "a".repeat(64),
                trackingCode: "TRACK-1",
            }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(404)
    })

    it("POST returns 404 when order not found by whatsappNumber", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrdersByWhatsApp as any).mockResolvedValueOnce([])
        const { POST } = await import("@/app/api/payments/monero/verify/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                txHash: "a".repeat(64),
                whatsappNumber: "+5511999999999",
            }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(404)
    })

    it("POST returns 400 when payment method is not monero", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce({
            id: "1",
            tracking_code: "TRACK-2",
            service_type: "svc",
            amount: 100,
            status: "pending",
            payment_method: "pix",
        })
        const { POST } = await import("@/app/api/payments/monero/verify/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ txHash: "a".repeat(64), trackingCode: "X" }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it("POST returns 400 when order status is not pending", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce({
            id: "2",
            tracking_code: "TRACK-3",
            service_type: "svc",
            amount: 100,
            status: "confirmed",
            payment_method: "monero",
        })
        const { POST } = await import("@/app/api/payments/monero/verify/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ txHash: "a".repeat(64), trackingCode: "Y" }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(400)
    })

    it("POST success confirms payment and returns details", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce({
            id: "3",
            tracking_code: "TRACK-4",
            service_type: "svc",
            amount: 800,
            status: "pending",
            payment_method: "monero",
        })
        const { POST } = await import("@/app/api/payments/monero/verify/route")
        const res = await POST(
            new Request("http://localhost", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    txHash: "a".repeat(64),
                    trackingCode: "Y",
                }),
            }) as any
        )
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.verified).toBe(true)
        expect(body.order.status).toBe("confirmed")
    })

    it("POST verification failed resets to pending with confirmations", async () => {
        const supa = await import("@/lib/db")
        const monero = await import("@/lib/monero")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce({
            id: "4",
            tracking_code: "TRACK-5",
            service_type: "svc",
            amount: 800,
            status: "pending",
            payment_method: "monero",
        })
        ;(monero.verifyMoneroTransaction as any).mockResolvedValueOnce({
            isValid: false,
            confirmations: 3,
            error: "low confirmations",
        })
        const { POST } = await import("@/app/api/payments/monero/verify/route")
        const res = await POST(
            new Request("http://localhost", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    txHash: "a".repeat(64),
                    trackingCode: "Z",
                }),
            }) as any
        )
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(false)
        expect(body.retryInfo.canRetry).toBe(true)
        expect(body.retryInfo.waitTime).toBe(14)
    })

    it("POST verification failed resets to pending without confirmations", async () => {
        const supa = await import("@/lib/db")
        const monero = await import("@/lib/monero")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce({
            id: "5",
            tracking_code: "TRACK-6",
            service_type: "svc",
            amount: 800,
            status: "pending",
            payment_method: "monero",
        })
        ;(monero.verifyMoneroTransaction as any).mockResolvedValueOnce({
            isValid: false,
        })
        const { POST } = await import("@/app/api/payments/monero/verify/route")
        const res = await POST(
            new Request("http://localhost", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    txHash: "a".repeat(64),
                    trackingCode: "W",
                }),
            }) as any
        )
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(false)
        expect(body.retryInfo.waitTime).toBe(20)
    })

    it("POST handles unexpected error with 500", async () => {
        const { POST } = await import("@/app/api/payments/monero/verify/route")
        const badReq = {
            json: async () => {
                throw new Error("boom")
            },
        } as any
        const res = await POST(badReq)
        expect(res.status).toBe(500)
    })

    it("GET returns 400 when no params provided", async () => {
        const { GET } = await import("@/app/api/payments/monero/verify/route")
        const url = new URL("http://localhost")
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(400)
    })

    it("GET returns 404 when order not found by trackingCode", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce(null)
        const { GET } = await import("@/app/api/payments/monero/verify/route")
        const url = new URL("http://localhost?trackingCode=NOPE")
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(404)
    })

    it("GET returns success by trackingCode without transaction details", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce({
            id: "6",
            tracking_code: "TRACK-7",
            service_type: "svc",
            amount: 100,
            status: "pending",
            created_at: new Date().toISOString(),
            expires_at: new Date().toISOString(),
            payment_method: "monero",
            tx_hash: undefined,
        })
        const { GET } = await import("@/app/api/payments/monero/verify/route")
        const url = new URL("http://localhost?trackingCode=TRACK-7")
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.transaction).toBeNull()
    })

    it("GET returns success by txHash with transaction details", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTxHash as any).mockResolvedValueOnce({
            id: "7",
            tracking_code: "TRACK-8",
            service_type: "svc",
            amount: 100,
            status: "pending",
            created_at: new Date().toISOString(),
            tx_hash: "a".repeat(64),
            payment_method: "monero",
        })
        const { GET } = await import("@/app/api/payments/monero/verify/route")
        const url = new URL("http://localhost?txHash=" + "a".repeat(64))
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.transaction).toBeTruthy()
        expect(body.transaction.hash).toBe("a".repeat(64))
    })

    it("GET handles unexpected error with 500", async () => {
        const { GET } = await import("@/app/api/payments/monero/verify/route")
        const res = await GET({} as any)
        expect(res.status).toBe(500)
    })
})
