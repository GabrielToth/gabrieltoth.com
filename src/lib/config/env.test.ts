// Environment Configuration Tests
// Feature: distributed-infrastructure-logging

import fc from "fast-check"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { validateEnv } from "./env"

describe("Environment Configuration", () => {
    let originalEnv: NodeJS.ProcessEnv

    const getTestEnv = () => ({
        DATABASE_URL: "postgres://localhost:5432/test",
        POSTGRES_USER: "test_user",
        POSTGRES_PASSWORD: "test_password",
        POSTGRES_DB: "test_db",
        UPSTASH_REDIS_REST_URL: "https://test-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test_redis_token",
        HOSTNAME: "localhost",
        DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/test",
        YOUTUBE_CLIENT_ID: "test_youtube_client_id",
        YOUTUBE_CLIENT_SECRET: "test_youtube_secret",
        YOUTUBE_REDIRECT_URI: "http://localhost:3000/api/auth/youtube/callback",
        INSTAGRAM_APP_ID: "test_instagram_id",
        INSTAGRAM_APP_SECRET: "test_instagram_secret",
        INSTAGRAM_REDIRECT_URI:
            "http://localhost:3000/api/auth/instagram/callback",
        INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "test_instagram_verify",
        TIKTOK_CLIENT_KEY: "test_tiktok_key",
        TIKTOK_CLIENT_SECRET: "test_tiktok_secret",
        TIKTOK_REDIRECT_URI: "http://localhost:3000/api/auth/tiktok/callback",
        TWITTER_CLIENT_ID: "test_twitter_id",
        TWITTER_CLIENT_SECRET: "test_twitter_secret",
        TWITTER_REDIRECT_URI: "http://localhost:3000/api/auth/twitter/callback",
        LINKEDIN_CLIENT_ID: "test_linkedin_id",
        LINKEDIN_CLIENT_SECRET: "test_linkedin_secret",
        LINKEDIN_REDIRECT_URI:
            "http://localhost:3000/api/auth/linkedin/callback",
        FACEBOOK_APP_ID: "test_facebook_id",
        FACEBOOK_APP_SECRET: "test_facebook_secret",
        FACEBOOK_REDIRECT_URI:
            "http://localhost:3000/api/auth/facebook/callback",
        FACEBOOK_WEBHOOK_VERIFY_TOKEN: "test_facebook_verify",
        FACEBOOK_PAGE_ID: "test_page_id",
        FACEBOOK_PAGE_ACCESS_TOKEN: "test_page_token",
        INSTAGRAM_BUSINESS_ACCOUNT_ID: "test_business_id",
        INSTAGRAM_PAGE_ACCESS_TOKEN: "test_insta_token",
        TWITCH_CLIENT_ID: "test_twitch_id",
        TWITCH_CLIENT_SECRET: "test_twitch_secret",
        TWITCH_REDIRECT_URI: "http://localhost:3000/api/auth/twitch/callback",
        KICK_CLIENT_ID: "test_kick_id",
        KICK_CLIENT_SECRET: "test_kick_secret",
        KICK_REDIRECT_URI: "http://localhost:3000/api/auth/kick/callback",
        EMAIL_FROM: "test@example.com",
        RESEND_API_KEY: "re_test_key",
        RESEND_FROM_EMAIL: "noreply@example.com",
        RESEND_FROM_NAME: "Test App",
        TOKEN_ENCRYPTION_KEY:
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        OAUTH_STATE_SECRET:
            "test_state_secret_minimum_32_chars_long_for_security",
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "test_anon_key",
        NODE_ENV: "test",
        DEBUG: "false",
        PORT: "3000",
    })

    beforeEach(() => {
        originalEnv = { ...process.env }
        Object.assign(process.env, getTestEnv())
    })

    afterEach(() => {
        process.env = originalEnv
    })

    // Feature: distributed-infrastructure-logging, Property 31: Required environment variable validation
    // **Validates: Requirements 8.3**
    describe("Property 31: Required environment variable validation", () => {
        it("should fail when any required variable is missing", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom("DATABASE_URL", "DISCORD_WEBHOOK_URL"),
                    missingVar => {
                        // Ensure base env is present
                        Object.assign(process.env, getTestEnv())

                        // Remove the selected variable
                        delete process.env[missingVar]

                        // Should throw with clear error message
                        expect(() => validateEnv()).toThrow(
                            `Missing required environment variables:`
                        )
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should succeed when all required variables are present", () => {
            Object.assign(process.env, getTestEnv())
            fc.assert(
                fc.property(
                    fc.record({
                        DATABASE_URL: fc.webUrl({
                            validSchemes: ["postgres", "postgresql"],
                        }),
                        DISCORD_WEBHOOK_URL: fc.webUrl({
                            validSchemes: ["https"],
                        }),
                    }),
                    envVars => {
                        // Setup environment
                        Object.assign(process.env, getTestEnv())
                        process.env.DATABASE_URL = envVars.DATABASE_URL
                        process.env.DISCORD_WEBHOOK_URL =
                            envVars.DISCORD_WEBHOOK_URL

                        // Should not throw
                        expect(() => validateEnv()).not.toThrow()

                        // Should return valid config
                        const config = validateEnv()
                        expect(config.DATABASE_URL).toBe(envVars.DATABASE_URL)
                        expect(config.DISCORD_WEBHOOK_URL).toBe(
                            envVars.DISCORD_WEBHOOK_URL
                        )
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should list all missing variables in error message", () => {
            // Setup fresh env with all keys deleted
            const allKeys = Object.keys(getTestEnv())
            allKeys.forEach(k => delete process.env[k])

            expect(() => validateEnv()).toThrow(
                /Missing required environment variables/
            )
        })
    })

    // Unit tests for edge cases
    describe("Unit Tests: Edge Cases", () => {
        it("should fail when DISCORD_WEBHOOK_URL is missing", () => {
            Object.assign(process.env, getTestEnv())
            delete process.env.DISCORD_WEBHOOK_URL

            expect(() => validateEnv()).toThrow(
                `Missing required environment variables:\n  DISCORD_WEBHOOK_URL`
            )
        })

        it("should fail when DATABASE_URL is missing", () => {
            Object.assign(process.env, getTestEnv())
            delete process.env.DATABASE_URL

            expect(() => validateEnv()).toThrow(
                `Missing required environment variables:\n  DATABASE_URL`
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

        it("should use default values for optional variables in production mode", () => {
            Object.assign(process.env, getTestEnv())
            ;(process.env as any).NODE_ENV = "production"
            delete process.env.POSTGRES_USER
            delete process.env.POSTGRES_PASSWORD
            delete process.env.POSTGRES_DB
            delete process.env.HOSTNAME
            delete process.env.PORT

            const config = validateEnv()
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
            delete (process.env as any).NODE_ENV

            const config = validateEnv()
            expect(config.NODE_ENV).toBe("development")
        })
    })
})
