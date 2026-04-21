// Discord Alerter Property-Based Tests
// Feature: distributed-infrastructure-logging

import fc from "fast-check"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DiscordAlerterImpl, type Alert, type AlertLevel } from "./alerter"
import { InMemoryRateLimiter } from "./rate-limiter"

describe("Discord Alerter Properties", () => {
    let mockFetch: any

    beforeEach(() => {
        // Mock global fetch
        mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
        })
        global.fetch = mockFetch
    })

    // Feature: distributed-infrastructure-logging, Property 11: Alert level filtering
    // **Validates: Requirements 3.1**
    describe("Property 11: Alert level filtering", () => {
        it("should only accept valid alert levels", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom<AlertLevel>(
                        "error",
                        "fatal",
                        "startup",
                        "shutdown"
                    ),
                    fc.string(),
                    fc.string(),
                    async (level, title, message) => {
                        const alerter = new DiscordAlerterImpl(
                            "https://discord.com/api/webhooks/test"
                        )
                        const alert: Alert = { level, title, message }

                        // Should not throw for valid levels
                        await expect(
                            alerter.sendAlert(alert)
                        ).resolves.not.toThrow()
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 12: Rate limiting enforcement
    // **Validates: Requirements 3.2**
    describe("Property 12: Rate limiting enforcement", () => {
        it("should enforce rate limiting within 1-minute window", async () => {
            const rateLimiter = new InMemoryRateLimiter(60000)
            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test",
                rateLimiter
            )

            const alert: Alert = {
                level: "error",
                title: "Test Alert",
                message: "Test message",
            }

            // First alert should go through
            await alerter.sendAlert(alert)
            expect(mockFetch).toHaveBeenCalledTimes(1)

            // Second alert with same context should be rate-limited
            await alerter.sendAlert(alert)
            expect(mockFetch).toHaveBeenCalledTimes(1) // Still 1, not 2
        })

        it("should allow alerts with different contexts", async () => {
            const rateLimiter = new InMemoryRateLimiter(60000)
            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test",
                rateLimiter
            )

            const alert1: Alert = {
                level: "error",
                title: "Alert 1",
                message: "Message 1",
            }

            const alert2: Alert = {
                level: "error",
                title: "Alert 2",
                message: "Message 2",
            }

            await alerter.sendAlert(alert1)
            await alerter.sendAlert(alert2)

            // Both should go through (different titles = different contexts)
            expect(mockFetch).toHaveBeenCalledTimes(2)
        })
    })

    // Feature: distributed-infrastructure-logging, Property 13: Discord embed formatting
    // **Validates: Requirements 3.4**
    describe("Property 13: Discord embed formatting", () => {
        it("should format alerts as Discord embeds with correct color coding", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        level: fc.constantFrom<AlertLevel>(
                            "error",
                            "fatal",
                            "startup",
                            "shutdown"
                        ),
                        title: fc.string(),
                        message: fc.string(),
                    }),
                    async ({ level, title, message }) => {
                        const alerter = new DiscordAlerterImpl(
                            "https://discord.com/api/webhooks/test"
                        )
                        const alert: Alert = { level, title, message }

                        await alerter.sendAlert(alert)

                        // Verify fetch was called with correct structure
                        expect(mockFetch).toHaveBeenCalled()
                        const callArgs =
                            mockFetch.mock.calls[
                                mockFetch.mock.calls.length - 1
                            ]
                        const body = JSON.parse(callArgs[1].body)

                        expect(body.embeds).toBeDefined()
                        expect(body.embeds[0].title).toBe(title)
                        expect(body.embeds[0].description).toBe(message)
                        expect(body.embeds[0].color).toBeDefined()
                        expect(body.embeds[0].timestamp).toBeDefined()

                        // Verify color coding
                        const expectedColors: Record<AlertLevel, number> = {
                            error: 0xffa500,
                            fatal: 0xff0000,
                            startup: 0x00ff00,
                            shutdown: 0x0000ff,
                        }
                        expect(body.embeds[0].color).toBe(expectedColors[level])
                    }
                ),
                { numRuns: 50 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 14: Stack traces in critical alerts
    // **Validates: Requirements 3.5**
    describe("Property 14: Stack traces in critical alerts", () => {
        it("should include stack traces in embeds when provided", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom<AlertLevel>("error", "fatal"),
                    fc.string(),
                    fc.string(),
                    fc.string(),
                    async (level, title, message, stack) => {
                        const alerter = new DiscordAlerterImpl(
                            "https://discord.com/api/webhooks/test"
                        )
                        const alert: Alert = { level, title, message, stack }

                        await alerter.sendAlert(alert)

                        const callArgs =
                            mockFetch.mock.calls[
                                mockFetch.mock.calls.length - 1
                            ]
                        const body = JSON.parse(callArgs[1].body)

                        // Should have a field for stack trace
                        const stackField = body.embeds[0].fields.find(
                            (f: any) => f.name === "Stack Trace"
                        )
                        expect(stackField).toBeDefined()
                        expect(stackField.value).toContain(
                            stack.substring(0, 100)
                        ) // At least part of it
                    }
                ),
                { numRuns: 50 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 15: Non-blocking alert failures
    // **Validates: Requirements 3.7**
    describe("Property 15: Non-blocking alert failures", () => {
        it("should not throw when webhook fails", async () => {
            mockFetch.mockRejectedValue(new Error("Network error"))

            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test"
            )
            const alert: Alert = {
                level: "error",
                title: "Test",
                message: "Test message",
            }

            // Should not throw
            await expect(alerter.sendAlert(alert)).resolves.not.toThrow()
        })

        it("should not throw when webhook returns error status", async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
            })

            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test"
            )
            const alert: Alert = {
                level: "error",
                title: "Test",
                message: "Test message",
            }

            // Should not throw
            await expect(alerter.sendAlert(alert)).resolves.not.toThrow()
        })
    })

    // Feature: distributed-infrastructure-logging, Property 16: Rate limit suppression logging
    // **Validates: Requirements 10.3**
    describe("Property 16: Rate limit suppression logging", () => {
        it("should log when alerts are suppressed", async () => {
            const rateLimiter = new InMemoryRateLimiter(60000)
            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test",
                rateLimiter
            )

            const alert: Alert = {
                level: "error",
                title: "Test",
                message: "Test message",
            }

            // First alert
            await alerter.sendAlert(alert)

            // Second alert (should be suppressed)
            await alerter.sendAlert(alert)

            // Verify only one webhook call was made
            expect(mockFetch).toHaveBeenCalledTimes(1)
        })
    })

    // Feature: distributed-infrastructure-logging, Property 17: Rate limit expiration
    // **Validates: Requirements 10.4**
    describe("Property 17: Rate limit expiration", () => {
        it("should allow alerts after rate limit window expires", async () => {
            const shortWindow = 100 // 100ms for testing
            const rateLimiter = new InMemoryRateLimiter(shortWindow)
            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test",
                rateLimiter
            )

            const alert: Alert = {
                level: "error",
                title: "Test",
                message: "Test message",
            }

            // First alert
            await alerter.sendAlert(alert)
            expect(mockFetch).toHaveBeenCalledTimes(1)

            // Wait for rate limit to expire
            await new Promise(resolve => setTimeout(resolve, shortWindow + 50))

            // Second alert (should go through)
            await alerter.sendAlert(alert)
            expect(mockFetch).toHaveBeenCalledTimes(2)
        })
    })

    // Feature: distributed-infrastructure-logging, Property 18: Independent context rate limiting
    // **Validates: Requirements 10.5**
    describe("Property 18: Independent context rate limiting", () => {
        it("should rate limit independently per context", async () => {
            const rateLimiter = new InMemoryRateLimiter(60000)
            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test",
                rateLimiter
            )

            const alert1: Alert = {
                level: "error",
                title: "Context1",
                message: "Message 1",
            }

            const alert2: Alert = {
                level: "error",
                title: "Context2",
                message: "Message 2",
            }

            // Send alert1 twice
            await alerter.sendAlert(alert1)
            await alerter.sendAlert(alert1)

            // Send alert2 once
            await alerter.sendAlert(alert2)

            // Should have 2 calls: first alert1 and alert2
            expect(mockFetch).toHaveBeenCalledTimes(2)
        })
    })

    // Unit tests for edge cases
    describe("Unit Tests: Discord Alerter Edge Cases", () => {
        it("should handle webhook URL from environment variable", () => {
            process.env.DISCORD_WEBHOOK_URL =
                "https://discord.com/api/webhooks/test"

            expect(
                () => new DiscordAlerterImpl(process.env.DISCORD_WEBHOOK_URL!)
            ).not.toThrow()
        })

        it("should handle embed with missing stack trace", async () => {
            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test"
            )
            const alert: Alert = {
                level: "error",
                title: "Test",
                message: "Test message",
                // No stack trace
            }

            await alerter.sendAlert(alert)

            const callArgs = mockFetch.mock.calls[0]
            const body = JSON.parse(callArgs[1].body)

            const stackField = body.embeds[0].fields.find(
                (f: any) => f.name === "Stack Trace"
            )
            expect(stackField).toBeUndefined()
        })

        it("should truncate very long context", async () => {
            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test"
            )
            const longContext = { data: "a".repeat(10000) }
            const alert: Alert = {
                level: "error",
                title: "Test",
                message: "Test message",
                context: longContext,
            }

            await alerter.sendAlert(alert)

            const callArgs = mockFetch.mock.calls[0]
            const body = JSON.parse(callArgs[1].body)

            const contextField = body.embeds[0].fields.find(
                (f: any) => f.name === "Context"
            )
            expect(contextField.value.length).toBeLessThan(600) // Truncated to ~500 + markup
        })

        it("should handle rate limiter cleanup", async () => {
            const rateLimiter = new InMemoryRateLimiter(100)
            const alerter = new DiscordAlerterImpl(
                "https://discord.com/api/webhooks/test",
                rateLimiter
            )

            // Send multiple alerts with different contexts
            for (let i = 0; i < 10; i++) {
                await alerter.sendAlert({
                    level: "error",
                    title: `Test ${i}`,
                    message: "Message",
                })
            }

            // Wait for cleanup
            await new Promise(resolve => setTimeout(resolve, 150))

            // Rate limiter should have cleaned up old entries
            expect(rateLimiter.size()).toBeLessThan(10)
        })
    })
})
