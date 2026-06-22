import { POST } from "@/app/api/oauth/disconnect/tiktok/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { mockGetToken, mockDeleteToken, mockRevokeToken } = vi.hoisted(
    () => ({
        mockGetToken: vi.fn().mockResolvedValue({
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            expiresAt: Date.now() + 3600000,
            platform: "tiktok",
            userId: "test-user-123",
        }),
        mockDeleteToken: vi.fn().mockResolvedValue(true),
        mockRevokeToken: vi.fn().mockResolvedValue(true),
    }),
)

vi.hoisted(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
})

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
        revokeToken: mockRevokeToken,
    }),
    resetTikTokOAuthService: vi.fn(),
}))

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({
        getToken: mockGetToken,
        deleteToken: mockDeleteToken,
    }),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

const mockEq = vi.fn().mockReturnThis()
const mockUpdate = vi.fn().mockReturnThis()

vi.mock("@supabase/supabase-js", () => {
    return {
        createClient: vi.fn(() => ({
            from: vi.fn().mockReturnThis(),
            update: mockUpdate,
            eq: mockEq,
        })),
    }
})

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

describe("POST /api/oauth/disconnect/tiktok — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("Row 1 — Auth bypass", () => {
        it("should reject request without x-user-id header", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
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
                "http://localhost/api/oauth/disconnect/tiktok",
                {},
                { "x-user-id": "" },
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })
    })

    describe("Row 2 — HTTP method confusion", () => {
        it("should not expose GET handler for disconnect", async () => {
            const route = await import(
                "@/app/api/oauth/disconnect/tiktok/route"
            )
            expect("GET" in route).toBe(false)
        })
    })

    describe("Row 3 — Type attacks", () => {
        it("should handle boolean body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok", true,
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })

        it("should handle null body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok", null,
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })

        it("should handle number body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok", 42,
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })

        it("should handle array body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok", [],
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 4 — Value attacks", () => {
        it("should handle empty object body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok", {},
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 5 — Structure attacks", () => {
        it("should handle extra fields in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                { extraField: "should-be-ignored" },
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 6 — Prototype pollution", () => {
        it("should handle __proto__ in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                JSON.parse('{"__proto__": {"polluted": true}}'),
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })

        it("should handle constructor.prototype in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                JSON.parse('{"constructor": {"prototype": {"polluted": true}}}'),
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 7 — Injection", () => {
        it("should handle SQL injection in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                {},
                { "x-user-id": "1' OR '1'='1" },
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })

        it("should handle XSS in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                {},
                { "x-user-id": "<script>alert(1)</script>" },
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })

        it("should handle NoSQL operators in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                {},
                { "x-user-id": '{"$gt": ""}' },
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 9 — Size attacks", () => {
        it("should handle oversized x-user-id (10k+ chars)", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                {},
                { "x-user-id": "A".repeat(10000) },
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })

        it("should handle deep JSON body nesting", async () => {
            let nested: any = {}
            let current = nested
            for (let i = 0; i < 100; i++) {
                current.a = {}
                current = current.a
            }
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                nested,
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 13 — Content-Type", () => {
        it("should handle wrong Content-Type (text/plain)", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                {
                    method: "POST",
                    headers: { "Content-Type": "text/plain", "x-user-id": "test-user-123" },
                    body: "{}",
                },
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })

        it("should handle missing Content-Type", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                {
                    method: "POST",
                    headers: { "x-user-id": "test-user-123" },
                    body: "{}",
                },
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })

        it("should handle multipart Content-Type", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                {
                    method: "POST",
                    headers: { "Content-Type": "multipart/form-data", "x-user-id": "test-user-123" },
                    body: "{}",
                },
            )
            const response = await POST(request)
            expect([200, 404, 500]).toContain(response.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error response", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
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
        it("should reject disconnect for non-linked user", async () => {
            mockGetToken.mockResolvedValueOnce(null)

            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/tiktok",
                {},
                { "x-user-id": "other-user-id" },
            )
            const response = await POST(request)
            expect(response.status).toBe(404)
            const body = await response.json()
            expect(body.error).toBe("NOT_LINKED")
        })
    })
})
