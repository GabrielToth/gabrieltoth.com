import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

/**
 * Security tests for /api/byo/channels.
 *
 * This endpoint accepts a user-supplied access token, so it MUST:
 *  - require an authenticated site session,
 *  - rate limit per user,
 *  - validate the body,
 *  - never echo the token back.
 */

const mockGetServerSession = vi.fn()
const mockResolve = vi.fn()

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}))

vi.mock("@/lib/byo/channel-resolver", () => ({
    resolveChannelsForToken: (...args: unknown[]) => mockResolve(...args),
}))

let rateLimitCalls = 0
vi.mock("@/lib/rate-limit", () => ({
    buildClientKey: vi.fn(() => "key"),
    rateLimitByKey: vi.fn(async () => {
        rateLimitCalls++
        return { success: rateLimitCalls <= 5 }
    }),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}))

function makeRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/byo/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

describe("POST /api/byo/channels", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        rateLimitCalls = 0
    })

    it("returns 401 without a session", async () => {
        mockGetServerSession.mockResolvedValue(null)
        const { POST } = await import("@/app/api/byo/channels/route")
        const res = await POST(
            makeRequest({ platform: "youtube", accessToken: "abcdefgh" })
        )
        expect(res.status).toBe(401)
    })

    it("rejects an unsupported platform (400)", async () => {
        mockGetServerSession.mockResolvedValue({ user: { id: "u1" } })
        const { POST } = await import("@/app/api/byo/channels/route")
        const res = await POST(
            makeRequest({
                platform: "invalid-platform",
                accessToken: "abcdefgh",
            })
        )
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.error).toBe("UNSUPPORTED_PLATFORM")
    })

    it("rejects a too-short token (400)", async () => {
        mockGetServerSession.mockResolvedValue({ user: { id: "u1" } })
        const { POST } = await import("@/app/api/byo/channels/route")
        const res = await POST(
            makeRequest({ platform: "youtube", accessToken: "short" })
        )
        expect(res.status).toBe(400)
    })

    it("returns resolved channels and never echoes the token", async () => {
        mockGetServerSession.mockResolvedValue({ user: { id: "u1" } })
        mockResolve.mockResolvedValue({
            platform: "youtube",
            ok: true,
            channels: [{ id: "UC1", name: "Canal" }],
        })
        const { POST } = await import("@/app/api/byo/channels/route")
        const res = await POST(
            makeRequest({
                platform: "youtube",
                accessToken: "my-secret-token-123",
            })
        )
        expect(res.status).toBe(200)
        const text = await res.text()
        expect(text).not.toContain("my-secret-token-123")
        const json = JSON.parse(text)
        expect(json.results[0].channels).toHaveLength(1)
    })

    it("supports batch platforms", async () => {
        mockGetServerSession.mockResolvedValue({ user: { id: "u1" } })
        mockResolve.mockResolvedValue({
            platform: "x",
            ok: true,
            channels: [],
        })
        const { POST } = await import("@/app/api/byo/channels/route")
        const res = await POST(
            makeRequest({
                platform: "youtube",
                platforms: ["youtube", "twitch", "kick"],
                accessToken: "batch-token-1",
            })
        )
        expect(res.status).toBe(200)
        expect(mockResolve).toHaveBeenCalledTimes(3)
    })

    it("rate limits after the threshold (429)", async () => {
        mockGetServerSession.mockResolvedValue({ user: { id: "u1" } })
        mockResolve.mockResolvedValue({ platform: "x", ok: true, channels: [] })
        const { POST } = await import("@/app/api/byo/channels/route")
        const body = { platform: "youtube", accessToken: "abcdefgh" }
        for (let i = 0; i < 5; i++) await POST(makeRequest(body))
        const res = await POST(makeRequest(body))
        expect(res.status).toBe(429)
    })
})
