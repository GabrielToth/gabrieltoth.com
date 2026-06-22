import { GET } from "@/app/api/oauth/callback/facebook/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
})

const mockVerifyState = vi.hoisted(() => vi.fn())

vi.mock("@/lib/oauth/state-signer", () => ({
    verifyState: mockVerifyState,
}))

vi.mock("@/lib/facebook/config", () => ({
    getFacebookConfig: () => ({
        oauth: {
            appId: "test-app-id",
            appSecret: "test-app-secret",
            redirectUri: "http://localhost:3000/api/oauth/callback/facebook",
            scopes: [
                "pages_show_list",
                "pages_read_engagement",
                "pages_manage_posts",
                "pages_manage_metadata",
                "pages_read_user_content",
                "pages_manage_engagement",
                "public_profile",
            ],
            apiVersion: "v22.0",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            publishAttemptsPerHour: 10,
            liveAttemptsPerHour: 5,
        },
        security: {
            tokenExpiryBufferMs: 5 * 60 * 1000,
        },
    }),
    resetFacebookConfig: vi.fn(),
}))

const mockExchangeCodeForToken = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        expiresIn: 5184000,
        tokenType: "bearer",
    })
)

const mockGetCurrentUser = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        id: "mock-fb-user-id",
        name: "Test User",
        email: "test@example.com",
        pictureUrl: "https://example.com/pic.jpg",
    })
)

const mockGetUserPages = vi.hoisted(() =>
    vi.fn().mockResolvedValue([
        {
            id: "mock-page-id-1",
            name: "Test Page 1",
            category: "Website",
            accessToken: "mock-page-token-1",
            tasks: ["ADMINISTER", "EDIT_PROFILE", "CREATE_CONTENT"],
            pictureUrl: "https://example.com/page1.jpg",
            followerCount: 100,
        },
    ])
)

vi.mock("@/lib/facebook/oauth-service", () => ({
    getFacebookOAuthService: () => ({
        initialize: vi.fn(),
        generateAuthorizationUrl: vi.fn(),
        exchangeCodeForToken: mockExchangeCodeForToken,
        getCurrentUser: mockGetCurrentUser,
        getUserPages: mockGetUserPages,
        getPageAccessToken: vi.fn().mockResolvedValue("mock-page-token"),
        revokeToken: vi.fn().mockResolvedValue(true),
    }),
    resetFacebookOAuthService: vi.fn(),
}))

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({
        storeToken: vi.fn().mockResolvedValue({
            id: "mock-token-id",
            userId: "test-user-123",
            platform: "facebook",
            encryptedToken: "mock-encrypted",
            linkedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }),
        getToken: vi.fn().mockResolvedValue({
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            expiresAt: Date.now() + 3600000,
            platform: "facebook",
            userId: "test-user-123",
        }),
        deleteToken: vi.fn().mockResolvedValue(true),
    }),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

vi.mock("@supabase/supabase-js", () => {
    const mockFrom = vi.fn().mockReturnThis()
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })
    const mockEq = vi.fn().mockReturnThis()
    const mockUpdate = vi.fn().mockReturnThis()

    return {
        createClient: vi.fn(() => ({
            from: mockFrom.mockReturnThis(),
            upsert: mockUpsert,
            update: mockUpdate,
            eq: mockEq,
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    }
})

function makeGetRequest(
    url: string,
    headers: Record<string, string> = {}
): NextRequest {
    return new NextRequest(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    })
}

describe("GET /api/oauth/callback/facebook — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockVerifyState.mockReset()
        mockExchangeCodeForToken.mockClear()
        mockGetCurrentUser.mockClear()
        mockGetUserPages.mockClear()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("Row 1 — Auth bypass (state acts as CSRF token)", () => {
        it("should handle null state gracefully", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=missing_params")
        })

        it("should handle empty state gracefully", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state="
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=missing_params")
        })

        it("should reject request with mismatched platform in state", async () => {
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "test-user-123",
                    platform: "instagram",
                    nonce: "abc",
                    iat: Date.now(),
                },
            })
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=invalid-platform-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=invalid_state")
        })
    })

    describe("Row 2 — HTTP method confusion", () => {
        it("should not expose POST handler for callback", async () => {
            const route =
                await import("@/app/api/oauth/callback/facebook/route")
            expect("POST" in route).toBe(false)
        })

        it("should not expose PUT handler for callback", async () => {
            const route =
                await import("@/app/api/oauth/callback/facebook/route")
            expect("PUT" in route).toBe(false)
        })
    })

    describe("Row 3 — Type attacks (query params)", () => {
        it("should handle code as array-like string", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code[]=test&state=some-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle code as number string", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=12345&state=some-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })
    })

    describe("Row 4 — Value attacks", () => {
        it("should handle missing code parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?state=some-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=missing_params")
        })

        it("should handle empty code parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=&state=some-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=missing_params")
        })

        it("should handle whitespace-only code", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=++&state=some-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })
    })

    describe("Row 5 — Structure attacks", () => {
        it("should handle no query params at all", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=missing_params")
        })

        it("should handle duplicate code parameter", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=first&code=second&state=some-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })
    })

    describe("Row 6 — Prototype pollution", () => {
        it("should handle __proto__ as state param", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&__proto__[polluted]=true&state=valid"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })

        it("should handle constructor[prototype] as param", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&constructor[prototype][polluted]=true&state=valid"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
        })
    })

    describe("Row 7 — Injection", () => {
        it("should handle SQL injection in code", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=1' OR '1'='1&state=some-state"
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })

        it("should handle XSS in code param", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=<script>alert(1)</script>&state=some-state"
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })

        it("should handle NoSQL operators in code", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code[$gt]=&state=some-state"
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })

        it("should handle SQL injection in state", async () => {
            mockVerifyState.mockReturnValue({
                valid: false,
                payload: null,
                error: "Invalid state signature",
            })
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=1' OR '1'='1"
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })

        it("should handle command injection in code", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=$(cat /etc/passwd)&state=some-state"
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })
    })

    describe("Row 8 — Unicode/encoding", () => {
        it("should handle emoji in code param", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=🔑🔓&state=some-state"
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })

        it("should handle null byte in code", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test%00code&state=some-state"
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })

        it("should handle unicode normalization in state", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=café"
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })
    })

    describe("Row 9 — Size attacks", () => {
        it("should handle oversized code (10k+ chars)", async () => {
            const request = makeGetRequest(
                `http://localhost/api/oauth/callback/facebook?code=${"A".repeat(10000)}&state=some-state`
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })

        it("should handle oversized state (10k+ chars)", async () => {
            const request = makeGetRequest(
                `http://localhost/api/oauth/callback/facebook?code=test-code&state=${"A".repeat(10000)}`
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })

        it("should handle deep nested query params", async () => {
            const deepParam = "a".repeat(100) + "[" + "a".repeat(100) + "]"
            const request = makeGetRequest(
                `http://localhost/api/oauth/callback/facebook?code=test-code&state=valid&${deepParam}=value`
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })
    })

    describe("Row 10 — Rate limiting", () => {
        it("should handle single callback request", async () => {
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "test-user-123",
                    platform: "facebook",
                    nonce: "abc",
                    iat: Date.now() - 1000,
                },
            })
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=valid-state-token"
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })
    })

    describe("Row 11 — CSRF (state param IS the CSRF protection)", () => {
        it("should reject invalid state", async () => {
            mockVerifyState.mockReturnValue({
                valid: false,
                payload: null,
                error: "Invalid state signature",
            })
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=invalid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=invalid_state")
        })

        it("should reject expired state", async () => {
            mockVerifyState.mockReturnValue({
                valid: false,
                payload: null,
                error: "State token expired",
            })
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=expired-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=invalid_state")
        })

        it("should reject malformed state", async () => {
            mockVerifyState.mockReturnValue({
                valid: false,
                payload: null,
                error: "Invalid state format",
            })
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=malformed"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=invalid_state")
        })
    })

    describe("Row 12 — Race conditions", () => {
        it("should handle concurrent callback requests", async () => {
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "test-user-123",
                    platform: "facebook",
                    nonce: "abc",
                    iat: Date.now() - 1000,
                },
            })
            const requests = Array.from({ length: 5 }, () =>
                makeGetRequest(
                    "http://localhost/api/oauth/callback/facebook?code=test-code&state=valid-state"
                )
            )
            const results = await Promise.all(requests.map(r => GET(r)))
            for (const response of results) {
                expect([307, 500]).toContain(response.status)
            }
        })
    })

    describe("Row 14 — HTTP header attacks", () => {
        it("should handle X-Forwarded-For header", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=some-state",
                { "X-Forwarded-For": "127.0.0.1" }
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })

        it("should handle Host override header", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=some-state",
                { Host: "evil.com" }
            )
            const response = await GET(request)
            expect([307, 500]).toContain(response.status)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in redirect location", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook"
            )
            const response = await GET(request)
            const location = response.headers.get("location") || ""
            expect(location).not.toContain(":\\")
            expect(location).not.toContain("/src/")
            expect(location).not.toContain("at ")
        })

        it("should not expose stack traces on error", async () => {
            mockExchangeCodeForToken.mockRejectedValueOnce(
                new Error("Internal server error")
            )
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "test-user-123",
                    platform: "facebook",
                    nonce: "abc",
                    iat: Date.now() - 1000,
                },
            })
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=server_error")
            expect(location).not.toContain("stack")
        })
    })

    describe("Row 16 — Business logic", () => {
        it("should handle OAuth error from Facebook", async () => {
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?error=access_denied&error_description=User+denied"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=access_denied")
        })

        it("should handle no pages found", async () => {
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "test-user-123",
                    platform: "facebook",
                    nonce: "abc",
                    iat: Date.now() - 1000,
                },
            })
            mockGetUserPages.mockResolvedValueOnce([])
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=valid-state"
            )
            const response = await GET(request)
            expect(response.status).toBe(307)
            const location = response.headers.get("location") || ""
            expect(location).toContain("reason=no_pages")
        })
    })

    describe("Row 21 — Timing side-channel", () => {
        it("should handle timing measurement without crash", async () => {
            const start = Date.now()
            mockVerifyState.mockReturnValue({
                valid: true,
                payload: {
                    userId: "test-user-123",
                    platform: "facebook",
                    nonce: "abc",
                    iat: Date.now() - 1000,
                },
            })
            const request = makeGetRequest(
                "http://localhost/api/oauth/callback/facebook?code=test-code&state=valid-state"
            )
            const response = await GET(request)
            const elapsed = Date.now() - start
            expect([307, 500]).toContain(response.status)
            expect(elapsed).toBeLessThan(30000)
        })
    })
})
