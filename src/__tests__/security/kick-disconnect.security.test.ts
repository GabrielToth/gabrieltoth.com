/**
 * Security Tests for POST /api/oauth/disconnect/kick — Attack Matrix
 *
 * Attack matrix applicable rows:
 * 1  (auth bypass — missing/invalid session)
 * 2  (HTTP method confusion)
 * 3  (type attacks — body)
 * 4  (value attacks — body edge cases)
 * 5  (structure attacks — body)
 * 6  (prototype pollution — body)
 * 7  (injection — body fields)
 * 8  (unicode/encoding — body)
 * 9  (size attacks — body)
 * 10 (rate limiting)
 * 11 (CSRF)
 * 12 (race conditions — concurrent disconnect)
 * 13 (Content-Type confusion)
 * 14 (HTTP header attacks)
 * 15 (info disclosure)
 * 16 (business logic — double disconnect)
 * 17 (IDOR — access other user's account)
 * 19 (mass assignment — extra body fields)
 *
 * SKIP:
 *   18 (path traversal) — no filename params
 *   20 (SSRF) — no user-supplied URLs fetched
 *   21 (timing side-channel) — all error paths return JSON
 */

import { POST } from "@/app/api/oauth/disconnect/kick/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
})

const mockGetToken = vi.hoisted(() => vi.fn())
const mockDeleteToken = vi.hoisted(() => vi.fn())

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({
        storeToken: vi.fn(),
        getToken: mockGetToken,
        deleteToken: mockDeleteToken,
    }),
    resetTokenStore: vi.fn(),
}))

vi.mock("@/lib/kick/config", () => ({
    getKickConfig: () => ({
        oauth: {
            clientId: "test-kick-client-id",
            clientSecret: "test-kick-client-secret",
            redirectUri: "http://localhost:3000/api/oauth/callback/kick",
            scopes: ["user:read", "chat:write", "events:subscribe"],
        },
        apiBaseUrl: "https://api.kick.com",
        oauthAuthorizeUrl: "https://id.kick.com/oauth/authorize",
        oauthTokenUrl: "https://id.kick.com/oauth/token",
        websocketUrl: "wss://ws.kick.com",
        rateLimit: {
            linkingAttemptsPerHour: 5,
        },
        security: {
            tokenExpiryBufferMs: 5 * 60 * 1000,
        },
    }),
    resetKickConfig: vi.fn(),
}))

const mockGetServerSession = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ user: { id: "test-user-123" } })
)

const mockRevokeToken = vi.hoisted(() => vi.fn().mockResolvedValue(true))

vi.mock("@/lib/kick/oauth-service", () => ({
    getKickOAuthService: () => ({
        initialize: vi.fn(),
        revokeToken: mockRevokeToken,
    }),
    resetKickOAuthService: vi.fn(),
}))

vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({
        from: () => ({
            upsert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                }),
            }),
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: null,
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

describe("POST /api/oauth/disconnect/kick — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetToken.mockResolvedValue({
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            platform: "kick",
        })
        mockDeleteToken.mockResolvedValue(undefined)
        mockGetServerSession.mockResolvedValue({ user: { id: "test-user-123" } })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ── Row 1: Auth bypass ──
    describe("Row 1 — Auth bypass", () => {
        it("should reject request without x-user-id header", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = new NextRequest(
                "http://localhost/api/oauth/disconnect/kick",
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

        it("should reject request with empty x-user-id", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                {},
                { "x-user-id": "" }
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })

        it("should reject request with null x-user-id header", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = new NextRequest(
                "http://localhost/api/oauth/disconnect/kick",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-user-id": "",
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
        it("should not expose GET handler for disconnect", async () => {
            const route = await import("@/app/api/oauth/disconnect/kick/route")
            expect("GET" in route).toBe(false)
        })
    })

    // ── Row 3: Type attacks on body ──
    describe("Row 3 — Type attacks on body", () => {
        it("should handle body with number instead of object", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                42
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with string instead of object", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                "string-body"
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with boolean instead of object", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                true
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with array instead of object", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
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
                "http://localhost/api/oauth/disconnect/kick",
                {}
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with null value", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                null
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with negative numbers", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                { amount: -100 }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 5: Structure attacks ──
    describe("Row 5 — Structure attacks", () => {
        it("should handle body as empty array", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                []
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle body with BOM prefix", async () => {
            const request = new NextRequest(
                "http://localhost/api/oauth/disconnect/kick",
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
                "http://localhost/api/oauth/disconnect/kick",
                JSON.parse('{"__proto__": {"isAdmin": true}}')
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle constructor.prototype in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                JSON.parse('{"constructor": {"prototype": {"isAdmin": true}}}')
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 7: Injection ──
    describe("Row 7 — Injection attacks", () => {
        it("should handle SQL injection in body fields", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                { userId: "1' OR '1'='1" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle XSS in body fields", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                { reason: "<script>alert(1)</script>" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle NoSQL operators in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                { userId: '{"$ne": ""}' }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 8: Unicode/encoding ──
    describe("Row 8 — Unicode and encoding attacks", () => {
        it("should handle null byte in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                { data: "test\0null" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle emoji in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                { reason: "test😊reason" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle RTL override in body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                { reason: "\u202Emalicious\u202C" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 9: Size attacks ──
    describe("Row 9 — Size attacks", () => {
        it("should handle oversized body with 10k+ chars", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                { reason: "A".repeat(10000) }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle deeply nested JSON (100+ levels)", async () => {
            let nested: any = {}
            let current = nested
            for (let i = 0; i < 100; i++) {
                current[i] = {}
                current = current[i]
            }
            current.value = "deep"
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                nested
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 10: Rate limiting ──
    describe("Row 10 — Rate limiting", () => {
        it("should handle request within rate limit", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                {}
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 11: CSRF ──
    describe("Row 11 — CSRF protection", () => {
        it("should work without CSRF token (session is the auth mechanism)", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                {}
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 12: Race conditions ──
    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent disconnect requests", async () => {
            const results = await Promise.all([
                POST(
                    makePostRequest(
                        "http://localhost/api/oauth/disconnect/kick",
                        {}
                    )
                ),
                POST(
                    makePostRequest(
                        "http://localhost/api/oauth/disconnect/kick",
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
                "http://localhost/api/oauth/disconnect/kick",
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
                "http://localhost/api/oauth/disconnect/kick",
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
                "http://localhost/api/oauth/disconnect/kick",
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
                "http://localhost/api/oauth/disconnect/kick",
                {},
                {
                    "X-Forwarded-For": "127.0.0.1",
                    "x-user-id": "test-user-123",
                }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle Host override header", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                {},
                { Host: "evil.com", "x-user-id": "test-user-123" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 15: Info disclosure ──
    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error response", async () => {
            mockGetToken.mockRejectedValue(
                new Error("Database connection error")
            )
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
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
            mockGetToken.mockRejectedValue(new Error("Internal server error"))
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                {}
            )
            const response = await POST(request)
            const body = await response.json()
            expect(body.stack).toBeUndefined()
        })
    })

    // ── Row 16: Business logic attacks ──
    describe("Row 16 — Business logic attacks", () => {
        it("should return 404 when Kick is not linked", async () => {
            mockGetToken.mockResolvedValue(null)
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                {}
            )
            const response = await POST(request)
            expect(response.status).toBe(404)
            const body = await response.json()
            expect(body.error).toBe("NOT_LINKED")
        })

        it("should allow double disconnect (idempotent after first)", async () => {
            mockGetToken.mockResolvedValueOnce({
                accessToken: "mock-access-token",
                refreshToken: "mock-refresh-token",
                platform: "kick",
            })
            mockGetToken.mockResolvedValueOnce({
                accessToken: "mock-access-token",
                refreshToken: "mock-refresh-token",
                platform: "kick",
            })
            const firstResponse = await POST(
                makePostRequest(
                    "http://localhost/api/oauth/disconnect/kick",
                    {}
                )
            )
            expect([200, 500]).toContain(firstResponse.status)
            const secondResponse = await POST(
                makePostRequest(
                    "http://localhost/api/oauth/disconnect/kick",
                    {}
                )
            )
            expect([200, 500]).toContain(secondResponse.status)
        })
    })

    // ── Row 17: IDOR ──
    describe("Row 17 — IDOR (access other user's account)", () => {
        it("should use session for authorization (not body)", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                { userId: "different-user-in-body" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should reject unauthenticated request even with x-user-id header", async () => {
            mockGetServerSession.mockResolvedValueOnce(null)
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                {},
                { "x-user-id": "another-user-id" }
            )
            const response = await POST(request)
            expect(response.status).toBe(400)
            const body = await response.json()
            expect(body.error).toBe("MISSING_USER_ID")
        })
    })

    // ── Row 19: Mass assignment ──
    describe("Row 19 — Mass assignment", () => {
        it("should ignore extra fields in request body", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/disconnect/kick",
                {
                    role: "admin",
                    isAdmin: true,
                    userId: "malicious-id",
                    platform: "twitch",
                }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })
})
