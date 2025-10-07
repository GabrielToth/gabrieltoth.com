import { describe, expect, it } from "vitest"

describe("lib/firewall coverage", () => {
    it("getClientIp parses x-forwarded-for and x-real-ip", async () => {
        const { getClientIp } = await import("@/lib/firewall")
        const req: any = {
            headers: {
                get: (k: string) =>
                    k === "x-forwarded-for" ? "1.1.1.1, 2.2.2.2" : "",
            },
        }
        expect(getClientIp(req)).toBe("1.1.1.1")

        const req2: any = {
            headers: {
                get: (k: string) => (k === "x-real-ip" ? "9.9.9.9" : ""),
            },
        }
        expect(getClientIp(req2)).toBe("9.9.9.9")
    })

    it("basicFirewall blocks empty UA and payload too large, allows allowed hosts in prod", async () => {
        const { basicFirewall } = await import("@/lib/firewall")

        const makeReq = (h: Record<string, string>) =>
            ({
                headers: { get: (k: string) => (h as any)[k] || "" },
            }) as any

        // Empty UA
        let res = basicFirewall(makeReq({ "user-agent": "" }), ["https://a"])
        expect(res.ok).toBe(false)

        // Production origin check
        const old = process.env.NODE_ENV
        process.env.NODE_ENV = "production"
        res = basicFirewall(
            makeReq({
                "user-agent": "UA",
                origin: "https://a",
                referer: "",
                "content-length": "0",
            }),
            ["https://a"]
        )
        expect(res.ok).toBe(true)

        // Invalid origin
        res = basicFirewall(
            makeReq({
                "user-agent": "UA",
                origin: "https://b",
                referer: "https://c",
                "content-length": "0",
            }),
            ["https://a"]
        )
        expect(res.ok).toBe(false)

        // Payload too large
        res = basicFirewall(
            makeReq({
                "user-agent": "UA",
                origin: "https://a",
                "content-length": String(3 * 1024 * 1024),
            }),
            ["https://a"]
        )
        expect(res.ok).toBe(false)
        process.env.NODE_ENV = old
    })
})
