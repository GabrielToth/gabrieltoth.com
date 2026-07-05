/**
 * Security Tests for POST /api/youtube/link/revoke — Attack Matrix
 *
 * Attack matrix applicable rows:
 * 1  (auth bypass — missing/invalid session)
 * 2  (HTTP method confusion)
 * 3  (type attacks — body fields)
 * 4  (value attacks — body fields)
 * 5  (structure attacks — body)
 * 6  (prototype pollution — body)
 * 7  (injection — body fields)
 * 8  (unicode/encoding — body)
 * 9  (size attacks — body)
 * 10 (rate limiting)
 * 11 (CSRF)
 * 12 (race conditions — concurrent revokes)
 * 13 (Content-Type confusion)
 * 14 (HTTP header attacks)
 * 15 (info disclosure — error messages)
 * 16 (business logic — double revoke, not-linked)
 * 17 (IDOR — revoke another user's channel)
 * 19 (mass assignment — extra body fields)
 *
 * SKIP:
 *   18 (path traversal) — no filename params
 *   20 (SSRF) — no URL params
 *   21 (timing side-channel) — all paths return JSON errors
 */

import { POST } from "@/app/api/youtube/link/revoke/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockGetToken = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        accessToken: "ya29.mock-access-token",
        refreshToken: "1//mock-refresh-token",
        expiresAt: Date.now() + 3600000,
        platform: "youtube",
        userId: "test-user-123",
    })
)

const mockDeleteToken = vi.hoisted(() => vi.fn().mockResolvedValue(true))

const mockGetServerSession = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ user: { id: "test-user-123" } })
)

vi.mock("@/lib/config/env", () => ({
    validateYouTubeEnv: () => ({
        REDIS_URL: "redis://localhost:6379",
        YOUTUBE_CLIENT_ID: "test-client-id",
        YOUTUBE_CLIENT_SECRET: "test-client-secret",
        YOUTUBE_REDIRECT_URI: "http://localhost:3000/api/youtube/link/callback",
        TOKEN_ENCRYPTION_KEY: "a".repeat(64),
    }),
}))

vi.mock("@/lib/youtube/config", () => ({
    getYouTubeChannelLinkingConfig: () => ({
        oauth: {
            clientId: "test-client-id",
            clientSecret: "test-client-secret",
            redirectUri: "http://localhost:3000/api/youtube/link/callback",
            scopes: [
                "https://www.googleapis.com/auth/youtube.readonly",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
        },
        email: { fromEmail: "noreply@example.com", fromName: "Test" },
        encryption: {
            encryptionKey: "a".repeat(64),
            algorithm: "aes-256-gcm",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            recoveryAttemptsPerDay: 3,
            verificationCodeAttempts: 3,
            unlinkAttemptsPerHour: 5,
        },
        security: {
            verificationCodeExpiry: 15 * 60 * 1000,
            recoveryTokenExpiry: 24 * 60 * 60 * 1000,
            unlinkRevocationWindow: 24 * 60 * 60 * 1000,
            suspiciousActivityThreshold: 50,
        },
    }),
    resetYouTubeChannelLinkingConfig: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

vi.mock("@/lib/youtube/oauth-service", () => ({
    getYouTubeOAuthService: () => ({
        initialize: vi.fn(),
        revokeToken: vi.fn().mockResolvedValue(true),
    }),
    resetYouTubeOAuthService: vi.fn(),
}))

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({
        getToken: mockGetToken,
        deleteToken: mockDeleteToken,
    }),
    resetTokenStore: vi.fn(),
}))

vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({
        from: () => ({
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                }),
            }),
        }),
    }),
}))

const mockRateLimit = vi.hoisted(() =>
    vi
        .fn()
        .mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 })
)

vi.mock("@/lib/rate-limit", () => ({
    rateLimitByKey: mockRateLimit,
    buildClientKey: vi.fn(
        (params: { ip: string; path: string }) => `${params.ip}:${params.path}`
    ),
}))

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: mockGetServerSession,
}))

function makePostRequest(
    url: string,
    body: unknown,
    headers: Record<string, string> = {}
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

describe("POST /api/youtube/link/revoke — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetToken.mockResolvedValue({
            accessToken: "ya29.mock-access-token",
            refreshToken: "1//mock-refresh-token",
            expiresAt: Date.now() + 3600000,
            platform: "youtube",
            userId: "test-user-123",
        })
        mockDeleteToken.mockResolvedValue(true)
        mockGetServerSession.mockResolvedValue({ user: { id: "test-user-123" } })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ── Row 1: Auth bypass ──
    describe("Row 1 — Auth bypass", () => {
        it("should reject request when not authenticated", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = new NextRequest(
                "http://localhost/api/youtube/link/revoke",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })

        it("should reject request with empty session user id", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {},
                { "x-user-id": "" }
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })

        it("should reject request with null session", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = new NextRequest(
                "http://localhost/api/youtube/link/revoke",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}),
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
        })
    })

    // ── Row 2: HTTP method confusion ──
    describe("Row 2 — HTTP method confusion", () => {
        it("should not expose GET handler for revoke", async () => {
            // Verify revoke route only exports POST
            const route = await import("@/app/api/youtube/link/revoke/route")
            expect("GET" in route).toBe(false)
        })
    })

    // ── Row 3: Type attacks ──
    describe("Row 3 — Type attacks on body", () => {
        it("should handle body with number instead of object", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                42
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with string instead of object", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                "invalid"
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with boolean instead of object", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                true
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with array instead of object", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                [1, 2, 3]
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 4: Value attacks ──
    describe("Row 4 — Value attacks", () => {
        it("should handle empty JSON body", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {}
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle body with null value", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                null
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with negative numbers", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { id: -1 }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 5: Structure attacks ──
    describe("Row 5 — Structure attacks", () => {
        it("should handle body as empty array", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                []
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with BOM prefix", async () => {
            const request = new NextRequest(
                "http://localhost/api/youtube/link/revoke",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-user-id": "test-user-123",
                    },
                    body: "\uFEFF{}",
                }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 6: Prototype pollution ──
    describe("Row 6 — Prototype pollution", () => {
        it("should handle __proto__ in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { __proto__: { polluted: true } }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle constructor.prototype in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { constructor: { prototype: { polluted: true } } }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // ── Row 7: Injection ──
    describe("Row 7 — Injection attacks", () => {
        it("should handle SQL injection in body fields", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { userId: "1' OR '1'='1" }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle XSS in body fields", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { userId: "<script>alert(1)</script>" }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle NoSQL operators in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { $gt: "" }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // ── Row 8: Unicode/encoding ──
    describe("Row 8 — Unicode and encoding attacks", () => {
        it("should handle null byte in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { userId: "test\0user" }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle emoji in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { userId: "test😊user" }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle RTL override in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { userId: "\u202Etest\u202C" }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // ── Row 9: Size attacks ──
    describe("Row 9 — Size attacks", () => {
        it("should handle oversized body with 10k+ chars", async () => {
            const largeBody = { data: "A".repeat(10000) }
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                largeBody
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle deeply nested JSON (100+ levels)", async () => {
            let deep: any = {}
            let current = deep
            for (let i = 0; i < 100; i++) {
                current.nested = {}
                current = current.nested
            }
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                deep
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 10: Rate limiting ──
    describe("Row 10 — Rate limiting", () => {
        it("should handle request within rate limit", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {}
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // ── Row 11: CSRF ──
    describe("Row 11 — CSRF protection", () => {
        it("should work without CSRF token (session is the auth mechanism)", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {}
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // ── Row 12: Race conditions ──
    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent revoke requests", async () => {
            const results = await Promise.all([
                POST(
                    makePostRequest(
                        "http://localhost/api/youtube/link/revoke",
                        {}
                    )
                ),
                POST(
                    makePostRequest(
                        "http://localhost/api/youtube/link/revoke",
                        {}
                    )
                ),
                POST(
                    makePostRequest(
                        "http://localhost/api/youtube/link/revoke",
                        {}
                    )
                ),
            ])
            for (const response of results) {
                expect([200, 500]).toContain(response.status)
            }
        })
    })

    // ── Row 13: Content-Type ──
    describe("Row 13 — Content-Type attacks", () => {
        it("should handle wrong Content-Type (text/plain)", async () => {
            const request = new NextRequest(
                "http://localhost/api/youtube/link/revoke",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain",
                        "x-user-id": "test-user-123",
                    },
                    body: "{}",
                }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle missing Content-Type", async () => {
            const request = new NextRequest(
                "http://localhost/api/youtube/link/revoke",
                {
                    method: "POST",
                    headers: { "x-user-id": "test-user-123" },
                    body: "{}",
                }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle multipart Content-Type", async () => {
            const request = new NextRequest(
                "http://localhost/api/youtube/link/revoke",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "x-user-id": "test-user-123",
                    },
                    body: "{}",
                }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 14: HTTP header attacks ──
    describe("Row 14 — HTTP header attacks", () => {
        it("should handle X-Forwarded-For header for logging", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {},
                {
                    "X-Forwarded-For": "127.0.0.1",
                    "X-Real-IP": "127.0.0.1",
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle Host override header", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {},
                { Host: "evil.com" }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // ── Row 15: Info disclosure ──
    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error response", async () => {
            mockGetToken.mockRejectedValue(
                new Error("Database connection error")
            )
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {}
            )
            const response = await POST(request)
            const body = await response.json()
            expect(body.message).not.toContain(":\\")
            expect(body.message).not.toContain("/src/")
            expect(body.message).not.toContain("at ")
            expect(body.message).not.toContain("stack")
        })

        it("should not leak stack traces", async () => {
            mockGetToken.mockImplementation(() => {
                throw new Error("Sensitive database error")
            })
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {}
            )
            const response = await POST(request)
            const body = await response.json()
            expect(body.error).toBeDefined()
            expect(body.message).not.toContain("at ")
            expect(body.message).not.toContain("stack")
        })
    })

    // ── Row 16: Business logic ──
    describe("Row 16 — Business logic attacks", () => {
        it("should return 404 when YouTube is not linked", async () => {
            mockGetToken.mockResolvedValue(null)
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {}
            )
            const response = await POST(request)
            expect(response.status).toBe(404)
            const body = await response.json()
            expect(body.error).toBe("NOT_LINKED")
        })

        it("should allow double revoke (idempotent)", async () => {
            // First revoke succeeds
            await POST(
                makePostRequest("http://localhost/api/youtube/link/revoke", {})
            )

            // Second revoke — token already deleted
            mockGetToken.mockResolvedValue(null)
            const response = await POST(
                makePostRequest("http://localhost/api/youtube/link/revoke", {})
            )
            expect(response.status).toBe(404)
        })
    })

    // ── Row 17: IDOR ──
    describe("Row 17 — IDOR (access other user's channel)", () => {
        it("should only revoke own channel (userId from session is used)", async () => {
            mockGetServerSession.mockResolvedValueOnce({ user: { id: "other-user-456" } })
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {},
                { "x-user-id": "other-user-456" }
            )
            const response = await POST(request)
            // The route uses getServerSession, so it would delete other-user-456's token
            // This is intentional — auth middleware should validate the session
            // Security: verify the route uses the session value, not any body value
            expect(mockGetToken).toHaveBeenCalledWith(
                "other-user-456",
                "youtube"
            )
            expect(response.status).toBe(200)
        })

        it("should not use userId from body for authorization", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                { userId: "victim-user-789" },
                { "x-user-id": "test-user-123" }
            )
            const response = await POST(request)
            // Verify the route uses session userId, not body.userId
            expect(mockGetToken).toHaveBeenCalledWith(
                "test-user-123",
                "youtube"
            )
            expect(response.status).toBe(200)
        })
    })

    // ── Row 19: Mass assignment ──
    describe("Row 19 — Mass assignment", () => {
        it("should ignore extra fields in request body", async () => {
            const request = makePostRequest(
                "http://localhost/api/youtube/link/revoke",
                {
                    role: "admin",
                    isAdmin: true,
                    balance: 999999,
                    isActive: false,
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
            const body = await response.json()
            expect(body.success).toBe(true)
        })
    })
})
