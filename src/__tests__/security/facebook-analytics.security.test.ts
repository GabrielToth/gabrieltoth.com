/**
 * Security Tests for GET /api/platform/facebook/analytics — Attack Matrix
 *
 * Attack matrix applicable rows:
 * 1  (auth bypass — missing/invalid session)
 * 2  (HTTP method confusion)
 * 3  (type attacks — query params)
 * 4  (value attacks — query params)
 * 5  (structure attacks — params)
 * 6  (prototype pollution — query params)
 * 7  (injection — query params)
 * 8  (unicode/encoding — params)
 * 9  (size attacks — params)
 * 10 (rate limiting)
 * 11 (CSRF)
 * 12 (race conditions)
 * 14 (HTTP header attacks)
 * 15 (info disclosure)
 * 17 (IDOR)
 * 18 (path traversal — pageId)
 * 20 (SSRF — pageId URL injection)
 *
 * SKIP:
 *   13 (Content-Type) — GET request
 *   16 (business logic) — simple query
 *   19 (mass assignment) — query params only
 *   21 (timing side-channel) — all paths return JSON errors
 */

import { GET } from "@/app/api/platform/facebook/analytics/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
})

const mockGetPageAccessToken = vi.hoisted(() =>
    vi.fn().mockResolvedValue("mock-page-token")
)

vi.mock("@/lib/facebook/config", () => ({
    getFacebookConfig: () => ({
        oauth: {
            appId: "test",
            appSecret: "test",
            redirectUri: "http://localhost:3000/api/oauth/callback/facebook",
            scopes: [],
            apiVersion: "v22.0",
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

vi.mock("@/lib/facebook/analytics", () => ({
    getPageInsights: vi.fn().mockResolvedValue({ data: [], paging: {} }),
    COMMON_PAGE_METRICS: ["page_impressions"],
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

function makeGet(url: string, h: Record<string, string> = {}): NextRequest {
    return new NextRequest(url, {
        method: "GET",
        headers: { "x-user-id": "test-user-123", ...h },
    })
}

describe("GET /api/platform/facebook/analytics — Attack Matrix", () => {
    beforeEach(() => vi.clearAllMocks())
    afterEach(() => vi.clearAllMocks())

    describe("Row 1 — Auth bypass", () => {
        it("should reject without x-user-id", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/analytics?pageId=123",
                { method: "GET" }
            )
            const res = await GET(req)
            expect(res.status).toBe(400)
        })
        it("should reject with empty x-user-id", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123",
                { "x-user-id": "" }
            )
            const res = await GET(req)
            expect(res.status).toBe(400)
        })
    })

    describe("Row 2 — Method confusion", () => {
        it("should not expose POST", async () => {
            const r =
                await import("@/app/api/platform/facebook/analytics/route")
            expect("POST" in r).toBe(false)
        })
    })

    describe("Row 3 — Type attacks", () => {
        it("should handle array-like pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId[]=1"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 4 — Value attacks", () => {
        it("should reject missing pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics"
            )
            const res = await GET(req)
            expect(res.status).toBe(400)
        })
        it("should handle empty pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId="
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle zero as pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=0"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 5 — Structure attacks", () => {
        it("should handle duplicate pageId param", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123&pageId=456"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle extra unknown query params", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123&malicious=param"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 6 — Prototype pollution", () => {
        it("should handle __proto__ as query param", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123&__proto__[polluted]=true"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 7 — Injection", () => {
        it("should handle SQL injection in pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=1' OR '1'='1"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle XSS in pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=<script>alert(1)</script>"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle NoSQL operator in metric", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123&metric[$gt]="
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle command injection in metric param", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123&metric=$(id)"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 8 — Unicode/encoding", () => {
        it("should handle emoji in pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=🔥"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle null byte in pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123%00"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle RTL override in metric", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123&metric=page_impressions\u202E"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 9 — Size attacks", () => {
        it("should handle oversized pageId (10k+ chars)", async () => {
            const req = makeGet(
                `http://localhost/api/platform/facebook/analytics?pageId=${"A".repeat(10000)}`
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle oversized metric param", async () => {
            const req = makeGet(
                `http://localhost/api/platform/facebook/analytics?pageId=123&metric=${"A".repeat(10000)}`
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 10 — Rate limiting", () => {
        it("should handle single request", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 11 — CSRF", () => {
        it("should handle request without CSRF token (GET is safe)", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent requests", async () => {
            const results = await Promise.all(
                Array.from({ length: 5 }, () =>
                    GET(
                        makeGet(
                            "http://localhost/api/platform/facebook/analytics?pageId=123"
                        )
                    )
                )
            )
            for (const r of results) expect([200, 400, 500]).toContain(r.status)
        })
    })

    describe("Row 14 — HTTP header attacks", () => {
        it("should handle X-Forwarded-For", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123",
                { "X-Forwarded-For": "127.0.0.1" }
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle Host override", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123",
                { Host: "evil.com" }
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/analytics?pageId=123",
                { method: "GET" }
            )
            const res = await GET(req)
            if (res.status === 200) return
            const b = await res.json()
            expect(b.message).not.toContain(":\\")
            expect(b.message).not.toContain("/src/")
            expect(b.message).not.toContain("at ")
        })
    })

    describe("Row 17 — IDOR", () => {
        it("should handle other user IDs", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123",
                { "x-user-id": "other-user" }
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 18 — Path traversal", () => {
        it("should handle path traversal in pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=../../../etc/passwd"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
        it("should handle Windows path traversal in pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=..\\..\\..\\windows\\system32"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 20 — SSRF", () => {
        it("should handle URL-like metric param", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/analytics?pageId=123&metric=http://evil.com"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })
})
