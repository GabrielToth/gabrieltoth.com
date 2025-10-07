import { basicFirewall, getClientIp } from "@/lib/firewall"
import { describe, expect, it } from "vitest"

class MockHeaders {
    private map: Record<string, string> = {}
    constructor(init?: Record<string, string>) {
        this.map = init || {}
    }
    get(key: string) {
        return this.map[key] || null
    }
}

function makeReq(init: Record<string, string> = {}) {
    return { headers: new MockHeaders(init) } as any
}

describe("lib/firewall", () => {
    it("getClientIp prefers x-forwarded-for then x-real-ip then localhost", () => {
        expect(
            getClientIp(makeReq({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))
        ).toBe("1.1.1.1")
        expect(getClientIp(makeReq({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3")
        expect(getClientIp(makeReq({}))).toBe("127.0.0.1")
    })

    it("basicFirewall allows in dev and checks origin in prod", () => {
        const originalNodeEnv = process.env.NODE_ENV
        process.env.NODE_ENV = "development"
        expect(
            basicFirewall(makeReq({ "user-agent": "ua" }), ["https://ok.com"])
                .ok
        ).toBe(true)

        process.env.NODE_ENV = "production"
        // Localhost referer allowed
        expect(
            basicFirewall(
                makeReq({
                    "user-agent": "ua",
                    referer: "http://localhost:3000/",
                }),
                ["https://ok.com"]
            ).ok
        ).toBe(true)
        // Invalid origin blocked
        expect(
            basicFirewall(
                makeReq({ "user-agent": "ua", origin: "https://evil.com" }),
                ["https://ok.com"]
            ).ok
        ).toBe(false)

        process.env.NODE_ENV = originalNodeEnv
    })
})
