import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock db module used by webhook
vi.mock("@/lib/db", () => ({
    db: {
        getOrdersByWhatsApp: vi.fn(async () => []),
        updateOrderStatus: vi.fn(async () => {}),
        addPaymentConfirmation: vi.fn(async () => {}),
        getOrderByTrackingCode: vi.fn(async () => null),
    },
}))

// Mock monero verification
vi.mock("@/lib/monero", () => ({
    verifyMoneroTransaction: vi.fn(async () => ({ isValid: true })),
}))

describe("api/whatsapp/webhook coverage", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it("verifies webhook on GET", async () => {
        const { GET } = await import("@/app/api/whatsapp/webhook/route")
        const old = process.env.WHATSAPP_VERIFY_TOKEN
        process.env.WHATSAPP_VERIFY_TOKEN = "token"
        const url = new URL("http://x")
        url.searchParams.set("hub.mode", "subscribe")
        url.searchParams.set("hub.verify_token", "token")
        url.searchParams.set("hub.challenge", "123")
        const res = await GET({ nextUrl: url } as any)
        expect(await res.text()).toBe("123")
        process.env.WHATSAPP_VERIFY_TOKEN = old
    })

    it("processes POST with help/default paths", async () => {
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const res = await POST(
            new Request("http://x", {
                method: "POST",
                body: JSON.stringify({
                    entry: [
                        {
                            changes: [
                                {
                                    value: {
                                        messages: [
                                            {
                                                from: "5511999999999",
                                                text: { body: "help" },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    ],
                }),
            }) as any
        )
        expect(await res.text()).toBe("OK")
    })

    it("handles POST without messages gracefully", async () => {
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const res = await POST(
            new Request("http://x", {
                method: "POST",
                body: JSON.stringify({ entry: [{ changes: [{ value: {} }] }] }),
            }) as any
        )
        expect(await res.text()).toBe("OK")
    })
})

vi.mock("@/lib/db", () => ({
    db: {
        getOrdersByWhatsApp: vi.fn(async () => []),
        getOrderByTrackingCode: vi.fn(async () => null),
        updateOrderStatus: vi.fn(async () => ({})),
        addPaymentConfirmation: vi.fn(async () => ({})),
    },
}))

vi.mock("@/lib/monero", () => ({
    verifyMoneroTransaction: vi.fn(async () => ({ isValid: false })),
}))

describe("api whatsapp webhook coverage", () => {
    beforeEach(() => {
        ;(global as any).process = {
            env: { WHATSAPP_VERIFY_TOKEN: "token" },
        } as any
        ;(global as any).fetch = vi.fn(
            async () => ({ ok: true, json: async () => ({}) }) as any
        )
        ;(console as any).error = vi.fn()
    })

    it("GET verifies challenge when token matches", async () => {
        const { GET } = await import("@/app/api/whatsapp/webhook/route")
        const url = new URL(
            "http://localhost?hub.mode=subscribe&hub.verify_token=token&hub.challenge=123"
        )
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(200)
    })

    it("GET returns 403 when token mismatch or mode invalid", async () => {
        const { GET } = await import("@/app/api/whatsapp/webhook/route")
        const url = new URL(
            "http://localhost?hub.mode=wrong&hub.verify_token=token&hub.challenge=123"
        )
        const res = await GET({ nextUrl: url } as any)
        expect(res.status).toBe(403)
    })

    it("POST handles non-matching body gracefully", async () => {
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ entry: [{ changes: [{ value: {} }] }] }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(200)
    })

    it("POST processes monero tx hash (verification true)", async () => {
        const supa = await import("@/lib/db")
        const monero = await import("@/lib/monero")
        ;(supa.db.getOrdersByWhatsApp as any).mockResolvedValueOnce([
            {
                id: "1",
                tracking_code: "TRACK-1",
                service_type: "svc",
                amount: 100,
                status: "pending",
                payment_method: "monero",
            },
        ])
        ;(monero.verifyMoneroTransaction as any).mockResolvedValueOnce({
            isValid: true,
            confirmations: 12,
        })
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "+5511999999999",
                                            text: { body: "a".repeat(64) },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(200)
    })

    it("POST processes monero tx hash (verification false)", async () => {
        const supa = await import("@/lib/db")
        const monero = await import("@/lib/monero")
        ;(supa.db.getOrdersByWhatsApp as any).mockResolvedValueOnce([
            {
                id: "1",
                tracking_code: "TRACK-2",
                service_type: "svc",
                amount: 100,
                status: "pending",
                payment_method: "monero",
            },
        ])
        ;(monero.verifyMoneroTransaction as any).mockResolvedValueOnce({
            isValid: false,
            confirmations: 0,
        })
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "+5511999999999",
                                            text: { body: "b".repeat(64) },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(200)
    })

    it("POST tracking code not found and found branches", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce(null)
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        // Not found
        let req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "+5511999999999",
                                            text: { body: "TRACK-ABC" },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        let res = await POST(req)
        expect(res.status).toBe(200)

        // Found
        ;(supa.db.getOrderByTrackingCode as any).mockResolvedValueOnce({
            tracking_code: "TRACK-ABC",
            service_type: "svc",
            amount: 100,
            status: "pending",
            payment_method: "pix",
            created_at: new Date().toISOString(),
        })
        req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "+5511888888888",
                                            text: { body: "TRACK-ABC" },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        res = await POST(req)
        expect(res.status).toBe(200)
    })

    it("POST help and default branches call sendWhatsAppMessage", async () => {
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        // help
        let req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "2199",
                                            text: { body: "help" },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        let res = await POST(req)
        expect(res.status).toBe(200)

        // default
        req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "2199",
                                            text: { body: "unknown" },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        res = await POST(req)
        expect(res.status).toBe(200)
    })

    it("POST status branches: empty and with orders", async () => {
        const supa = await import("@/lib/db")
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        // empty list
        ;(supa.db.getOrdersByWhatsApp as any).mockResolvedValueOnce([])
        let req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "2199",
                                            text: { body: "status" },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        let res = await POST(req)
        expect(res.status).toBe(200)

        // with orders
        ;(supa.db.getOrdersByWhatsApp as any).mockResolvedValueOnce([
            {
                tracking_code: "T-1",
                service_type: "svc",
                amount: 10,
                status: "confirmed",
                created_at: new Date().toISOString(),
            },
        ])
        req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "2199",
                                            text: { body: "pedido" },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        res = await POST(req)
        expect(res.status).toBe(200)
    })

    it("POST handles internal error in processing with 200 response", async () => {
        const supa = await import("@/lib/db")
        ;(supa.db.getOrdersByWhatsApp as any).mockRejectedValueOnce(
            new Error("boom")
        )
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "2199",
                                            text: { body: "status" },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        const res = await POST(req)
        expect(res.status).toBe(200)
    })

    it("sendWhatsAppMessage fetch success and error branches", async () => {
        ;(global as any).process.env.WHATSAPP_PHONE_NUMBER_ID = "id"
        ;(global as any).process.env.WHATSAPP_ACCESS_TOKEN = "token"
        const { POST } = await import("@/app/api/whatsapp/webhook/route")

        // success branch
        ;(global as any).fetch = vi.fn(
            async () =>
                ({
                    ok: true,
                    json: async () => ({}),
                    text: async () => "",
                }) as any
        )
        let req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "2199",
                                            text: { body: "help" },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        let res = await POST(req)
        expect(res.status).toBe(200)

        // error branch
        ;(global as any).fetch = vi.fn(
            async () => ({ ok: false, text: async () => "err" }) as any
        )
        req = new Request("http://localhost", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messages: [
                                        {
                                            from: "2199",
                                            text: { body: "help" },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            }),
        }) as any
        res = await POST(req)
        expect(res.status).toBe(200)
    })
})
