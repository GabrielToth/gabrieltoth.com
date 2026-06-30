/**
 * Unit Tests for Rate Limiter (Redis Backend)
 */
import {
    checkRateLimit,
    clearAllRateLimits,
    getAttemptCount,
    getRateLimiterStats,
    getTimeUntilReset,
    incrementAttempt,
    resetAttempt,
} from "@/lib/auth/rate-limiter"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockLogger, mockRedisClient } = vi.hoisted(() => ({
    mockLogger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
    mockRedisClient: {
        get: vi.fn(),
        incr: vi.fn(),
        expire: vi.fn(),
        del: vi.fn(),
        ttl: vi.fn(),
        keys: vi.fn(),
    },
}))

// Mock the cache modules
vi.mock("@/lib/cache/redis-client", () => ({
    getRedisClient: vi.fn(() => mockRedisClient),
    isRedisConnected: vi.fn(() => true),
}))

// Mock the logger
vi.mock("@/lib/logger", () => ({
    createLogger: () => mockLogger,
}))

describe("Rate Limiter - Redis Backend", () => {
    const ipAddress = "192.168.1.1"
    const key = `rate-limit:login:${ipAddress}`

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("Normal Operations", () => {
        it("should check rate limit using Redis", async () => {
            mockRedisClient.get.mockResolvedValueOnce("2")
            const isLimited = await checkRateLimit(ipAddress)
            expect(mockRedisClient.get).toHaveBeenCalledWith(key)
            expect(isLimited).toBe(false)
        })

        it("should return true when rate limit exceeded via Redis", async () => {
            mockRedisClient.get.mockResolvedValueOnce("5")
            const isLimited = await checkRateLimit(ipAddress)
            expect(mockRedisClient.get).toHaveBeenCalledWith(key)
            expect(isLimited).toBe(true)
        })

        it("should increment attempt in Redis and set expire on first try", async () => {
            mockRedisClient.incr.mockResolvedValueOnce(1)
            const count = await incrementAttempt(ipAddress)
            expect(mockRedisClient.incr).toHaveBeenCalledWith(key)
            expect(mockRedisClient.expire).toHaveBeenCalledWith(key, 3600)
            expect(count).toBe(1)
        })

        it("should increment attempt in Redis without setting expire on subsequent tries", async () => {
            mockRedisClient.incr.mockResolvedValueOnce(2)
            const count = await incrementAttempt(ipAddress)
            expect(mockRedisClient.incr).toHaveBeenCalledWith(key)
            expect(mockRedisClient.expire).not.toHaveBeenCalled()
            expect(count).toBe(2)
        })

        it("should reset attempt by deleting Redis key", async () => {
            await resetAttempt(ipAddress)
            expect(mockRedisClient.del).toHaveBeenCalledWith(key)
        })

        it("should get attempt count from Redis", async () => {
            mockRedisClient.get.mockResolvedValueOnce("3")
            const count = await getAttemptCount(ipAddress)
            expect(mockRedisClient.get).toHaveBeenCalledWith(key)
            expect(count).toBe(3)
        })

        it("should get time until reset from Redis", async () => {
            mockRedisClient.ttl.mockResolvedValueOnce(1500)
            const ttl = await getTimeUntilReset(ipAddress)
            expect(mockRedisClient.ttl).toHaveBeenCalledWith(key)
            expect(ttl).toBe(1500)
        })

        it("should clear all rate limits using Redis keys", async () => {
            mockRedisClient.keys.mockResolvedValueOnce(["key1", "key2"])
            await clearAllRateLimits()
            expect(mockRedisClient.keys).toHaveBeenCalledWith(
                "rate-limit:login:*"
            )
            expect(mockRedisClient.del).toHaveBeenCalledWith("key1", "key2")
        })

        it("should get rate limiter stats from Redis", async () => {
            mockRedisClient.keys.mockResolvedValueOnce(["key1", "key2", "key3"])
            const stats = await getRateLimiterStats()
            expect(mockRedisClient.keys).toHaveBeenCalledWith(
                "rate-limit:login:*"
            )
            expect(stats).toEqual({ backend: "redis", entriesCount: 3 })
        })
    })

    describe("Error Handling", () => {
        it("should fail open and log error if checkRateLimit throws", async () => {
            mockRedisClient.get.mockRejectedValueOnce(new Error("Redis error"))
            const isLimited = await checkRateLimit(ipAddress)
            expect(mockLogger.error).toHaveBeenCalledWith(
                "Failed to get attempt count from Redis",
                expect.any(Object)
            )
            expect(isLimited).toBe(false) // Fail open
        })

        it("should return 0 and log error if incrementAttempt throws", async () => {
            mockRedisClient.incr.mockRejectedValueOnce(new Error("Redis error"))
            const count = await incrementAttempt(ipAddress)
            expect(mockLogger.error).toHaveBeenCalledWith(
                "Failed to increment attempt count in Redis",
                expect.any(Object)
            )
            expect(count).toBe(0)
        })

        it("should handle error during resetAttempt", async () => {
            mockRedisClient.del.mockRejectedValueOnce(new Error("Redis error"))
            await resetAttempt(ipAddress)
            expect(mockLogger.error).toHaveBeenCalledWith(
                "Failed to reset attempt count in Redis",
                expect.any(Object)
            )
        })

        it("should return 0 and log error if getAttemptCount throws", async () => {
            mockRedisClient.get.mockRejectedValueOnce(new Error("Redis error"))
            const count = await getAttemptCount(ipAddress)
            expect(mockLogger.error).toHaveBeenCalledWith(
                "Failed to get attempt count from Redis",
                expect.any(Object)
            )
            expect(count).toBe(0)
        })

        it("should return 0 and log error if getTimeUntilReset throws", async () => {
            mockRedisClient.ttl.mockRejectedValueOnce(new Error("Redis error"))
            const ttl = await getTimeUntilReset(ipAddress)
            expect(mockLogger.error).toHaveBeenCalledWith(
                "Error getting time until reset",
                expect.any(Object)
            )
            expect(ttl).toBe(0)
        })

        it("should handle error during clearAllRateLimits", async () => {
            mockRedisClient.keys.mockRejectedValueOnce(new Error("Redis error"))
            await clearAllRateLimits()
            expect(mockLogger.error).toHaveBeenCalledWith(
                "Error clearing rate limits",
                expect.any(Object)
            )
        })
    })
})
