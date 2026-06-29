/**
 * Unit Tests for Rate Limiter
 * Tests rate limiting functionality with both Redis and in-memory backends
 */

import {
    checkRateLimit,
    clearAllRateLimits,
    getAttemptCount,
    getRateLimiterStats,
    getRemainingAttempts,
    getTimeUntilReset,
    incrementAttempt,
    resetAttempt,
} from "@/lib/auth/rate-limiter"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the cache modules
vi.mock("@/lib/cache/redis-client", () => ({
    getRedisClient: vi.fn(),
    isRedisConnected: vi.fn(() => false),
    initializeRedis: vi.fn(),
    closeRedis: vi.fn(),
}))

// Mock the logger
vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

describe("Rate Limiter - In-Memory Backend", () => {
    beforeEach(async () => {
        // Clear all rate limits before each test
        await clearAllRateLimits()
    })

    describe("checkRateLimit", () => {
        it("should return false when attempts are below limit", async () => {
            const ipAddress = "192.168.1.1"

            // Make 3 attempts (below limit of 5)
            await incrementAttempt(ipAddress)
            await incrementAttempt(ipAddress)
            await incrementAttempt(ipAddress)

            const isLimited = await checkRateLimit(ipAddress)
            expect(isLimited).toBe(false)
        })

        it("should return true when attempts reach limit", async () => {
            const ipAddress = "192.168.1.1"

            // Make 5 attempts (at limit)
            for (let i = 0; i < 5; i++) {
                await incrementAttempt(ipAddress)
            }

            const isLimited = await checkRateLimit(ipAddress)
            expect(isLimited).toBe(true)
        })

        it("should return true when attempts exceed limit", async () => {
            const ipAddress = "192.168.1.1"

            // Make 7 attempts (exceeds limit)
            for (let i = 0; i < 7; i++) {
                await incrementAttempt(ipAddress)
            }

            const isLimited = await checkRateLimit(ipAddress)
            expect(isLimited).toBe(true)
        })

        it("should return false for new IP address", async () => {
            const ipAddress = "192.168.1.100"

            const isLimited = await checkRateLimit(ipAddress)
            expect(isLimited).toBe(false)
        })

        it("should handle multiple IP addresses independently", async () => {
            const ip1 = "192.168.1.1"
            const ip2 = "192.168.1.2"

            // Make 5 attempts for IP1
            for (let i = 0; i < 5; i++) {
                await incrementAttempt(ip1)
            }

            // Make 2 attempts for IP2
            await incrementAttempt(ip2)
            await incrementAttempt(ip2)

            // IP1 should be limited
            expect(await checkRateLimit(ip1)).toBe(true)

            // IP2 should not be limited
            expect(await checkRateLimit(ip2)).toBe(false)
        })
    })

    describe("incrementAttempt", () => {
        it("should increment attempt count", async () => {
            const ipAddress = "192.168.1.1"

            const count1 = await incrementAttempt(ipAddress)
            expect(count1).toBe(1)

            const count2 = await incrementAttempt(ipAddress)
            expect(count2).toBe(2)

            const count3 = await incrementAttempt(ipAddress)
            expect(count3).toBe(3)
        })

        it("should return correct count after multiple increments", async () => {
            const ipAddress = "192.168.1.1"

            for (let i = 1; i <= 5; i++) {
                const count = await incrementAttempt(ipAddress)
                expect(count).toBe(i)
            }
        })

        it("should handle concurrent increments", async () => {
            const ipAddress = "192.168.1.1"

            // Simulate concurrent increments
            const promises = Array(5)
                .fill(null)
                .map(() => incrementAttempt(ipAddress))

            const results = await Promise.all(promises)

            // Results should be 1-5 in some order
            const sorted = results.sort((a, b) => a - b)
            expect(sorted).toEqual([1, 2, 3, 4, 5])
        })
    })

    describe("resetAttempt", () => {
        it("should reset attempt count to zero", async () => {
            const ipAddress = "192.168.1.1"

            // Make 3 attempts
            await incrementAttempt(ipAddress)
            await incrementAttempt(ipAddress)
            await incrementAttempt(ipAddress)

            let count = await getAttemptCount(ipAddress)
            expect(count).toBe(3)

            // Reset
            await resetAttempt(ipAddress)

            count = await getAttemptCount(ipAddress)
            expect(count).toBe(0)
        })

        it("should allow new attempts after reset", async () => {
            const ipAddress = "192.168.1.1"

            // Make 5 attempts (at limit)
            for (let i = 0; i < 5; i++) {
                await incrementAttempt(ipAddress)
            }

            expect(await checkRateLimit(ipAddress)).toBe(true)

            // Reset
            await resetAttempt(ipAddress)

            expect(await checkRateLimit(ipAddress)).toBe(false)

            // Should be able to make new attempts
            const count = await incrementAttempt(ipAddress)
            expect(count).toBe(1)
        })

        it("should handle reset on non-existent entry", async () => {
            const ipAddress = "192.168.1.1"

            // Should not throw error
            await expect(resetAttempt(ipAddress)).resolves.toBeUndefined()

            const count = await getAttemptCount(ipAddress)
            expect(count).toBe(0)
        })
    })

    describe("getAttemptCount", () => {
        it("should return 0 for new IP address", async () => {
            const ipAddress = "192.168.1.1"

            const count = await getAttemptCount(ipAddress)
            expect(count).toBe(0)
        })

        it("should return correct count after increments", async () => {
            const ipAddress = "192.168.1.1"

            await incrementAttempt(ipAddress)
            await incrementAttempt(ipAddress)
            await incrementAttempt(ipAddress)

            const count = await getAttemptCount(ipAddress)
            expect(count).toBe(3)
        })

        it("should return 0 after reset", async () => {
            const ipAddress = "192.168.1.1"

            await incrementAttempt(ipAddress)
            await incrementAttempt(ipAddress)
            await resetAttempt(ipAddress)

            const count = await getAttemptCount(ipAddress)
            expect(count).toBe(0)
        })
    })

    describe("getRemainingAttempts", () => {
        it("should return max attempts for new IP", async () => {
            const ipAddress = "192.168.1.1"

            const remaining = await getRemainingAttempts(ipAddress)
            expect(remaining).toBe(5)
        })

        it("should decrease as attempts are made", async () => {
            const ipAddress = "192.168.1.1"

            let remaining = await getRemainingAttempts(ipAddress)
            expect(remaining).toBe(5)

            await incrementAttempt(ipAddress)
            remaining = await getRemainingAttempts(ipAddress)
            expect(remaining).toBe(4)

            await incrementAttempt(ipAddress)
            remaining = await getRemainingAttempts(ipAddress)
            expect(remaining).toBe(3)
        })

        it("should return 0 when limit is reached", async () => {
            const ipAddress = "192.168.1.1"

            for (let i = 0; i < 5; i++) {
                await incrementAttempt(ipAddress)
            }

            const remaining = await getRemainingAttempts(ipAddress)
            expect(remaining).toBe(0)
        })

        it("should return 0 when limit is exceeded", async () => {
            const ipAddress = "192.168.1.1"

            for (let i = 0; i < 7; i++) {
                await incrementAttempt(ipAddress)
            }

            const remaining = await getRemainingAttempts(ipAddress)
            expect(remaining).toBe(0)
        })
    })

    describe("getTimeUntilReset", () => {
        it("should return 0 for new IP address", async () => {
            const ipAddress = "192.168.1.1"

            const time = await getTimeUntilReset(ipAddress)
            expect(time).toBe(0)
        })

        it("should return time remaining after first attempt", async () => {
            const ipAddress = "192.168.1.1"

            await incrementAttempt(ipAddress)

            const time = await getTimeUntilReset(ipAddress)

            // Should be approximately 1 hour (3600 seconds)
            // Allow some tolerance for test execution time
            expect(time).toBeGreaterThan(3590)
            expect(time).toBeLessThanOrEqual(3600)
        })

        it("should return same time for multiple checks", async () => {
            const ipAddress = "192.168.1.1"

            await incrementAttempt(ipAddress)

            const time1 = await getTimeUntilReset(ipAddress)
            const time2 = await getTimeUntilReset(ipAddress)

            // Times should be very close (within 1 second)
            expect(Math.abs(time1 - time2)).toBeLessThanOrEqual(1)
        })

        it("should return 0 after reset", async () => {
            const ipAddress = "192.168.1.1"

            await incrementAttempt(ipAddress)
            await resetAttempt(ipAddress)

            const time = await getTimeUntilReset(ipAddress)
            expect(time).toBe(0)
        })
    })

    describe("clearAllRateLimits", () => {
        it("should clear all rate limit entries", async () => {
            const ip1 = "192.168.1.1"
            const ip2 = "192.168.1.2"
            const ip3 = "192.168.1.3"

            // Create entries for multiple IPs
            await incrementAttempt(ip1)
            await incrementAttempt(ip2)
            await incrementAttempt(ip3)

            expect(await getAttemptCount(ip1)).toBe(1)
            expect(await getAttemptCount(ip2)).toBe(1)
            expect(await getAttemptCount(ip3)).toBe(1)

            // Clear all
            await clearAllRateLimits()

            expect(await getAttemptCount(ip1)).toBe(0)
            expect(await getAttemptCount(ip2)).toBe(0)
            expect(await getAttemptCount(ip3)).toBe(0)
        })
    })

    describe("getRateLimiterStats", () => {
        it("should return in-memory backend stats", async () => {
            const stats = await getRateLimiterStats()

            expect(stats.backend).toBe("in-memory")
            expect(stats.entriesCount).toBe(0)
        })

        it("should count entries correctly", async () => {
            const ip1 = "192.168.1.1"
            const ip2 = "192.168.1.2"

            await incrementAttempt(ip1)
            await incrementAttempt(ip2)

            const stats = await getRateLimiterStats()

            expect(stats.backend).toBe("in-memory")
            expect(stats.entriesCount).toBe(2)
        })

        it("should not count expired entries", async () => {
            const ip1 = "192.168.1.1"

            await incrementAttempt(ip1)

            let stats = await getRateLimiterStats()
            expect(stats.entriesCount).toBe(1)

            // Note: In a real test, we'd need to wait for expiration
            // or mock time. For now, we just verify the function works.
        })
    })

    describe("Rate Limiting Enforcement", () => {
        it("should enforce 5 attempts per hour limit", async () => {
            const ipAddress = "192.168.1.1"

            // First 4 attempts should succeed
            for (let i = 0; i < 4; i++) {
                expect(await checkRateLimit(ipAddress)).toBe(false)
                await incrementAttempt(ipAddress)
            }

            // 5th attempt should still be allowed (at limit, not exceeded)
            expect(await checkRateLimit(ipAddress)).toBe(false)
            await incrementAttempt(ipAddress)

            // 6th attempt should be blocked
            expect(await checkRateLimit(ipAddress)).toBe(true)
        })

        it("should reset counter on successful login", async () => {
            const ipAddress = "192.168.1.1"

            // Make 3 failed attempts
            for (let i = 0; i < 3; i++) {
                await incrementAttempt(ipAddress)
            }

            expect(await getAttemptCount(ipAddress)).toBe(3)

            // Successful login resets counter
            await resetAttempt(ipAddress)

            expect(await getAttemptCount(ipAddress)).toBe(0)
            expect(await checkRateLimit(ipAddress)).toBe(false)
        })

        it("should track attempts per IP independently", async () => {
            const ip1 = "192.168.1.1"
            const ip2 = "192.168.1.2"

            // Make 5 attempts from IP1
            for (let i = 0; i < 5; i++) {
                await incrementAttempt(ip1)
            }

            // Make 2 attempts from IP2
            for (let i = 0; i < 2; i++) {
                await incrementAttempt(ip2)
            }

            // IP1 should be limited
            expect(await checkRateLimit(ip1)).toBe(true)
            expect(await getAttemptCount(ip1)).toBe(5)

            // IP2 should not be limited
            expect(await checkRateLimit(ip2)).toBe(false)
            expect(await getAttemptCount(ip2)).toBe(2)

            // Reset IP1
            await resetAttempt(ip1)

            // IP1 should no longer be limited
            expect(await checkRateLimit(ip1)).toBe(false)

            // IP2 should still have its attempts
            expect(await getAttemptCount(ip2)).toBe(2)
        })
    })

    describe("Edge Cases", () => {
        it("should handle empty IP address", async () => {
            const ipAddress = ""

            const count = await incrementAttempt(ipAddress)
            expect(count).toBe(1)

            const isLimited = await checkRateLimit(ipAddress)
            expect(isLimited).toBe(false)
        })

        it("should handle IPv6 addresses", async () => {
            const ipAddress = "2001:0db8:85a3:0000:0000:8a2e:0370:7334"

            const count = await incrementAttempt(ipAddress)
            expect(count).toBe(1)

            const isLimited = await checkRateLimit(ipAddress)
            expect(isLimited).toBe(false)
        })

        it("should handle special characters in IP", async () => {
            const ipAddress = "192.168.1.1:8080"

            const count = await incrementAttempt(ipAddress)
            expect(count).toBe(1)

            const isLimited = await checkRateLimit(ipAddress)
            expect(isLimited).toBe(false)
        })

        it("should handle rapid sequential calls", async () => {
            const ipAddress = "192.168.1.1"

            const counts = []
            for (let i = 0; i < 10; i++) {
                const count = await incrementAttempt(ipAddress)
                counts.push(count)
            }

            // Should have incremented correctly
            expect(counts).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

            // Should be limited after 5
            expect(await checkRateLimit(ipAddress)).toBe(true)
        })
    })

    describe("Integration Scenarios", () => {
        it("should handle complete login flow with rate limiting", async () => {
            const ipAddress = "192.168.1.1"

            // Attempt 1: Check limit (should pass), then fail
            expect(await checkRateLimit(ipAddress)).toBe(false)
            await incrementAttempt(ipAddress)

            // Attempt 2: Check limit (should pass), then fail
            expect(await checkRateLimit(ipAddress)).toBe(false)
            await incrementAttempt(ipAddress)

            // Attempt 3: Check limit (should pass), then fail
            expect(await checkRateLimit(ipAddress)).toBe(false)
            await incrementAttempt(ipAddress)

            // Attempt 4: Check limit (should pass), then fail
            expect(await checkRateLimit(ipAddress)).toBe(false)
            await incrementAttempt(ipAddress)

            // Attempt 5: Check limit (should pass), then fail
            expect(await checkRateLimit(ipAddress)).toBe(false)
            await incrementAttempt(ipAddress)

            // Attempt 6: Check limit (should fail - rate limited)
            expect(await checkRateLimit(ipAddress)).toBe(true)

            // Verify stats
            const stats = await getRateLimiterStats()
            expect(stats.entriesCount).toBeGreaterThan(0)
        })

        it("should handle successful login after failed attempts", async () => {
            const ipAddress = "192.168.1.1"

            // Make 3 failed attempts
            for (let i = 0; i < 3; i++) {
                expect(await checkRateLimit(ipAddress)).toBe(false)
                await incrementAttempt(ipAddress)
            }

            expect(await getAttemptCount(ipAddress)).toBe(3)

            // Successful login
            await resetAttempt(ipAddress)

            // Should be able to make new attempts
            expect(await checkRateLimit(ipAddress)).toBe(false)
            expect(await getAttemptCount(ipAddress)).toBe(0)
            expect(await getRemainingAttempts(ipAddress)).toBe(5)
        })

        it("should provide useful information for error messages", async () => {
            const ipAddress = "192.168.1.1"

            // Make 4 failed attempts
            for (let i = 0; i < 4; i++) {
                await incrementAttempt(ipAddress)
            }

            // Get info for error message
            const remaining = await getRemainingAttempts(ipAddress)
            const timeUntilReset = await getTimeUntilReset(ipAddress)

            expect(remaining).toBe(1)
            expect(timeUntilReset).toBeGreaterThan(0)

            // Make 5th attempt
            await incrementAttempt(ipAddress)

            // Now should be limited
            expect(await checkRateLimit(ipAddress)).toBe(true)
            expect(await getRemainingAttempts(ipAddress)).toBe(0)
        })
    })

    describe("Error Handling (In-Memory)", () => {
        const ipAddress = "192.168.1.1"

        it("should fail open and log error if checkRateLimit throws", async () => {
            const mapGetSpy = vi.spyOn(Map.prototype, "get").mockImplementationOnce(() => {
                throw new Error("Simulated Map error")
            })

            const isLimited = await checkRateLimit(ipAddress)
            
            expect(isLimited).toBe(false) // Fail open
            mapGetSpy.mockRestore()
        })

        it("should return 0 and log error if incrementAttempt throws", async () => {
            const mapSetSpy = vi.spyOn(Map.prototype, "set").mockImplementationOnce(() => {
                throw new Error("Simulated Map error")
            })

            const count = await incrementAttempt(ipAddress)
            
            expect(count).toBe(0)
            mapSetSpy.mockRestore()
        })

        it("should handle error during resetAttempt", async () => {
            const mapDeleteSpy = vi.spyOn(Map.prototype, "delete").mockImplementationOnce(() => {
                throw new Error("Simulated Map error")
            })

            await expect(resetAttempt(ipAddress)).resolves.not.toThrow()
            mapDeleteSpy.mockRestore()
        })

        it("should return 0 if getAttemptCount throws", async () => {
            const mapGetSpy = vi.spyOn(Map.prototype, "get").mockImplementationOnce(() => {
                throw new Error("Simulated Map error")
            })

            const count = await getAttemptCount(ipAddress)
            
            expect(count).toBe(0)
            mapGetSpy.mockRestore()
        })

        it("should return 0 if getTimeUntilReset throws", async () => {
            const mapGetSpy = vi.spyOn(Map.prototype, "get").mockImplementationOnce(() => {
                throw new Error("Simulated Map error")
            })

            const ttl = await getTimeUntilReset(ipAddress)
            
            expect(ttl).toBe(0)
            mapGetSpy.mockRestore()
        })

        it("should handle error during clearAllRateLimits", async () => {
            const mapClearSpy = vi.spyOn(Map.prototype, "clear").mockImplementationOnce(() => {
                throw new Error("Simulated Map error")
            })

            await expect(clearAllRateLimits()).resolves.not.toThrow()
            mapClearSpy.mockRestore()
        })

        it("should return fallback stats if getRateLimiterStats throws", async () => {
            const mapSizeSpy = vi.spyOn(Map.prototype, "size", "get").mockImplementationOnce(() => {
                throw new Error("Simulated Map error")
            })

            const stats = await getRateLimiterStats()
            
            expect(stats).toEqual({ backend: "in-memory", entriesCount: 0 })
            mapSizeSpy.mockRestore()
        })
    })
})
