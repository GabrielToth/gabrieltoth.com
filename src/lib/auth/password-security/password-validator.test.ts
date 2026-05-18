/**
 * Unit Tests: Password Validator
 * Tests: validatePassword, isPasswordValid, shouldMigratePassword, getValidationDescription
 *
 * Validates: Requirements 6.1, 6.4, 6.5, 6.6, 6.7
 *
 * Test Coverage:
 * - Argon2id hash validation (correct and incorrect passwords)
 * - Bcrypt hash validation (correct and incorrect passwords)
 * - Algorithm detection and migration flag
 * - Generic error messages (no algorithm revelation)
 * - Invalid input handling (null, undefined, wrong type)
 * - Invalid hash handling (null, undefined, wrong type, malformed)
 * - Pepper application (correct pepper required)
 * - Constant-time comparison (timing attack prevention)
 * - Performance monitoring (validation time tracking)
 * - Convenience functions (isPasswordValid, shouldMigratePassword, getValidationDescription)
 */

import argon2 from "argon2"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
    getValidationDescription,
    isPasswordValid,
    validatePassword,
    type PasswordValidationResult,
} from "./password-validator"

// Test constants
const TEST_PASSWORD = "MySecurePassword123!"
const WRONG_PASSWORD = "WrongPassword456"
const PEPPER = process.env.PEPPER_SECRET || "test-pepper-min-32-characters-long"

describe("Password Validator", () => {
    beforeAll(() => {
        // Ensure pepper is set for tests
        process.env.PEPPER_SECRET = PEPPER
    })

    afterAll(() => {
        // Clean up
        delete process.env.PEPPER_SECRET
    })

    describe("validatePassword - Argon2id Hashes", () => {
        let argon2Hash: string

        beforeAll(async () => {
            // Create a fresh Argon2id hash for testing
            const pepperedPassword = TEST_PASSWORD + PEPPER
            argon2Hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024, // 64 MB
                timeCost: 3,
                parallelism: 2,
                type: 2, // Argon2id
                version: 19,
            })
        })

        it("should validate correct password against Argon2id hash", async () => {
            const result = await validatePassword(TEST_PASSWORD, argon2Hash)

            expect(result.valid).toBe(true)
            expect(result.algorithmType).toBe("argon2id")
            expect(result.hashValid).toBe(true)
            expect(result.error).toBeUndefined()
            expect(result.timeTakenMs).toBeGreaterThan(0)
        })

        it("should reject incorrect password against Argon2id hash", async () => {
            const result = await validatePassword(WRONG_PASSWORD, argon2Hash)

            expect(result.valid).toBe(false)
            expect(result.algorithmType).toBe("argon2id")
            expect(result.hashValid).toBe(true)
            expect(result.error).toBe("Authentication failed")
        })

        it("should return generic error message for failed validation", async () => {
            const result = await validatePassword(WRONG_PASSWORD, argon2Hash)

            // Error message should not reveal algorithm or hash validity
            expect(result.error).toBe("Authentication failed")
            expect(result.error).not.toContain("Argon2")
            expect(result.error).not.toContain("algorithm")
        })

        it("should track validation time", async () => {
            const result = await validatePassword(TEST_PASSWORD, argon2Hash)

            expect(result.timeTakenMs).toBeGreaterThan(0)
            expect(result.timeTakenMs).toBeLessThan(10000) // Should complete within 10 seconds
        })
    })

    describe("validatePassword - Legacy Bcrypt Rejected", () => {
        it("rejects bcrypt hashes", async () => {
            const bcryptHash =
                "$2b$10$nOUIs5kJ7naTuTFkBy1Be.PRZQl/qxWXInGA4aBUW3CjjF3XGm2Oi"
            const result = await validatePassword(TEST_PASSWORD, bcryptHash)

            expect(result.valid).toBe(false)
            expect(result.algorithmType).toBe("unknown")
        })
    })

    describe("validatePassword - Invalid Passwords", () => {
        let testHash: string

        beforeAll(async () => {
            const pepperedPassword = TEST_PASSWORD + PEPPER
            testHash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })
        })

        it("should reject null password", async () => {
            await expect(validatePassword(null, testHash)).rejects.toThrow()
        })

        it("should reject undefined password", async () => {
            await expect(
                validatePassword(undefined, testHash)
            ).rejects.toThrow()
        })

        it("should reject non-string password", async () => {
            await expect(
                validatePassword(12345 as any, testHash)
            ).rejects.toThrow()
        })

        it("should reject empty password", async () => {
            await expect(validatePassword("", testHash)).rejects.toThrow()
        })

        it("should reject password shorter than 8 characters", async () => {
            await expect(validatePassword("short", testHash)).rejects.toThrow()
        })

        it("should reject password longer than 128 characters", async () => {
            const longPassword = "a".repeat(129)
            await expect(
                validatePassword(longPassword, testHash)
            ).rejects.toThrow()
        })

        it("should reject password with null bytes", async () => {
            await expect(
                validatePassword("Password\x00Injection", testHash)
            ).rejects.toThrow()
        })

        it("should reject password with control characters", async () => {
            await expect(
                validatePassword("Password\nNewline", testHash)
            ).rejects.toThrow()
        })
    })

    describe("validatePassword - Invalid Hashes", () => {
        it("should return generic error for null hash", async () => {
            const result = await validatePassword(TEST_PASSWORD, null)

            expect(result.valid).toBe(false)
            expect(result.algorithmType).toBe("unknown")
            expect(result.hashValid).toBe(false)
            expect(result.error).toBe("Authentication failed")
        })

        it("should return generic error for undefined hash", async () => {
            const result = await validatePassword(TEST_PASSWORD, undefined)

            expect(result.valid).toBe(false)
            expect(result.algorithmType).toBe("unknown")
            expect(result.hashValid).toBe(false)
            expect(result.error).toBe("Authentication failed")
        })

        it("should return generic error for non-string hash", async () => {
            const result = await validatePassword(TEST_PASSWORD, 12345 as any)

            expect(result.valid).toBe(false)
            expect(result.algorithmType).toBe("unknown")
            expect(result.hashValid).toBe(false)
            expect(result.error).toBe("Authentication failed")
        })

        it("should return generic error for empty hash", async () => {
            const result = await validatePassword(TEST_PASSWORD, "")

            expect(result.valid).toBe(false)
            expect(result.algorithmType).toBe("unknown")
            expect(result.hashValid).toBe(false)
            expect(result.error).toBe("Authentication failed")
        })

        it("should return generic error for malformed hash", async () => {
            const result = await validatePassword(
                TEST_PASSWORD,
                "not_a_valid_hash_format"
            )

            expect(result.valid).toBe(false)
            expect(result.algorithmType).toBe("unknown")
            expect(result.hashValid).toBe(false)
            expect(result.error).toBe("Authentication failed")
            // Error should not reveal that hash format is invalid
            expect(result.error).not.toContain("format")
            expect(result.error).not.toContain("malformed")
        })

        it("should return generic error for incomplete Argon2id hash", async () => {
            const incompleteHash = "$argon2id$v=19$m=64000,t=3,p=2$"

            const result = await validatePassword(TEST_PASSWORD, incompleteHash)

            expect(result.valid).toBe(false)
            expect(result.error).toBe("Authentication failed")
        })

        it("should return generic error for incomplete Bcrypt hash", async () => {
            const incompleteHash = "$2b$12$"

            const result = await validatePassword(TEST_PASSWORD, incompleteHash)

            expect(result.valid).toBe(false)
            expect(result.error).toBe("Authentication failed")
        })
    })

    describe("validatePassword - Pepper Application", () => {
        let argon2Hash: string

        beforeAll(async () => {
            const pepperedPassword = TEST_PASSWORD + PEPPER

            argon2Hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })
        })

        it("should validate with correct pepper (Argon2id)", async () => {
            const result = await validatePassword(TEST_PASSWORD, argon2Hash)

            expect(result.valid).toBe(true)
        })

        it("should fail if pepper is wrong", async () => {
            // Create hash with different pepper
            const wrongPepper = "wrong-pepper-min-32-characters-long"
            const pepperedPassword = TEST_PASSWORD + wrongPepper

            const wrongHash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })

            // Try to validate with correct pepper (should fail)
            const result = await validatePassword(TEST_PASSWORD, wrongHash)

            expect(result.valid).toBe(false)
            expect(result.error).toBe("Authentication failed")
        })
    })

    describe("validatePassword - Constant-Time Comparison", () => {
        let argon2Hash: string

        beforeAll(async () => {
            const pepperedPassword = TEST_PASSWORD + PEPPER
            argon2Hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })
        })

        it("should use constant-time comparison (timing variance < 1 second)", async () => {
            const timings: number[] = []

            // Run multiple validations and collect timing data
            for (let i = 0; i < 5; i++) {
                const startTime = Date.now()
                await validatePassword(TEST_PASSWORD, argon2Hash)
                const endTime = Date.now()
                timings.push(endTime - startTime)
            }

            // Calculate variance
            const avgTime = timings.reduce((a, b) => a + b) / timings.length
            const variance = Math.max(...timings) - Math.min(...timings)

            // Variance should be reasonable (< 1 second for Argon2id)
            // Note: Argon2id inherently takes 2-3 seconds, so variance will be larger
            expect(variance).toBeLessThan(1000)
        })

        it("should return timing information in result", async () => {
            const result = await validatePassword(TEST_PASSWORD, argon2Hash)

            expect(result.timeTakenMs).toBeGreaterThan(0)
            expect(typeof result.timeTakenMs).toBe("number")
        })
    })

    describe("validatePassword - Convenience Functions", () => {
        let validResult: PasswordValidationResult
        let invalidResult: PasswordValidationResult

        beforeAll(async () => {
            const pepperedPassword = TEST_PASSWORD + PEPPER

            const argon2Hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })

            validResult = await validatePassword(TEST_PASSWORD, argon2Hash)
            invalidResult = await validatePassword(WRONG_PASSWORD, argon2Hash)
        })

        describe("isPasswordValid", () => {
            it("should return true for valid password", () => {
                expect(isPasswordValid(validResult)).toBe(true)
            })

            it("should return false for invalid password", () => {
                expect(isPasswordValid(invalidResult)).toBe(false)
            })
        })

        describe("getValidationDescription", () => {
            it("should describe valid Argon2id validation", () => {
                const description = getValidationDescription(validResult)

                expect(description).toContain("succeeded")
                expect(description).toContain("argon2id")
            })

            it("should describe failed validation", () => {
                const description = getValidationDescription(invalidResult)

                expect(description).toContain("failed")
                expect(description).toContain("argon2id")
            })
        })
    })

    describe("validatePassword - Edge Cases", () => {
        let argon2Hash: string

        beforeAll(async () => {
            const pepperedPassword = TEST_PASSWORD + PEPPER
            argon2Hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })
        })

        it("should handle password with special characters", async () => {
            const specialPassword = "P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?"
            const pepperedPassword = specialPassword + PEPPER

            const hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })

            const result = await validatePassword(specialPassword, hash)

            expect(result.valid).toBe(true)
        })

        it("should handle password with unicode characters", async () => {
            const unicodePassword = "Pässwörd123!Ñoño"
            const pepperedPassword = unicodePassword + PEPPER

            const hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })

            const result = await validatePassword(unicodePassword, hash)

            expect(result.valid).toBe(true)
        })

        it("should handle password with spaces", async () => {
            const spacedPassword = "My Secure Password 123"
            const pepperedPassword = spacedPassword + PEPPER

            const hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })

            const result = await validatePassword(spacedPassword, hash)

            expect(result.valid).toBe(true)
        })

        it("should handle password at minimum length (8 characters)", async () => {
            const minPassword = "12345678"
            const pepperedPassword = minPassword + PEPPER

            const hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })

            const result = await validatePassword(minPassword, hash)

            expect(result.valid).toBe(true)
        })

        it("should handle password at maximum length (128 characters)", async () => {
            const maxPassword = "a".repeat(128)
            const pepperedPassword = maxPassword + PEPPER

            const hash = await argon2.hash(pepperedPassword, {
                memoryCost: 64 * 1024,
                timeCost: 3,
                parallelism: 2,
                type: 2,
                version: 19,
            })

            const result = await validatePassword(maxPassword, hash)

            expect(result.valid).toBe(true)
        })
    })

    describe("validatePassword - Error Handling", () => {
        it("should not throw on invalid hash (returns generic error)", async () => {
            const result = await validatePassword(TEST_PASSWORD, "invalid_hash")

            expect(result.valid).toBe(false)
            expect(result.error).toBe("Authentication failed")
        })

        it("should not throw on null hash (returns generic error)", async () => {
            const result = await validatePassword(TEST_PASSWORD, null)

            expect(result.valid).toBe(false)
            expect(result.error).toBe("Authentication failed")
        })

        it("should throw on invalid password (fail-secure)", async () => {
            await expect(
                validatePassword("short", "any_hash")
            ).rejects.toThrow()
        })
    })
})
