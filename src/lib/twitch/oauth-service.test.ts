/**
 * Twitch OAuth Service Unit Tests
 * Tests for getStreamKey method and existing service methods
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { TwitchOAuthService } from "./oauth-service"
import type { TwitchConfig } from "./config"

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch as any

const mockConfig: TwitchConfig = {
    oauth: {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/api/oauth/callback/twitch",
        scopes: ["chat:read", "chat:edit", "channel:read:stream_key"],
    },
    apiBaseUrl: "https://api.twitch.tv/helix",
    oauthAuthorizeUrl: "https://id.twitch.tv/oauth2/authorize",
    oauthTokenUrl: "https://id.twitch.tv/oauth2/token",
    oauthRevokeUrl: "https://id.twitch.tv/oauth2/revoke",
    ircUrl: "irc.chat.twitch.tv",
    ircPort: 6667,
    eventsubWsUrl: "wss://eventsub.wss.twitch.tv",
    rateLimit: { requestsPerMinute: 800 },
    security: { tokenExpiryBufferMs: 300000 },
}

describe("TwitchOAuthService.getStreamKey", () => {
    let service: TwitchOAuthService

    beforeEach(() => {
        vi.clearAllMocks()
        service = new TwitchOAuthService(mockConfig)
    })

    it("should call GET /helix/streams/key with correct headers and broadcaster_id", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                data: [{ stream_key: "live_123456_abc123" }],
            }),
        })

        const result = await service.getStreamKey(
            "test-access-token",
            "broadcaster_123"
        )

        expect(mockFetch).toHaveBeenCalledTimes(1)
        const callUrl = mockFetch.mock.calls[0][0]
        expect(callUrl).toContain("/helix/streams/key")
        expect(callUrl).toContain("broadcaster_id=broadcaster_123")

        const callHeaders = mockFetch.mock.calls[0][1]?.headers
        expect(callHeaders).toMatchObject({
            Authorization: "Bearer test-access-token",
            "Client-Id": "test-client-id",
        })
    })

    it("should return TwitchStreamKey on success", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                data: [{ stream_key: "live_123456_abc123" }],
            }),
        })

        const result = await service.getStreamKey(
            "test-access-token",
            "broadcaster_123"
        )

        expect(result).toEqual({ streamKey: "live_123456_abc123" })
    })

    it("should return null when Twitch returns 403 (missing scope)", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            json: async () => ({}),
        })

        const result = await service.getStreamKey(
            "test-access-token",
            "broadcaster_123"
        )

        expect(result).toBeNull()
    })

    it("should return null when no stream key data", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ data: [] }),
        })

        const result = await service.getStreamKey(
            "test-access-token",
            "broadcaster_123"
        )

        expect(result).toBeNull()
    })

    it("should return null on network error (non-ok response)", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({}),
        })

        const result = await service.getStreamKey(
            "test-access-token",
            "broadcaster_123"
        )

        expect(result).toBeNull()
    })

    it("should return null on empty data object", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({}),
        })

        const result = await service.getStreamKey(
            "test-access-token",
            "broadcaster_123"
        )

        expect(result).toBeNull()
    })
})
