import { describe, expect, it, vi } from "vitest"

async function importRate() {
    return await import("@/lib/rate-limit")
}

describe("lib/rate-limit", () => {
    it("allows by default when env missing", async () => {
        const rate = await importRate()
        const res = await rate.rateLimitByKey("k")
        expect(res.success).toBe(true)
        expect(res.limit).toBeGreaterThan(1000)
    })

    it("buildClientKey builds stable composite key", async () => {
        const rate = await importRate()
        const key = rate.buildClientKey({
            ip: "1.1.1.1",
            path: "/x",
            userAgent: undefined,
            sessionId: null,
        })
        expect(key).toContain("1.1.1.1:/x:unknown:anon")
    })

    it("uses configured ratelimiter when env present", async () => {
        vi.resetModules()
        process.env.UPSTASH_REDIS_REST_URL = "u"
        process.env.UPSTASH_REDIS_REST_TOKEN = "t"
        vi.doMock("@upstash/redis", () => ({
            Redis: vi.fn().mockImplementation(() => ({})),
        }))
        class RL {
            static slidingWindow() {
                return {} as any
            }
            constructor(_: any) {}
            async limit(_: string) {
                return {
                    success: false,
                    limit: 5,
                    remaining: 4,
                    reset: Date.now() + 1000,
                } as any
            }
        }
        vi.doMock("@upstash/ratelimit", () => ({ Ratelimit: RL }))

        const rate = await import("@/lib/rate-limit")
        const out = await rate.rateLimitByKey("key-1")
        expect(out.success).toBe(false)
        expect(out.limit).toBe(5)
    })

    it("falls back to allow when ratelimiter construction fails", async () => {
        vi.resetModules()
        process.env.UPSTASH_REDIS_REST_URL = "u"
        process.env.UPSTASH_REDIS_REST_TOKEN = "t"
        vi.doMock("@upstash/redis", () => ({
            Redis: vi.fn().mockImplementation(() => {
                throw new Error("boom")
            }),
        }))
        vi.doMock("@upstash/ratelimit", () => ({
            Ratelimit: class {},
        }))
        const rate = await import("@/lib/rate-limit")
        const res = await rate.rateLimitByKey("k2")
        expect(res.success).toBe(true)
    })
})

import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"

describe("lib/rate-limit", () => {
    it("buildClientKey concatenates fields", () => {
        const key = buildClientKey({
            ip: "1.1.1.1",
            path: "/api",
            userAgent: "UA",
            sessionId: "SID",
        })
        expect(key).toContain("1.1.1.1:/api:UA:SID")
    })

    it("rateLimitByKey allows by default without env", async () => {
        const res = await rateLimitByKey("test")
        expect(res.success).toBe(true)
        expect(res.limit).toBeGreaterThan(0)
    })
})
