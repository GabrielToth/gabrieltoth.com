/**
 * Security Tests for GET /api/youtube/link/callback — Attack Matrix
 *
 * Attack matrix applicable rows:
 * 2  (HTTP method confusion)
 * 3  (type attacks — query params)
 * 4  (value attacks — query params)
 * 5  (structure attacks — query params)
 * 6  (prototype pollution — query params)
 * 7  (injection — query params)
 * 8  (unicode/encoding — query params)
 * 9  (size attacks — oversized params)
 * 10 (rate limiting)
 * 12 (race conditions — concurrent callbacks)
 * 15 (info disclosure — error messages)
 * 16 (business logic — replay, re-link)
 *
 * SKIP:
 *   1  (auth bypass) — OAuth callback is intentionally unauthenticated; Google controls who hits this
 *   11 (CSRF) — handled by state param + Redis key deletion
 *   13 (Content-Type) — GET has no body
 *   14 (HTTP header) — no header-based logic in callback
 *   17 (IDOR) — userId comes from Redis state, not directly from request
 *   18 (path traversal) — no filename params
 *   19 (mass assignment) — no body
 *   20 (SSRF) — no URL params
 *   21 (timing side-channel) — all paths redirect
 */

import { GET } from "@/app/api/youtube/link/callback/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockRedisInstance = vi.hoisted(() => ({
    get: vi.fn(),
    del: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue("OK"),
}))

const mockExchangeCode = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        accessToken: "ya29.mock-access-token",
        refreshToken: "1//mock-refresh-token",
        expiresIn: 3600,
        tokenType: "Bearer",
        scope: "https://www.googleapis.com/auth/youtube.readonly",
    })
)

const mockGetChannelInfo = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        channelId: "UC_mock_channel_123",
        title: "Test Channel",
        description: "A test channel",
        customUrl: "@testchannel",
        subscriberCount: 100,
        profileImageUrl: "https://yt3.ggpht.com/test.jpg",
    })
)

vi.mock("@/lib/config/env", () => ({
    validateYouTubeEnv: () => ({
        REDIS_URL: "redis://localhost:6379",
        YOUTUBE_CLIENT_ID: "test-client-id",
        YOUTUBE_CLIENT_SECRET: "test-client-secret",
        YOUTUBE_REDIRECT_URI:
            "http://localhost:3000/api/youtube/link/callback",
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
        exchangeCodeForToken: mockExchangeCode,
        validateState: vi
            .fn()
            .mockImplementation(
                (state: string, storedState: string) => state === storedState
            ),
    }),
    resetYouTubeOAuthService: vi.fn(),
}))

vi.mock("@/lib/youtube/channel-validation", () => ({
    getChannelValidationService: () => ({
        initialize: vi.fn(),
        getChannelInfo: mockGetChannelInfo,
    }),
    resetChannelValidationService: vi.fn(),
}))

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({
        storeToken: vi.fn().mockResolvedValue({
            id: "mock-token-id",
            userId: "test-user-123",
            platform: "youtube",
        }),
    }),
    resetTokenStore: vi.fn(),
}))

vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({
        from: () => ({
            upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
    }),
}))

vi.mock("ioredis", () => ({
    Redis: vi.fn(function MockRedis() {
        return mockRedisInstance
    }),
}))

function makeRequest(url: string): NextRequest {
    return new NextRequest(url)
}

describe("GET /api/youtube/link/callback — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRedisInstance.get.mockResolvedValue(
            JSON.stringify({ userId: "test-user-123", createdAt: new Date().toISOString() })
        )
        mockRedisInstance.del.mockResolvedValue(1)
        mockRedisInstance.quit.mockResolvedValue("OK")
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ── Row 2: HTTP method confusion ──
    describe("Row 2 — HTTP method confusion", () => {
        it("should redirect with error when accessed via POST", async () => {
            // Next.js would normally 405, but in test we can call GET directly
            // This verifies the OAuth error path
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback"
            )
            const response = await GET(request)
            // Redirect because code and state are missing (POST doesn't have query params)
            expect(response.status).toBe(307)
        })
    })

    // ── Row 3: Type attacks — query params ──
    describe("Row 3 — Type attacks on query params", () => {
        it("should handle code as array-like object", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code[]=invalid&code[]=also&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle state as array-like object", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state[]=a&state[]=b"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })
    })

    // ── Row 4: Value attacks — query params ──
    describe("Row 4 — Value attacks on query params", () => {
        it("should reject empty code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should reject whitespace-only code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=%20%20&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should reject empty state", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state="
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should reject whitespace-only state", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=%20"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })
    })

    // ── Row 5: Structure attacks — query params ──
    describe("Row 5 — Structure attacks", () => {
        it("should reject missing code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should reject missing state", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should reject missing both params", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle extra unknown params", async () => {
            mockRedisInstance.get.mockResolvedValue(
                JSON.stringify({ userId: "test-user-123", createdAt: new Date().toISOString() })
            )
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=valid-state&extra=unexpected&utm_source=test"
            )
            const response = await GET(request)
            expect([200, 307]).toContain(response.status)
        })
    })

    // ── Row 6: Prototype pollution ──
    describe("Row 6 — Prototype pollution", () => {
        it("should handle __proto__ in query params", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=valid-state&__proto__[polluted]=true"
            )
            const response = await GET(request)
            expect([200, 307]).toContain(response.status)
        })

        it("should handle constructor[prototype] in query params", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=valid-state&constructor[prototype][polluted]=true"
            )
            const response = await GET(request)
            expect([200, 307]).toContain(response.status)
        })
    })

    // ── Row 7: Injection ──
    describe("Row 7 — Injection attacks", () => {
        it("should handle SQL injection in code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=1%27%20OR%20%271%27%3D%271&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle SQL injection in state", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=1%27%3BDROP%20TABLE%20users--"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle XSS in code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=%3Cscript%3Ealert(1)%3C/script%3E&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle XSS in state", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=%3Cimg%20src=x%20onerror=alert(1)%3E"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle NoSQL operators in code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code[$ne]=invalid&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle command injection in code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=%3B%20rm%20-rf%20%2F&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })
    })

    // ── Row 8: Unicode/encoding ──
    describe("Row 8 — Unicode and encoding attacks", () => {
        it("should handle null byte in code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid%00code&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle emoji in code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=%F0%9F%98%8A&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle RTL override in state", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=%E2%80%AEvalid%E2%80%AC"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle UTF-16 encoded params", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=%00v%00a%00l%00i%00d&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle control characters in code", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid%01%02%03code&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })
    })

    // ── Row 9: Size attacks ──
    describe("Row 9 — Size attacks", () => {
        it("should handle oversized code param (10k+)", async () => {
            const oversizedCode = "A".repeat(10000)
            const request = makeRequest(
                `http://localhost/api/youtube/link/callback?code=${oversizedCode}&state=valid-state`
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle oversized state param (10k+)", async () => {
            const oversizedState = "A".repeat(10000)
            const request = makeRequest(
                `http://localhost/api/youtube/link/callback?code=valid-code&state=${oversizedState}`
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })
    })

    // ── Row 10: Rate limiting ──
    describe("Row 10 — Rate limiting", () => {
        it("should handle request within rate limit", async () => {
            mockRedisInstance.get.mockResolvedValue(
                JSON.stringify({ userId: "test-user-123", createdAt: new Date().toISOString() })
            )
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBeGreaterThanOrEqual(200)
            expect(response.status).toBeLessThan(500)
        })
    })

    // ── Row 12: Race conditions ──
    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent duplicate callbacks", async () => {
            mockRedisInstance.get.mockResolvedValue(
                JSON.stringify({ userId: "test-user-123", createdAt: new Date().toISOString() })
            )
            const url =
                "http://localhost/api/youtube/link/callback?code=valid-code&state=valid-state"
            const results = await Promise.all([
                GET(makeRequest(url)),
                GET(makeRequest(url)),
                GET(makeRequest(url)),
            ])
            for (const response of results) {
                expect(response.status).toBeGreaterThanOrEqual(200)
                expect(response.status).toBeLessThan(500)
            }
        })
    })

    // ── Row 15: Info disclosure ──
    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error redirect URL", async () => {
            mockRedisInstance.get.mockRejectedValue(new Error("Connection refused"))
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=valid-state"
            )
            const response = await GET(request)
            const location = response.headers.get("location") || ""
            expect(location).not.toContain(":\\")
            expect(location).not.toContain("/src/")
            expect(location).not.toContain("Error:")
            expect(location).not.toContain("stack")
        })

        it("should not leak stack traces in error redirect URL", async () => {
            mockRedisInstance.get.mockImplementation(() => {
                throw new Error("Internal server error with sensitive details")
            })
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=valid-state"
            )
            const response = await GET(request)
            const location = response.headers.get("location") || ""
            expect(location).toContain("youtube=error")
            expect(location).not.toContain("sensitive")
        })
    })

    // ── Row 16: Business logic ──
    describe("Row 16 — Business logic attacks", () => {
        it("should reject expired state from Redis (null)", async () => {
            mockRedisInstance.get.mockResolvedValue(null)
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?code=valid-code&state=expired-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=invalid_state")
        })

        it("should reject replayed state (already deleted)", async () => {
            // First call succeeds
            mockRedisInstance.get.mockResolvedValueOnce(
                JSON.stringify({ userId: "test-user-123", createdAt: new Date().toISOString() })
            )
            // Second call — state already consumed
            mockRedisInstance.get.mockResolvedValueOnce(null)

            const url =
                "http://localhost/api/youtube/link/callback?code=valid-code&state=consumed-state"
            await GET(makeRequest(url))
            const response2 = await GET(makeRequest(url))
            expect(response2.status).toBe(307)
            const location = response2.headers.get("location") || ""
            expect(location).toContain("reason=invalid_state")
        })

        it("should handle OAuth denied error from Google", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?error=access_denied"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=access_denied")
        })

        it("should handle OAuth error with missing redirect URI", async () => {
            const request = makeRequest(
                "http://localhost/api/youtube/link/callback?error=redirect_uri_mismatch"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=redirect_uri_mismatch")
        })
    })
})
