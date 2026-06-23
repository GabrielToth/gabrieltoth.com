/**
 * Unit Tests for getValidYouTubeToken
 * Feature: youtube-token-refresh-on-demand
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import type { TokenStore, TokenData } from "@/lib/token-store"
import type {
    YouTubeOAuthService,
    OAuthTokenResponse,
} from "@/lib/youtube/oauth-service"
import { getValidYouTubeToken } from "@/lib/youtube/get-valid-token"

function makeTokenData(overrides: Partial<TokenData> = {}): TokenData {
    return {
        accessToken: "ya29.valid-access-token",
        refreshToken: "1//refresh-token",
        expiresAt: Date.now() + 3600_000,
        platform: "youtube",
        userId: "user-1",
        ...overrides,
    }
}

function makeRefreshResponse(
    overrides: Partial<OAuthTokenResponse> = {}
): OAuthTokenResponse {
    return {
        accessToken: "ya29.new-access-token",
        refreshToken: "1//new-refresh-token",
        expiresIn: 3600,
        tokenType: "Bearer",
        scope: "youtube.readonly",
        ...overrides,
    }
}

describe("getValidYouTubeToken", () => {
    let mockTokenStore: Record<keyof TokenStore, ReturnType<typeof vi.fn>>
    let mockOAuthService: Record<
        keyof YouTubeOAuthService,
        ReturnType<typeof vi.fn>
    >

    beforeEach(() => {
        vi.clearAllMocks()

        mockTokenStore = {
            storeToken: vi.fn(),
            getToken: vi.fn(),
            isTokenValid: vi.fn(),
            refreshToken: vi.fn(),
            deleteToken: vi.fn(),
            getUserTokens: vi.fn(),
            getPlatformTokens: vi.fn(),
            hasTokens: vi.fn(),
        }

        mockOAuthService = {
            initialize: vi.fn(),
            shutdown: vi.fn(),
            onInitialize: vi.fn(),
            onShutdown: vi.fn(),
            isReady: vi.fn(),
            generateAuthorizationUrl: vi.fn(),
            exchangeCodeForToken: vi.fn(),
            refreshAccessToken: vi.fn(),
            revokeToken: vi.fn(),
            validateState: vi.fn(),
        }
    })

    it("returns null when no token exists", async () => {
        mockTokenStore.getToken.mockResolvedValue(null)

        const result = await getValidYouTubeToken("user-1", {
            tokenStore: mockTokenStore as unknown as TokenStore,
            oauthService: mockOAuthService as unknown as YouTubeOAuthService,
        })

        expect(result).toBeNull()
    })

    it("returns the access token when still valid", async () => {
        mockTokenStore.getToken.mockResolvedValue(
            makeTokenData({ accessToken: "ya29.valid" })
        )

        const result = await getValidYouTubeToken("user-1", {
            tokenStore: mockTokenStore as unknown as TokenStore,
            oauthService: mockOAuthService as unknown as YouTubeOAuthService,
        })

        expect(result).toBe("ya29.valid")
        expect(mockOAuthService.refreshAccessToken).not.toHaveBeenCalled()
    })

    it("returns the token when it has no expiresAt (treat as non-expiring)", async () => {
        mockTokenStore.getToken.mockResolvedValue(
            makeTokenData({
                accessToken: "ya29.no-expiry",
                expiresAt: undefined,
            })
        )

        const result = await getValidYouTubeToken("user-1", {
            tokenStore: mockTokenStore as unknown as TokenStore,
            oauthService: mockOAuthService as unknown as YouTubeOAuthService,
        })

        expect(result).toBe("ya29.no-expiry")
        expect(mockOAuthService.refreshAccessToken).not.toHaveBeenCalled()
    })

    it("refreshes and returns new token when expired", async () => {
        mockTokenStore.getToken.mockResolvedValue(
            makeTokenData({
                accessToken: "ya29.expired",
                refreshToken: "1//old-refresh",
                expiresAt: Date.now() - 1000,
            })
        )
        mockOAuthService.refreshAccessToken.mockResolvedValue(
            makeRefreshResponse({
                accessToken: "ya29.refreshed",
                refreshToken: "1//new-refresh",
            })
        )

        const result = await getValidYouTubeToken("user-1", {
            tokenStore: mockTokenStore as unknown as TokenStore,
            oauthService: mockOAuthService as unknown as YouTubeOAuthService,
        })

        expect(result).toBe("ya29.refreshed")
        expect(mockOAuthService.refreshAccessToken).toHaveBeenCalledWith(
            "1//old-refresh"
        )
        expect(mockTokenStore.refreshToken).toHaveBeenCalledWith(
            "user-1",
            "youtube",
            expect.objectContaining({
                accessToken: "ya29.refreshed",
                refreshToken: "1//new-refresh",
            })
        )
    })

    it("returns null when expired and no refresh token", async () => {
        mockTokenStore.getToken.mockResolvedValue(
            makeTokenData({
                accessToken: "ya29.expired",
                refreshToken: undefined,
                expiresAt: Date.now() - 1000,
            })
        )

        const result = await getValidYouTubeToken("user-1", {
            tokenStore: mockTokenStore as unknown as TokenStore,
            oauthService: mockOAuthService as unknown as YouTubeOAuthService,
        })

        expect(result).toBeNull()
        expect(mockOAuthService.refreshAccessToken).not.toHaveBeenCalled()
    })

    it("returns null when refresh fails", async () => {
        mockTokenStore.getToken.mockResolvedValue(
            makeTokenData({
                accessToken: "ya29.expired",
                refreshToken: "1//bad-refresh",
                expiresAt: Date.now() - 1000,
            })
        )
        mockOAuthService.refreshAccessToken.mockRejectedValue(
            new Error("invalid_grant")
        )

        const result = await getValidYouTubeToken("user-1", {
            tokenStore: mockTokenStore as unknown as TokenStore,
            oauthService: mockOAuthService as unknown as YouTubeOAuthService,
        })

        expect(result).toBeNull()
        expect(mockOAuthService.refreshAccessToken).toHaveBeenCalled()
    })

    it("preserves existing refresh_token when Google does not issue new one", async () => {
        mockTokenStore.getToken.mockResolvedValue(
            makeTokenData({
                accessToken: "ya29.expired",
                refreshToken: "1//original-refresh",
                expiresAt: Date.now() - 1000,
            })
        )
        // Google returns old refresh token when not issuing new one
        mockOAuthService.refreshAccessToken.mockResolvedValue(
            makeRefreshResponse({
                accessToken: "ya29.refreshed",
                refreshToken: "1//original-refresh",
            })
        )

        const result = await getValidYouTubeToken("user-1", {
            tokenStore: mockTokenStore as unknown as TokenStore,
            oauthService: mockOAuthService as unknown as YouTubeOAuthService,
        })

        expect(result).toBe("ya29.refreshed")
        expect(mockTokenStore.refreshToken).toHaveBeenCalledWith(
            "user-1",
            "youtube",
            expect.objectContaining({
                refreshToken: "1//original-refresh",
            })
        )
    })

    it("initializes OAuth service before refreshing", async () => {
        mockTokenStore.getToken.mockResolvedValue(
            makeTokenData({
                expiresAt: Date.now() - 1000,
            })
        )
        mockOAuthService.refreshAccessToken.mockResolvedValue(
            makeRefreshResponse()
        )

        await getValidYouTubeToken("user-1", {
            tokenStore: mockTokenStore as unknown as TokenStore,
            oauthService: mockOAuthService as unknown as YouTubeOAuthService,
        })

        expect(mockOAuthService.initialize).toHaveBeenCalled()
    })
})
