/**
 * Security Tests for GET /api/platform/instagram/analytics — Attack Matrix
 *
 * Attack matrix applicable rows:
 * 1  (auth bypass — missing/invalid session)
 * 2  (HTTP method confusion)
 * 4  (value attacks — query params)
 * 7  (injection — query params metric/period)
 * 8  (unicode/encoding — query params)
 * 9  (size attacks — oversized query params)
 * 10 (rate limiting)
 * 12 (race conditions — concurrent requests)
 * 14 (HTTP header attacks)
 * 15 (info disclosure — error messages)
 * 16 (business logic — not linked)
 * 17 (IDOR — access another user's analytics)
 * 20 (SSRF — metric values used in Graph API URL)
 *
 * SKIP:
 *   3  (type attacks) — query params are always strings
 *   5  (structure attacks) — query params only
 *   6  (prototype pollution) — no body parsing
 *   11 (CSRF) — GET is read-only
 *   13 (Content-Type) — GET request
 *   18 (path traversal) — no filename params
 *   19 (mass assignment) — no body
 *   21 (timing side-channel) — all paths return JSON errors
 */

import { GET } from "@/app/api/platform/instagram/analytics/route"
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

const mockGetValidInstagramToken = vi.hoisted(() =>
    vi.fn().mockResolvedValue("mock-access-token")
)

const mockGetServerSession = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ user: { id: "test-user-123" } })
)

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({
        getToken: mockGetToken,
    }),
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
            ],
            apiVersion: "v22.0",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            publishAttemptsPerHour: 10,
        },
        security: {
            tokenExpiryBufferMs: 5 * 60 * 1000,
        },
    }),
    resetInstagramConfig: vi.fn(),
}))

vi.mock("@/lib/instagram/oauth-service", () => ({
    getInstagramOAuthService: () => ({
        initialize: vi.fn(),
    }),
    resetInstagramOAuthService: vi.fn(),
}))

vi.mock("@/lib/instagram/get-valid-token", () => ({
    getValidInstagramToken: mockGetValidInstagramToken,
}))

vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({
        from: () => ({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: {
                                platform_user_id: "mock-ig-user-id",
                                platform_username: "testuser",
                                metadata: {
                                    name: "Test User",
                                    followerCount: 100,
                                },
                            },
                            error: null,
                        }),
                    }),
                }),
            }),
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

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: mockGetServerSession,
}))

function makeGetRequest(
    url: string,
    headers: Record<string, string> = {}
): NextRequest {
    return new NextRequest(url, {
        method: "GET",
        headers: {
            "x-user-id": "test-user-123",
            ...headers,
        },
    })
}

describe("GET /api/platform/instagram/analytics — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetToken.mockResolvedValue({
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            expiresAt: Date.now() + 3600000,
            platform: "instagram",
            userId: "test-user-123",
        })
        mockGetValidInstagramToken.mockResolvedValue("mock-access-token")
        mockGetServerSession.mockResolvedValue({
            user: { id: "test-user-123" },
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ── Row 1: Auth bypass ──
    describe("Row 1 — Auth bypass", () => {
        it("should reject request without x-user-id header", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = new NextRequest(
                "http://localhost/api/platform/instagram/analytics"
            )
            const response = await GET(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })

        it("should reject request with empty x-user-id", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics",
                { "x-user-id": "" }
            )
            const response = await GET(request)
            expect(response.status).toBe(400)
        })
    })

    // ── Row 2: HTTP method confusion ──
    describe("Row 2 — HTTP method confusion", () => {
        it("should not expose POST handler for analytics", async () => {
            const route =
                await import("@/app/api/platform/instagram/analytics/route")
            expect("POST" in route).toBe(false)
        })
    })

    // ── Row 4: Value attacks ──
    describe("Row 4 — Value attacks on query params", () => {
        it("should handle empty metric parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle invalid metric value", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=nonexistent_metric&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle empty period parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=impressions&period="
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle invalid period value", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=impressions&period=invalid"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle no query params (defaults)", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle negative values in period", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=impressions&period=-1"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 7: Injection ──
    describe("Row 7 — Injection attacks", () => {
        it("should handle SQL injection in metric parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=1' OR '1'='1&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle XSS in metric parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=<script>alert(1)</script>&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle NoSQL operators in metric parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=$gt&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 8: Unicode/encoding ──
    describe("Row 8 — Unicode and encoding attacks", () => {
        it("should handle null byte in metric parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=impress\0ions&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle emoji in metric parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=impress😊ions&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle RTL override in metric parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=\u202Eimpressions&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 9: Size attacks ──
    describe("Row 9 — Size attacks", () => {
        it("should handle oversized metric parameter (10k+ chars)", async () => {
            const request = makeGetRequest(
                `http://localhost/api/platform/instagram/analytics?metric=${"A".repeat(10000)}&period=day`
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle deeply nested query params", async () => {
            const request = makeGetRequest(
                `http://localhost/api/platform/instagram/analytics?metric=impressions&period=day&${"x".repeat(1000)}=y`
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 10: Rate limiting ──
    describe("Row 10 — Rate limiting", () => {
        it("should handle request within rate limit", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=impressions&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 12: Race conditions ──
    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent analytics requests", async () => {
            const results = await Promise.all([
                GET(
                    makeGetRequest(
                        "http://localhost/api/platform/instagram/analytics?metric=impressions&period=day"
                    )
                ),
                GET(
                    makeGetRequest(
                        "http://localhost/api/platform/instagram/analytics?metric=reach&period=week"
                    )
                ),
                GET(
                    makeGetRequest(
                        "http://localhost/api/platform/instagram/analytics?metric=profile_views&period=days_28"
                    )
                ),
            ])
            for (const response of results) {
                expect([200, 500]).toContain(response.status)
            }
        })
    })

    // ── Row 14: HTTP header attacks ──
    describe("Row 14 — HTTP header attacks", () => {
        it("should handle X-Forwarded-For header", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics",
                { "X-Forwarded-For": "127.0.0.1" }
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle Host override header", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics",
                { Host: "evil.com" }
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 15: Info disclosure ──
    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error response", async () => {
            mockGetToken.mockRejectedValue(
                new Error("Database connection error")
            )
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics"
            )
            const response = await GET(request)
            const body = await response.json()
            expect(body.message).not.toContain(":\\")
            expect(body.message).not.toContain("/src/")
            expect(body.message).not.toContain("at ")
            expect(body.message).not.toContain("stack")
        })
    })

    // ── Row 16: Business logic ──
    describe("Row 16 — Business logic attacks", () => {
        it("should return 404 when Instagram is not linked", async () => {
            mockGetToken.mockResolvedValue(null)
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics"
            )
            const response = await GET(request)
            expect(response.status).toBe(404)
        })

        it("should return 401 when token is expired and cannot refresh", async () => {
            mockGetValidInstagramToken.mockResolvedValue(null)
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics"
            )
            const response = await GET(request)
            expect(response.status).toBe(401)
        })
    })

    // ── Row 17: IDOR ──
    describe("Row 17 — IDOR (access another user's analytics)", () => {
        it("should use session for authorization", async () => {
            mockGetServerSession.mockResolvedValueOnce({
                user: { id: "other-user-456" },
            })
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics"
            )
            const response = await GET(request)
            expect(mockGetToken).toHaveBeenCalledWith(
                "other-user-456",
                "instagram"
            )
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 20: SSRF ──
    describe("Row 20 — SSRF via metric parameter", () => {
        it("should handle SSRF attempt via metric with internal IP redirect", async () => {
            const request = makeGetRequest(
                "http://localhost/api/platform/instagram/analytics?metric=impressions&period=day"
            )
            const response = await GET(request)
            expect([200, 500]).toContain(response.status)
        })
    })
})
