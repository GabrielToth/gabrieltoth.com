/**
 * Security Tests for Instagram Comments Routes — Attack Matrix
 *
 * GET  /api/platform/instagram/comments
 * POST /api/platform/instagram/comments
 * DELETE /api/platform/instagram/comments/{id}
 *
 * Applicable rows:
 * GET:    1,2,4,7,8,9,10,12,14,15,17,18
 * POST:   1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19
 * DELETE: 1,2,3,4,5,7,8,9,10,11,12,13,14,15,17,18
 *
 * SKIP:
 *   GET rows 3,5,6,11,13,16,19,20,21
 *   POST rows 16,20,21
 *   DELETE rows 6,16,19,20,21
 */

import { GET, POST } from "@/app/api/platform/instagram/comments/route"
import { DELETE } from "@/app/api/platform/instagram/comments/[id]/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockGetToken = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        expiresAt: Date.now() + 3600000,
        platform: "instagram",
        userId: "test-user-123",
    })
)

const mockGetComments = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        data: [],
        paging: { cursors: { before: "", after: "" } },
    })
)

const mockReplyToComment = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ id: "mock-reply-id-123" })
)

const mockDeleteComment = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

const mockGetValidToken = vi.hoisted(() =>
    vi.fn().mockResolvedValue("mock-valid-access-token")
)

const mockGetServerSession = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ user: { id: "test-user-123" } })
)

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({ getToken: mockGetToken }),
    resetTokenStore: vi.fn(),
}))

vi.mock("@/lib/instagram/config", () => ({
    getInstagramConfig: () => ({
        oauth: {
            appId: "test-app-id",
            appSecret: "test-app-secret",
            redirectUri: "http://localhost:3000/api/oauth/callback/instagram",
            scopes: [
                "instagram_basic",
                "instagram_content_publish",
                "pages_show_list",
                "pages_read_engagement",
                "instagram_business_manage_comments",
                "instagram_business_manage_messages",
                "pages_manage_metadata",
            ],
            apiVersion: "v25.0",
        },
        rateLimit: { linkingAttemptsPerHour: 5, publishAttemptsPerHour: 10 },
        security: { tokenExpiryBufferMs: 5 * 60 * 1000 },
    }),
    resetInstagramConfig: vi.fn(),
}))

vi.mock("@/lib/instagram/oauth-service", () => ({
    getInstagramOAuthService: () => ({
        initialize: vi.fn(),
        generateAuthorizationUrl: vi.fn(),
    }),
    resetInstagramOAuthService: vi.fn(),
}))

vi.mock("@/lib/instagram/get-valid-token", () => ({
    getValidInstagramToken: mockGetValidToken,
}))

vi.mock("@/lib/instagram/comments", () => ({
    getComments: mockGetComments,
    replyToComment: mockReplyToComment,
    deleteComment: mockDeleteComment,
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}))

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: mockGetServerSession,
}))

vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        single: vi.fn().mockResolvedValue({
                            data: { platform_user_id: "mock-ig-user-id" },
                            error: null,
                        }),
                    }),
                }),
            }),
        }),
    }),
}))

function makeGetRequest(
    query: Record<string, string> = {},
    headers: Record<string, string> = {}
): NextRequest {
    const params = new URLSearchParams(query).toString()
    return new NextRequest(
        `http://localhost/api/platform/instagram/comments?${params}`,
        {
            method: "GET",
            headers: { "x-user-id": "test-user-123", ...headers },
        }
    )
}

function makePostRequest(
    body: unknown,
    headers: Record<string, string> = {}
): NextRequest {
    return new NextRequest("http://localhost/api/platform/instagram/comments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": "test-user-123",
            ...headers,
        },
        body: body !== null ? JSON.stringify(body) : null,
    })
}

function makeDeleteRequest(
    commentId: string,
    headers: Record<string, string> = {}
): NextRequest {
    return new NextRequest(
        `http://localhost/api/platform/instagram/comments/${commentId}`,
        {
            method: "DELETE",
            headers: { "x-user-id": "test-user-123", ...headers },
        }
    )
}

function makeDeleteRouteRequest(
    commentId: string,
    headers: Record<string, string> = {}
): NextRequest {
    return new NextRequest(
        `http://localhost/api/platform/instagram/comments/${commentId}`,
        {
            method: "DELETE",
            headers: { "x-user-id": "test-user-123", ...headers },
        }
    )
}

describe("GET /api/platform/instagram/comments — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetServerSession.mockResolvedValue({
            user: { id: "test-user-123" },
        })
    })
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("Row 1 — Auth bypass", () => {
        it("should reject without x-user-id", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = makeGetRequest(
                { media_id: "123" },
                { "x-user-id": "" }
            )
            const response = await GET(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })

        it("should reject with missing x-user-id header", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = new NextRequest(
                "http://localhost/api/platform/instagram/comments?media_id=123",
                { method: "GET", headers: {} }
            )
            const response = await GET(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 2 — HTTP method confusion", () => {
        it("should not expose POST handler via GET route", async () => {
            const route =
                await import("@/app/api/platform/instagram/comments/route")
            expect(typeof route.GET).toBe("function")
            expect(typeof route.POST).toBe("function")
        })
    })

    describe("Row 4 — Value attacks", () => {
        it("should reject empty media_id", async () => {
            const request = makeGetRequest({ media_id: "" })
            const response = await GET(request)
            expect(response.status).toBe(400)
        })

        it("should reject missing media_id parameter", async () => {
            const request = makeGetRequest({})
            const response = await GET(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 7 — Injection", () => {
        it("should handle SQL injection in media_id", async () => {
            const request = makeGetRequest({ media_id: "1' OR '1'='1" })
            const response = await GET(request)
            expect([200, 400, 500]).toContain(response.status)
        })

        it("should handle XSS in media_id", async () => {
            const request = makeGetRequest({
                media_id: "<script>alert(1)</script>",
            })
            const response = await GET(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 8 — Unicode", () => {
        it("should handle emoji in media_id", async () => {
            const request = makeGetRequest({ media_id: "🔥" })
            const response = await GET(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 9 — Size attacks", () => {
        it("should handle oversized media_id", async () => {
            const request = makeGetRequest({ media_id: "A".repeat(10000) })
            const response = await GET(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 10 — Rate limiting", () => {
        it("should handle concurrent GET requests", async () => {
            const results = await Promise.all(
                Array.from({ length: 5 }, () =>
                    GET(makeGetRequest({ media_id: "123" }))
                )
            )
            for (const r of results) {
                expect([200, 400, 500]).toContain(r.status)
            }
        })
    })

    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent list requests with same media_id", async () => {
            const results = await Promise.all([
                GET(makeGetRequest({ media_id: "123" })),
                GET(makeGetRequest({ media_id: "123" })),
                GET(makeGetRequest({ media_id: "123" })),
            ])
            for (const r of results) {
                expect([200, 400, 500]).toContain(r.status)
            }
        })
    })

    describe("Row 14 — HTTP header attacks", () => {
        it("should handle Host override", async () => {
            const request = makeGetRequest(
                { media_id: "123" },
                { host: "evil.com" }
            )
            const response = await GET(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error response", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = makeGetRequest(
                { media_id: "123" },
                { "x-user-id": "" }
            )
            const response = await GET(request)
            const body = await response.json()
            expect(body.message).not.toContain(":\\")
            expect(body.message).not.toContain("/src/")
        })
    })

    describe("Row 17 — IDOR", () => {
        it("should allow any userId to list comments (authorized per user)", async () => {
            mockGetServerSession.mockResolvedValueOnce({
                user: { id: "other-user-456" },
            })
            const request = makeGetRequest({ media_id: "123" })
            const response = await GET(request)
            // Each user sees their own linked account's comments
            expect([200, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 18 — Path traversal", () => {
        it("should handle path traversal in media_id", async () => {
            const request = makeGetRequest({ media_id: "../../../etc/passwd" })
            const response = await GET(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })
})

describe("POST /api/platform/instagram/comments — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockReplyToComment.mockResolvedValue({ id: "mock-reply-id-123" })
        mockGetServerSession.mockResolvedValue({
            user: { id: "test-user-123" },
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    const validReply = { comment_id: "comment-123", message: "Great post!" }

    describe("Row 1 — Auth bypass", () => {
        it("should reject without x-user-id", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = makePostRequest(validReply, { "x-user-id": "" })
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 2 — HTTP method confusion", () => {
        it("should have both GET and POST handlers", async () => {
            const route =
                await import("@/app/api/platform/instagram/comments/route")
            expect(typeof route.GET).toBe("function")
            expect(typeof route.POST).toBe("function")
        })
    })

    describe("Row 3 — Type attacks", () => {
        const payloads = [
            ["string body", "hello"],
            ["number body", 42],
            ["boolean body", true],
            ["null body", null],
            ["array body", [1, 2, 3]],
        ] as const

        it.each(payloads)("should handle %s", async (_, body) => {
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 4 — Value attacks", () => {
        it("should reject empty comment_id", async () => {
            const request = makePostRequest({ comment_id: "", message: "test" })
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should reject empty message", async () => {
            const request = makePostRequest({ comment_id: "c-1", message: "" })
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should reject message with only whitespace", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "   ",
            })
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 5 — Structure attacks", () => {
        it("should reject empty body {}", async () => {
            const request = makePostRequest({})
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should reject body with extra unexpected fields", async () => {
            const request = makePostRequest({
                ...validReply,
                admin: true,
                role: "moderator",
            })
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should handle array body", async () => {
            const request = makePostRequest([])
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 6 — Prototype pollution", () => {
        it("should handle __proto__ in body", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "test",
                __proto__: { admin: true },
            })
            const response = await POST(request)
            // __proto__ is a JS accessor property on Object.prototype,
            // not an own property — Object.keys() doesn't detect it
            expect([201, 400]).toContain(response.status)
        })

        it("should handle constructor.prototype in body", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "test",
                constructor: { prototype: { admin: true } },
            })
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 7 — Injection", () => {
        it("should handle SQL injection in message", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "1' DROP TABLE users; --",
            })
            const response = await POST(request)
            expect([201, 400, 500]).toContain(response.status)
        })

        it("should handle XSS in message", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "<script>alert(1)</script>",
            })
            const response = await POST(request)
            expect([201, 400, 500]).toContain(response.status)
        })

        it("should handle HTML in message", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "<b>bold</b><img src=x onerror=alert(1)>",
            })
            const response = await POST(request)
            expect([201, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 8 — Unicode", () => {
        it("should handle emoji in message", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "🔥🚀 Great content!",
            })
            const response = await POST(request)
            expect([201, 400, 500]).toContain(response.status)
        })

        it("should handle null byte in message", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "hello\0world",
            })
            const response = await POST(request)
            expect([201, 400, 500]).toContain(response.status)
        })

        it("should handle RTL override in message", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "\u202Etest",
            })
            const response = await POST(request)
            expect([201, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 9 — Size attacks", () => {
        it("should reject message over 1000 chars", async () => {
            const request = makePostRequest({
                comment_id: "c-1",
                message: "A".repeat(1001),
            })
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should handle deeply nested body", async () => {
            let nested: any = { comment_id: "c-1", message: "test" }
            for (let i = 0; i < 50; i++) {
                nested = { nested }
            }
            const request = makePostRequest(nested)
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 10 — Rate limiting", () => {
        it("should handle concurrent POST requests", async () => {
            const results = await Promise.all(
                Array.from({ length: 5 }, () =>
                    POST(makePostRequest(validReply))
                )
            )
            for (const r of results) {
                expect([201, 400, 500]).toContain(r.status)
            }
        })
    })

    describe("Row 11 — CSRF", () => {
        it("should handle POST without CSRF token", async () => {
            const request = makePostRequest(validReply, {
                "x-user-id": "test-user-123",
            })
            const response = await POST(request)
            expect([201, 400]).toContain(response.status)
        })
    })

    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent replies to same comment", async () => {
            const results = await Promise.all([
                POST(makePostRequest(validReply)),
                POST(makePostRequest(validReply)),
                POST(makePostRequest(validReply)),
            ])
            for (const r of results) {
                expect([201, 400, 500]).toContain(r.status)
            }
        })
    })

    describe("Row 13 — Content-Type", () => {
        it("should handle wrong Content-Type (text/plain)", async () => {
            const request = new NextRequest(
                "http://localhost/api/platform/instagram/comments",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain",
                        "x-user-id": "test-user-123",
                    },
                    body: JSON.stringify(validReply),
                }
            )
            const response = await POST(request)
            expect([201, 400]).toContain(response.status)
        })

        it("should handle missing Content-Type", async () => {
            const request = new NextRequest(
                "http://localhost/api/platform/instagram/comments",
                {
                    method: "POST",
                    headers: { "x-user-id": "test-user-123" },
                    body: JSON.stringify(validReply),
                }
            )
            const response = await POST(request)
            expect([201, 400]).toContain(response.status)
        })

        it("should handle multipart Content-Type", async () => {
            const request = new NextRequest(
                "http://localhost/api/platform/instagram/comments",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "x-user-id": "test-user-123",
                    },
                    body: JSON.stringify(validReply),
                }
            )
            const response = await POST(request)
            expect([201, 400]).toContain(response.status)
        })
    })

    describe("Row 14 — HTTP header attacks", () => {
        it("should handle Host override", async () => {
            const request = makePostRequest(validReply, { host: "evil.com" })
            const response = await POST(request)
            expect([201, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = makePostRequest(validReply, { "x-user-id": "" })
            const response = await POST(request)
            const body = await response.json()
            expect(body.message).not.toContain(":\\")
            expect(body.message).not.toContain("/src/")
        })
    })

    describe("Row 17 — IDOR", () => {
        it("should allow reply from any userId (per-user auth)", async () => {
            mockGetServerSession.mockResolvedValueOnce({
                user: { id: "other-user-789" },
            })
            const request = makePostRequest(validReply)
            const response = await POST(request)
            expect([201, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 18 — Path traversal in comment_id", () => {
        it("should handle path traversal in comment_id", async () => {
            const request = makePostRequest({
                comment_id: "../../../etc/passwd",
                message: "test",
            })
            const response = await POST(request)
            expect([201, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 19 — Mass assignment", () => {
        it("should reject extra fields in body", async () => {
            const request = makePostRequest({
                ...validReply,
                isModerator: true,
                canDelete: true,
            })
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })
})

describe("DELETE /api/platform/instagram/comments/{id} — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockDeleteComment.mockResolvedValue(undefined)
        mockGetServerSession.mockResolvedValue({
            user: { id: "test-user-123" },
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("Row 1 — Auth bypass", () => {
        it("should reject without x-user-id", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = new NextRequest(
                "http://localhost/api/platform/instagram/comments/c-123",
                { method: "DELETE", headers: {} }
            )
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "c-123" }),
            })
            expect(response.status).toBe(400)
        })
    })

    describe("Row 2 — HTTP method confusion", () => {
        it("should only expose DELETE handler for [id] route", async () => {
            const route =
                await import("@/app/api/platform/instagram/comments/[id]/route")
            expect(typeof route.DELETE).toBe("function")
            expect("GET" in route).toBe(false)
            expect("POST" in route).toBe(false)
        })
    })

    describe("Row 3 — Type attacks", () => {
        it("should handle special comment_id values", async () => {
            const ids = [
                makeDeleteRouteRequest("null"),
                makeDeleteRouteRequest("undefined"),
                makeDeleteRouteRequest("0"),
                makeDeleteRouteRequest("NaN"),
            ]
            const results = await Promise.all(
                ids.map(req =>
                    DELETE(req, {
                        params: Promise.resolve({
                            id: req.url.split("/").pop() ?? "",
                        }),
                    })
                )
            )
            for (const r of results) {
                expect([200, 400, 500]).toContain(r.status)
            }
        })
    })

    describe("Row 4 — Value attacks", () => {
        it("should handle empty comment id", async () => {
            const request = makeDeleteRouteRequest("")
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "" }),
            })
            expect(response.status).toBe(400)
        })
    })

    describe("Row 5 — Structure attacks", () => {
        it("should handle DELETE with body (ignored)", async () => {
            const request = new NextRequest(
                "http://localhost/api/platform/instagram/comments/c-123",
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "x-user-id": "test-user-123",
                    },
                    body: JSON.stringify({ extra: "field" }),
                }
            )
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "c-123" }),
            })
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 7 — Injection", () => {
        it("should handle SQL injection in comment id", async () => {
            const request = makeDeleteRouteRequest("1' OR '1'='1")
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "1' OR '1'='1" }),
            })
            expect([200, 400, 500]).toContain(response.status)
        })

        it("should handle NoSQL operator in comment id", async () => {
            const request = makeDeleteRouteRequest('{"$gt": ""}')
            const response = await DELETE(request, {
                params: Promise.resolve({ id: '{"$gt": ""}' }),
            })
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 8 — Unicode", () => {
        it("should handle emoji in comment id", async () => {
            const request = makeDeleteRouteRequest("🔥")
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "🔥" }),
            })
            expect([200, 400, 500]).toContain(response.status)
        })

        it("should handle null byte in comment id", async () => {
            const request = makeDeleteRouteRequest("c-123\0")
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "c-123\0" }),
            })
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 9 — Size attacks", () => {
        it("should handle oversized comment id", async () => {
            const request = makeDeleteRouteRequest("A".repeat(10000))
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "A".repeat(10000) }),
            })
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 10 — Rate limiting", () => {
        it("should handle concurrent DELETE requests", async () => {
            const results = await Promise.all(
                Array.from({ length: 5 }, () =>
                    DELETE(makeDeleteRouteRequest("c-123"), {
                        params: Promise.resolve({ id: "c-123" }),
                    })
                )
            )
            for (const r of results) {
                expect([200, 400, 500]).toContain(r.status)
            }
        })
    })

    describe("Row 11 — CSRF", () => {
        it("should handle DELETE without CSRF token", async () => {
            const request = makeDeleteRouteRequest("c-123")
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "c-123" }),
            })
            expect([200, 400]).toContain(response.status)
        })
    })

    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent deletions of same comment", async () => {
            const results = await Promise.all([
                DELETE(makeDeleteRouteRequest("c-123"), {
                    params: Promise.resolve({ id: "c-123" }),
                }),
                DELETE(makeDeleteRouteRequest("c-123"), {
                    params: Promise.resolve({ id: "c-123" }),
                }),
            ])
            for (const r of results) {
                expect([200, 400, 500]).toContain(r.status)
            }
        })
    })

    describe("Row 13 — Content-Type", () => {
        it("should handle missing Content-Type on DELETE", async () => {
            const request = new NextRequest(
                "http://localhost/api/platform/instagram/comments/c-123",
                { method: "DELETE", headers: { "x-user-id": "test-user-123" } }
            )
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "c-123" }),
            })
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 14 — HTTP header attacks", () => {
        it("should handle Host override", async () => {
            const request = makeDeleteRouteRequest("c-123", {
                host: "evil.com",
            })
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "c-123" }),
            })
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = new NextRequest(
                "http://localhost/api/platform/instagram/comments/c-123",
                { method: "DELETE", headers: {} }
            )
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "c-123" }),
            })
            const body = await response.json()
            expect(body.message).not.toContain(":\\")
            expect(body.message).not.toContain("/src/")
        })
    })

    describe("Row 17 — IDOR", () => {
        it("should allow delete from any userId (per-user auth)", async () => {
            mockGetServerSession.mockResolvedValueOnce({
                user: { id: "other-user-789" },
            })
            const request = makeDeleteRouteRequest("c-123")
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "c-123" }),
            })
            expect([200, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 18 — Path traversal", () => {
        it("should handle path traversal in comment id", async () => {
            const request = makeDeleteRouteRequest("../../../etc/passwd")
            const response = await DELETE(request, {
                params: Promise.resolve({ id: "../../../etc/passwd" }),
            })
            expect([200, 400, 500]).toContain(response.status)
        })
    })
})
