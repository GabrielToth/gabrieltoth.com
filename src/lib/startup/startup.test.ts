// Tests for Startup Handler
// Feature: distributed-infrastructure-logging

import fc from "fast-check"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DiscordAlerter } from "../discord/alerter"
import { StartupHandlerImpl } from "./index"

describe("Startup Handler", () => {
    let startupHandler: StartupHandlerImpl
    let mockDiscordAlerter: DiscordAlerter

    beforeEach(() => {
        mockDiscordAlerter = {
            sendAlert: vi.fn().mockResolvedValue(undefined),
        } as unknown as DiscordAlerter

        startupHandler = new StartupHandlerImpl(mockDiscordAlerter)
    })

    // Feature: distributed-infrastructure-logging, Property 10: Sensitive data exclusion
    // **Validates: Requirements 8.9**
    describe("Property 10: Sensitive data exclusion", () => {
        it("should never log sensitive environment variables", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.record({
                        PASSWORD: fc.string(),
                        SECRET_KEY: fc.string(),
                        API_TOKEN: fc.string(),
                        DATABASE_URL: fc.string(),
                        PRIVATE_KEY: fc.string(),
                        AUTH_TOKEN: fc.string(),
                        REDIS_URL: fc.string(),
                        DISCORD_WEBHOOK_URL: fc.string(),
                    }),
                    async sensitiveEnv => {
                        // Set sensitive environment variables
                        const originalEnv = { ...process.env }
                        Object.assign(process.env, sensitiveEnv)

                        try {
                            // Get safe configuration
                            const safeConfig = (
                                startupHandler as any
                            ).getSafeConfiguration()

                            // Verify all sensitive values are redacted
                            for (const [key, value] of Object.entries(
                                sensitiveEnv
                            )) {
                                expect(safeConfig[key]).toBe("[REDACTED]")
                                expect(safeConfig[key]).not.toBe(value)
                            }
                        } finally {
                            // Restore original environment
                            process.env = originalEnv
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should allow non-sensitive environment variables", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.record({
                        NODE_ENV: fc.constantFrom(
                            "development",
                            "production",
                            "test"
                        ),
                        DEBUG: fc.constantFrom("true", "false"),
                        PORT: fc.integer({ min: 1000, max: 9999 }).map(String),
                        LOG_LEVEL: fc.constantFrom(
                            "debug",
                            "info",
                            "warn",
                            "error"
                        ),
                    }),
                    async nonSensitiveEnv => {
                        const originalEnv = { ...process.env }
                        Object.assign(process.env, nonSensitiveEnv)

                        try {
                            const safeConfig = (
                                startupHandler as any
                            ).getSafeConfiguration()

                            // Verify non-sensitive values are not redacted
                            for (const [key, value] of Object.entries(
                                nonSensitiveEnv
                            )) {
                                expect(safeConfig[key]).toBe(value)
                                expect(safeConfig[key]).not.toBe("[REDACTED]")
                            }
                        } finally {
                            process.env = originalEnv
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Unit Tests
    describe("Unit Tests", () => {
        it("should log startup event", async () => {
            const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})

            await startupHandler.logStartup("1.0.0")

            // Verify Discord alert was sent
            expect(mockDiscordAlerter.sendAlert).toHaveBeenCalledWith({
                level: "startup",
                title: "Application Started",
                message: "Application has started successfully",
                context: expect.objectContaining({
                    version: "1.0.0",
                    environment: expect.any(String),
                }),
            })

            logSpy.mockRestore()
        })

        it("should send Discord alert on startup", async () => {
            await startupHandler.logStartup()

            expect(mockDiscordAlerter.sendAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    level: "startup",
                    title: "Application Started",
                })
            )
        })

        it("should redact PASSWORD in environment", () => {
            const originalEnv = { ...process.env }
            process.env.MY_PASSWORD = "secret123"

            try {
                const safeConfig = (
                    startupHandler as any
                ).getSafeConfiguration()
                expect(safeConfig.MY_PASSWORD).toBe("[REDACTED]")
            } finally {
                process.env = originalEnv
            }
        })

        it("should redact SECRET in environment", () => {
            const originalEnv = { ...process.env }
            process.env.APP_SECRET = "topsecret"

            try {
                const safeConfig = (
                    startupHandler as any
                ).getSafeConfiguration()
                expect(safeConfig.APP_SECRET).toBe("[REDACTED]")
            } finally {
                process.env = originalEnv
            }
        })

        it("should redact TOKEN in environment", () => {
            const originalEnv = { ...process.env }
            process.env.ACCESS_TOKEN = "token123"

            try {
                const safeConfig = (
                    startupHandler as any
                ).getSafeConfiguration()
                expect(safeConfig.ACCESS_TOKEN).toBe("[REDACTED]")
            } finally {
                process.env = originalEnv
            }
        })

        it("should redact KEY in environment", () => {
            const originalEnv = { ...process.env }
            process.env.API_KEY = "key123"

            try {
                const safeConfig = (
                    startupHandler as any
                ).getSafeConfiguration()
                expect(safeConfig.API_KEY).toBe("[REDACTED]")
            } finally {
                process.env = originalEnv
            }
        })

        it("should redact DATABASE_URL", () => {
            const originalEnv = { ...process.env }
            process.env.DATABASE_URL =
                "postgresql://user:password@localhost:5432/db"

            try {
                const safeConfig = (
                    startupHandler as any
                ).getSafeConfiguration()
                expect(safeConfig.DATABASE_URL).toBe("[REDACTED]")
            } finally {
                process.env = originalEnv
            }
        })

        it("should redact REDIS_URL", () => {
            const originalEnv = { ...process.env }
            process.env.REDIS_URL = "redis://user:password@localhost:6379"

            try {
                const safeConfig = (
                    startupHandler as any
                ).getSafeConfiguration()
                expect(safeConfig.REDIS_URL).toBe("[REDACTED]")
            } finally {
                process.env = originalEnv
            }
        })

        it("should redact DISCORD_WEBHOOK_URL", () => {
            const originalEnv = { ...process.env }
            process.env.DISCORD_WEBHOOK_URL =
                "https://discord.com/api/webhooks/123/abc"

            try {
                const safeConfig = (
                    startupHandler as any
                ).getSafeConfiguration()
                expect(safeConfig.DISCORD_WEBHOOK_URL).toBe("[REDACTED]")
            } finally {
                process.env = originalEnv
            }
        })

        it("should not redact NODE_ENV", () => {
            const originalEnv = { ...process.env }
            process.env.NODE_ENV = "production"

            try {
                const safeConfig = (
                    startupHandler as any
                ).getSafeConfiguration()
                expect(safeConfig.NODE_ENV).toBe("production")
            } finally {
                process.env = originalEnv
            }
        })

        it("should not redact DEBUG flag", () => {
            const originalEnv = { ...process.env }
            process.env.DEBUG = "true"

            try {
                const safeConfig = (
                    startupHandler as any
                ).getSafeConfiguration()
                expect(safeConfig.DEBUG).toBe("true")
            } finally {
                process.env = originalEnv
            }
        })

        it("should handle missing version", async () => {
            await startupHandler.logStartup()

            expect(mockDiscordAlerter.sendAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    context: expect.objectContaining({
                        version: expect.any(String),
                    }),
                })
            )
        })
    })
})
