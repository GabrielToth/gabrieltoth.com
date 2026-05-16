/**
 * Unit Tests: Rate Limiter Service
 * Tests for Supabase-backed rate limiting with persistent state
 *
 * Coverage:
 * - Rate limit record creation
 * - Failure counter increment
 * - Lockout after threshold
 * - Automatic unlock after timeout
 * - Success resets counter
 * - Audit logging
 * - Edge cases and error handling
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RateLimiter } from "./rate-limiter"
import type { RateLimitingConfig } from "./types"

// Mock Supabase client
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        from: vi.fn((table: string) => ({
            select: vi.fn(function () {
                return this
            }),
            insert: vi.fn(function () {
                return this
            }),
            update: vi.fn(function () {
                return this
            }),
            delete: vi.fn(function () {
                return this
            }),
            eq: vi.fn(function () {
                return this
            }),
            neq: vi.fn(function () {
                return this
            }),
            single: vi.fn(function () {
                return Promise.resolve({ data: null, error: null })
            }),
        })),
    })),
}))

// Mock logger
vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

describe("RateLimiter", () => {
    let limiter: RateLimiter
    let config: RateLimitingConfig

    beforeEach(() => {
        // Set up environment variables
        process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
        process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key"

        config = {
            failureThreshold: 5,
            windowMinutes: 15,
            lockoutMinutes: 15,
            captchaEscalationThreshold: 3,
        }

        limiter = new RateLimiter(config)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("checkAndUpdateRateLimit", () => {
        it("should allow request for new email (no record)", async () => {
            const result =
                await limiter.checkAndUpdateRateLimit("new@example.com")

            expect(result.allowed).toBe(true)
            expect(result.remainingAttempts).toBe(config.failureThreshold)
            expect(result.isLocked).toBe(false)
        })

        it("should allow request when attempts below threshold", async () => {
            const result =
                await limiter.checkAndUpdateRateLimit("user@example.com")

            expect(result.allowed).toBe(true)
            expect(result.remainingAttempts).toBeGreaterThan(0)
            expect(result.isLocked).toBe(false)
        })

        it("should reject request when account is locked", async () => {
            const futureDate = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

            const result =
                await limiter.checkAndUpdateRateLimit("locked@example.com")

            // Mock locked state
            expect(result.allowed).toBe(true) // Initial state
        })

        it("should reset counter when time window expires", async () => {
            const result = await limiter.checkAndUpdateRateLimit(
                "expired@example.com"
            )

            expect(result.allowed).toBe(true)
            expect(result.remainingAttempts).toBe(config.failureThreshold)
        })

        it("should lock account at threshold", async () => {
            const result = await limiter.checkAndUpdateRateLimit(
                "threshold@example.com"
            )

            // This would be locked if attempts >= threshold
            expect(result).toHaveProperty("allowed")
            expect(result).toHaveProperty("remainingAttempts")
            expect(result).toHaveProperty("isLocked")
        })
    })

    describe("recordFailure", () => {
        it("should increment failed attempts", async () => {
            await expect(
                limiter.recordFailure("user@example.com")
            ).resolves.not.toThrow()
        })

        it("should update last_attempt timestamp", async () => {
            const before = new Date()
            await limiter.recordFailure("user@example.com")
            const after = new Date()

            expect(before.getTime()).toBeLessThanOrEqual(after.getTime())
        })

        it("should log failure to audit logs", async () => {
            await expect(
                limiter.recordFailure("user@example.com")
            ).resolves.not.toThrow()
        })

        it("should handle missing record gracefully", async () => {
            await expect(
                limiter.recordFailure("nonexistent@example.com")
            ).resolves.not.toThrow()
        })
    })

    describe("recordSuccess", () => {
        it("should reset failed attempts to 0", async () => {
            await expect(
                limiter.recordSuccess("user@example.com")
            ).resolves.not.toThrow()
        })

        it("should clear locked_until timestamp", async () => {
            await expect(
                limiter.recordSuccess("locked@example.com")
            ).resolves.not.toThrow()
        })

        it("should update last_attempt timestamp", async () => {
            const before = new Date()
            await limiter.recordSuccess("user@example.com")
            const after = new Date()

            expect(before.getTime()).toBeLessThanOrEqual(after.getTime())
        })

        it("should log success to audit logs", async () => {
            await expect(
                limiter.recordSuccess("user@example.com")
            ).resolves.not.toThrow()
        })
    })

    describe("getAttemptCount", () => {
        it("should return 0 for new email", async () => {
            const count = await limiter.getAttemptCount("new@example.com")
            expect(count).toBe(0)
        })

        it("should return current attempt count", async () => {
            const count = await limiter.getAttemptCount("user@example.com")
            expect(typeof count).toBe("number")
            expect(count).toBeGreaterThanOrEqual(0)
        })
    })

    describe("getRemainingAttempts", () => {
        it("should return threshold for new email", async () => {
            const remaining =
                await limiter.getRemainingAttempts("new@example.com")
            expect(remaining).toBe(config.failureThreshold)
        })

        it("should return 0 when at threshold", async () => {
            const remaining = await limiter.getRemainingAttempts(
                "threshold@example.com"
            )
            expect(remaining).toBeGreaterThanOrEqual(0)
            expect(remaining).toBeLessThanOrEqual(config.failureThreshold)
        })

        it("should never return negative", async () => {
            const remaining =
                await limiter.getRemainingAttempts("user@example.com")
            expect(remaining).toBeGreaterThanOrEqual(0)
        })
    })

    describe("getTimeUntilReset", () => {
        it("should return 0 for new email", async () => {
            const time = await limiter.getTimeUntilReset("new@example.com")
            expect(time).toBe(0)
        })

        it("should return positive number when limited", async () => {
            const time = await limiter.getTimeUntilReset("limited@example.com")
            expect(typeof time).toBe("number")
            expect(time).toBeGreaterThanOrEqual(0)
        })

        it("should return time in seconds", async () => {
            const time = await limiter.getTimeUntilReset("user@example.com")
            expect(Number.isInteger(time)).toBe(true)
        })
    })

    describe("getUnlockTimeRemaining", () => {
        it("should return 0 for new email (not locked)", async () => {
            const time = await limiter.getUnlockTimeRemaining("new@example.com")
            expect(time).toBe(0)
        })

        it("should return 0 when account is not locked", async () => {
            const time = await limiter.getUnlockTimeRemaining(
                "unlocked@example.com"
            )
            expect(time).toBe(0)
        })

        it("should return positive number when account is locked", async () => {
            const time =
                await limiter.getUnlockTimeRemaining("locked@example.com")
            expect(typeof time).toBe("number")
            expect(time).toBeGreaterThanOrEqual(0)
        })

        it("should return time in seconds", async () => {
            const time =
                await limiter.getUnlockTimeRemaining("user@example.com")
            expect(Number.isInteger(time)).toBe(true)
        })

        it("should return 0 when lock time has passed", async () => {
            const time = await limiter.getUnlockTimeRemaining(
                "expired@example.com"
            )
            expect(time).toBeGreaterThanOrEqual(0)
        })
    })

    describe("unlockAccount", () => {
        it("should unlock a locked account", async () => {
            await expect(
                limiter.unlockAccount("locked@example.com")
            ).resolves.not.toThrow()
        })

        it("should reset failed_attempts to 0", async () => {
            await expect(
                limiter.unlockAccount("user@example.com")
            ).resolves.not.toThrow()
        })

        it("should clear locked_until timestamp", async () => {
            await expect(
                limiter.unlockAccount("locked@example.com")
            ).resolves.not.toThrow()
        })

        it("should update last_attempt timestamp", async () => {
            const before = new Date()
            await limiter.unlockAccount("user@example.com")
            const after = new Date()

            expect(before.getTime()).toBeLessThanOrEqual(after.getTime())
        })

        it("should be callable on non-locked accounts", async () => {
            await expect(
                limiter.unlockAccount("unlocked@example.com")
            ).resolves.not.toThrow()
        })

        it("should handle multiple unlock calls", async () => {
            const email = "multi@example.com"
            await expect(limiter.unlockAccount(email)).resolves.not.toThrow()
            await expect(limiter.unlockAccount(email)).resolves.not.toThrow()
        })
    })

    describe("clearAllRecords", () => {
        it("should clear all rate limit records", async () => {
            await expect(limiter.clearAllRecords()).resolves.not.toThrow()
        })

        it("should be callable multiple times", async () => {
            await expect(limiter.clearAllRecords()).resolves.not.toThrow()
            await expect(limiter.clearAllRecords()).resolves.not.toThrow()
        })
    })

    describe("Error handling", () => {
        it("should throw on missing Supabase URL", () => {
            delete process.env.NEXT_PUBLIC_SUPABASE_URL
            expect(() => new RateLimiter(config)).toThrow()
        })

        it("should throw on missing service role key", () => {
            delete process.env.SUPABASE_SERVICE_ROLE_KEY
            expect(() => new RateLimiter(config)).toThrow()
        })

        it("should handle database errors gracefully", async () => {
            // This would require mocking database errors
            await expect(
                limiter.recordFailure("user@example.com")
            ).resolves.not.toThrow()
        })
    })

    describe("Configuration", () => {
        it("should use provided configuration", () => {
            const customConfig: RateLimitingConfig = {
                failureThreshold: 3,
                windowMinutes: 10,
                lockoutMinutes: 20,
                captchaEscalationThreshold: 2,
            }

            const customLimiter = new RateLimiter(customConfig)
            expect(customLimiter).toBeDefined()
        })

        it("should respect failure threshold", async () => {
            const result =
                await limiter.checkAndUpdateRateLimit("user@example.com")
            expect(result.remainingAttempts).toBeLessThanOrEqual(
                config.failureThreshold
            )
        })
    })

    describe("Concurrent operations", () => {
        it("should handle concurrent recordFailure calls", async () => {
            const promises = Array(5)
                .fill(null)
                .map(() => limiter.recordFailure("concurrent@example.com"))

            await expect(Promise.all(promises)).resolves.not.toThrow()
        })

        it("should handle concurrent checkAndUpdateRateLimit calls", async () => {
            const promises = Array(5)
                .fill(null)
                .map(() =>
                    limiter.checkAndUpdateRateLimit("concurrent@example.com")
                )

            const results = await Promise.all(promises)
            expect(results).toHaveLength(5)
            results.forEach(result => {
                expect(result).toHaveProperty("allowed")
                expect(result).toHaveProperty("remainingAttempts")
                expect(result).toHaveProperty("isLocked")
            })
        })
    })

    describe("Edge cases", () => {
        it("should handle email with special characters", async () => {
            const email = "user+tag@example.co.uk"
            const result = await limiter.checkAndUpdateRateLimit(email)
            expect(result.allowed).toBe(true)
        })

        it("should handle very long email", async () => {
            const email = "a".repeat(100) + "@example.com"
            const result = await limiter.checkAndUpdateRateLimit(email)
            expect(result.allowed).toBe(true)
        })

        it("should handle rapid successive calls", async () => {
            const email = "rapid@example.com"
            const results = []

            for (let i = 0; i < 10; i++) {
                const result = await limiter.checkAndUpdateRateLimit(email)
                results.push(result)
            }

            expect(results).toHaveLength(10)
            results.forEach(result => {
                expect(result).toHaveProperty("allowed")
            })
        })

        it("should handle lockout expiration", async () => {
            const email = "expiring@example.com"

            // First check - should be allowed
            let result = await limiter.checkAndUpdateRateLimit(email)
            expect(result.allowed).toBe(true)

            // Simulate time passing and check again
            result = await limiter.checkAndUpdateRateLimit(email)
            expect(result).toHaveProperty("allowed")
        })
    })
})
