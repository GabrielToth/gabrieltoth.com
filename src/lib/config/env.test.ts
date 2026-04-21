// Environment Configuration Tests
// Feature: distributed-infrastructure-logging

import fc from "fast-check"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { validateEnv } from "./env"

describe("Environment Configuration", () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env }
    })

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv
    })

    // Feature: distributed-infrastructure-logging, Property 31: Required environment variable validation
    // **Validates: Requirements 8.3**
    describe("Property 31: Required environment variable validation", () => {
        it("should fail when any required variable is missing", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "DATABASE_URL",
                        "REDIS_URL",
                        "DISCORD_WEBHOOK_URL"
                    ),
                    missingVar => {
                        // Setup: Set all required vars except one
                        process.env.DATABASE_URL =
                            "postgres://localhost:5432/test"
                        process.env.REDIS_URL = "redis://localhost:6379"
                        process.env.DISCORD_WEBHOOK_URL =
                            "https://discord.com/api/webhooks/test"

                        // Remove the selected variable
                        delete process.env[missingVar]

                        // Should throw with clear error message
                        expect(() => validateEnv()).toThrow(
                            `Missing required environment variables: ${missingVar}`
                        )
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should succeed when all required variables are present", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        DATABASE_URL: fc.webUrl({
                            validSchemes: ["postgres", "postgresql"],
                        }),
                        REDIS_URL: fc
                            .string()
                            .map(s => `redis://localhost:6379/${s}`),
                        DISCORD_WEBHOOK_URL: fc.webUrl({
                            validSchemes: ["https"],
                        }),
                    }),
                    envVars => {
                        // Setup environment
                        process.env.DATABASE_URL = envVars.DATABASE_URL
                        process.env.REDIS_URL = envVars.REDIS_URL
                        process.env.DISCORD_WEBHOOK_URL =
                            envVars.DISCORD_WEBHOOK_URL

                        // Should not throw
                        expect(() => validateEnv()).not.toThrow()

                        // Should return valid config
                        const config = validateEnv()
                        expect(config.DATABASE_URL).toBe(envVars.DATABASE_URL)
                        expect(config.REDIS_URL).toBe(envVars.REDIS_URL)
                        expect(config.DISCORD_WEBHOOK_URL).toBe(
                            envVars.DISCORD_WEBHOOK_URL
                        )
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should list all missing variables in error message", () => {
            // Remove all required variables
            delete process.env.DATABASE_URL
            delete process.env.REDIS_URL
            delete process.env.DISCORD_WEBHOOK_URL

            expect(() => validateEnv()).toThrow(
                "Missing required environment variables: DATABASE_URL, REDIS_URL, DISCORD_WEBHOOK_URL"
            )
        })
    })

    // Unit tests for edge cases
    describe("Unit Tests: Edge Cases", () => {
        it("should fail when DISCORD_WEBHOOK_URL is missing", () => {
            process.env.DATABASE_URL = "postgres://localhost:5432/test"
            process.env.REDIS_URL = "redis://localhost:6379"
            delete process.env.DISCORD_WEBHOOK_URL

            expect(() => validateEnv()).toThrow(
                "Missing required environment variables: DISCORD_WEBHOOK_URL"
            )
        })

        it("should fail when DATABASE_URL is missing", () => {
            delete process.env.DATABASE_URL
            process.env.REDIS_URL = "redis://localhost:6379"
            process.env.DISCORD_WEBHOOK_URL =
                "https://discord.com/api/webhooks/test"

            expect(() => validateEnv()).toThrow(
                "Missing required environment variables: DATABASE_URL"
            )
        })

        it('should parse DEBUG flag as true when set to "true"', () => {
            process.env.DATABASE_URL = "postgres://localhost:5432/test"
            process.env.REDIS_URL = "redis://localhost:6379"
            process.env.DISCORD_WEBHOOK_URL =
                "https://discord.com/api/webhooks/test"
            process.env.DEBUG = "true"

            const config = validateEnv()
            expect(config.DEBUG).toBe(true)
        })

        it('should parse DEBUG flag as false when set to "false"', () => {
            process.env.DATABASE_URL = "postgres://localhost:5432/test"
            process.env.REDIS_URL = "redis://localhost:6379"
            process.env.DISCORD_WEBHOOK_URL =
                "https://discord.com/api/webhooks/test"
            process.env.DEBUG = "false"

            const config = validateEnv()
            expect(config.DEBUG).toBe(false)
        })

        it("should parse DEBUG flag as false when undefined", () => {
            process.env.DATABASE_URL = "postgres://localhost:5432/test"
            process.env.REDIS_URL = "redis://localhost:6379"
            process.env.DISCORD_WEBHOOK_URL =
                "https://discord.com/api/webhooks/test"
            delete process.env.DEBUG

            const config = validateEnv()
            expect(config.DEBUG).toBe(false)
        })

        it("should use default values for optional variables", () => {
            process.env.DATABASE_URL = "postgres://localhost:5432/test"
            process.env.REDIS_URL = "redis://localhost:6379"
            process.env.DISCORD_WEBHOOK_URL =
                "https://discord.com/api/webhooks/test"
            delete process.env.POSTGRES_USER
            delete process.env.POSTGRES_PASSWORD
            delete process.env.POSTGRES_DB
            delete process.env.HOSTNAME
            delete process.env.PORT

            const config = validateEnv()
            expect(config.POSTGRES_USER).toBe("postgres")
            expect(config.POSTGRES_PASSWORD).toBe("")
            expect(config.POSTGRES_DB).toBe("app")
            expect(config.HOSTNAME).toBe("unknown")
            expect(config.PORT).toBe(4000)
        })

        it("should parse PORT as number", () => {
            process.env.DATABASE_URL = "postgres://localhost:5432/test"
            process.env.REDIS_URL = "redis://localhost:6379"
            process.env.DISCORD_WEBHOOK_URL =
                "https://discord.com/api/webhooks/test"
            process.env.PORT = "8080"

            const config = validateEnv()
            expect(config.PORT).toBe(8080)
            expect(typeof config.PORT).toBe("number")
        })

        it("should default NODE_ENV to development when not set", () => {
            process.env.DATABASE_URL = "postgres://localhost:5432/test"
            process.env.REDIS_URL = "redis://localhost:6379"
            process.env.DISCORD_WEBHOOK_URL =
                "https://discord.com/api/webhooks/test"
            delete process.env.NODE_ENV

            const config = validateEnv()
            expect(config.NODE_ENV).toBe("development")
        })
    })
})
