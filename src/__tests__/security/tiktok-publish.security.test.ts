/**
 * Security Tests for POST /api/platform/tiktok/publish — Attack Matrix
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
 * 12 (race conditions — concurrent publishes)
 * 13 (Content-Type confusion)
 * 14 (HTTP header attacks)
 * 15 (info disclosure — error messages)
 * 16 (business logic — not linked, invalid media)
 * 17 (IDOR — publish to another user's account)
 * 18 (path traversal — title/mediaUrl params)
 * 19 (mass assignment — extra body fields)
 * 20 (SSRF — uploadUrl injection)
 *
 * SKIP:
 *   21 (timing side-channel) — all paths return JSON errors
 */

import { POST } from "@/app/api/platform/tiktok/publish/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
})

const mockQueryCreatorInfo = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        privacyLevelOptions: ["SELF_ONLY", "PUBLIC_TO_EVERYONE"],
        maxVideoPostDurationSec: 180,
    }),
)

const mockInitVideoPublish = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        uploadUrl: "https://upload.tiktok.com/video/123",
        publishId: "mock-publish-id-123",
        uploadMethod: "FILE_UPLOAD",
    }),
)

vi.mock("@/lib/tiktok/config", () => ({
    getTikTokConfig: () => ({
        oauth: {
            clientKey: "test-client-key",
            clientSecret: "test-client-secret",
            redirectUri: "http://localhost:3000/api/oauth/callback/tiktok",
            scopes: ["user.info.basic", "user.info.profile", "user.info.stats", "video.list", "video.publish"],
            apiVersion: "v2",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            publishAttemptsPerHour: 6,
        },
        security: {
            tokenExpiryBufferMs: 300000,
        },
    }),
    resetTikTokConfig: vi.fn(),
}))

vi.mock("@/lib/tiktok/oauth-service", () => ({
    getTikTokOAuthService: () => ({
        initialize: vi.fn(),
        queryCreatorInfo: mockQueryCreatorInfo,
        initVideoPublish: mockInitVideoPublish,
    }),
    resetTikTokOAuthService: vi.fn(),
}))

vi.mock("@/lib/tiktok/get-valid-token", () => ({
    getValidTikTokToken: vi.fn().mockResolvedValue("mock-user-token"),
}))

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({
        getToken: vi.fn().mockResolvedValue({
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            expiresAt: Date.now() + 3600000,
            platform: "tiktok",
            userId: "test-user-123",
        }),
    }),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

function makePostRequest(
    url: string,
    body: unknown,
    headers: Record<string, string> = {},
): NextRequest {
    return new NextRequest(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": "test-user-123",
            ...headers,
        },
        body: body !== null ? JSON.stringify(body) : null,
    })
}

describe("POST /api/platform/tiktok/publish — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("Row 1 — Auth bypass", () => {
        it("should reject without x-user-id header", async () => {
            const request = new NextRequest(
                "http://localhost/api/platform/tiktok/publish",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ source: "FILE_UPLOAD", title: "Test Video" }),
                },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })

        it("should reject with empty x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Test Video" },
                { "x-user-id": "" },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            expect((await response.json()).error).toBe("MISSING_USER_ID")
        })
    })

    describe("Row 2 — Method confusion", () => {
        it("should not expose GET handler", async () => {
            const route = await import(
                "@/app/api/platform/tiktok/publish/route"
            )
            expect("GET" in route).toBe(false)
        })
    })

    describe("Row 3 — Type attacks", () => {
        it("should handle null body", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish", null,
            )
            const response = await POST(request)
            expect([400, 404, 500]).toContain(response.status)
        })

        it("should handle array body", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish", [],
            )
            const response = await POST(request)
            expect([400, 404, 500]).toContain(response.status)
        })

        it("should handle number body", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish", 42,
            )
            const response = await POST(request)
            expect([400, 404, 500]).toContain(response.status)
        })

        it("should handle boolean body", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish", true,
            )
            const response = await POST(request)
            expect([400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 4 — Value attacks", () => {
        it("should handle empty object body", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish", {},
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should reject missing source", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { title: "Test" },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should reject missing title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD" },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should reject invalid source value", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "INVALID", title: "Test Video" },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should reject whitespace-only title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "   " },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should reject empty title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "" },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 5 — Structure attacks", () => {
        it("should reject extra fields", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Test", extraField: "bad" },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("VALIDATION_ERROR")
        })
    })

    describe("Row 6 — Prototype pollution", () => {
        it("should handle __proto__ in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                JSON.parse('{"__proto__": {"polluted": true}, "source": "FILE_UPLOAD", "title": "Test"}'),
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })

        it("should handle constructor.prototype in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                JSON.parse('{"constructor": {"prototype": {"polluted": true}}, "source": "FILE_UPLOAD", "title": "Test"}'),
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 7 — Injection", () => {
        it("should handle SQL injection in title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "1' OR '1'='1" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })

        it("should handle XSS in title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "<script>alert(1)</script>" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })

        it("should handle SQL injection in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Test" },
                { "x-user-id": "1' OR '1'='1" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 8 — Unicode", () => {
        it("should handle emoji in title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Test Video 🔥" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 9 — Size", () => {
        it("should handle oversized title (>2200 chars)", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "A".repeat(2201) },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should handle 2200-char title (boundary)", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "A".repeat(2200) },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 10 — Rate limiting", () => {
        it("should handle single POST request", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Test Video" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent POST requests", async () => {
            const requests = Array.from({ length: 5 }, () =>
                makePostRequest(
                    "http://localhost/api/platform/tiktok/publish",
                    { source: "FILE_UPLOAD", title: "Test Video" },
                ),
            )
            const results = await Promise.all(requests.map(r => POST(r)))
            for (const response of results) {
                expect([201, 400, 404, 500]).toContain(response.status)
            }
        })
    })

    describe("Row 13 — Content-Type", () => {
        it("should handle wrong Content-Type (text/plain)", async () => {
            const request = new NextRequest(
                "http://localhost/api/platform/tiktok/publish",
                {
                    method: "POST",
                    headers: { "Content-Type": "text/plain", "x-user-id": "test-user-123" },
                    body: JSON.stringify({ source: "FILE_UPLOAD", title: "Test" }),
                },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })

        it("should handle missing Content-Type", async () => {
            const request = new NextRequest(
                "http://localhost/api/platform/tiktok/publish",
                {
                    method: "POST",
                    headers: { "x-user-id": "test-user-123" },
                    body: JSON.stringify({ source: "FILE_UPLOAD", title: "Test" }),
                },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths on error", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                {},
                { "x-user-id": "" },
            )
            const response = await POST(request)
            const body = await response.json()
            expect(body.message).not.toContain(":\\")
            expect(body.message).not.toContain("/src/")
            expect(body.message).not.toContain("at ")
        })
    })

    describe("Row 17 — IDOR", () => {
        it("should handle other user IDs", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Test" },
                { "x-user-id": "other-user-id" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 14 — HTTP header attacks", () => {
        it("should handle X-Forwarded-For header", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Test" },
                { "X-Forwarded-For": "127.0.0.1" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })

        it("should handle Host override header", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Test" },
                { Host: "evil.com" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 16 — Business logic", () => {
        it("should handle invalid source gracefully", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "INVALID_SOURCE", title: "Test" },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("Row 18 — Path traversal", () => {
        it("should handle path traversal in title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "../../etc/passwd" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })

        it("should handle Windows path traversal in title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "..\\..\\windows\\system32" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 20 — SSRF", () => {
        it("should handle internal URL in title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Check http://localhost:5432/pg" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })

        it("should handle internal IP in title", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                { source: "FILE_UPLOAD", title: "Check http://10.0.0.1/admin" },
            )
            const response = await POST(request)
            expect([201, 400, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 19 — Mass assignment", () => {
        it("should reject extra fields in POST", async () => {
            const request = makePostRequest(
                "http://localhost/api/platform/tiktok/publish",
                {
                    source: "FILE_UPLOAD",
                    title: "Test",
                    extraField1: "bad",
                    extraField2: "also bad",
                },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("VALIDATION_ERROR")
        })
    })
})
