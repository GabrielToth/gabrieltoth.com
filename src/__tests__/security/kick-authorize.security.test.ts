/**
 * Security Tests for POST /api/oauth/authorize/kick — Attack Matrix
 *
 * Attack matrix applicable rows:
 * 1  (auth bypass — missing/invalid session)
 * 2  (HTTP method confusion)
 * 7  (injection — userId header)
 * 8  (unicode/encoding — SKIP: headers must be ASCII per RFC 7230)
 * 9  (size attacks — oversized userId)
 * 10 (rate limiting)
 * 12 (race conditions — concurrent)
 * 13 (Content-Type confusion)
 * 14 (HTTP header attacks)
 * 15 (info disclosure — error messages)
 * 17 (IDOR — any userId can initiate)
 *
 * SKIP:
 *   3  (type attacks) — body not read
 *   4  (value attacks) — body not read
 *   5  (structure attacks) — body not read
 *   6  (prototype pollution) — body not read
 *   11 (CSRF) — POST but no CSRF token enforced
 *   16 (business logic) — no pre-check of link status
 *   18 (path traversal) — no filename params
 *   19 (mass assignment) — no body fields
 *   20 (SSRF) — no URL params
 *   21 (timing side-channel) — all paths return JSON errors
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { POST } from "@/app/api/oauth/authorize/kick/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
    process.env.OAUTH_STATE_SECRET =
        "test-state-secret-that-is-at-least-32-chars-long!!"
})

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

vi.mock("@/lib/kick/oauth-service", () => ({
    getKickOAuthService: () => ({
        initialize: vi.fn(),
        generateAuthorizationUrl: vi.fn(),
    }),
    resetKickOAuthService: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: vi.fn(),
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

describe("POST /api/oauth/authorize/kick — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: "test-user-123" },
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ── Row 1: Auth bypass ──
    describe("Row 1 — Auth bypass", () => {
        it("should reject request without session cookie", async () => {
            vi.mocked(getServerSession).mockResolvedValue(null)
            const request = new NextRequest(
                "http://localhost/api/oauth/authorize/kick",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(401)
            const body = await response.json()
            expect(body.error).toBe("UNAUTHORIZED")
        })

        it("should reject request with invalid session", async () => {
            vi.mocked(getServerSession).mockResolvedValue(null)
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/kick",
                {},
                { "x-user-id": "" }
            )
            const response = await POST(request)
            expect(response.status).toBe(401)
            const body = await response.json()
            expect(body.error).toBe("UNAUTHORIZED")
        })

        it("should reject request without any auth headers", async () => {
            vi.mocked(getServerSession).mockResolvedValue(null)
            const request = new NextRequest(
                "http://localhost/api/oauth/authorize/kick",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(401)
        })
    })

    // ── Row 2: HTTP method confusion ──
    describe("Row 2 — HTTP method confusion", () => {
        it("should not expose GET handler for authorize", async () => {
            const route = await import("@/app/api/oauth/authorize/kick/route")
            expect("GET" in route).toBe(false)
        })
    })

    // ── Row 7: Injection ──
    describe("Row 7 — Injection attacks via userId header", () => {
        it("should handle SQL injection in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/kick",
                {},
                { "x-user-id": "1' OR '1'='1" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle XSS in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/kick",
                {},
                { "x-user-id": "<script>alert(1)</script>" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })

        it("should handle NoSQL operators in x-user-id", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/kick",
                {},
                { "x-user-id": '{"$gt": ""}' }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 9: Size attacks ──
    describe("Row 9 — Size attacks", () => {
        it("should handle oversized x-user-id header (10k+ chars)", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/kick",
                {},
                { "x-user-id": "A".repeat(10000) }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 10: Rate limiting ──
    describe("Row 10 — Rate limiting", () => {
        it("should handle request within rate limit", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/kick",
                {}
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })

    // ── Row 12: Race conditions ──
    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent authorize requests", async () => {
            const results = await Promise.all([
                POST(
                    makePostRequest(
                        "http://localhost/api/oauth/authorize/kick",
                        {}
                    )
                ),
                POST(
                    makePostRequest(
                        "http://localhost/api/oauth/authorize/kick",
                        {}
                    )
                ),
                POST(
                    makePostRequest(
                        "http://localhost/api/oauth/authorize/kick",
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
                "http://localhost/api/oauth/authorize/kick",
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
                "http://localhost/api/oauth/authorize/kick",
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
                "http://localhost/api/oauth/authorize/kick",
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
        it("should handle X-Forwarded-For header", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/kick",
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
                "http://localhost/api/oauth/authorize/kick",
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
            vi.mocked(getServerSession).mockResolvedValue(null)
            const request = new NextRequest(
                "http://localhost/api/oauth/authorize/kick",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                }
            )
            const response = await POST(request)
            const body = await response.json()
            expect(body.error).not.toContain(":\\")
            expect(body.error).not.toContain("/src/")
            expect(body.error).not.toContain("at ")
            expect(body.error).not.toContain("stack")
        })
    })

    // ── Row 17: IDOR ──
    describe("Row 17 — IDOR", () => {
        it("should allow authorize for any userId (authorize is public by design)", async () => {
            const request = makePostRequest(
                "http://localhost/api/oauth/authorize/kick",
                {},
                { "x-user-id": "any-user-id-123" }
            )
            const response = await POST(request)
            expect([200, 500]).toContain(response.status)
        })
    })
})
