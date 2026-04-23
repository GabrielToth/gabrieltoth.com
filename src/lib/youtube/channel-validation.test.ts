/**
 * Unit Tests for Channel Validation Service
 * Tests channel ID validation, API error handling, and rate limiting
 * Validates: Requirements 2.1, 2.2
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    ChannelValidationService,
    type OAuthResponse,
    type YouTubeChannelInfo,
} from "./channel-validation"
import { YouTubeChannelLinkingConfig } from "./config"

// Mock configuration
const mockConfig: YouTubeChannelLinkingConfig = {
    oauth: {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/callback",
        scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
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

describe("ChannelValidationService", () => {
    let service: ChannelValidationService

    beforeEach(async () => {
        service = new ChannelValidationService(mockConfig)
        await service.initialize()
    })

    afterEach(async () => {
        await service.shutdown()
        service.clearRateLimitState()
    })

    describe("validateChannelOwnership", () => {
        it("should validate channel ownership with matching channel ID", async () => {
            const oauthResponse: OAuthResponse = {
                accessToken: "test-access-token",
                channelId: "UCtest123",
            }

            const mockChannelInfo: YouTubeChannelInfo = {
                channelId: "UCtest123",
                title: "Test Channel",
                description: "Test Description",
                customUrl: "https://youtube.com/@testchannel",
                subscriberCount: 1000,
            }

            // Mock the getChannelInfo method
            vi.spyOn(service, "getChannelInfo").mockResolvedValue(
                mockChannelInfo
            )

            const result = await service.validateChannelOwnership(
                oauthResponse,
                "UCtest123"
            )

            expect(result.valid).toBe(true)
            expect(result.channelInfo).toEqual(mockChannelInfo)
            expect(result.error).toBeUndefined()
        })

        it("should reject validation with mismatched channel ID", async () => {
            const oauthResponse: OAuthResponse = {
                accessToken: "test-access-token",
                channelId: "UCtest123",
            }

            const mockChannelInfo: YouTubeChannelInfo = {
                channelId: "UCdifferent456",
                title: "Different Channel",
                description: "Different Description",
            }

            vi.spyOn(service, "getChannelInfo").mockResolvedValue(
                mockChannelInfo
            )

            const result = await service.validateChannelOwnership(
                oauthResponse,
                "UCtest123"
            )

            expect(result.valid).toBe(false)
            expect(result.error).toContain("Channel ID does not match")
            expect(result.channelInfo).toBeUndefined()
        })

        it("should return error when access token is missing", async () => {
            const oauthResponse: OAuthResponse = {
                accessToken: "",
            }

            const result = await service.validateChannelOwnership(
                oauthResponse,
                "UCtest123"
            )

            expect(result.valid).toBe(false)
            expect(result.error).toContain("Access token is required")
        })

        it("should return error when expected channel ID is missing", async () => {
            const oauthResponse: OAuthResponse = {
                accessToken: "test-access-token",
            }

            const result = await service.validateChannelOwnership(
                oauthResponse,
                ""
            )

            expect(result.valid).toBe(false)
            expect(result.error).toContain("Expected channel ID is required")
        })

        it("should handle API errors gracefully", async () => {
            const oauthResponse: OAuthResponse = {
                accessToken: "test-access-token",
                channelId: "UCtest123",
            }

            vi.spyOn(service, "getChannelInfo").mockRejectedValue(
                new Error("API Error")
            )

            const result = await service.validateChannelOwnership(
                oauthResponse,
                "UCtest123"
            )

            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
        })
    })

    describe("getChannelInfo", () => {
        it("should fetch channel information successfully", async () => {
            const mockResponse = {
                items: [
                    {
                        id: "UCtest123",
                        snippet: {
                            title: "Test Channel",
                            description: "Test Description",
                            customUrl: "https://youtube.com/@testchannel",
                            thumbnails: {
                                default: {
                                    url: "https://example.com/image.jpg",
                                },
                            },
                        },
                        statistics: {
                            subscriberCount: "1000",
                        },
                    },
                ],
            }

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            })

            const result = await service.getChannelInfo("test-access-token")

            expect(result).toBeDefined()
            expect(result?.channelId).toBe("UCtest123")
            expect(result?.title).toBe("Test Channel")
            expect(result?.subscriberCount).toBe(1000)
        })

        it("should throw error when no channel found", async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ items: [] }),
            })

            await expect(
                service.getChannelInfo("test-access-token")
            ).rejects.toThrow("No channel found")
        })

        it("should throw error for invalid access token (401)", async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({ error: "Invalid token" }),
            })

            await expect(
                service.getChannelInfo("invalid-token")
            ).rejects.toThrow("Access token is invalid or expired")
        })

        it("should throw error for insufficient permissions (403)", async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 403,
                json: async () => ({ error: "Insufficient permissions" }),
            })

            await expect(
                service.getChannelInfo("test-access-token")
            ).rejects.toThrow("Access token does not have required permissions")
        })

        it("should retry on rate limit (429)", async () => {
            let callCount = 0

            global.fetch = vi.fn().mockImplementation(async () => {
                callCount++
                if (callCount < 3) {
                    return {
                        ok: false,
                        status: 429,
                        json: async () => ({ error: "Rate limited" }),
                    }
                }
                return {
                    ok: true,
                    json: async () => ({
                        items: [
                            {
                                id: "UCtest123",
                                snippet: { title: "Test Channel" },
                                statistics: { subscriberCount: "1000" },
                            },
                        ],
                    }),
                }
            })

            const result = await service.getChannelInfo("test-access-token")

            expect(result).toBeDefined()
            expect(result?.channelId).toBe("UCtest123")
            expect(callCount).toBe(3)
        })

        it("should throw error when access token is empty", async () => {
            await expect(service.getChannelInfo("")).rejects.toThrow(
                "Access token is required"
            )
        })
    })

    describe("Rate Limiting", () => {
        it("should allow requests within rate limit", async () => {
            service.clearRateLimitState()

            // Should not throw for requests within limit
            for (let i = 0; i < 50; i++) {
                expect(() => {
                    // Access private method through type assertion
                    ;(service as any).checkRateLimit("test-key")
                }).not.toThrow()
            }
        })

        it("should throw error when rate limit exceeded", async () => {
            service.clearRateLimitState()

            // Make requests up to the limit
            for (let i = 0; i < 100; i++) {
                ;(service as any).checkRateLimit("test-key")
            }

            // Next request should fail
            expect(() => {
                ;(service as any).checkRateLimit("test-key")
            }).toThrow("Rate limit exceeded")
        })

        it("should reset rate limit after window expires", async () => {
            service.clearRateLimitState()

            // Make a request
            ;(service as any).checkRateLimit("test-key")

            // Get the rate limit state
            const state = service.getRateLimitState("test-key")
            expect(state?.requestCount).toBe(1)

            // Simulate time passing (window expiry)
            const originalNow = Date.now
            Date.now = vi.fn(() => state!.resetTime + 1000)

            // Next request should reset the counter
            ;(service as any).checkRateLimit("test-key")
            const newState = service.getRateLimitState("test-key")
            expect(newState?.requestCount).toBe(1)

            // Restore Date.now
            Date.now = originalNow
        })

        it("should track rate limit per key", async () => {
            service.clearRateLimitState()

            // Make requests with different keys
            ;(service as any).checkRateLimit("key1")
            ;(service as any).checkRateLimit("key2")

            const state1 = service.getRateLimitState("key1")
            const state2 = service.getRateLimitState("key2")

            expect(state1?.requestCount).toBe(1)
            expect(state2?.requestCount).toBe(1)
        })
    })

    describe("Error Handling", () => {
        it("should handle network errors", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

            await expect(
                service.getChannelInfo("test-access-token")
            ).rejects.toThrow("Failed to fetch channel information")
        })

        it("should handle malformed API responses", async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => {
                    throw new Error("Invalid JSON")
                },
            })

            await expect(
                service.getChannelInfo("test-access-token")
            ).rejects.toThrow()
        })

        it("should handle server errors (5xx) with retry", async () => {
            let callCount = 0

            global.fetch = vi.fn().mockImplementation(async () => {
                callCount++
                if (callCount < 3) {
                    return {
                        ok: false,
                        status: 500,
                        json: async () => ({ error: "Server error" }),
                    }
                }
                return {
                    ok: true,
                    json: async () => ({
                        items: [
                            {
                                id: "UCtest123",
                                snippet: { title: "Test Channel" },
                                statistics: { subscriberCount: "1000" },
                            },
                        ],
                    }),
                }
            })

            const result = await service.getChannelInfo("test-access-token")

            expect(result).toBeDefined()
            expect(callCount).toBe(3)
        })
    })

    describe("Service Lifecycle", () => {
        it("should initialize successfully", async () => {
            const newService = new ChannelValidationService(mockConfig)
            await newService.initialize()

            expect(newService.isReady()).toBe(true)

            await newService.shutdown()
        })

        it("should shutdown successfully", async () => {
            const newService = new ChannelValidationService(mockConfig)
            await newService.initialize()
            await newService.shutdown()

            expect(newService.isReady()).toBe(false)
        })

        it("should throw error when using service before initialization", async () => {
            const newService = new ChannelValidationService(mockConfig)

            await expect(
                newService.validateChannelOwnership(
                    { accessToken: "token" },
                    "UCtest123"
                )
            ).rejects.toThrow("not ready")
        })

        it("should handle multiple initializations gracefully", async () => {
            const newService = new ChannelValidationService(mockConfig)
            await newService.initialize()
            await newService.initialize() // Should not throw

            expect(newService.isReady()).toBe(true)

            await newService.shutdown()
        })
    })

    describe("Channel Info Extraction", () => {
        it("should extract all channel fields correctly", async () => {
            const mockResponse = {
                items: [
                    {
                        id: "UCtest123",
                        snippet: {
                            title: "My Channel",
                            description: "My Description",
                            customUrl: "https://youtube.com/@mychannel",
                            thumbnails: {
                                default: {
                                    url: "https://example.com/image.jpg",
                                },
                            },
                        },
                        statistics: {
                            subscriberCount: "5000",
                        },
                    },
                ],
            }

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            })

            const result = await service.getChannelInfo("test-access-token")

            expect(result?.channelId).toBe("UCtest123")
            expect(result?.title).toBe("My Channel")
            expect(result?.description).toBe("My Description")
            expect(result?.customUrl).toBe("https://youtube.com/@mychannel")
            expect(result?.subscriberCount).toBe(5000)
            expect(result?.profileImageUrl).toBe(
                "https://example.com/image.jpg"
            )
        })

        it("should handle missing optional fields", async () => {
            const mockResponse = {
                items: [
                    {
                        id: "UCtest123",
                        snippet: {
                            title: "My Channel",
                        },
                        statistics: {},
                    },
                ],
            }

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            })

            const result = await service.getChannelInfo("test-access-token")

            expect(result?.channelId).toBe("UCtest123")
            expect(result?.title).toBe("My Channel")
            expect(result?.description).toBe("")
            expect(result?.customUrl).toBeUndefined()
            expect(result?.subscriberCount).toBe(0)
        })
    })
})
