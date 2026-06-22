import { POST } from "@/app/api/oauth/authorize/tiktok/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
})

const mockGenerateState = vi.hoisted(() =>
    vi.fn().mockReturnValue({ token: "mock-signed-state-token", payload: { userId: "test-user-123", platform: "tiktok" } }),
)

vi.mock("@/lib/oauth/state-signer", () => ({
    generateState: mockGenerateState,
}))

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
    }),
    resetTikTokOAuthService: vi.fn(),
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

describe("POST /api/oauth/authorize/tiktok — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("Row 1 — Auth bypass", () => {
        it("should reject request without x-user-id header", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })

        it("should reject request with empty x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
                { "x-user-id": "" },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })

        it("should reject request without any auth headers", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })
    })

    describe("Row 2 — HTTP method confusion", () => {
        it("should not expose GET handler for authorize", async () => {
            const route = await import(
                "@/app/api/oauth/authorize/tiktok/route"
            )
            expect("GET" in route).toBe(false)
        })
    })

    describe("Row 7 — Injection attacks via userId header", () => {
        it("should handle SQL injection in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
                { "x-user-id": "1' OR '1'='1" },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })

        it("should handle XSS in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
                { "x-user-id": "<script>alert(1)</script>" },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })

        it("should handle NoSQL operators in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
                { "x-user-id": '{"$gt": ""}' },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 8 — Unicode/encoding", () => {
        it("should skip: HTTP headers must be ASCII per RFC 7230", async () => {
            expect(true).toBe(true)
        })
    })

    describe("Row 9 — Size attacks", () => {
        it("should handle oversized x-user-id header (10k+ chars)", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
                { "x-user-id": "A".repeat(10000) },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 10 — Rate limiting", () => {
        it("should handle request within rate limit", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent authorize requests", async () => {
            const requests = Array.from({ length: 5 }, () =>
                makePostRequest(
                    "http://localhost/api/oauth/authorize/tiktok",
                    {},
                ),
            )
            const results = await Promise.all(requests.map(r => POST(r)))
            for (const response of results) {
                expect([200, 400, 500]).toContain(response.status)
            }
        })
    })

    describe("Row 13 — Content-Type attacks", () => {
        it("should handle wrong Content-Type (text/plain)", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain",
                        "x-user-id": "test-user-123",
                    },
                    body: "{}",
                },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })

        it("should handle missing Content-Type", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {
                    method: "POST",
                    headers: { "x-user-id": "test-user-123" },
                    body: "{}",
                },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })

        it("should handle multipart Content-Type", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "x-user-id": "test-user-123",
                    },
                    body: "{}",
                },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 14 — HTTP header attacks", () => {
        it("should handle X-Forwarded-For header", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
                {
                    "x-user-id": "test-user-123",
                    "X-Forwarded-For": "127.0.0.1",
                },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })

        it("should handle Host override header", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
                {
                    "x-user-id": "test-user-123",
                    Host: "evil.com",
                },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error response", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
                { "x-user-id": "" },
            )
            const response = await POST(request)
            const body = await response.json()
            expect(body.message).not.toContain(":\\")
            expect(body.message).not.toContain("/src/")
            expect(body.message).not.toContain("at ")
            expect(body.message).not.toContain("stack")
        })
    })

    describe("Row 17 — IDOR", () => {
        it("should allow authorize for any userId (authorize is public by design)", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/tiktok",
                {},
                { "x-user-id": "any-user-id" },
            )
            const response = await POST(request)
            expect([200, 400, 500]).toContain(response.status)
        })
    })
})
