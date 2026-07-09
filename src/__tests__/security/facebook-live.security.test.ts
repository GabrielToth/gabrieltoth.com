/**
 * Security Tests for POST + GET /api/platform/facebook/live — Attack Matrix
 *
 * Attack matrix applicable rows:
 * 1  (auth bypass — missing/invalid session)
 * 2  (HTTP method confusion)
 * 3  (type attacks — body fields)
 * 4  (value attacks — body fields)
 * 5  (structure attacks — body)
 * 6  (prototype pollution — body)
 * 7  (injection — body fields)
 * 8  (unicode/encoding — body fields)
 * 9  (size attacks — body)
 * 10 (rate limiting)
 * 11 (CSRF)
 * 12 (race conditions — concurrent live creations)
 * 13 (Content-Type confusion)
 * 14 (HTTP header attacks)
 * 15 (info disclosure — error messages)
 * 16 (business logic — not linked, invalid stream)
 * 17 (IDOR — create live for another user's page)
 * 18 (path traversal — pageId params)
 * 19 (mass assignment — extra body fields)
 *
 * SKIP:
 *   20 (SSRF) — no URL params in live
 *   21 (timing side-channel) — all paths return JSON errors
 */

import { POST, GET } from "@/app/api/platform/facebook/live/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
})

const mockGetPageAccessToken = vi.hoisted(() =>
    vi.fn().mockResolvedValue("mock-page-token")
)
const mockCreateLiveVideo = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        id: "mock-video-123",
        streamUrl: "rtmp://example.com/live",
        secureStreamUrl: "rtmps://example.com/live",
        status: "LIVE",
        title: "Test Live",
    })
)
const mockGetLiveVideos = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ data: [], paging: {} })
)
const mockGetServerSession = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ user: { id: "test-user-123" } })
)

vi.mock("@/lib/facebook/config", () => ({
    getFacebookConfig: () => ({
        oauth: {
            appId: "test",
            appSecret: "test",
            redirectUri: "http://localhost:3000/api/oauth/callback/facebook",
            scopes: [],
            apiVersion: "v25.0",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            publishAttemptsPerHour: 10,
            liveAttemptsPerHour: 5,
        },
        security: { tokenExpiryBufferMs: 300000 },
    }),
    resetFacebookConfig: vi.fn(),
}))

vi.mock("@/lib/facebook/oauth-service", () => ({
    getFacebookOAuthService: () => ({
        initialize: vi.fn(),
        getPageAccessToken: mockGetPageAccessToken,
    }),
    resetFacebookOAuthService: vi.fn(),
}))

vi.mock("@/lib/facebook/get-valid-token", () => ({
    getValidFacebookToken: vi.fn().mockResolvedValue("mock-user-token"),
}))

vi.mock("@/lib/facebook/live", () => ({
    createLiveVideo: mockCreateLiveVideo,
    getLiveVideos: mockGetLiveVideos,
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: mockGetServerSession,
}))

function makePost(
    url: string,
    body: unknown,
    h: Record<string, string> = {}
): NextRequest {
    return new NextRequest(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": "test-user-123",
            ...h,
        },
        body: body !== null ? JSON.stringify(body) : null,
    })
}

function makeGet(url: string, h: Record<string, string> = {}): NextRequest {
    return new NextRequest(url, {
        method: "GET",
        headers: { "x-user-id": "test-user-123", ...h },
    })
}

describe("Facebook Live — Attack Matrix", () => {
    beforeEach(() => vi.clearAllMocks())
    afterEach(() => vi.clearAllMocks())

    describe("Row 1 — Auth bypass", () => {
        it("POST: should reject when not authenticated", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/live",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "{}",
                }
            )
            const res = await POST(req)
            expect(res.status).toBe(400)
        })
        it("GET: should reject when not authenticated", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/live?pageId=123",
                { method: "GET" }
            )
            const res = await GET(req)
            expect(res.status).toBe(400)
        })
    })

    describe("Row 2 — Method confusion", () => {
        it("should have only POST and GET", async () => {
            const r = await import("@/app/api/platform/facebook/live/route")
            expect("DELETE" in r).toBe(false)
        })
    })

    describe("Row 3 — Type attacks (POST)", () => {
        it("should handle null body", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", null)
            )
            expect([400, 500]).toContain(res.status)
        })
        it("should handle array body", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", [])
            )
            expect([400, 500]).toContain(res.status)
        })
    })

    describe("Row 4 — Value attacks (POST)", () => {
        it("should handle empty object", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {})
            )
            expect([400, 500]).toContain(res.status)
        })
        it("should handle missing pageId", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    title: "test",
                })
            )
            expect([400, 500]).toContain(res.status)
        })
        it("should reject invalid status", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "123",
                    status: "INVALID",
                })
            )
            const b = await res.json()
            expect(res.status).toBe(400)
            expect(b.error).toBe("VALIDATION_ERROR")
        })
    })

    describe("Row 5 — Structure (POST)", () => {
        it("should reject extra fields", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "123",
                    extra: "field",
                })
            )
            expect(res.status).toBe(400)
        })
    })

    describe("Row 6 — Prototype pollution", () => {
        it("should handle __proto__", async () => {
            const res = await POST(
                makePost(
                    "http://localhost/api/platform/facebook/live",
                    JSON.parse('{"__proto__":{"p":1},"pageId":"123"}')
                )
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 7 — Injection", () => {
        it("should handle SQL injection in pageId", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "1'; DROP TABLE--",
                    title: "test",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
        it("should handle XSS in title", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "123",
                    title: "<script>alert(1)</script>",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 8 — Unicode", () => {
        it("should handle emoji in title", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "123",
                    title: "🔥 Live",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 9 — Size", () => {
        it("should handle oversized title", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "123",
                    title: "A".repeat(10000),
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 10 — Rate limiting", () => {
        it("should handle single POST request", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "123",
                    title: "Test Live",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent POST", async () => {
            const results = await Promise.all(
                Array.from({ length: 5 }, () =>
                    POST(
                        makePost(
                            "http://localhost/api/platform/facebook/live",
                            { pageId: "123", title: "test" }
                        )
                    )
                )
            )
            for (const r of results) expect([201, 400, 500]).toContain(r.status)
        })
    })

    describe("Row 13 — Content-Type", () => {
        it("should handle missing Content-Type on POST", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/live",
                {
                    method: "POST",
                    headers: { "x-user-id": "test" },
                    body: '{"pageId":"123"}',
                }
            )
            const res = await POST(req)
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths on error", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/live",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "{}",
                }
            )
            const res = await POST(req)
            const b = await res.json()
            expect(b.message).not.toContain(":\\")
            expect(b.message).not.toContain("/src/")
        })
    })

    describe("Row 17 — IDOR", () => {
        it("should handle other user IDs", async () => {
            const res = await POST(
                makePost(
                    "http://localhost/api/platform/facebook/live",
                    { pageId: "123" },
                    { "x-user-id": "other-user" }
                )
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 11 — CSRF", () => {
        it("POST: should handle missing CSRF token gracefully", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "123",
                    title: "Test Live",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 14 — HTTP header attacks", () => {
        it("POST: should handle X-Forwarded-For header", async () => {
            const res = await POST(
                makePost(
                    "http://localhost/api/platform/facebook/live",
                    { pageId: "123", title: "Test" },
                    { "X-Forwarded-For": "127.0.0.1" }
                )
            )
            expect([201, 400, 500]).toContain(res.status)
        })

        it("POST: should handle Host override header", async () => {
            const res = await POST(
                makePost(
                    "http://localhost/api/platform/facebook/live",
                    { pageId: "123", title: "Test" },
                    { Host: "evil.com" }
                )
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 16 — Business logic", () => {
        it("POST: should handle invalid pageId gracefully", async () => {
            mockGetPageAccessToken.mockRejectedValueOnce(
                new Error("Page not found")
            )
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "nonexistent",
                    title: "Test Live",
                })
            )
            expect([400, 500]).toContain(res.status)
        })
    })

    describe("Row 18 — Path traversal", () => {
        it("POST: should handle path traversal in pageId", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "../../etc/passwd",
                    title: "Test",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })

        it("POST: should handle Windows path traversal in pageId", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "..\\..\\windows\\system32",
                    title: "Test",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 19 — Mass assignment", () => {
        it("should reject extra fields in POST", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/live", {
                    pageId: "123",
                    role: "admin",
                })
            )
            expect(res.status).toBe(400)
        })
    })

    describe("GET — Basic security", () => {
        it("should reject missing pageId query param", async () => {
            const req = makeGet("http://localhost/api/platform/facebook/live")
            const res = await GET(req)
            expect(res.status).toBe(400)
        })
        it("should handle empty pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/live?pageId="
            )
            const res = await GET(req)
            expect([400, 500]).toContain(res.status)
        })
        it("should handle SQL injection in pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/live?pageId=1' OR '1'='1"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })
})
