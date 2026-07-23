import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TikTokOAuthService } from "./oauth-service"
import type { TikTokConfig } from "./config"

// Mock the base service to avoid actual initialization
vi.mock("@/lib/youtube/base-service", () => ({
    BaseService: class MockBaseService {
        protected logger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        }
        protected isInitialized = true
        assertReady() {}
        async initialize() {}
    },
    ServiceError: class ServiceError extends Error {
        code: string
        statusCode: number
        context?: Record<string, unknown>

        constructor(
            code: string,
            message: string,
            statusCode: number = 500,
            context?: Record<string, unknown>
        ) {
            super(message)
            this.name = "ServiceError"
            this.code = code
            this.statusCode = statusCode
            this.context = context
        }
    },
}))

const mockConfig: TikTokConfig = {
    oauth: {
        clientKey: "test-client-key",
        clientSecret: "test-client-secret",
        redirectUri: "https://example.com/callback",
        scopes: ["user.info.basic"],
        apiVersion: "v2",
    },
    rateLimit: {
        linkingAttemptsPerHour: 5,
        publishAttemptsPerHour: 6,
    },
    security: {
        tokenExpiryBufferMs: 5 * 60 * 1000,
    },
}

let service: TikTokOAuthService

beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    vi.restoreAllMocks()
    service = new TikTokOAuthService(mockConfig)
    // Bypass initialization assertion
    ;(service as any).isInitialized = true
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe("TikTokOAuthService", () => {
    describe("generateAuthorizationUrl", () => {
        it("returns authorization URL and state for a user", () => {
            const result = service.generateAuthorizationUrl("user-123")
            expect(result.authorizationUrl).toContain(
                "https://www.tiktok.com/v2/auth/authorize/"
            )
            expect(result.authorizationUrl).toContain(
                "client_key=test-client-key"
            )
            expect(result.state).toBeTruthy()
            expect(typeof result.state).toBe("string")
        })
    })

    describe("exchangeCodeForToken", () => {
        it("exchanges code for token with flat response format", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        access_token: "flat-access-token",
                        refresh_token: "flat-refresh-token",
                        expires_in: 86400,
                        token_type: "bearer",
                        open_id: "test-open-id",
                    }),
                    { status: 200 }
                )
            )

            const result = await service.exchangeCodeForToken("test-code")

            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith(
                "https://open.tiktokapis.com/v2/oauth/token/",
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        "Content-Type": "application/x-www-form-urlencoded",
                    }),
                })
            )
            expect(result.accessToken).toBe("flat-access-token")
            expect(result.refreshToken).toBe("flat-refresh-token")
            expect(result.expiresIn).toBe(86400)
            expect(result.tokenType).toBe("bearer")
        })

        it("exchanges code for token with wrapped response format", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        data: {
                            access_token: "wrapped-access-token",
                            refresh_token: "wrapped-refresh-token",
                            expires_in: 86400,
                            token_type: "bearer",
                            open_id: "wrapped-open-id",
                        },
                    }),
                    { status: 200 }
                )
            )

            const result = await service.exchangeCodeForToken("test-code")
            expect(result.accessToken).toBe("wrapped-access-token")
            expect(result.refreshToken).toBe("wrapped-refresh-token")
        })

        it("throws ServiceError on HTTP 400 response", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        error: "invalid_grant",
                        error_description: "Invalid authorization code",
                    }),
                    { status: 400 }
                )
            )

            await expect(
                service.exchangeCodeForToken("bad-code")
            ).rejects.toThrow(/Failed to exchange code/)
        })

        it("throws ServiceError on malformed JSON response", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response("not-json-at-all", { status: 200 })
            )

            await expect(
                service.exchangeCodeForToken("test-code")
            ).rejects.toThrow(/Invalid JSON response/)
        })

        it("throws ServiceError when TikTok returns HTTP 200 with error payload", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        error: "invalid_grant",
                        error_description: "Code already used",
                    }),
                    { status: 200 }
                )
            )

            await expect(
                service.exchangeCodeForToken("used-code")
            ).rejects.toThrow(/TikTok API error/)
        })
    })

    describe("refreshAccessToken", () => {
        it("refreshes token successfully", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        access_token: "refreshed-access-token",
                        refresh_token: "new-refresh-token",
                        expires_in: 86400,
                        token_type: "bearer",
                    }),
                    { status: 200 }
                )
            )

            const result = await service.refreshAccessToken("old-refresh-token")

            expect(result.accessToken).toBe("refreshed-access-token")
            expect(result.refreshToken).toBe("new-refresh-token")
            expect(result.expiresIn).toBe(86400)
        })

        it("throws ServiceError on failed refresh", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(JSON.stringify({ error: "invalid_grant" }), {
                    status: 400,
                })
            )

            await expect(
                service.refreshAccessToken("expired-token")
            ).rejects.toThrow(/Failed to refresh/)
        })
    })

    describe("revokeToken", () => {
        it("returns true on successful revocation", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(null, { status: 200 })
            )

            const result = await service.revokeToken("valid-token")
            expect(result).toBe(true)
        })

        it("returns false when revocation returns HTTP error", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(null, { status: 400 })
            )

            const result = await service.revokeToken("bad-token")
            expect(result).toBe(false)
        })

        it("throws on network failure (uncaught error)", async () => {
            vi.spyOn(globalThis, "fetch").mockRejectedValue(
                new Error("Network error")
            )

            await expect(service.revokeToken("any-token")).rejects.toThrow(
                "Network error"
            )
        })
    })

    describe("getUserInfo", () => {
        it("returns user info with valid token", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        data: {
                            user: {
                                open_id: "open-123",
                                union_id: "union-123",
                                display_name: "Test User",
                                avatar_url: "https://example.com/avatar.jpg",
                                is_verified: true,
                                username: "testuser",
                                follower_count: 100,
                                following_count: 50,
                                likes_count: 500,
                                video_count: 10,
                            },
                        },
                    }),
                    { status: 200 }
                )
            )

            const user = await service.getUserInfo("valid-token")
            expect(user).not.toBeNull()
            expect(user!.openId).toBe("open-123")
            expect(user!.displayName).toBe("Test User")
            expect(user!.isVerified).toBe(true)
            expect(user!.followerCount).toBe(100)
        })

        it("returns null when no access token is provided", async () => {
            const user = await service.getUserInfo("")
            expect(user).toBeNull()
        })

        it("returns null when response lacks user data", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(JSON.stringify({ data: { user: null } }), {
                    status: 200,
                })
            )

            const user = await service.getUserInfo("valid-token")
            expect(user).toBeNull()
        })

        it("returns null after retries exhausted on error", async () => {
            vi.spyOn(globalThis, "fetch").mockRejectedValue(
                new Error("Network error")
            )

            const user = await service.getUserInfo("valid-token")
            expect(user).toBeNull()
        })
    })
})
