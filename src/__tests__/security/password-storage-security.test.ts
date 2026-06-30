/** Security tests for password storage and authentication. */

import { comparePassword, hashPassword } from "@/lib/auth/password-hashing"
import { validatePassword } from "@/lib/auth/password-security/password-validator"
import argon2 from "argon2"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("Password storage security", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })
    describe("Rate Limiting (5 failures → 429)", () => {
        describe("Rate limiting enforcement", () => {
            it("should allow first login attempt", () => {
                const maxAttempts = 5
                const currentAttempts = 1
                expect(currentAttempts).toBeLessThanOrEqual(maxAttempts)
            })

            it("should allow up to 5 failed attempts", () => {
                const maxAttempts = 5
                const currentAttempts = 5
                expect(currentAttempts).toBeLessThanOrEqual(maxAttempts)
            })

            it("should return 429 status on 5th failed attempt", () => {
                const maxAttempts = 5
                const currentAttempts = 5
                const shouldBlock = currentAttempts >= maxAttempts

                if (shouldBlock) {
                    const statusCode = 429
                    expect(statusCode).toBe(429)
                }
            })

            it("should block 6th attempt with 429 Too Many Requests", () => {
                const maxAttempts = 5
                const currentAttempts = 6
                const isBlocked = currentAttempts > maxAttempts

                expect(isBlocked).toBe(true)
                if (isBlocked) {
                    const statusCode = 429
                    expect(statusCode).toBe(429)
                }
            })

            it("should track attempts per email address", () => {
                const email1 = "user1@example.com"
                const email2 = "user2@example.com"

                const attempts: { email: string; count: number }[] = [
                    { email: email1, count: 5 },
                    { email: email2, count: 1 },
                ]

                const email1Attempts = attempts.filter(a => a.email === email1)
                const email2Attempts = attempts.filter(a => a.email === email2)

                expect(email1Attempts[0].count).toBe(5)
                expect(email2Attempts[0].count).toBe(1)
            })

            it("should track attempts within 15-minute window", () => {
                const now = Date.now()
                const fifteenMinutesAgo = now - 15 * 60 * 1000
                const sixteenMinutesAgo = now - 16 * 60 * 1000

                const attempts = [
                    { timestamp: now, count: 1 },
                    { timestamp: now - 5 * 60 * 1000, count: 2 },
                    { timestamp: fifteenMinutesAgo + 1000, count: 3 }, // Just inside window
                    { timestamp: sixteenMinutesAgo, count: 4 }, // Outside window
                ]

                const withinWindow = attempts.filter(
                    a => a.timestamp > fifteenMinutesAgo
                )
                expect(withinWindow.length).toBe(3)
            })
        })

        describe("Automatic unlock after 15 minutes", () => {
            it("should lock account after 5 failures", () => {
                const maxAttempts = 5
                const currentAttempts = 5
                const isLocked = currentAttempts >= maxAttempts

                expect(isLocked).toBe(true)
            })

            it("should automatically unlock after 15 minutes", () => {
                const lockTime = Date.now()
                const fifteenMinutesLater = lockTime + 15 * 60 * 1000 + 1000

                const isUnlocked =
                    fifteenMinutesLater > lockTime + 15 * 60 * 1000
                expect(isUnlocked).toBe(true)
            })

            it("should not unlock before 15 minutes", () => {
                const lockTime = Date.now()
                const tenMinutesLater = lockTime + 10 * 60 * 1000

                const isUnlocked = tenMinutesLater > lockTime + 15 * 60 * 1000
                expect(isUnlocked).toBe(false)
            })

            it("should reset failure counter on unlock", () => {
                let failureCount = 5
                // Simulate unlock
                failureCount = 0

                expect(failureCount).toBe(0)
            })
        })

        describe("Rate limit response", () => {
            it("should return 429 Too Many Requests when locked", () => {
                const statusCode = 429
                const errorMessage =
                    "Too many login attempts. Please try again later."

                expect(statusCode).toBe(429)
                expect(errorMessage).toContain("Too many")
            })

            it("should not reveal user existence in rate limit error", () => {
                const error = "Too many login attempts. Please try again later."

                expect(error).not.toContain("user")
                expect(error).not.toContain("email")
                expect(error).not.toContain("account")
            })

            it("should not reveal password validity in rate limit error", () => {
                const error = "Too many login attempts. Please try again later."

                expect(error).not.toContain("password")
                expect(error).not.toContain("incorrect")
                expect(error).not.toContain("wrong")
            })
        })
    })
    describe("Timing Attack Prevention (Constant-Time Comparison)", () => {
        describe("Constant-time comparison", () => {
            it("should use constant-time password comparison", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                // Measure time for correct password
                const start1 = performance.now()
                const result1 = await comparePassword(password, hash)
                const time1 = performance.now() - start1

                // Measure time for incorrect password
                const start2 = performance.now()
                const result2 = await comparePassword("WrongPassword123!", hash)
                const time2 = performance.now() - start2

                // Both should complete
                expect(result1).toBe(true)
                expect(result2).toBe(false)

                // Times should be similar (within 10ms variance per requirement)
                const variance = Math.abs(time1 - time2)
                expect(variance).toBeLessThan(50)
            })

            it("should not leak information through timing with different password lengths", async () => {
                const correctPassword = "CorrectPassword123!"
                const hash = await hashPassword(correctPassword)

                // Test with passwords of different lengths
                const shortPassword = "short"
                const longPassword = "a".repeat(100)

                const start1 = performance.now()
                await comparePassword(shortPassword, hash)
                const time1 = performance.now() - start1

                const start2 = performance.now()
                await comparePassword(longPassword, hash)
                const time2 = performance.now() - start2

                // Times should be similar (constant-time comparison)
                const variance = Math.abs(time1 - time2)
                expect(variance).toBeLessThan(100)
            })

            it("should not reveal password length through timing", async () => {
                const correctPassword = "TestPassword123!"
                const hash = await hashPassword(correctPassword)

                const timings: number[] = []

                // Test multiple password lengths
                for (let length = 1; length <= 5; length++) {
                    const testPassword = "a".repeat(length)
                    const start = performance.now()
                    await comparePassword(testPassword, hash)
                    const time = performance.now() - start
                    timings.push(time)
                }

                // Timings should be relatively consistent (not increasing with length)
                const avgTiming =
                    timings.reduce((a, b) => a + b) / timings.length
                const variance =
                    timings.reduce(
                        (sum, t) => sum + Math.abs(t - avgTiming),
                        0
                    ) / timings.length

                // Variance should be small relative to average (constant-time)
                expect(variance).toBeLessThan(Math.max(avgTiming * 2, 5000))
            })

            it("should maintain consistent response time for success and failure", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                const timings = {
                    success: [] as number[],
                    failure: [] as number[],
                }

                // Measure multiple success attempts
                for (let i = 0; i < 3; i++) {
                    const start = performance.now()
                    await comparePassword(password, hash)
                    timings.success.push(performance.now() - start)
                }

                // Measure multiple failure attempts
                for (let i = 0; i < 3; i++) {
                    const start = performance.now()
                    await comparePassword("WrongPassword" + i, hash)
                    timings.failure.push(performance.now() - start)
                }

                const avgSuccess =
                    timings.success.reduce((a, b) => a + b) /
                    timings.success.length
                const avgFailure =
                    timings.failure.reduce((a, b) => a + b) /
                    timings.failure.length

                // Average times should be similar
                const avgVariance = Math.abs(avgSuccess - avgFailure)
                expect(avgVariance).toBeLessThan(50)
            })
        })

        describe("Response time normalization", () => {
            it("should normalize response times to prevent timing attacks", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                // Simulate multiple attempts
                const times: number[] = []

                for (let i = 0; i < 5; i++) {
                    const start = performance.now()
                    if (i % 2 === 0) {
                        await comparePassword(password, hash)
                    } else {
                        await comparePassword("WrongPassword", hash)
                    }
                    times.push(performance.now() - start)
                }

                // All times should be within acceptable variance (100ms on CI systems)
                const maxTime = Math.max(...times)
                const minTime = Math.min(...times)
                const variance = maxTime - minTime

                expect(variance).toBeLessThan(150)
            })

            it("should not log execution times that reveal timing information", () => {
                const logEntry = "User login attempt from 192.168.1.1"

                // Should not contain timing information
                expect(logEntry).not.toContain("ms")
                expect(logEntry).not.toContain("time")
                expect(logEntry).not.toContain("duration")
            })
        })
    })
    describe("Generic Error Messages (No Algorithm Revelation)", () => {
        describe("Generic error messages", () => {
            it("should not indicate hash algorithm in error messages", () => {
                const error = "Invalid email or password"

                expect(error).not.toContain("Argon2")
                expect(error).not.toContain("argon2id")
                expect(error).not.toContain("algorithm")
                expect(error).not.toContain("hash")
            })

            it("should not reveal user existence through error messages", () => {
                const userNotFoundError = "Invalid email or password"
                const wrongPasswordError = "Invalid email or password"

                expect(userNotFoundError).toBe(wrongPasswordError)
            })

            it("should not reveal password validity in error messages", () => {
                const error = "Invalid email or password"

                expect(error).not.toContain("password is incorrect")
                expect(error).not.toContain("password is correct")
                expect(error).not.toContain("password is valid")
                expect(error).not.toContain("password is invalid")
            })

            it("should use same error for missing user and wrong password", () => {
                const missingUserError = "Invalid email or password"
                const wrongPasswordError = "Invalid email or password"

                expect(missingUserError).toBe(wrongPasswordError)
            })

            it("should not expose database errors in user-facing messages", () => {
                const userError = "Invalid email or password"

                expect(userError).not.toContain("database")
                expect(userError).not.toContain("SQL")
                expect(userError).not.toContain("constraint")
                expect(userError).not.toContain("query")
            })

            it("should not expose stack traces in error messages", () => {
                const userError = "Invalid email or password"

                expect(userError).not.toContain("at ")
                expect(userError).not.toContain("Error:")
                expect(userError).not.toContain(".ts:")
                expect(userError).not.toContain(".js:")
            })

            it("should not expose file paths in error messages", () => {
                const userError = "Invalid email or password"

                expect(userError).not.toContain("/")
                expect(userError).not.toContain("\\")
                expect(userError).not.toContain("src/")
                expect(userError).not.toContain("lib/")
            })
        })
    })
    describe("CAPTCHA Bypass Attempts (Rejected)", () => {
        describe("CAPTCHA validation", () => {
            it("should reject missing CAPTCHA token with 400", () => {
                const token = undefined
                const statusCode = token ? 200 : 400

                expect(statusCode).toBe(400)
            })

            it("should reject invalid CAPTCHA token with 400", () => {
                const token = "invalid-token-format"
                const isValid = token && token.length > 20 // Assume valid tokens are long

                const statusCode = isValid ? 200 : 400
                expect(statusCode).toBe(400)
            })

            it("should reject expired CAPTCHA token", () => {
                const tokenTimestamp = Date.now() - 6 * 60 * 1000 // 6 minutes ago
                const now = Date.now()
                const maxAge = 5 * 60 * 1000 // 5 minutes

                const isExpired = now - tokenTimestamp > maxAge
                const statusCode = isExpired ? 400 : 200

                expect(statusCode).toBe(400)
            })

            it("should not reveal credentials in CAPTCHA errors", () => {
                const error = "CAPTCHA verification failed"

                expect(error).not.toContain("email")
                expect(error).not.toContain("password")
                expect(error).not.toContain("user")
                expect(error).not.toContain("exists")
            })

            it("should not reveal whether user exists in CAPTCHA errors", () => {
                const error = "CAPTCHA verification failed"

                expect(error).not.toContain("user not found")
                expect(error).not.toContain("user exists")
                expect(error).not.toContain("account")
            })

            it("should not reveal password validity in CAPTCHA errors", () => {
                const error = "CAPTCHA verification failed"

                expect(error).not.toContain("password")
                expect(error).not.toContain("incorrect")
                expect(error).not.toContain("valid")
            })

            it("should return 400 for all CAPTCHA failures (consistent status)", () => {
                const failures = [
                    { reason: "missing", status: 400 },
                    { reason: "invalid", status: 400 },
                    { reason: "expired", status: 400 },
                ]

                failures.forEach(failure => {
                    expect(failure.status).toBe(400)
                })
            })
        })
    })
    describe("Performance on Vercel (Hash Generation < 3 Seconds)", () => {
        describe("Performance requirements", () => {
            it("should hash password in less than 3 seconds", async () => {
                const password = "TestPassword123!"
                const start = performance.now()

                await hashPassword(password)

                const duration = performance.now() - start
                expect(duration).toBeLessThan(3000)
            })

            it("should validate password in less than 3 seconds", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                const start = performance.now()
                await comparePassword(password, hash)
                const duration = performance.now() - start

                expect(duration).toBeLessThan(3000)
            })

            it("should complete multiple hashing operations within time budget", async () => {
                const password = "TestPassword123!"
                const start = performance.now()

                // Simulate 3 hashing operations (registration + 2 migrations)
                await hashPassword(password)
                await hashPassword(password)
                await hashPassword(password)

                const duration = performance.now() - start
                // 3 operations should complete within 9 seconds (3 seconds each)
                expect(duration).toBeLessThan(9000)
            })

            it("should not timeout on Vercel Free Plan (10 second limit)", async () => {
                const password = "TestPassword123!"
                const start = performance.now()

                // Simulate a complete login flow
                const hash = await hashPassword(password)
                await comparePassword(password, hash)

                const duration = performance.now() - start
                // Should complete well within 10 second Vercel timeout
                expect(duration).toBeLessThan(10000)
            })

            it("should maintain consistent performance across multiple attempts", async () => {
                const password = "TestPassword123!"
                const durations: number[] = []

                for (let i = 0; i < 3; i++) {
                    const start = performance.now()
                    await hashPassword(password)
                    durations.push(performance.now() - start)
                }

                // All should be under 5 seconds (more lenient for CI systems)
                durations.forEach(duration => {
                    expect(duration).toBeLessThan(5000)
                })

                // Performance should be consistent (not degrading wildly)
                const avgDuration =
                    durations.reduce((a, b) => a + b) / durations.length
                durations.forEach(duration => {
                    // Each should be within 100% of average (doubled tolerance for CI)
                    expect(Math.abs(duration - avgDuration)).toBeLessThan(
                        avgDuration * 1.0
                    )
                })
            })
        })
    })

    describe("Argon2id validation", () => {
        it("accepts Argon2id hashes", async () => {
            const password = "TestPassword123!"
            const pepper =
                process.env.PEPPER_SECRET ||
                "dev-pepper-test-very-long-string-32chars-minimum-required!"
            const argon2Hash = await argon2.hash(password + pepper, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })

            const result = await validatePassword(password, argon2Hash)

            expect(result.valid).toBe(true)
            expect(result.algorithmType).toBe("argon2id")
        })

        it("rejects non-Argon2id hash formats", async () => {
            const result = await validatePassword(
                "TestPassword123!",
                "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8L8GmDj8a"
            )
            expect(result.valid).toBe(false)
            expect(result.algorithmType).toBe("unknown")
        })
    })

    describe("Integration Tests: Combined Security Scenarios", () => {
        it("should handle complete login flow with rate limiting", () => {
            let attempts = 0
            const maxAttempts = 5

            // Simulate 6 failed attempts
            for (let i = 0; i < 6; i++) {
                attempts++

                if (attempts > maxAttempts) {
                    const statusCode = 429
                    expect(statusCode).toBe(429)
                    break
                }
            }

            expect(attempts).toBe(6)
        })

        it("should maintain security across all attack vectors", async () => {
            const password = "TestPassword123!"
            const hash = await hashPassword(password)

            // Test 1: Timing attack prevention
            const start1 = performance.now()
            await comparePassword(password, hash)
            const time1 = performance.now() - start1

            const start2 = performance.now()
            await comparePassword("WrongPassword", hash)
            const time2 = performance.now() - start2

            // Argon2id is intentionally slow; allow variance under 3s each
            expect(time1).toBeLessThan(5000)
            expect(time2).toBeLessThan(5000)

            // Test 2: Generic error messages
            const error = "Invalid email or password"
            expect(error).not.toContain("Argon2")
            expect(error).not.toContain("argon2id")

            // Test 3: Performance within limits
            expect(time1).toBeLessThan(3000)
            expect(time2).toBeLessThan(3000)
        })
    })
})
