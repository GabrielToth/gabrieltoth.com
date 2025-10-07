import { beforeEach, describe, expect, it, vi } from "vitest"

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
    notifyContactMessage: vi.fn(async () => {}),
}))

describe("api/contact route branches", () => {
    beforeEach(() => {
        vi.unstubAllEnvs()
        vi.restoreAllMocks()
    })

    it("returns 400 for invalid email", async () => {
        const mod = await import("@/app/api/contact/route")
        const req = new Request("http://localhost/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                name: "John",
                email: "invalid",
                subject: "Hi",
                message: "msg",
                locale: "en",
            }),
        }) as any
        const res = await mod.POST(req)
        expect(res.status).toBe(400)
    })

    it("returns 400 for spam content", async () => {
        const mod = await import("@/app/api/contact/route")
        const req = new Request("http://localhost/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                name: "John",
                email: "john@example.com",
                subject: "viagra offer",
                message: "cheap pills",
                locale: "en",
            }),
        }) as any
        const res = await mod.POST(req)
        expect(res.status).toBe(400)
    })

    it("returns 400 when turnstile fails", async () => {
        vi.stubEnv("TURNSTILE_SECRET_KEY", "s")
        // mock fetch used by turnstile verification
        const fetchSpy = vi
            // @ts-ignore
            .spyOn(globalThis, "fetch")
            .mockResolvedValueOnce({
                json: async () => ({ success: false }),
            } as any)
        const mod = await import("@/app/api/contact/route")
        const form = new FormData()
        form.set("name", "John")
        form.set("email", "john@example.com")
        form.set("subject", "Hi")
        form.set("message", "msg")
        form.set("locale", "en")
        form.set("cf-turnstile-response", "bad")
        const req = new Request("http://localhost/api/contact", {
            method: "POST",
            body: form as any,
        }) as any
        const res = await mod.POST(req)
        expect(res.status).toBe(400)
        fetchSpy.mockRestore()
    })

    it("returns 200 success when resend not configured", async () => {
        const mod = await import("@/app/api/contact/route")
        const req = new Request("http://localhost/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                name: "John",
                email: "john@example.com",
                subject: "Hello",
                message: "Test message",
                locale: "en",
            }),
        }) as any
        const res = await mod.POST(req)
        expect(res.status).toBe(200)
    })

    it("returns 405 for GET/PUT/DELETE methods", async () => {
        const mod = await import("@/app/api/contact/route")
        const get = await mod.GET()
        const put = await mod.PUT()
        const del = await mod.DELETE()
        expect(get.status).toBe(405)
        expect(put.status).toBe(405)
        expect(del.status).toBe(405)
    })

    it("returns 403 when firewall blocks request", async () => {
        vi.resetModules()
        vi.doMock("@/lib/firewall", () => ({
            basicFirewall: vi.fn(() => ({ ok: false, reason: "BLOCK" })),
            getClientIp: vi.fn(() => "127.0.0.1"),
        }))
        const mod = await import("@/app/api/contact/route")
        const req = new Request("http://localhost/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                name: "John",
                email: "john@example.com",
                subject: "Hello",
                message: "Test",
                locale: "en",
            }),
        }) as any
        const res = await mod.POST(req)
        expect(res.status).toBe(403)
    })

    it("returns 429 when in-memory rate limit is exceeded", async () => {
        vi.resetModules()
        // Ensure firewall allows
        vi.doMock("@/lib/firewall", () => ({
            basicFirewall: vi.fn(() => ({ ok: true })),
            getClientIp: vi.fn(() => "127.0.0.1"),
        }))
        const mod = await import("@/app/api/contact/route")
        const factory = () =>
            new Request("http://localhost/api/contact", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name: "John",
                    email: "john@example.com",
                    subject: "Hello",
                    message: "Test",
                    locale: "en",
                }),
            }) as any
        for (let i = 0; i < 5; i++) {
            const okRes = await mod.POST(factory())
            expect(okRes.status).toBe(200)
        }
        const blocked = await mod.POST(factory())
        expect(blocked.status).toBe(429)
    })

    it("returns 200 with Resend configured (mocked)", async () => {
        vi.resetModules()
        vi.stubEnv("RESEND_API_KEY", "x")
        vi.doMock("resend", () => ({
            Resend: class {
                emails = { send: async () => ({ data: { id: "1" } }) }
            },
        }))
        // Ensure firewall allows
        vi.doMock("@/lib/firewall", () => ({
            basicFirewall: vi.fn(() => ({ ok: true })),
            getClientIp: vi.fn(() => "127.0.0.1"),
        }))
        const mod = await import("@/app/api/contact/route")
        const req = new Request("http://localhost/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                name: "John",
                email: "john@example.com",
                subject: "Hello",
                message: "Test message",
                locale: "en",
            }),
        }) as any
        const res = await mod.POST(req)
        expect(res.status).toBe(200)
    })
})
