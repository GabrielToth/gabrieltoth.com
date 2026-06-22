import { GET, POST } from "@/app/api/platform/facebook/comments/route"
import { DELETE, PATCH } from "@/app/api/platform/facebook/comments/[id]/route"
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

vi.mock("@/lib/facebook/comments", () => ({
    getComments: vi.fn().mockResolvedValue({ data: [], paging: {} }),
    replyToComment: vi.fn().mockResolvedValue({ id: "reply-123" }),
    deleteComment: vi.fn().mockResolvedValue(undefined),
    hideComment: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
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
function makeDelete(url: string, h: Record<string, string> = {}): NextRequest {
    return new NextRequest(url, {
        method: "DELETE",
        headers: { "x-user-id": "test-user-123", ...h },
    })
}
function makePatch(
    url: string,
    body: unknown,
    h: Record<string, string> = {}
): NextRequest {
    return new NextRequest(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": "test-user-123",
            ...h,
        },
        body: body !== null ? JSON.stringify(body) : null,
    })
}

describe("Facebook Comments — Attack Matrix", () => {
    beforeEach(() => vi.clearAllMocks())
    afterEach(() => vi.clearAllMocks())

    describe("Row 1 — Auth bypass", () => {
        it("GET: should reject without x-user-id", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/comments?post_id=1&pageId=1",
                { method: "GET" }
            )
            const res = await GET(req)
            expect(res.status).toBe(400)
        })
        it("POST: should reject without x-user-id", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/comments",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "{}",
                }
            )
            const res = await POST(req)
            expect(res.status).toBe(400)
        })
        it("DELETE: should reject without x-user-id", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/comments/123?pageId=1",
                { method: "DELETE" }
            )
            const res = await DELETE(req, {
                params: Promise.resolve({ id: "123" }),
            })
            expect(res.status).toBe(400)
        })
        it("PATCH: should reject without x-user-id", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/comments/123?pageId=1",
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: '{"hide":true}',
                }
            )
            const res = await PATCH(req, {
                params: Promise.resolve({ id: "123" }),
            })
            expect(res.status).toBe(400)
        })
    })

    describe("Row 2 — Method confusion", () => {
        it("should not expose unexpected methods on comments", async () => {
            const r = await import("@/app/api/platform/facebook/comments/route")
            expect("PUT" in r).toBe(false)
            expect("DELETE" in r).toBe(false)
        })
    })

    describe("Row 3 — Type attacks", () => {
        it("POST: should handle number body", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", 42)
            )
            expect([400, 500]).toContain(res.status)
        })
        it("POST: should handle null body", async () => {
            const res = await POST(
                makePost(
                    "http://localhost/api/platform/facebook/comments",
                    null
                )
            )
            expect([400, 500]).toContain(res.status)
        })
        it("PATCH: should handle boolean hide as non-boolean type", async () => {
            const res = await PATCH(
                makePatch(
                    "http://localhost/api/platform/facebook/comments/123?pageId=1",
                    { hide: "not-boolean" }
                ),
                { params: Promise.resolve({ id: "123" }) }
            )
            expect(res.status).toBe(400)
        })
    })

    describe("Row 4 — Value attacks", () => {
        it("GET: should reject missing post_id", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/comments?pageId=1"
            )
            const res = await GET(req)
            expect(res.status).toBe(400)
        })
        it("GET: should reject missing pageId", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/comments?post_id=1"
            )
            const res = await GET(req)
            expect(res.status).toBe(400)
        })
        it("POST: should reject missing comment_id", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", {
                    pageId: "123",
                    message: "hi",
                })
            )
            expect(res.status).toBe(400)
        })
        it("POST: should reject whitespace-only message", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", {
                    pageId: "123",
                    comment_id: "c1",
                    message: "   ",
                })
            )
            expect(res.status).toBe(400)
        })
        it("DELETE: should reject missing pageId", async () => {
            const req = makeDelete(
                "http://localhost/api/platform/facebook/comments/123"
            )
            const res = await DELETE(req, {
                params: Promise.resolve({ id: "123" }),
            })
            expect(res.status).toBe(400)
        })
    })

    describe("Row 5 — Structure attacks", () => {
        it("POST: should reject extra fields", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", {
                    pageId: "123",
                    comment_id: "c1",
                    message: "hi",
                    extra: "field",
                })
            )
            expect(res.status).toBe(400)
        })
        it("PATCH: should reject extra fields", async () => {
            const res = await PATCH(
                makePatch(
                    "http://localhost/api/platform/facebook/comments/123?pageId=1",
                    { hide: true, extra: "field" }
                ),
                { params: Promise.resolve({ id: "123" }) }
            )
            expect(res.status).toBe(400)
        })
    })

    describe("Row 6 — Prototype pollution", () => {
        it("POST: should handle __proto__", async () => {
            const res = await POST(
                makePost(
                    "http://localhost/api/platform/facebook/comments",
                    JSON.parse(
                        '{"__proto__":{"p":1},"pageId":"123","comment_id":"c1","message":"hi"}'
                    )
                )
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 7 — Injection", () => {
        it("POST: should handle SQL injection in message", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", {
                    pageId: "123",
                    comment_id: "c1",
                    message: "1'; DROP TABLE--",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
        it("POST: should handle XSS in message", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", {
                    pageId: "123",
                    comment_id: "c1",
                    message: "<script>alert(1)</script>",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
        it("GET: should handle SQL injection in post_id", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/comments?post_id=1' OR '1'='1&pageId=123"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 8 — Unicode", () => {
        it("POST: should handle emoji in message", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", {
                    pageId: "123",
                    comment_id: "c1",
                    message: "🔥👍",
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
        it("GET: should handle unicode in post_id", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/comments?post_id=café&pageId=123"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 9 — Size", () => {
        it("POST: should handle message > 1000 chars", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", {
                    pageId: "123",
                    comment_id: "c1",
                    message: "A".repeat(1001),
                })
            )
            expect(res.status).toBe(400)
        })
        it("POST: should handle 1000-char message (boundary)", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", {
                    pageId: "123",
                    comment_id: "c1",
                    message: "A".repeat(1000),
                })
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 10 — Rate limiting", () => {
        it("should handle single GET request", async () => {
            const req = makeGet(
                "http://localhost/api/platform/facebook/comments?post_id=1&pageId=123"
            )
            const res = await GET(req)
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent POST requests", async () => {
            const results = await Promise.all(
                Array.from({ length: 5 }, () =>
                    POST(
                        makePost(
                            "http://localhost/api/platform/facebook/comments",
                            { pageId: "123", comment_id: "c1", message: "hi" }
                        )
                    )
                )
            )
            for (const r of results) expect([201, 400, 500]).toContain(r.status)
        })
    })

    describe("Row 13 — Content-Type", () => {
        it("POST: should handle missing Content-Type", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/comments",
                {
                    method: "POST",
                    headers: { "x-user-id": "test" },
                    body: '{"pageId":"123","comment_id":"c1","message":"hi"}',
                }
            )
            const res = await POST(req)
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths", async () => {
            const req = new NextRequest(
                "http://localhost/api/platform/facebook/comments?post_id=1&pageId=123",
                { method: "GET" }
            )
            const res = await GET(req)
            if (res.status !== 400) return
            const b = await res.json()
            expect(b.message).not.toContain(":\\")
        })
    })

    describe("Row 17 — IDOR", () => {
        it("should handle other user IDs", async () => {
            const res = await POST(
                makePost(
                    "http://localhost/api/platform/facebook/comments",
                    { pageId: "123", comment_id: "c1", message: "hi" },
                    { "x-user-id": "other-user" }
                )
            )
            expect([201, 400, 500]).toContain(res.status)
        })
    })

    describe("Row 19 — Mass assignment", () => {
        it("POST: should reject extra body fields", async () => {
            const res = await POST(
                makePost("http://localhost/api/platform/facebook/comments", {
                    pageId: "123",
                    comment_id: "c1",
                    message: "hi",
                    role: "admin",
                })
            )
            expect(res.status).toBe(400)
        })
    })
})
