// Unit Tests for Retry Logic
// Feature: distributed-infrastructure-logging

import { describe, expect, it, vi } from "vitest"
import { defaultRetryConfig, withRetry, withRetryAndFilter } from "./index"
import { isRetryableError } from "./wrappers"

describe("Retry Logic", () => {
    it("should succeed on first attempt", async () => {
        const operation = vi.fn().mockResolvedValue("success")

        const result = await withRetry(operation)

        expect(result).toBe("success")
        expect(operation).toHaveBeenCalledTimes(1)
    })

    it("should retry on failure and eventually succeed", async () => {
        const operation = vi
            .fn()
            .mockRejectedValueOnce(new Error("fail 1"))
            .mockRejectedValueOnce(new Error("fail 2"))
            .mockResolvedValue("success")

        const result = await withRetry(operation)

        expect(result).toBe("success")
        expect(operation).toHaveBeenCalledTimes(3)
    })

    it("should throw after max attempts", async () => {
        const operation = vi.fn().mockRejectedValue(new Error("always fails"))

        await expect(
            withRetry(operation, { ...defaultRetryConfig, maxAttempts: 3 })
        ).rejects.toThrow("always fails")

        expect(operation).toHaveBeenCalledTimes(3)
    })

    it("should use exponential backoff", async () => {
        const operation = vi
            .fn()
            .mockRejectedValueOnce(new Error("fail 1"))
            .mockRejectedValueOnce(new Error("fail 2"))
            .mockResolvedValue("success")

        const startTime = Date.now()
        await withRetry(operation, {
            maxAttempts: 3,
            initialDelayMs: 100,
            maxDelayMs: 5000,
            backoffMultiplier: 2,
        })
        const duration = Date.now() - startTime

        // Should have waited at least 100ms + 200ms = 300ms
        expect(duration).toBeGreaterThanOrEqual(300)
    })

    it("should respect max delay", async () => {
        const operation = vi
            .fn()
            .mockRejectedValueOnce(new Error("fail 1"))
            .mockRejectedValueOnce(new Error("fail 2"))
            .mockResolvedValue("success")

        const startTime = Date.now()
        await withRetry(operation, {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 1500,
            backoffMultiplier: 10, // Would be 10000ms without max
        })
        const duration = Date.now() - startTime

        // Should have waited at most 1000ms + 1500ms = 2500ms (plus some overhead)
        expect(duration).toBeLessThan(3000)
    })

    it("should filter errors with withRetryAndFilter", async () => {
        const operation = vi.fn().mockRejectedValue(new Error("non-retryable"))
        const shouldRetry = vi.fn().mockReturnValue(false)

        await expect(
            withRetryAndFilter(operation, shouldRetry)
        ).rejects.toThrow("non-retryable")

        // Should only try once since error is not retryable
        expect(operation).toHaveBeenCalledTimes(1)
        expect(shouldRetry).toHaveBeenCalledTimes(1)
    })

    it("should retry filtered errors", async () => {
        const operation = vi
            .fn()
            .mockRejectedValueOnce(new Error("retryable"))
            .mockResolvedValue("success")
        const shouldRetry = vi.fn().mockReturnValue(true)

        const result = await withRetryAndFilter(operation, shouldRetry)

        expect(result).toBe("success")
        expect(operation).toHaveBeenCalledTimes(2)
        expect(shouldRetry).toHaveBeenCalledTimes(1)
    })

    it("should identify retryable errors", () => {
        expect(isRetryableError(new Error("ECONNREFUSED"))).toBe(true)
        expect(isRetryableError(new Error("ETIMEDOUT"))).toBe(true)
        expect(isRetryableError(new Error("ENOTFOUND"))).toBe(true)
        expect(isRetryableError(new Error("connection timeout"))).toBe(true)
        expect(isRetryableError(new Error("network error"))).toBe(true)
    })

    it("should identify non-retryable errors", () => {
        expect(isRetryableError(new Error("Invalid input"))).toBe(false)
        expect(isRetryableError(new Error("Not found"))).toBe(false)
        expect(isRetryableError(new Error("Unauthorized"))).toBe(false)
    })

    it("should handle synchronous errors", async () => {
        const operation = vi.fn(() => {
            throw new Error("sync error")
        })

        await expect(withRetry(operation as any)).rejects.toThrow("sync error")
    })

    it("should preserve error stack trace", async () => {
        const error = new Error("test error")
        const operation = vi.fn().mockRejectedValue(error)

        try {
            await withRetry(operation, {
                ...defaultRetryConfig,
                maxAttempts: 1,
            })
        } catch (e) {
            expect(e).toBe(error)
            expect((e as Error).stack).toBeDefined()
        }
    })

    it("should handle zero delay", async () => {
        const operation = vi
            .fn()
            .mockRejectedValueOnce(new Error("fail"))
            .mockResolvedValue("success")

        const result = await withRetry(operation, {
            maxAttempts: 2,
            initialDelayMs: 0,
            maxDelayMs: 0,
            backoffMultiplier: 1,
        })

        expect(result).toBe("success")
    })

    it("should handle custom retry config", async () => {
        const operation = vi
            .fn()
            .mockRejectedValueOnce(new Error("fail 1"))
            .mockRejectedValueOnce(new Error("fail 2"))
            .mockRejectedValueOnce(new Error("fail 3"))
            .mockRejectedValueOnce(new Error("fail 4"))
            .mockResolvedValue("success")

        const result = await withRetry(operation, {
            maxAttempts: 5,
            initialDelayMs: 10,
            maxDelayMs: 100,
            backoffMultiplier: 1.5,
        })

        expect(result).toBe("success")
        expect(operation).toHaveBeenCalledTimes(5)
    })
})
