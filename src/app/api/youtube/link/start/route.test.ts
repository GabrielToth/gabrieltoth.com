/**
 * Tests for POST /api/youtube/link/start endpoint
 * Tests OAuth authorization URL generation and state parameter storage
 * Validates: Requirements 1.1, 1.2
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const mockRedisInstance = vi.hoisted(() => ({
    setex: vi.fn().mockResolvedValue("OK"),
    quit: vi.fn().mockResolvedValue("OK"),
}))

const mockValidateEnv = vi.hoisted(() =>
    vi.fn(() => ({
        REDIS_URL: "redis://localhost:6379",
        YOUTUBE_CLIENT_ID: "test-client-id",
        YOUTUBE_CLIENT_SECRET: "test-client-secret",
        YOUTUBE_REDIRECT_URI: "http://localhost:3000/api/youtube/link/callback",
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "noreply@example.com",
        RESEND_FROM_NAME: "Test",
        TOKEN_ENCRYPTION_KEY: "a".repeat(64),
    }))
)

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

vi.mock("@/lib/config/env", () => ({
    validateYouTubeEnv: mockValidateEnv,
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
        email: {
            apiKey: "re_test",
            fromEmail: "noreply@example.com",
            fromName: "Test",
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
    }),
    resetYouTubeChannelLinkingConfig: vi.fn(),
}))

vi.mock("@/lib/youtube/oauth-service", () => ({
    getYouTubeOAuthService: () => ({
        initialize: vi.fn(),
        generateAuthorizationUrl: () => ({
            authorizationUrl:
                "https://accounts.google.com/o/oauth2/v2/auth?client_id=test&...",
            state: "test-state-value",
        }),
    }),
    resetYouTubeOAuthService: vi.fn(),
}))

vi.mock("ioredis", () => ({
    Redis: vi.fn(function MockRedis() {
        return mockRedisInstance
    }),
}))

describe("POST /api/youtube/link/start", () => {
    let mockRequest: Partial<NextRequest>

    beforeEach(() => {
        vi.clearAllMocks()
        mockValidateEnv.mockImplementation(() => ({
            REDIS_URL: "redis://localhost:6379",
            YOUTUBE_CLIENT_ID: "test-client-id",
            YOUTUBE_CLIENT_SECRET: "test-client-secret",
            YOUTUBE_REDIRECT_URI:
                "http://localhost:3000/api/youtube/link/callback",
            RESEND_API_KEY: "re_test",
            RESEND_FROM_EMAIL: "noreply@example.com",
            RESEND_FROM_NAME: "Test",
            TOKEN_ENCRYPTION_KEY: "a".repeat(64),
        }))
        mockRedisInstance.setex.mockResolvedValue("OK")
        mockRedisInstance.quit.mockResolvedValue("OK")
        mockRequest = {
            headers: new Map([["x-user-id", "test-user-123"]]),
        }
    })

    it("should return authorization URL and state on success", async () => {
        const response = await POST(mockRequest as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty("success", true)
        expect(data).toHaveProperty("authorizationUrl")
        expect(data).toHaveProperty("state")
        expect(data.authorizationUrl).toContain(
            "https://accounts.google.com/o/oauth2/v2/auth"
        )
        expect(data.state).toBeTruthy()
    })

    it("should return error if user ID is missing", async () => {
        mockRequest.headers = new Map()

        const response = await POST(mockRequest as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data).toHaveProperty("success", false)
        expect(data).toHaveProperty("error", "MISSING_USER_ID")
        expect(data).toHaveProperty("message")
    })

    it("should store state parameter in Redis with expiration", async () => {
        const response = await POST(mockRequest as NextRequest)

        expect(response.status).toBe(200)
        expect(mockRedisInstance.setex).toHaveBeenCalled()

        const [key, ttl, value] = mockRedisInstance.setex.mock.calls[0]
        expect(key).toMatch(/^youtube:oauth:state:/)
        expect(ttl).toBe(600)
        expect(value).toContain("test-user-123")
    })

    it("should handle errors gracefully", async () => {
        mockValidateEnv.mockImplementation(() => {
            throw new Error("Invalid environment")
        })

        const response = await POST(mockRequest as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data).toHaveProperty("success", false)
        expect(data).toHaveProperty("error", "LINKING_INITIATION_FAILED")
    })

    it("should close Redis connection after use", async () => {
        const response = await POST(mockRequest as NextRequest)

        expect(response.status).toBe(200)
        expect(mockRedisInstance.quit).toHaveBeenCalled()
    })
})
