/**
 * Tests for YouTube Channel Linking Configuration
 */

import { afterEach, describe, expect, it } from "vitest"
import { EnvironmentConfig } from "../config/env"
import {
    createYouTubeChannelLinkingConfig,
    getYouTubeChannelLinkingConfig,
    resetYouTubeChannelLinkingConfig,
    validateYouTubeChannelLinkingConfig,
} from "./config"

/**
 * Create a valid test environment config
 */
function createValidEnv(): EnvironmentConfig {
    return {
        NODE_ENV: "development",
        DEBUG: false,
        PORT: 3000,
        DATABASE_URL: "postgres://localhost/test",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "password",
        POSTGRES_DB: "test",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: "",
        DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/123/456",
        HOSTNAME: "localhost",
        YOUTUBE_CLIENT_ID: "test-client-id",
        YOUTUBE_CLIENT_SECRET: "test-client-secret",
        YOUTUBE_REDIRECT_URI: "http://localhost:3000/api/youtube/link/callback",
        EMAIL_FROM: "noreply@example.com",
        RESEND_API_KEY: "re_test_key",
        RESEND_FROM_EMAIL: "noreply@example.com",
        RESEND_FROM_NAME: "Test App",
        INSTAGRAM_APP_ID: "ig-test-id",
        INSTAGRAM_APP_SECRET: "ig-test-secret",
        INSTAGRAM_REDIRECT_URI:
            "http://localhost:3000/api/oauth/callback/instagram",
        INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "test-verify-token",
        TIKTOK_CLIENT_KEY: "tt-test-key",
        TIKTOK_CLIENT_SECRET: "tt-test-secret",
        TIKTOK_REDIRECT_URI: "http://localhost:3000/api/oauth/callback/tiktok",
        FACEBOOK_APP_ID: "fb-test-id",
        FACEBOOK_APP_SECRET: "fb-test-secret",
        FACEBOOK_REDIRECT_URI:
            "http://localhost:3000/api/oauth/callback/facebook",
        FACEBOOK_WEBHOOK_VERIFY_TOKEN: "test-verify-token",
        FACEBOOK_PAGE_ID: "",
        FACEBOOK_PAGE_ACCESS_TOKEN: "",
        INSTAGRAM_BUSINESS_ACCOUNT_ID: "",
        INSTAGRAM_PAGE_ACCESS_TOKEN: "",
        TWITTER_CLIENT_ID: "tw-test-id",
        TWITTER_CLIENT_SECRET: "tw-test-secret",
        TWITTER_REDIRECT_URI:
            "http://localhost:3000/api/oauth/callback/twitter",
        TWITCH_CLIENT_ID: "twitch-test-id",
        TWITCH_CLIENT_SECRET: "twitch-test-secret",
        TWITCH_REDIRECT_URI: "http://localhost:3000/api/oauth/callback/twitch",
        KICK_CLIENT_ID: "kick-test-id",
        KICK_CLIENT_SECRET: "kick-test-secret",
        KICK_REDIRECT_URI: "http://localhost:3000/api/oauth/callback/kick",
        LINKEDIN_CLIENT_ID: "li-test-id",
        LINKEDIN_CLIENT_SECRET: "li-test-secret",
        LINKEDIN_REDIRECT_URI:
            "http://localhost:3000/api/oauth/callback/linkedin",
        OAUTH_STATE_SECRET: "a".repeat(64), // 64 character hex string
        TOKEN_ENCRYPTION_KEY: "a".repeat(64), // 64 character hex string
    }
}

describe("YouTube Channel Linking Configuration", () => {
    afterEach(() => {
        resetYouTubeChannelLinkingConfig()
    })

    describe("createYouTubeChannelLinkingConfig", () => {
        it("should create valid configuration from environment", () => {
            const env = createValidEnv()

            const config = createYouTubeChannelLinkingConfig(env)

            expect(config.oauth.clientId).toBe("test-client-id")
            expect(config.oauth.clientSecret).toBe("test-client-secret")
            expect(config.oauth.redirectUri).toBe(
                "http://localhost:3000/api/youtube/link/callback"
            )
            expect(config.oauth.scopes).toContain(
                "https://www.googleapis.com/auth/youtube.readonly"
            )
            expect(config.oauth.scopes).toContain(
                "https://www.googleapis.com/auth/youtube.upload"
            )
            expect(config.oauth.scopes).toContain(
                "https://www.googleapis.com/auth/youtube"
            )
        })

        it("should set correct email configuration", () => {
            const env = createValidEnv()

            const config = createYouTubeChannelLinkingConfig(env)

            expect(config.email.fromEmail).toBe("noreply@example.com")
            expect(config.email.fromName).toBe("Test App")
        })

        it("should set correct encryption configuration", () => {
            const env = createValidEnv()

            const config = createYouTubeChannelLinkingConfig(env)

            expect(config.encryption.encryptionKey).toBe("a".repeat(64))
            expect(config.encryption.algorithm).toBe("aes-256-gcm")
        })

        it("should set correct rate limiting configuration", () => {
            const env = createValidEnv()

            const config = createYouTubeChannelLinkingConfig(env)

            expect(config.rateLimit.linkingAttemptsPerHour).toBe(5)
            expect(config.rateLimit.recoveryAttemptsPerDay).toBe(3)
            expect(config.rateLimit.verificationCodeAttempts).toBe(3)
            expect(config.rateLimit.unlinkAttemptsPerHour).toBe(5)
        })

        it("should set correct security configuration", () => {
            const env = createValidEnv()

            const config = createYouTubeChannelLinkingConfig(env)

            expect(config.security.verificationCodeExpiry).toBe(15 * 60 * 1000)
            expect(config.security.recoveryTokenExpiry).toBe(
                24 * 60 * 60 * 1000
            )
            expect(config.security.unlinkRevocationWindow).toBe(
                24 * 60 * 60 * 1000
            )
            expect(config.security.suspiciousActivityThreshold).toBe(50)
        })
    })

    describe("validateYouTubeChannelLinkingConfig", () => {
        it("should validate correct configuration", () => {
            const env = createValidEnv()
            const config = createYouTubeChannelLinkingConfig(env)

            const result = validateYouTubeChannelLinkingConfig(config)

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it("should detect missing OAuth client ID", () => {
            const env = createValidEnv()
            const config = createYouTubeChannelLinkingConfig(env)
            config.oauth.clientId = ""

            const result = validateYouTubeChannelLinkingConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain(
                "YouTube OAuth client ID is required"
            )
        })

        it("should detect missing OAuth client secret", () => {
            const env = createValidEnv()
            const config = createYouTubeChannelLinkingConfig(env)
            config.oauth.clientSecret = ""

            const result = validateYouTubeChannelLinkingConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain(
                "YouTube OAuth client secret is required"
            )
        })

        it("should detect missing encryption key", () => {
            const env = createValidEnv()
            const config = createYouTubeChannelLinkingConfig(env)
            config.encryption.encryptionKey = ""

            const result = validateYouTubeChannelLinkingConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain("Encryption key is required")
        })

        it("should detect invalid encryption key length", () => {
            const env = createValidEnv()
            const config = createYouTubeChannelLinkingConfig(env)
            config.encryption.encryptionKey = "invalid"

            const result = validateYouTubeChannelLinkingConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain(
                "Encryption key must be 64 characters (32 bytes in hex format)"
            )
        })

        it("should detect invalid rate limiting configuration", () => {
            const env = createValidEnv()
            const config = createYouTubeChannelLinkingConfig(env)
            config.rateLimit.linkingAttemptsPerHour = 0

            const result = validateYouTubeChannelLinkingConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain(
                "Linking attempts per hour must be at least 1"
            )
        })

        it("should detect invalid security configuration", () => {
            const env = createValidEnv()
            const config = createYouTubeChannelLinkingConfig(env)
            config.security.suspiciousActivityThreshold = 150

            const result = validateYouTubeChannelLinkingConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain(
                "Suspicious activity threshold must be between 0 and 100"
            )
        })

        it("should detect multiple validation errors", () => {
            const env = createValidEnv()
            const config = createYouTubeChannelLinkingConfig(env)
            config.oauth.clientId = ""
            config.encryption.encryptionKey = "invalid"

            const result = validateYouTubeChannelLinkingConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(1)
        })
    })

    describe("getYouTubeChannelLinkingConfig", () => {
        it("should create and cache configuration", () => {
            const env = createValidEnv()

            const config1 = getYouTubeChannelLinkingConfig(env)
            const config2 = getYouTubeChannelLinkingConfig()

            expect(config1).toBe(config2)
        })

        it("should throw if environment not provided on first call", () => {
            expect(() => getYouTubeChannelLinkingConfig()).toThrow(
                "Environment configuration is required"
            )
        })

        it("should throw if configuration is invalid", () => {
            const env = createValidEnv()
            env.YOUTUBE_CLIENT_ID = ""

            expect(() => getYouTubeChannelLinkingConfig(env)).toThrow(
                "Invalid YouTube Channel Linking configuration"
            )
        })

        it("should validate invalid encryption key on creation", () => {
            const env = createValidEnv()
            env.TOKEN_ENCRYPTION_KEY = "invalid"

            expect(() => getYouTubeChannelLinkingConfig(env)).toThrow(
                "Invalid YouTube Channel Linking configuration"
            )
        })
    })

    describe("resetYouTubeChannelLinkingConfig", () => {
        it("should reset cached configuration", () => {
            const env = createValidEnv()

            const config1 = getYouTubeChannelLinkingConfig(env)
            resetYouTubeChannelLinkingConfig()
            const config2 = getYouTubeChannelLinkingConfig(env)

            expect(config1).not.toBe(config2)
        })
    })
})
