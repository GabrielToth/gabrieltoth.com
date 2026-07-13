/**
 * Tests for TikTok token response normalization.
 *
 * The private normalizeTokenResponse method in TikTokOAuthService handles both
 * flat (per docs) and wrapped (observed) response formats from TikTok's API.
 * These tests verify the normalization through the public exchangeCodeForToken
 * and refreshAccessToken methods which internally use normalizeTokenResponse.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { TikTokConfig } from "@/lib/tiktok/config"
import { TikTokOAuthService } from "@/lib/tiktok/oauth-service"

// Mock BaseService to avoid initialization dependencies
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
        tokenExpiryBufferMs: 300000,
    },
}

let service: TikTokOAuthService

beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    service = new TikTokOAuthService(mockConfig)
    ;(service as any).isInitialized = true
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe("token normalization behavior", () => {
    describe("exchangeCodeForToken — flat response format", () => {
        it("extracts fields from flat response with all optional fields", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        access_token: "flat-at",
                        refresh_token: "flat-rt",
                        expires_in: 7200,
                        token_type: "bearer",
                        open_id: "open-id-123",
                    }),
                    { status: 200 }
                )
            )

            const result = await service.exchangeCodeForToken("code-123")
            expect(result.accessToken).toBe("flat-at")
            expect(result.refreshToken).toBe("flat-rt")
            expect(result.expiresIn).toBe(7200)
            expect(result.tokenType).toBe("bearer")
        })

        it("defaults refresh_token to empty string when absent", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        access_token: "flat-at-no-rt",
                        expires_in: 86400,
                        token_type: "bearer",
                    }),
                    { status: 200 }
                )
            )

            const result = await service.exchangeCodeForToken("code-no-rt")
            expect(result.accessToken).toBe("flat-at-no-rt")
            expect(result.refreshToken).toBe("")
        })

        it("defaults expires_in and token_type when missing", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        access_token: "minimal-token",
                    }),
                    { status: 200 }
                )
            )

            const result = await service.exchangeCodeForToken("code-minimal")
            expect(result.accessToken).toBe("minimal-token")
            expect(result.expiresIn).toBe(86400)
            expect(result.tokenType).toBe("bearer")
        })
    })

    describe("exchangeCodeForToken — wrapped data format", () => {
        it("extracts fields from wrapped data.data format", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        data: {
                            access_token: "wrapped-at",
                            refresh_token: "wrapped-rt",
                            expires_in: 86400,
                            token_type: "bearer",
                            open_id: "open-wrapped",
                        },
                    }),
                    { status: 200 }
                )
            )

            const result = await service.exchangeCodeForToken("code-wrapped")
            expect(result.accessToken).toBe("wrapped-at")
            expect(result.refreshToken).toBe("wrapped-rt")
        })
    })

    describe("exchangeCodeForToken — error responses", () => {
        it("throws on missing access_token in response", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        data: { refresh_token: "rt-without-at" },
                    }),
                    { status: 200 }
                )
            )

            await expect(
                service.exchangeCodeForToken("code-missing-at")
            ).rejects.toThrow(/TikTok returned no access_token/)
        })

        it("throws on empty response object", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(JSON.stringify({}), { status: 200 })
            )

            await expect(
                service.exchangeCodeForToken("code-empty")
            ).rejects.toThrow(/TikTok returned no access_token/)
        })
    })

    describe("refreshAccessToken — normalization", () => {
        it("normalizes flat refresh response", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        access_token: "refreshed-at",
                        refresh_token: "new-rt",
                        expires_in: 86400,
                        token_type: "bearer",
                    }),
                    { status: 200 }
                )
            )

            const result = await service.refreshAccessToken("old-rt")
            expect(result.accessToken).toBe("refreshed-at")
            expect(result.refreshToken).toBe("new-rt")
        })

        it("normalizes wrapped refresh response", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        data: {
                            access_token: "refreshed-wrapped-at",
                            refresh_token: "new-wrapped-rt",
                            expires_in: 86400,
                            token_type: "bearer",
                        },
                    }),
                    { status: 200 }
                )
            )

            const result = await service.refreshAccessToken("old-wrapped-rt")
            expect(result.accessToken).toBe("refreshed-wrapped-at")
            expect(result.refreshToken).toBe("new-wrapped-rt")
        })
    })
})
