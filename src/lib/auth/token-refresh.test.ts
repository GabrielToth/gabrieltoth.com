/**
 * Unit Tests: Platform Token Refresh
 *
 * Tests for getFreshPlatformToken() which ensures adapters receive
 * valid (non-expired) access tokens, refreshing via refresh_token
 * when expired. Terminal OAuth failures mark the account disconnected.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetTokenStore } from "@/lib/token-store"

const mockTokenStore = {
    getToken: vi.fn(),
    refreshToken: vi.fn(),
}

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    }),
}))

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => mockTokenStore,
    resetTokenStore: vi.fn(),
}))

const mockMarkDisconnected = vi.fn()

vi.mock("@/lib/auth/token-health", () => ({
    isTerminalTokenError: (msg: string) =>
        msg.toLowerCase().includes("invalid_grant"),
    markAccountDisconnected: (...args: unknown[]) =>
        Promise.resolve(mockMarkDisconnected(...args)),
}))

// Mock dynamically imported OAuth services used by doRefresh()
const mockRefreshAccessToken = vi.fn()
const mockOAuthService = () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    refreshAccessToken: mockRefreshAccessToken,
})

vi.mock("@/lib/youtube/oauth-service", () => ({
    getYouTubeOAuthService: () => mockOAuthService(),
}))
vi.mock("@/lib/youtube/config", () => ({
    getYouTubeChannelLinkingConfig: () => ({}),
}))
vi.mock("@/lib/config/env", () => ({
    validateEnvScoped: () => ({}),
    YOUTUBE_ENV_KEYS: [],
}))
vi.mock("@/lib/twitch/config", () => ({
    getTwitchConfig: () => ({}),
}))
vi.mock("@/lib/twitch/oauth-service", () => ({
    getTwitchOAuthService: () => mockOAuthService(),
}))
vi.mock("@/lib/kick/config", () => ({
    getKickConfig: () => ({}),
}))
vi.mock("@/lib/kick/oauth-service", () => ({
    getKickOAuthService: () => mockOAuthService(),
}))

import { getFreshPlatformToken } from "./token-refresh"

const USER_ID = "user-123"
const NOW = Date.now()

describe("getFreshPlatformToken", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        resetTokenStore()
    })

    it("returns stored token when not expired", async () => {
        mockTokenStore.getToken.mockResolvedValue({
            accessToken: "valid-access-token",
            refreshToken: "rt",
            expiresAt: NOW + 60_000,
        })

        const result = await getFreshPlatformToken(USER_ID, "youtube")

        expect(result?.accessToken).toBe("valid-access-token")
        expect(mockTokenStore.refreshToken).not.toHaveBeenCalled()
    })

    it("refreshes an expired youtube token via the OAuth service", async () => {
        mockRefreshAccessToken.mockResolvedValueOnce({
            accessToken: "fresh-token",
            refreshToken: "yt-refresh-2",
            expiresIn: 3600,
        })
        mockTokenStore.getToken
            .mockResolvedValueOnce({
                accessToken: "expired",
                refreshToken: "yt-refresh",
                expiresAt: NOW - 1000,
            })
            .mockResolvedValueOnce({
                accessToken: "fresh-token",
                refreshToken: "yt-refresh-2",
                expiresAt: NOW + 3600_000,
            })

        const result = await getFreshPlatformToken(USER_ID, "youtube")

        expect(mockTokenStore.refreshToken).toHaveBeenCalledTimes(1)
        expect(result?.accessToken).toBe("fresh-token")
    })

    it("returns null when no token is stored", async () => {
        mockTokenStore.getToken.mockResolvedValue(null)

        const result = await getFreshPlatformToken(USER_ID, "twitch")

        expect(result).toBeNull()
        expect(mockTokenStore.refreshToken).not.toHaveBeenCalled()
    })

    it("does not refresh when refresh_token is missing", async () => {
        mockTokenStore.getToken.mockResolvedValue({
            accessToken: "expired",
            expiresAt: NOW - 1000,
        })

        const result = await getFreshPlatformToken(USER_ID, "kick")

        // Falls back to the expired stored token
        expect(result?.accessToken).toBe("expired")
        expect(mockTokenStore.refreshToken).not.toHaveBeenCalled()
    })

    it("marks youtube account disconnected on terminal refresh error", async () => {
        mockRefreshAccessToken.mockRejectedValueOnce(
            new Error("invalid_grant: refresh token revoked")
        )
        mockTokenStore.getToken.mockResolvedValue({
            accessToken: "expired",
            refreshToken: "revoked-rt",
            expiresAt: NOW - 1000,
        })

        const result = await getFreshPlatformToken(USER_ID, "youtube")

        // Refresh failed → falls back to expired token (non-null)
        expect(result?.accessToken).toBe("expired")
        expect(mockMarkDisconnected).toHaveBeenCalledWith(
            USER_ID,
            "youtube"
        )
    })

    it("keeps account connected on transient refresh error", async () => {
        mockRefreshAccessToken.mockRejectedValueOnce(
            new Error("EAI_AGAIN network error")
        )
        mockTokenStore.getToken.mockResolvedValue({
            accessToken: "expired",
            refreshToken: "rt",
            expiresAt: NOW - 1000,
        })

        const result = await getFreshPlatformToken(USER_ID, "twitch")

        expect(result?.accessToken).toBe("expired")
        expect(mockMarkDisconnected).not.toHaveBeenCalled()
    })
})
