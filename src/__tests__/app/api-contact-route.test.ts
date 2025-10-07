import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/rate-limit", () => ({
    buildClientKey: vi.fn(() => "key"),
    rateLimitByKey: vi.fn(async () => ({ success: true })),
}))

vi.mock("@/lib/firewall", () => ({
    basicFirewall: vi.fn(() => ({ ok: true })),
    getClientIp: vi.fn(() => "127.0.0.1"),
}))

vi.mock("@/lib/discord", () => ({
    notifyError: vi.fn(async () => {}),
}))

describe("api/contact route", () => {
    it("rejects missing fields with 400", async () => {
        const mod = await import("@/app/api/contact/route")
        const req = new Request("http://localhost/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                name: "",
                email: "",
                subject: "",
                message: "",
                locale: "en",
            }),
        }) as any
        const res = await mod.POST(req)
        expect(res.status).toBe(400)
    })
})
