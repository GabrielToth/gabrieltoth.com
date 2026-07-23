/**
 * Stream Key Endpoint Unit Tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

// Use vi.hoisted to create a mutable variable accessible in hoisted vi.mock factories
const { mockSingleResult } = vi.hoisted(() => {
    const store: {
        fn: () => Promise<{
            data: Record<string, unknown> | null
            error: { message: string; code: string } | null
        }>
    } = {
        fn: () =>
            Promise.resolve({
                data: {
                    id: "net_123",
                    user_id: "user_123",
                    platform: "twitch",
                    platform_user_id: "broadcaster_123",
                    platform_username: "testuser",
                    status: "connected",
                    metadata: {
                        userId: "broadcaster_123",
                        username: "testuser",
                    },
                    access_token: null,
                },
                error: null,
            }),
    }
    return {
        mockSingleResult: store,
    }
})

vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            single: vi.fn(() => mockSingleResult.fn()),
                        })),
                        single: vi.fn(() =>
                            Promise.resolve({ data: null, error: null })
                        ),
                    })),
                    single: vi.fn(() =>
                        Promise.resolve({ data: null, error: null })
                    ),
                })),
            })),
        })),
    })),
}))

// Mock getServerSession
vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: vi.fn(),
}))

import { getServerSession } from "@/lib/auth/get-server-session"

// Mock TokenStore
vi.mock("@/lib/token-store", () => ({
    getTokenStore: vi.fn(),
}))

import { getTokenStore } from "@/lib/token-store"

// Mock Twitch services
vi.mock("@/lib/twitch/config", () => ({
    getTwitchConfig: vi.fn(() => ({
        oauth: {
            clientId: "test-client-id",
            clientSecret: "test-client-secret",
            redirectUri: "http://localhost:3000/api/oauth/callback/twitch",
            scopes: [],
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
    })),
}))

vi.mock("@/lib/twitch/oauth-service", () => ({
    getTwitchOAuthService: vi.fn(),
    TwitchOAuthService: vi.fn(),
}))

import { getTwitchOAuthService } from "@/lib/twitch/oauth-service"
import type { NextRequest } from "next/server"
import { GET } from "./route"

function createMockRequest(platform?: string): NextRequest {
    const url = platform
        ? `http://localhost:3000/api/live/stream-key?platform=${platform}`
        : "http://localhost:3000/api/live/stream-key"
    return new Request(url) as unknown as NextRequest
}

describe("Stream Key Endpoint", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset supabase mock to return valid data by default
        mockSingleResult.fn = () =>
            Promise.resolve({
                data: {
                    id: "net_123",
                    user_id: "user_123",
                    platform: "twitch",
                    platform_user_id: "broadcaster_123",
                    platform_username: "testuser",
                    status: "connected",
                    metadata: {
                        userId: "broadcaster_123",
                        username: "testuser",
                    },
                    access_token: null,
                },
                error: null,
            })
    })

    describe("GET /api/live/stream-key", () => {
        it("should return 401 without auth", async () => {
            vi.mocked(getServerSession).mockResolvedValue(null)

            const response = await GET(createMockRequest("twitch"))
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data).toMatchObject({
                success: false,
                error: "UNAUTHORIZED",
            })
        })

        it("should return 400 for invalid platform", async () => {
            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: "user_123" },
            })

            const response = await GET(createMockRequest("youtube"))
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data).toMatchObject({
                success: false,
                error: "INVALID_PLATFORM",
            })
        })

        it("should return 404 when platform not connected", async () => {
            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: "user_123" },
            })

            // Simulate no connected platform (PGRST116 = no rows)
            mockSingleResult.fn = () =>
                Promise.resolve({
                    data: null,
                    error: {
                        message: "no rows found",
                        code: "PGRST116",
                    },
                })

            const response = await GET(createMockRequest("twitch"))
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data).toMatchObject({
                success: false,
                error: "PLATFORM_NOT_CONNECTED",
            })
        })

        it("should return 500 when Twitch token not found", async () => {
            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: "user_123" },
            })

            // Mock TokenStore to return no token
            const mockGetToken = vi.fn().mockResolvedValue(null)
            vi.mocked(getTokenStore).mockReturnValue({
                getToken: mockGetToken,
            } as any)

            const response = await GET(createMockRequest("twitch"))
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data).toMatchObject({
                success: false,
                error: "TOKEN_NOT_FOUND",
            })
        })

        it("should return stream key for Twitch on success", async () => {
            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: "user_123" },
            })

            // Mock TokenStore to return a token
            const mockGetToken = vi
                .fn()
                .mockResolvedValue({ accessToken: "twitch-access-token" })
            vi.mocked(getTokenStore).mockReturnValue({
                getToken: mockGetToken,
            } as any)

            // Mock Twitch OAuth service to return a stream key
            const mockGetStreamKey = vi
                .fn()
                .mockResolvedValue({ streamKey: "live_123456_abc123" })
            const mockInitialize = vi.fn()
            vi.mocked(getTwitchOAuthService).mockReturnValue({
                initialize: mockInitialize,
                getStreamKey: mockGetStreamKey,
            } as any)

            const response = await GET(createMockRequest("twitch"))
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toMatchObject({
                success: true,
                key: "live_123456_abc123",
            })
        })

        it("should return success for Kick with no key", async () => {
            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: "user_123" },
            })

            // For Kick, the supabase mock should return a Kick network
            mockSingleResult.fn = () =>
                Promise.resolve({
                    data: {
                        id: "net_456",
                        user_id: "user_123",
                        platform: "kick",
                        platform_user_id: "kick_user_123",
                        platform_username: "kickuser",
                        status: "connected",
                        metadata: { username: "kickuser" },
                        access_token: "kick-token",
                    },
                    error: null,
                })

            const response = await GET(createMockRequest("kick"))
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toMatchObject({
                success: true,
                key: null,
                note: expect.stringContaining("Kick"),
            })
        })

        it("should return 500 when Twitch API fails", async () => {
            vi.mocked(getServerSession).mockResolvedValue({
                user: { id: "user_123" },
            })

            // Mock TokenStore to return a token
            const mockGetToken = vi
                .fn()
                .mockResolvedValue({ accessToken: "twitch-access-token" })
            vi.mocked(getTokenStore).mockReturnValue({
                getToken: mockGetToken,
            } as any)

            // Mock Twitch OAuth service to return null (failure)
            const mockGetStreamKey = vi.fn().mockResolvedValue(null)
            const mockInitialize = vi.fn()
            vi.mocked(getTwitchOAuthService).mockReturnValue({
                initialize: mockInitialize,
                getStreamKey: mockGetStreamKey,
            } as any)

            const response = await GET(createMockRequest("twitch"))
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data).toMatchObject({
                success: false,
                error: "STREAM_KEY_UNAVAILABLE",
            })
        })
    })
})
