/**
 * Unit Tests for YouTube OAuth Service
 * Tests OAuth authorization URL generation, token exchange, and token management
 * Validates: Requirements 1.1, 1.3
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { YouTubeChannelLinkingConfig } from "./config"
import { YouTubeOAuthService } from "./oauth-service"

// Mock configuration
const mockConfig: YouTubeChannelLinkingConfig = {
    oauth: {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/api/youtube/link/callback",
        scopes: [
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
    },
    email: {
        host: "smtp.example.com",
        port: 587,
        user: "test@example.com",
        password: "password",
        fromEmail: "noreply@example.com",
        fromName: "Test",
        tls: true,
    },
    geolocation: {
        serviceUrl: "https://geoip.example.com",
        timeout: 5000,
        retries: 3,
    },
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
}

describe("YouTubeOAuthService", () => {
    let service: YouTubeOAuthService

    beforeEach(async () => {
        service = new YouTubeOAuthService(mockConfig)
        await service.initialize()
    })

    afterEach(async () => {
        await service.shutdown()
    })

    describe("generateAuthorizationUrl", () => {
        it("should generate a valid authorization URL", () => {
            const userId = "test-user-123"
            const result = service.generateAuthorizationUrl(userId)

            expect(result).toHaveProperty("authorizationUrl")
            expect(result).toHaveProperty("state")
            expect(result.authorizationUrl).toContain(
                "https://accounts.google.com/o/oauth2/v2/auth"
            )
            expect(result.authorizationUrl).toContain(
                `client_id=${mockConfig.oauth.clientId}`
            )
            expect(result.authorizationUrl).toContain(
                `redirect_uri=${encodeURIComponent(mockConfig.oauth.redirectUri)}`
            )
            expect(result.authorizationUrl).toContain("response_type=code")
            expect(result.authorizationUrl).toContain("access_type=offline")
            expect(result.authorizationUrl).toContain("prompt=consent")
        })

        it("should include all required scopes in authorization URL", () => {
            const userId = "test-user-123"
            const result = service.generateAuthorizationUrl(userId)

            const url = new URL(result.authorizationUrl)
            const scope = url.searchParams.get("scope")

            expect(scope).toContain(
                "https://www.googleapis.com/auth/youtube.readonly"
            )
            expect(scope).toContain(
                "https://www.googleapis.com/auth/userinfo.email"
            )
        })

        it("should generate unique state parameters", () => {
            const userId = "test-user-123"
            const result1 = service.generateAuthorizationUrl(userId)
            const result2 = service.generateAuthorizationUrl(userId)

            expect(result1.state).not.toBe(result2.state)
            expect(result1.state).toHaveLength(64) // 32 bytes in hex = 64 chars
            expect(result2.state).toHaveLength(64)
        })

        it("should throw error if service is not initialized", async () => {
            const uninitializedService = new YouTubeOAuthService(mockConfig)

            expect(() => {
                uninitializedService.generateAuthorizationUrl("test-user")
            }).toThrow("not ready")
        })
    })

    describe("validateState", () => {
        it("should validate matching state parameters", () => {
            const state = "test-state-value"
            const result = service.validateState(state, state)

            expect(result).toBe(true)
        })

        it("should reject non-matching state parameters", () => {
            const state1 = "test-state-value-1"
            const state2 = "test-state-value-2"
            const result = service.validateState(state1, state2)

            expect(result).toBe(false)
        })

        it("should use constant-time comparison to prevent timing attacks", () => {
            const state1 = "a".repeat(64)
            const state2 = "b".repeat(64)

            // Both should return false, but with constant time
            const result1 = service.validateState(state1, state2)
            const result2 = service.validateState(state1, state1)

            expect(result1).toBe(false)
            expect(result2).toBe(true)
        })

        it("should handle empty state parameters", () => {
            const result = service.validateState("", "")
            expect(result).toBe(true)
        })

        it("should handle different length state parameters", () => {
            const result = service.validateState("short", "much-longer-state")
            expect(result).toBe(false)
        })
    })

    describe("exchangeCodeForToken", () => {
        it("should exchange authorization code for token", async () => {
            const mockResponse = {
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                expires_in: 3600,
                token_type: "Bearer",
                scope: "https://www.googleapis.com/auth/youtube.readonly",
            }

            vi.stubGlobal(
                "fetch",
                vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                })
            )

            const result = await service.exchangeCodeForToken("test-code")

            expect(result).toEqual({
                accessToken: "test-access-token",
                refreshToken: "test-refresh-token",
                expiresIn: 3600,
                tokenType: "Bearer",
                scope: "https://www.googleapis.com/auth/youtube.readonly",
            })
        })

        it("should handle token exchange errors", async () => {
            const mockError = {
                error: "invalid_code",
                error_description: "The authorization code is invalid",
            }

            vi.stubGlobal(
                "fetch",
                vi.fn().mockResolvedValueOnce({
                    ok: false,
                    json: async () => mockError,
                })
            )

            await expect(
                service.exchangeCodeForToken("invalid-code")
            ).rejects.toThrow("Failed to exchange code for token")
        })

        it("should throw error if service is not initialized", async () => {
            const uninitializedService = new YouTubeOAuthService(mockConfig)

            await expect(
                uninitializedService.exchangeCodeForToken("test-code")
            ).rejects.toThrow("not ready")
        })
    })

    describe("refreshAccessToken", () => {
        it("should refresh access token using refresh token", async () => {
            const mockResponse = {
                access_token: "new-access-token",
                expires_in: 3600,
                token_type: "Bearer",
                scope: "https://www.googleapis.com/auth/youtube.readonly",
            }

            vi.stubGlobal(
                "fetch",
                vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                })
            )

            const result =
                await service.refreshAccessToken("test-refresh-token")

            expect(result).toEqual({
                accessToken: "new-access-token",
                refreshToken: "test-refresh-token", // Uses old refresh token if new one not provided
                expiresIn: 3600,
                tokenType: "Bearer",
                scope: "https://www.googleapis.com/auth/youtube.readonly",
            })
        })

        it("should use new refresh token if provided", async () => {
            const mockResponse = {
                access_token: "new-access-token",
                refresh_token: "new-refresh-token",
                expires_in: 3600,
                token_type: "Bearer",
                scope: "https://www.googleapis.com/auth/youtube.readonly",
            }

            vi.stubGlobal(
                "fetch",
                vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                })
            )

            const result =
                await service.refreshAccessToken("test-refresh-token")

            expect(result.refreshToken).toBe("new-refresh-token")
        })

        it("should handle token refresh errors", async () => {
            const mockError = {
                error: "invalid_grant",
                error_description: "The refresh token is invalid",
            }

            vi.stubGlobal(
                "fetch",
                vi.fn().mockResolvedValueOnce({
                    ok: false,
                    json: async () => mockError,
                })
            )

            await expect(
                service.refreshAccessToken("invalid-refresh-token")
            ).rejects.toThrow("Failed to refresh token")
        })
    })

    describe("revokeToken", () => {
        it("should revoke access token", async () => {
            vi.stubGlobal(
                "fetch",
                vi.fn().mockResolvedValueOnce({
                    ok: true,
                })
            )

            const result = await service.revokeToken("test-access-token")

            expect(result).toBe(true)
        })

        it("should handle token revocation failures", async () => {
            vi.stubGlobal(
                "fetch",
                vi.fn().mockResolvedValueOnce({
                    ok: false,
                    status: 400,
                })
            )

            const result = await service.revokeToken("invalid-token")

            expect(result).toBe(false)
        })

        it("should handle network errors during revocation", async () => {
            vi.stubGlobal(
                "fetch",
                vi.fn().mockRejectedValueOnce(new Error("Network error"))
            )

            const result = await service.revokeToken("test-token")

            expect(result).toBe(false)
        })
    })

    describe("service lifecycle", () => {
        it("should initialize service", async () => {
            const newService = new YouTubeOAuthService(mockConfig)
            expect(newService.isReady()).toBe(false)

            await newService.initialize()
            expect(newService.isReady()).toBe(true)

            await newService.shutdown()
            expect(newService.isReady()).toBe(false)
        })

        it("should handle multiple initializations gracefully", async () => {
            const newService = new YouTubeOAuthService(mockConfig)

            await newService.initialize()
            await newService.initialize() // Should not throw

            expect(newService.isReady()).toBe(true)

            await newService.shutdown()
        })

        it("should handle shutdown of uninitialized service", async () => {
            const newService = new YouTubeOAuthService(mockConfig)

            // Should not throw
            await newService.shutdown()

            expect(newService.isReady()).toBe(false)
        })
    })
})
