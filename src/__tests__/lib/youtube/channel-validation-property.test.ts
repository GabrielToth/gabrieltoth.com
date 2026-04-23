/**
 * Property-Based Tests for Channel Validation Service
 * Feature: youtube-channel-linking
 * **Validates: Requirements 2.2**
 */

import {
    ChannelValidationService,
    type OAuthResponse,
    type YouTubeChannelInfo,
} from "@/lib/youtube/channel-validation"
import { YouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import * as fc from "fast-check"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

// Generator for valid YouTube channel IDs
const youtubeChannelIdArb = fc
    .tuple(fc.constant("UC"), fc.hexaString({ minLength: 22, maxLength: 22 }))
    .map(([prefix, hex]) => prefix + hex)

// Generator for valid access tokens
const accessTokenArb = fc
    .string({ minLength: 20, maxLength: 200 })
    .filter(s => s.length > 0)

// Generator for OAuth responses
const oauthResponseArb = fc.record({
    accessToken: accessTokenArb,
    channelId: fc.option(youtubeChannelIdArb),
    email: fc.option(fc.emailAddress()),
    name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
})

// Generator for YouTube channel info
const youtubeChannelInfoArb = fc.record({
    channelId: youtubeChannelIdArb,
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 0, maxLength: 500 }),
    customUrl: fc.option(fc.webUrl()),
    subscriberCount: fc.option(fc.integer({ min: 0, max: 1000000 })),
    profileImageUrl: fc.option(fc.webUrl()),
})

describe("Channel Validation Service - Property-Based Tests", () => {
    let service: ChannelValidationService

    beforeEach(async () => {
        service = new ChannelValidationService(mockConfig)
        await service.initialize()
    })

    afterEach(async () => {
        await service.shutdown()
        service.clearRateLimitState()
    })

    describe("Property 1: Channel ID Validation", () => {
        it(
            "should validate matching channel IDs correctly",
            async () => {
                await fc.assert(
                    fc.asyncProperty(youtubeChannelIdArb, async channelId => {
                        const oauthResponse: OAuthResponse = {
                            accessToken: "test-token",
                            channelId,
                        }

                        const mockChannelInfo: YouTubeChannelInfo = {
                            channelId,
                            title: "Test Channel",
                            description: "Test",
                        }

                        vi.spyOn(service, "getChannelInfo").mockResolvedValue(
                            mockChannelInfo
                        )

                        const result = await service.validateChannelOwnership(
                            oauthResponse,
                            channelId
                        )

                        // Property: Matching channel IDs should validate successfully
                        expect(result.valid).toBe(true)
                        expect(result.channelInfo?.channelId).toBe(channelId)
                    })
                )
            },
            { timeout: 30000 }
        )

        it(
            "should reject mismatched channel IDs",
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.tuple(youtubeChannelIdArb, youtubeChannelIdArb),
                        async ([channelId1, channelId2]) => {
                            // Skip if IDs are the same
                            if (channelId1 === channelId2) {
                                return
                            }

                            const oauthResponse: OAuthResponse = {
                                accessToken: "test-token",
                                channelId: channelId1,
                            }

                            const mockChannelInfo: YouTubeChannelInfo = {
                                channelId: channelId2,
                                title: "Test Channel",
                                description: "Test",
                            }

                            vi.spyOn(
                                service,
                                "getChannelInfo"
                            ).mockResolvedValue(mockChannelInfo)

                            const result =
                                await service.validateChannelOwnership(
                                    oauthResponse,
                                    channelId1
                                )

                            // Property: Mismatched channel IDs should fail validation
                            expect(result.valid).toBe(false)
                            expect(result.error).toContain(
                                "Channel ID does not match"
                            )
                        }
                    )
                )
            },
            { timeout: 30000 }
        )
    })

    describe("Property 2: Channel Info Extraction", () => {
        it(
            "should extract all channel info fields correctly",
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        youtubeChannelInfoArb,
                        async channelInfo => {
                            const mockResponse = {
                                items: [
                                    {
                                        id: channelInfo.channelId,
                                        snippet: {
                                            title: channelInfo.title,
                                            description:
                                                channelInfo.description,
                                            customUrl: channelInfo.customUrl,
                                            thumbnails:
                                                channelInfo.profileImageUrl
                                                    ? {
                                                          default: {
                                                              url: channelInfo.profileImageUrl,
                                                          },
                                                      }
                                                    : undefined,
                                        },
                                        statistics: {
                                            subscriberCount: String(
                                                channelInfo.subscriberCount || 0
                                            ),
                                        },
                                    },
                                ],
                            }

                            global.fetch = vi.fn().mockResolvedValue({
                                ok: true,
                                json: async () => mockResponse,
                            })

                            const result =
                                await service.getChannelInfo("test-token")

                            // Property: All channel info fields should be extracted correctly
                            expect(result?.channelId).toBe(
                                channelInfo.channelId
                            )
                            expect(result?.title).toBe(channelInfo.title)
                            expect(result?.description).toBe(
                                channelInfo.description
                            )
                            expect(result?.customUrl).toBe(
                                channelInfo.customUrl
                            )
                            expect(result?.subscriberCount).toBe(
                                channelInfo.subscriberCount || 0
                            )
                        }
                    )
                )
            },
            { timeout: 30000 }
        )
    })

    describe("Property 3: Error Handling", () => {
        it(
            "should handle invalid access tokens consistently",
            async () => {
                await fc.assert(
                    fc.asyncProperty(accessTokenArb, async token => {
                        const oauthResponse: OAuthResponse = {
                            accessToken: token,
                            channelId: "UCtest123",
                        }

                        global.fetch = vi.fn().mockResolvedValue({
                            ok: false,
                            status: 401,
                            json: async () => ({ error: "Invalid token" }),
                        })

                        // Property: Invalid tokens should always fail
                        await expect(
                            service.validateChannelOwnership(
                                oauthResponse,
                                "UCtest123"
                            )
                        ).rejects.toThrow()
                    })
                )
            },
            { timeout: 30000 }
        )
    })

    describe("Property 4: Rate Limiting", () => {
        it(
            "should enforce rate limits consistently",
            async () => {
                await fc.assert(
                    fc.asyncProperty(
                        fc.integer({ min: 1, max: 150 }),
                        async requestCount => {
                            service.clearRateLimitState()

                            let successCount = 0
                            let failureCount = 0

                            for (let i = 0; i < requestCount; i++) {
                                try {
                                    ;(service as any).checkRateLimit("test-key")
                                    successCount++
                                } catch {
                                    failureCount++
                                }
                            }

                            // Property: First 100 requests should succeed, rest should fail
                            expect(successCount).toBe(
                                Math.min(requestCount, 100)
                            )
                            expect(failureCount).toBe(
                                Math.max(0, requestCount - 100)
                            )
                        }
                    )
                )
            },
            { timeout: 30000 }
        )
    })

    describe("Property 5: Validation Result Consistency", () => {
        it(
            "should return consistent validation results for same inputs",
            async () => {
                await fc.assert(
                    fc.asyncProperty(youtubeChannelIdArb, async channelId => {
                        const oauthResponse: OAuthResponse = {
                            accessToken: "test-token",
                            channelId,
                        }

                        const mockChannelInfo: YouTubeChannelInfo = {
                            channelId,
                            title: "Test Channel",
                            description: "Test",
                        }

                        vi.spyOn(service, "getChannelInfo").mockResolvedValue(
                            mockChannelInfo
                        )

                        // Call validation twice with same inputs
                        const result1 = await service.validateChannelOwnership(
                            oauthResponse,
                            channelId
                        )
                        const result2 = await service.validateChannelOwnership(
                            oauthResponse,
                            channelId
                        )

                        // Property: Same inputs should produce same results
                        expect(result1.valid).toBe(result2.valid)
                        expect(result1.error).toBe(result2.error)
                        expect(result1.channelInfo?.channelId).toBe(
                            result2.channelInfo?.channelId
                        )
                    })
                )
            },
            { timeout: 30000 }
        )
    })

    describe("Property 6: Empty/Null Input Handling", () => {
        it("should handle empty inputs gracefully", async () => {
            const emptyOAuthResponse: OAuthResponse = {
                accessToken: "",
            }

            const result = await service.validateChannelOwnership(
                emptyOAuthResponse,
                ""
            )

            // Property: Empty inputs should return error, not crash
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
        })
    })
})
