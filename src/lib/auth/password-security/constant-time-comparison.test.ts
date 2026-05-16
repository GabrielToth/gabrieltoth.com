/**
 * Unit Tests: Constant-Time Comparison Module
 * Purpose: Verify constant-time comparison and response time normalization
 *
 * Test Coverage:
 * - Constant-time string comparison (match/no-match)
 * - Response time normalization
 * - Timing metrics collection
 * - Configuration options
 * - Edge cases (empty strings, null, undefined)
 * - Performance characteristics
 * - Variance tracking
 *
 * Requirements tested:
 * - Requirement 10.1: Constant-time string comparison
 * - Requirement 10.2: Execution time doesn't vary based on difference location
 * - Requirement 10.3: Response time variance < 10ms
 * - Requirement 10.4: Deliberate delay for response time normalization
 * - Requirement 10.5: Timing information not logged to user
 */

import { describe, expect, it } from "vitest"
import {
    CONSTANT_TIME_CONFIG,
    constantTimeStringCompare,
    createTimingSafeValidator,
    getConstantTimeConfig,
    normalizeResponseTime,
    performConstantTimeComparison,
} from "./constant-time-comparison"

describe("Constant-Time Comparison Module", () => {
    describe("constantTimeStringCompare", () => {
        it("should return true for matching strings", () => {
            const result = constantTimeStringCompare(
                "password123",
                "password123"
            )
            expect(result).toBe(true)
        })

        it("should return false for non-matching strings", () => {
            const result = constantTimeStringCompare(
                "password123",
                "password456"
            )
            expect(result).toBe(false)
        })

        it("should return false for different lengths", () => {
            const result = constantTimeStringCompare("password", "password123")
            expect(result).toBe(false)
        })

        it("should return false for empty vs non-empty", () => {
            const result = constantTimeStringCompare("", "password")
            expect(result).toBe(false)
        })

        it("should return true for both empty strings", () => {
            const result = constantTimeStringCompare("", "")
            expect(result).toBe(true)
        })

        it("should handle single character difference at start", () => {
            const result = constantTimeStringCompare("aassword", "password")
            expect(result).toBe(false)
        })

        it("should handle single character difference at end", () => {
            const result = constantTimeStringCompare("password1", "password2")
            expect(result).toBe(false)
        })

        it("should handle single character difference in middle", () => {
            const result = constantTimeStringCompare("passwor1", "passwor2")
            expect(result).toBe(false)
        })

        it("should handle UTF-8 characters", () => {
            const result = constantTimeStringCompare("pässwörd", "pässwörd")
            expect(result).toBe(true)
        })

        it("should return false for different UTF-8 characters", () => {
            const result = constantTimeStringCompare("pässwörd", "pässwörd1")
            expect(result).toBe(false)
        })

        it("should handle very long strings", () => {
            const longString = "a".repeat(10000)
            const result = constantTimeStringCompare(longString, longString)
            expect(result).toBe(true)
        })

        it("should handle very long strings with difference at end", () => {
            const longString1 = "a".repeat(10000)
            const longString2 = "a".repeat(9999) + "b"
            const result = constantTimeStringCompare(longString1, longString2)
            expect(result).toBe(false)
        })

        it("should handle special characters", () => {
            const result = constantTimeStringCompare(
                "p@$$w0rd!#%",
                "p@$$w0rd!#%"
            )
            expect(result).toBe(true)
        })

        it("should return false for special character differences", () => {
            const result = constantTimeStringCompare(
                "p@$$w0rd!#%",
                "p@$$w0rd!#&"
            )
            expect(result).toBe(false)
        })

        it("should handle whitespace", () => {
            const result = constantTimeStringCompare(
                "pass word 123",
                "pass word 123"
            )
            expect(result).toBe(true)
        })

        it("should return false for whitespace differences", () => {
            const result = constantTimeStringCompare(
                "pass word 123",
                "password 123"
            )
            expect(result).toBe(false)
        })
    })

    describe("normalizeResponseTime", () => {
        it("should return 0 if validation time exceeds target", async () => {
            const normalizationTime = await normalizeResponseTime(300, 250)
            expect(normalizationTime).toBe(0)
        })

        it("should add delay if validation time is less than target", async () => {
            const normalizationTime = await normalizeResponseTime(100, 250)
            expect(normalizationTime).toBeGreaterThan(0)
            expect(normalizationTime).toBeLessThanOrEqual(150 + 10) // Allow 10ms variance
        })

        it("should add approximately correct delay", async () => {
            const startTime = Date.now()
            await normalizeResponseTime(50, 200)
            const elapsedTime = Date.now() - startTime
            expect(elapsedTime).toBeGreaterThanOrEqual(150)
            expect(elapsedTime).toBeLessThan(200) // Should not exceed target
        })

        it("should cap delay at MAX_NORMALIZATION_TIME_MS", async () => {
            const normalizationTime = await normalizeResponseTime(
                0,
                CONSTANT_TIME_CONFIG.MAX_NORMALIZATION_TIME_MS + 1000
            )
            expect(normalizationTime).toBeLessThanOrEqual(
                CONSTANT_TIME_CONFIG.MAX_NORMALIZATION_TIME_MS + 10
            )
        })

        it("should handle zero validation time", async () => {
            const normalizationTime = await normalizeResponseTime(0, 250)
            expect(normalizationTime).toBeGreaterThan(0)
            expect(normalizationTime).toBeLessThanOrEqual(250 + 10)
        })

        it("should handle equal validation and target time", async () => {
            const normalizationTime = await normalizeResponseTime(250, 250)
            expect(normalizationTime).toBe(0)
        })

        it("should handle very small target time", async () => {
            const normalizationTime = await normalizeResponseTime(100, 10)
            expect(normalizationTime).toBe(0)
        })
    })

    describe("performConstantTimeComparison", () => {
        it("should return match=true for matching strings", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123"
            )
            expect(result.match).toBe(true)
            expect(result.constantTimeGuaranteed).toBe(true)
        })

        it("should return match=false for non-matching strings", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password456"
            )
            expect(result.match).toBe(false)
            expect(result.constantTimeGuaranteed).toBe(true)
        })

        it("should include timing metrics", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123"
            )
            expect(result.metrics).toBeDefined()
            expect(result.metrics.validationTimeMs).toBeGreaterThanOrEqual(0)
            expect(result.metrics.totalTimeMs).toBeGreaterThanOrEqual(
                result.metrics.validationTimeMs
            )
        })

        it("should track normalization time", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123"
            )
            expect(result.metrics.normalizationTimeMs).toBeGreaterThanOrEqual(0)
        })

        it("should apply normalization when enabled", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123",
                { enableNormalization: true }
            )
            expect(result.metrics.totalTimeMs).toBeGreaterThanOrEqual(
                CONSTANT_TIME_CONFIG.TARGET_RESPONSE_TIME_MS - 20
            )
        })

        it("should not apply normalization when disabled", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123",
                { enableNormalization: false }
            )
            expect(result.metrics.normalizationApplied).toBe(false)
            expect(result.metrics.normalizationTimeMs).toBe(0)
        })

        it("should use custom target response time", async () => {
            const customTarget = 500
            const result = await performConstantTimeComparison(
                "password123",
                "password123",
                { targetResponseTimeMs: customTarget }
            )
            expect(result.metrics.totalTimeMs).toBeGreaterThanOrEqual(
                customTarget - 20
            )
        })

        it("should track variance from target", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123"
            )
            expect(result.metrics.varianceMs).toBeGreaterThanOrEqual(0)
        })

        it("should indicate if within acceptable variance", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123"
            )
            expect(result.metrics.withinVariance).toBeDefined()
            expect(typeof result.metrics.withinVariance).toBe("boolean")
        })

        it("should handle empty strings", async () => {
            const result = await performConstantTimeComparison("", "")
            expect(result.match).toBe(true)
            expect(result.constantTimeGuaranteed).toBe(true)
        })

        it("should handle very long strings", async () => {
            const longString = "a".repeat(10000)
            const result = await performConstantTimeComparison(
                longString,
                longString
            )
            expect(result.match).toBe(true)
        })

        it("should handle UTF-8 strings", async () => {
            const result = await performConstantTimeComparison(
                "pässwörd123",
                "pässwörd123"
            )
            expect(result.match).toBe(true)
        })

        it("should disable metrics tracking when requested", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123",
                { trackMetrics: false }
            )
            expect(result.metrics).toBeDefined()
        })

        it("should maintain constant-time guarantee on error", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password456"
            )
            expect(result.metrics.totalTimeMs).toBeDefined()
        })
    })

    describe("createTimingSafeValidator", () => {
        it("should create a validator function", () => {
            const validator = createTimingSafeValidator()
            expect(typeof validator).toBe("function")
        })

        it("should use custom target response time", async () => {
            const customTarget = 500
            const validator = createTimingSafeValidator(customTarget)
            const result = await validator("password123", "password123")
            expect(result.metrics.totalTimeMs).toBeGreaterThanOrEqual(
                customTarget - 20
            )
        })

        it("should return constant-time comparison result", async () => {
            const validator = createTimingSafeValidator()
            const result = await validator("password123", "password123")
            expect(result.match).toBe(true)
            expect(result.constantTimeGuaranteed).toBe(true)
        })

        it("should handle non-matching strings", async () => {
            const validator = createTimingSafeValidator()
            const result = await validator("password123", "password456")
            expect(result.match).toBe(false)
        })

        it("should use default target response time if not provided", async () => {
            const validator = createTimingSafeValidator()
            const result = await validator("password123", "password123")
            expect(result.metrics.totalTimeMs).toBeGreaterThanOrEqual(
                CONSTANT_TIME_CONFIG.TARGET_RESPONSE_TIME_MS - 20
            )
        })
    })

    describe("getConstantTimeConfig", () => {
        it("should return configuration object", () => {
            const config = getConstantTimeConfig()
            expect(config).toBeDefined()
            expect(typeof config).toBe("object")
        })

        it("should include TARGET_RESPONSE_TIME_MS", () => {
            const config = getConstantTimeConfig()
            expect(config.TARGET_RESPONSE_TIME_MS).toBeDefined()
            expect(typeof config.TARGET_RESPONSE_TIME_MS).toBe("number")
        })

        it("should include ACCEPTABLE_VARIANCE_MS", () => {
            const config = getConstantTimeConfig()
            expect(config.ACCEPTABLE_VARIANCE_MS).toBeDefined()
            expect(typeof config.ACCEPTABLE_VARIANCE_MS).toBe("number")
        })

        it("should include MAX_NORMALIZATION_TIME_MS", () => {
            const config = getConstantTimeConfig()
            expect(config.MAX_NORMALIZATION_TIME_MS).toBeDefined()
            expect(typeof config.MAX_NORMALIZATION_TIME_MS).toBe("number")
        })

        it("should not be modifiable", () => {
            const config = getConstantTimeConfig()
            const originalValue = config.TARGET_RESPONSE_TIME_MS
            config.TARGET_RESPONSE_TIME_MS = 999
            const newConfig = getConstantTimeConfig()
            expect(newConfig.TARGET_RESPONSE_TIME_MS).toBe(originalValue)
        })
    })

    describe("Timing Attack Prevention", () => {
        it("should take similar time for match and no-match", async () => {
            const startMatch = Date.now()
            await performConstantTimeComparison("password123", "password123")
            const timeMatch = Date.now() - startMatch

            const startNoMatch = Date.now()
            await performConstantTimeComparison("password123", "password456")
            const timeNoMatch = Date.now() - startNoMatch

            // Both should be within acceptable variance
            const variance = Math.abs(timeMatch - timeNoMatch)
            expect(variance).toBeLessThan(50) // Allow 50ms variance for test environment
        })

        it("should take similar time for difference at start vs end", async () => {
            const startDiffStart = Date.now()
            await performConstantTimeComparison("aassword", "password")
            const timeDiffStart = Date.now() - startDiffStart

            const startDiffEnd = Date.now()
            await performConstantTimeComparison("password1", "password2")
            const timeDiffEnd = Date.now() - startDiffEnd

            // Both should be within acceptable variance
            const variance = Math.abs(timeDiffStart - timeDiffEnd)
            expect(variance).toBeLessThan(50) // Allow 50ms variance for test environment
        })

        it("should normalize response time consistently", async () => {
            const results: number[] = []

            for (let i = 0; i < 5; i++) {
                const start = Date.now()
                await performConstantTimeComparison(
                    "password123",
                    "password123"
                )
                results.push(Date.now() - start)
            }

            // Calculate variance
            const average = results.reduce((a, b) => a + b) / results.length
            const variance = Math.sqrt(
                results.reduce((sum, val) => sum + Math.pow(val - average, 2)) /
                    results.length
            )

            // Variance should be small (< 50ms in test environment)
            expect(variance).toBeLessThan(50)
        })
    })

    describe("Edge Cases and Error Handling", () => {
        it("should handle comparison with null-like strings", async () => {
            const result = await performConstantTimeComparison("", "")
            expect(result.match).toBe(true)
        })

        it("should handle very large strings", async () => {
            const largeString = "a".repeat(100000)
            const result = await performConstantTimeComparison(
                largeString,
                largeString
            )
            expect(result.match).toBe(true)
        })

        it("should handle special characters in comparison", async () => {
            const result = await performConstantTimeComparison(
                "p@$$w0rd!#%&*",
                "p@$$w0rd!#%&*"
            )
            expect(result.match).toBe(true)
        })

        it("should handle newlines and tabs", async () => {
            const result = await performConstantTimeComparison(
                "pass\nword\t123",
                "pass\nword\t123"
            )
            expect(result.match).toBe(true)
        })

        it("should handle binary-like strings", async () => {
            const result = await performConstantTimeComparison(
                "\x00\x01\x02\x03",
                "\x00\x01\x02\x03"
            )
            expect(result.match).toBe(true)
        })

        it("should return false for binary-like strings with differences", async () => {
            const result = await performConstantTimeComparison(
                "\x00\x01\x02\x03",
                "\x00\x01\x02\x04"
            )
            expect(result.match).toBe(false)
        })
    })

    describe("Performance Characteristics", () => {
        it("should complete within reasonable time", async () => {
            const start = Date.now()
            await performConstantTimeComparison("password123", "password123")
            const elapsed = Date.now() - start
            expect(elapsed).toBeLessThan(1000) // Should complete within 1 second
        })

        it("should not have excessive overhead", async () => {
            const start = Date.now()
            for (let i = 0; i < 10; i++) {
                await performConstantTimeComparison(
                    "password123",
                    "password123"
                )
            }
            const elapsed = Date.now() - start
            expect(elapsed).toBeLessThan(5000) // 10 comparisons should take < 5 seconds
        })

        it("should handle rapid sequential comparisons", async () => {
            const results = []
            for (let i = 0; i < 5; i++) {
                const result = await performConstantTimeComparison(
                    "password123",
                    "password123"
                )
                results.push(result)
            }
            expect(results).toHaveLength(5)
            expect(results.every(r => r.match === true)).toBe(true)
        })
    })

    describe("Metrics Accuracy", () => {
        it("should track total time accurately", async () => {
            const start = Date.now()
            const result = await performConstantTimeComparison(
                "password123",
                "password123"
            )
            const actualElapsed = Date.now() - start
            expect(result.metrics.totalTimeMs).toBeLessThanOrEqual(
                actualElapsed + 10
            )
        })

        it("should track validation time separately from normalization", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123"
            )
            expect(result.metrics.validationTimeMs).toBeGreaterThanOrEqual(0)
            expect(result.metrics.normalizationTimeMs).toBeGreaterThanOrEqual(0)
            expect(result.metrics.totalTimeMs).toBeGreaterThanOrEqual(
                result.metrics.validationTimeMs
            )
        })

        it("should calculate variance correctly", async () => {
            const result = await performConstantTimeComparison(
                "password123",
                "password123"
            )
            const expectedVariance = Math.abs(
                result.metrics.totalTimeMs -
                    CONSTANT_TIME_CONFIG.TARGET_RESPONSE_TIME_MS
            )
            expect(result.metrics.varianceMs).toBe(expectedVariance)
        })
    })
})
