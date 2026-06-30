/**
 * Unit Tests for Rate Limiter (Degradation Mode)
 */
import {
    checkRateLimitWithDegradation,
    incrementAttemptWithDegradation,
    clearAllRateLimits,
} from "@/lib/auth/rate-limiter"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockLogger, mockRedisClient, mockState } = vi.hoisted(() => ({
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
    mockState: {
        isConnected: false
    }
}))

// Mock the cache modules
vi.mock("@/lib/cache/redis-client", () => ({
    getRedisClient: vi.fn(() => mockRedisClient),
    isRedisConnected: vi.fn(() => mockState.isConnected),
}))

// Mock the logger
vi.mock("@/lib/logger", () => ({
    createLogger: () => mockLogger,
}))

describe("Rate Limiter - Degradation Mode", () => {
    const ipAddress = "192.168.1.1"
    const key = `rate-limit:login:${ipAddress}`

    beforeEach(async () => {
        vi.clearAllMocks()
        mockState.isConnected = false
        await clearAllRateLimits() // Clear in-memory
    })

    describe("In-Memory Backend", () => {
        it("should return correct status when under limits (degraded)", async () => {
            const status = await checkRateLimitWithDegradation(ipAddress, true)
            expect(status).toEqual({
                allowed: true,
                remainingAttempts: 3,
                degradedMode: true,
                reason: undefined,
            })
        })

        it("should return correct status when limits exceeded (degraded)", async () => {
            await incrementAttemptWithDegradation(ipAddress, true)
            await incrementAttemptWithDegradation(ipAddress, true)
            await incrementAttemptWithDegradation(ipAddress, true)

            const status = await checkRateLimitWithDegradation(ipAddress, true)
            expect(status.allowed).toBe(false)
            expect(status.remainingAttempts).toBe(0)
            expect(status.degradedMode).toBe(true)
            expect(status.reason).toContain("3 attempts in 10 minutes")

            expect(mockLogger.error).toHaveBeenCalled()
            expect(mockLogger.info).toHaveBeenCalledWith(
                "Degraded mode rate limiting applied",
                expect.any(Object)
            )
        })

        it("should use stricter failure threshold in degraded mode", async () => {
            await incrementAttemptWithDegradation(ipAddress, true)
            await incrementAttemptWithDegradation(ipAddress, true)
            await incrementAttemptWithDegradation(ipAddress, true) // 3 is the limit

            // 4th try
            const count = await incrementAttemptWithDegradation(ipAddress, true)
            expect(count).toBe(4)

            const status = await checkRateLimitWithDegradation(ipAddress, true)
            expect(status.allowed).toBe(false)
        })

        it("should log degraded mode increments appropriately", async () => {
            await incrementAttemptWithDegradation(ipAddress, true)
            expect(mockLogger.warn).toHaveBeenCalledWith(
                "Login attempt incremented (degraded mode)",
                expect.any(Object)
            )
        })

        it("should fallback to normal mode when degradedMode is false", async () => {
            const status = await checkRateLimitWithDegradation(ipAddress, false)
            expect(status.allowed).toBe(true)
            expect(status.remainingAttempts).toBe(5)
            expect(status.degradedMode).toBe(false)

            await incrementAttemptWithDegradation(ipAddress, false)
            expect(mockLogger.debug).toHaveBeenCalledWith("Login attempt incremented", expect.any(Object))
        })
    })

    describe("Redis Backend", () => {
        beforeEach(() => {
            mockState.isConnected = true
        })

        it("should check rate limit with Redis (degraded)", async () => {
            mockRedisClient.get.mockResolvedValueOnce("3")
            const status = await checkRateLimitWithDegradation(ipAddress, true)
            expect(mockRedisClient.get).toHaveBeenCalledWith(key)
            expect(status.allowed).toBe(false)
            expect(status.remainingAttempts).toBe(0)
            expect(status.reason).toContain("3 attempts in 10 minutes")
        })

        it("should increment with Redis and set correct expiry (degraded)", async () => {
            mockRedisClient.incr.mockResolvedValueOnce(1)
            const count = await incrementAttemptWithDegradation(ipAddress, true)
            
            expect(mockRedisClient.incr).toHaveBeenCalledWith(key)
            // 10 minutes * 60 seconds = 600
            expect(mockRedisClient.expire).toHaveBeenCalledWith(key, 600)
            expect(count).toBe(1)
        })

        it("should fallback to normal mode increment expiry", async () => {
            mockRedisClient.incr.mockResolvedValueOnce(1)
            const count = await incrementAttemptWithDegradation(ipAddress, false)
            
            expect(mockRedisClient.incr).toHaveBeenCalledWith(key)
            // 1 hour * 60 * 60 = 3600
            expect(mockRedisClient.expire).toHaveBeenCalledWith(key, 3600)
            expect(count).toBe(1)
        })
    })

    describe("Error Handling", () => {
        beforeEach(() => {
            mockState.isConnected = true
        })

        it("should fail open and log error if checkRateLimitWithDegradation throws", async () => {
            mockRedisClient.get.mockRejectedValueOnce(new Error("Redis error"))
            const status = await checkRateLimitWithDegradation(ipAddress, true)
            
            expect(mockLogger.error).toHaveBeenCalledWith("Failed to get attempt count from Redis", expect.any(Object))
            expect(status.allowed).toBe(true)
            expect(status.remainingAttempts).toBe(3)
        })

        it("should return 0 and log error if incrementAttemptWithDegradation throws", async () => {
            mockRedisClient.incr.mockRejectedValueOnce(new Error("Redis error"))
            const count = await incrementAttemptWithDegradation(ipAddress, true)
            
            expect(mockLogger.error).toHaveBeenCalledWith("Error incrementing attempt count with degradation", expect.any(Object))
            expect(count).toBe(0)
        })
    })
})
