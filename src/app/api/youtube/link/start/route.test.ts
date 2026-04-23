/**
 * Tests for POST /api/youtube/link/start endpoint
 * Tests OAuth authorization URL generation and state parameter storage
 * Validates: Requirements 1.1, 1.2
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

// Mock dependencies
vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

vi.mock("@/lib/config/env", () => ({
    validateEnv: () => ({
        REDIS_URL: "redis://localhost:6379",
        YOUTUBE_CLIENT_ID: "test-client-id",
        YOUTUBE_CLIENT_SECRET: "test-client-secret",
        YOUTUBE_REDIRECT_URI: "http://localhost:3000/api/youtube/link/callback",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: 587,
        SMTP_USER: "test@example.com",
        SMTP_PASSWORD: "password",
        SMTP_FROM_EMAIL: "noreply@example.com",
        SMTP_FROM_NAME: "Test",
        GEOIP_SERVICE_URL: "https://geoip.example.com",
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
    Redis: class MockRedis {
        async setex(key: string, ttl: number, value: string) {
            return "OK"
        }

        async quit() {
            return "OK"
        }
    },
}))

describe("POST /api/youtube/link/start", () => {
    let mockRequest: Partial<NextRequest>

    beforeEach(() => {
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
        const mockRedis = {
            setex: vi.fn().mockResolvedValue("OK"),
            quit: vi.fn().mockResolvedValue("OK"),
        }

        vi.mocked(require("ioredis").Redis).mockImplementation(() => mockRedis)

        const response = await POST(mockRequest as NextRequest)

        expect(response.status).toBe(200)
        expect(mockRedis.setex).toHaveBeenCalled()

        // Verify setex was called with correct parameters
        const [key, ttl, value] = mockRedis.setex.mock.calls[0]
        expect(key).toMatch(/^youtube:oauth:state:/)
        expect(ttl).toBe(600) // 10 minutes
        expect(value).toContain("test-user-123")
    })

    it("should handle errors gracefully", async () => {
        vi.mocked(require("@/lib/config/env").validateEnv).mockImplementation(
            () => {
                throw new Error("Invalid environment")
            }
        )

        const response = await POST(mockRequest as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data).toHaveProperty("success", false)
        expect(data).toHaveProperty("error", "LINKING_INITIATION_FAILED")
    })

    it("should close Redis connection after use", async () => {
        const mockRedis = {
            setex: vi.fn().mockResolvedValue("OK"),
            quit: vi.fn().mockResolvedValue("OK"),
        }

        vi.mocked(require("ioredis").Redis).mockImplementation(() => mockRedis)

        const response = await POST(mockRequest as NextRequest)

        expect(response.status).toBe(200)
        expect(mockRedis.quit).toHaveBeenCalled()
    })
})
