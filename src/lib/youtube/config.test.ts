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
        REDIS_URL: "redis://localhost:6379",
        DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/123/456",
        HOSTNAME: "localhost",
        YOUTUBE_CLIENT_ID: "test-client-id",
        YOUTUBE_CLIENT_SECRET: "test-client-secret",
        YOUTUBE_REDIRECT_URI: "http://localhost:3000/api/youtube/link/callback",
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: 587,
        SMTP_USER: "test@gmail.com",
        SMTP_PASSWORD: "test-password",
        SMTP_FROM_EMAIL: "noreply@example.com",
        SMTP_FROM_NAME: "Test App",
        GEOIP_SERVICE_URL: "https://geoip.maxmind.com/geoip/v2.1/city",
        GEOIP_API_KEY: "test-api-key",
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
        })

        it("should set correct email configuration", () => {
            const env = createValidEnv()

            const config = createYouTubeChannelLinkingConfig(env)

            expect(config.email.host).toBe("smtp.gmail.com")
            expect(config.email.port).toBe(587)
            expect(config.email.user).toBe("test@gmail.com")
            expect(config.email.password).toBe("test-password")
            expect(config.email.fromEmail).toBe("noreply@example.com")
            expect(config.email.fromName).toBe("Test App")
            expect(config.email.tls).toBe(true)
        })

        it("should set correct geolocation configuration", () => {
            const env = createValidEnv()

            const config = createYouTubeChannelLinkingConfig(env)

            expect(config.geolocation.serviceUrl).toBe(
                "https://geoip.maxmind.com/geoip/v2.1/city"
            )
            expect(config.geolocation.apiKey).toBe("test-api-key")
            expect(config.geolocation.timeout).toBe(5000)
            expect(config.geolocation.retries).toBe(3)
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

        it("should detect invalid email port", () => {
            const env = createValidEnv()
            const config = createYouTubeChannelLinkingConfig(env)
            config.email.port = 99999

            const result = validateYouTubeChannelLinkingConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain(
                "Email service port must be between 1 and 65535"
            )
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
            config.email.port = 99999
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

        it("should validate configuration on creation", () => {
            const env = createValidEnv()
            env.SMTP_PORT = 99999

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
