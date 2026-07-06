/**
 * Tests for POST /api/youtube/link/start endpoint
 * Tests OAuth authorization URL generation and HMAC-signed state (no Redis)
 * Validates: Requirements 1.1, 1.2
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const mockValidateEnv = vi.hoisted(() =>
    vi.fn(() => ({
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

const mockGetServerSession = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ user: { id: "test-user-123" } })
)

vi.mock("@/lib/config/env", () => ({
    validateYouTubeEnv: mockValidateEnv,
}))

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: mockGetServerSession,
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

vi.mock("@/lib/oauth/state-signer", () => ({
    generateState: vi.fn(() => ({
        token: "signed-state-token-12345",
        payload: {
            userId: "test-user-123",
            platform: "youtube",
            nonce: "abc123",
            iat: Date.now(),
        },
    })),
}))

describe("POST /api/youtube/link/start", () => {
    let mockRequest: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockValidateEnv.mockImplementation(() => ({
            YOUTUBE_CLIENT_ID: "test-client-id",
            YOUTUBE_CLIENT_SECRET: "test-client-secret",
            YOUTUBE_REDIRECT_URI:
                "http://localhost:3000/api/youtube/link/callback",
            RESEND_API_KEY: "re_test",
            RESEND_FROM_EMAIL: "noreply@example.com",
            RESEND_FROM_NAME: "Test",
            TOKEN_ENCRYPTION_KEY: "a".repeat(64),
        }))
        mockGetServerSession.mockResolvedValue({
            user: { id: "test-user-123" },
        })
        mockRequest = {
            headers: new Map(),
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
        expect(data.state).toBe("signed-state-token-12345")
    })

    it("should return error if user ID is missing", async () => {
        mockGetServerSession.mockResolvedValueOnce(null)

        const response = await POST(mockRequest as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data).toHaveProperty("success", false)
        expect(data).toHaveProperty("error", "MISSING_USER_ID")
        expect(data).toHaveProperty("message")
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
})
