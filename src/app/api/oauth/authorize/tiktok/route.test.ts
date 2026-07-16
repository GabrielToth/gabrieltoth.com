import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}))

const mockGetServerSession = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ user: { id: "test-user-123" } })
)

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: mockGetServerSession,
}))

vi.mock("@/lib/tiktok/config", () => ({
    getTikTokConfig: () => ({
        oauth: {
            clientKey: "test-client-key",
            clientSecret: "test-client-secret",
            redirectUri: "https://example.com/callback",
            scopes: ["user.info.basic", "user.info.profile"],
            apiVersion: "v2",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            publishAttemptsPerHour: 6,
        },
        security: {
            tokenExpiryBufferMs: 300000,
        },
    }),
}))

const mockOAuthService = vi.hoisted(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/tiktok/oauth-service", () => ({
    getTikTokOAuthService: () => mockOAuthService,
    resetTikTokOAuthService: vi.fn(),
}))

const mockGenerateState = vi.hoisted(() =>
    vi.fn(() => ({
        token: "signed-state-token-abc123",
        payload: {
            userId: "test-user-123",
            platform: "tiktok",
            nonce: "abc123",
            iat: Date.now(),
        },
    }))
)

vi.mock("@/lib/oauth/state-signer", () => ({
    generateState: mockGenerateState,
}))

describe("POST /api/oauth/authorize/tiktok", () => {
    let mockRequest: NextRequest

    beforeEach(() => {
        vi.clearAllMocks()
        mockGetServerSession.mockResolvedValue({
            user: { id: "test-user-123" },
        })
        mockGenerateState.mockReturnValue({
            token: "signed-state-token-abc123",
            payload: {
                userId: "test-user-123",
                platform: "tiktok",
                nonce: "abc123",
                iat: Date.now(),
            },
        })
        mockRequest = { headers: new Map() } as unknown as NextRequest
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("returns 200 with authorization URL and state on success", async () => {
        const response = await POST(mockRequest)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
            success: true,
            authorizationUrl: expect.stringContaining(
                "https://www.tiktok.com/v2/auth/authorize/"
            ),
            state: "signed-state-token-abc123",
        })
        expect(data.authorizationUrl).toContain("client_key=test-client-key")
        expect(data.authorizationUrl).toContain(
            "redirect_uri=https%3A%2F%2Fexample.com%2Fcallback"
        )
        expect(data.authorizationUrl).toContain(
            "state=signed-state-token-abc123"
        )
        expect(data.authorizationUrl).toContain("response_type=code")
        expect(data.authorizationUrl).toContain(
            "scope=user.info.basic%2Cuser.info.profile"
        )
    })

    it("returns 401 when user is not authenticated", async () => {
        mockGetServerSession.mockResolvedValueOnce(null)

        const response = await POST(mockRequest)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data).toEqual({
            success: false,
            error: "UNAUTHORIZED",
            message: "Authentication required",
        })
    })

    it("returns 401 when session has no user id", async () => {
        mockGetServerSession.mockResolvedValueOnce({ user: {} })

        const response = await POST(mockRequest)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data).toEqual({
            success: false,
            error: "UNAUTHORIZED",
            message: "Authentication required",
        })
    })

    it("returns 500 when an unexpected error occurs", async () => {
        mockOAuthService.initialize.mockRejectedValueOnce(
            new Error("Unexpected failure")
        )

        const response = await POST(mockRequest)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data).toEqual({
            success: false,
            error: "LINKING_INITIATION_FAILED",
            message: "Unexpected failure",
        })
    })
})
