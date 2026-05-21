/**
 * Environment Configuration Tests
 * Tests for environment configuration module
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
    getConfig,
    getEnvironmentConfiguration,
    resetConfig,
    validateEnvironmentConfiguration,
} from "./environment"

describe("Environment Configuration", () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
        resetConfig()
        // Reset to original env
        process.env = { ...originalEnv }
        ;(process.env as any).NODE_ENV = "development"
        process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
        process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db"
        process.env.REDIS_URL = "redis://localhost:6379"
        process.env.CACHE_ENABLED = "true"
    })

    afterEach(() => {
        resetConfig()
        // Restore original env
        process.env = { ...originalEnv }
    })

    describe("getEnvironmentConfiguration", () => {
        it("should return development configuration for local deployment", () => {
            ;(process.env as any).NODE_ENV = "development"

            const config = getEnvironmentConfiguration()

            expect(config.environment).toBe("development")
            expect(config.deploymentType).toBe("local")
            expect(config.isDevelopment).toBe(true)
            expect(config.isProduction).toBe(false)
            expect(config.isLocal).toBe(true)
            expect(config.isCloud).toBe(false)
        })

        it("should return production configuration for cloud deployment", () => {
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.environment).toBe("production")
            expect(config.deploymentType).toBe("cloud")
            expect(config.isProduction).toBe(true)
            expect(config.isDevelopment).toBe(false)
            expect(config.isCloud).toBe(true)
            expect(config.isLocal).toBe(false)
        })

        it("should return test configuration", () => {
            ;(process.env as any).NODE_ENV = "test"

            const config = getEnvironmentConfiguration()

            expect(config.environment).toBe("test")
            expect(config.isTest).toBe(true)
        })
    })

    describe("Database Configuration", () => {
        it("should configure local PostgreSQL database", () => {
            process.env.DATABASE_URL =
                "postgres://user:pass@localhost:5432/mydb"

            const config = getEnvironmentConfiguration()

            expect(config.database.url).toBe(
                "postgres://user:pass@localhost:5432/mydb"
            )
            expect(config.database.host).toBe("localhost")
            expect(config.database.port).toBe(5432)
            expect(config.database.user).toBe("user")
            expect(config.database.password).toBe("pass")
            expect(config.database.name).toBe("mydb")
            expect(config.database.ssl).toBe(false)
        })

        it("should throw error if DATABASE_URL is missing for local deployment", () => {
            delete process.env.DATABASE_URL

            expect(() => {
                getEnvironmentConfiguration()
            }).toThrow("DATABASE_URL is required for local development")
        })

        it("should configure cloud Supabase database", () => {
            resetConfig()
            delete process.env.DATABASE_URL
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.database.url).toBe("https://project.supabase.co")
            expect(config.database.host).toBe("project.supabase.co")
            expect(config.database.port).toBe(5432)
            expect(config.database.ssl).toBe(true)
        })

        it("should throw error if NEXT_PUBLIC_SUPABASE_URL is missing for cloud deployment", () => {
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            delete process.env.NEXT_PUBLIC_SUPABASE_URL

            expect(() => {
                getEnvironmentConfiguration()
            }).toThrow("NEXT_PUBLIC_SUPABASE_URL is required for production")
        })
    })

    describe("Cache Configuration", () => {
        it("should enable Redis cache for cloud deployment", () => {
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.REDIS_URL = "redis://host:6379"
            process.env.CACHE_ENABLED = "true"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.cache.enabled).toBe(true)
            expect(config.cache.url).toBe("redis://host:6379")
        })

        it("should disable cache if CACHE_ENABLED is false", () => {
            process.env.CACHE_ENABLED = "false"

            const config = getEnvironmentConfiguration()

            expect(config.cache.enabled).toBe(false)
        })

        it("should use default cache TTL", () => {
            const config = getEnvironmentConfiguration()

            expect(config.cache.ttl).toBe(3600)
        })

        it("should use custom cache TTL if provided", () => {
            process.env.CACHE_TTL = "7200"

            const config = getEnvironmentConfiguration()

            expect(config.cache.ttl).toBe(7200)
        })
    })

    describe("Security Configuration", () => {
        it("should enforce HTTPS in production", () => {
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.security.httpsEnforced).toBe(true)
        })

        it("should not enforce HTTPS in development", () => {
            ;(process.env as any).NODE_ENV = "development"

            const config = getEnvironmentConfiguration()

            expect(config.security.httpsEnforced).toBe(false)
        })

        it("should enable secure cookies in production", () => {
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.security.secureCookies).toBe(true)
        })

        it("should disable secure cookies in development", () => {
            ;(process.env as any).NODE_ENV = "development"

            const config = getEnvironmentConfiguration()

            expect(config.security.secureCookies).toBe(false)
        })

        it("should restrict CORS origins in production", () => {
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.security.corsOrigins).toContain("https://acme.test")
            expect(config.security.corsOrigins).toContain(
                "https://www.acme.test"
            )
            expect(config.security.corsOrigins.length).toBe(2)
        })

        it("should allow flexible CORS origins in development", () => {
            ;(process.env as any).NODE_ENV = "development"

            const config = getEnvironmentConfiguration()

            expect(config.security.corsOrigins).toContain(
                "http://localhost:3000"
            )
            expect(config.security.corsOrigins.length).toBeGreaterThan(0)
        })

        it("should enable rate limiting", () => {
            const config = getEnvironmentConfiguration()

            expect(config.security.rateLimitEnabled).toBe(true)
            expect(config.security.rateLimitMaxAttempts).toBe(5)
            expect(config.security.rateLimitWindow).toBe(3600000) // 1 hour
        })
    })

    describe("Session Configuration", () => {
        it("should set session token expiration to 1 hour", () => {
            const config = getEnvironmentConfiguration()

            expect(config.session.tokenExpiration).toBe(60 * 60 * 1000)
        })

        it("should set Remember Me token expiration to 30 days", () => {
            const config = getEnvironmentConfiguration()

            expect(config.session.rememberMeExpiration).toBe(
                30 * 24 * 60 * 60 * 1000
            )
        })

        it("should set refresh threshold to 5 minutes", () => {
            const config = getEnvironmentConfiguration()

            expect(config.session.refreshThreshold).toBe(5 * 60 * 1000)
        })
    })

    describe("Logging Configuration", () => {
        it("should use debug level in development", () => {
            ;(process.env as any).NODE_ENV = "development"

            const config = getEnvironmentConfiguration()

            expect(config.logging.level).toBe("debug")
        })

        it("should use info level in production", () => {
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.logging.level).toBe("info")
        })

        it("should use text format in development", () => {
            ;(process.env as any).NODE_ENV = "development"

            const config = getEnvironmentConfiguration()

            expect(config.logging.format).toBe("text")
        })

        it("should use JSON format in production", () => {
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.logging.format).toBe("json")
        })

        it("should set audit log retention to 90 days", () => {
            const config = getEnvironmentConfiguration()

            expect(config.logging.auditLogRetention).toBe(90)
        })
    })

    describe("Application URLs", () => {
        it("should use localhost URL in development", () => {
            ;(process.env as any).NODE_ENV = "development"

            const config = getEnvironmentConfiguration()

            expect(config.appUrl).toBe("http://localhost:3000")
            expect(config.apiUrl).toBe("http://localhost:3000/api")
        })

        it("should derive API URL from app URL in production", () => {
            resetConfig()
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.appUrl).toBe("https://acme.test")
            expect(config.apiUrl).toBe("https://acme.test/api")
        })

        it("should use custom app URL if provided", () => {
            process.env.NEXT_PUBLIC_APP_URL = "https://custom.com"

            const config = getEnvironmentConfiguration()

            expect(config.appUrl).toBe("https://custom.com")
            expect(config.apiUrl).toBe("https://custom.com/api")
        })
    })

    describe("getConfig (singleton)", () => {
        it("should return cached configuration on subsequent calls", () => {
            const config1 = getConfig()
            const config2 = getConfig()

            expect(config1).toBe(config2)
        })

        it("should return new configuration after reset", () => {
            const config1 = getConfig()
            resetConfig()
            const config2 = getConfig()

            expect(config1).not.toBe(config2)
        })
    })

    describe("validateEnvironmentConfiguration", () => {
        it("should not throw error for valid configuration", () => {
            expect(() => {
                validateEnvironmentConfiguration()
            }).not.toThrow()
        })

        it("should throw error if database URL is missing", () => {
            delete process.env.DATABASE_URL

            expect(() => {
                validateEnvironmentConfiguration()
            }).toThrow()
        })
    })

    describe("Environment-specific behavior", () => {
        it("should configure for local development", () => {
            ;(process.env as any).NODE_ENV = "development"

            const config = getEnvironmentConfiguration()

            expect(config.isDevelopment).toBe(true)
            expect(config.isLocal).toBe(true)
            expect(config.security.httpsEnforced).toBe(false)
            expect(config.database.ssl).toBe(false)
        })

        it("should configure for cloud production", () => {
            ;(process.env as any).NODE_ENV = "production"
            process.env.NEXT_PUBLIC_APP_URL = "https://acme.test"
            process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"

            const config = getEnvironmentConfiguration()

            expect(config.isProduction).toBe(true)
            expect(config.isCloud).toBe(true)
            expect(config.security.httpsEnforced).toBe(true)
            expect(config.database.ssl).toBe(true)
        })
    })
})
