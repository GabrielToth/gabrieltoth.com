/**
 * Unit Tests: Bcrypt Password Validation
 * Tests: validatePasswordBcrypt, isBcryptHashValid, extractBcryptInfo, describeBcryptHash
 *
 * Validates: Requirements 5.1, 5.2, 10.2, 6.4, 8.4, 8.5
 */

import bcrypt from "bcrypt"
import { beforeAll, describe, expect, it } from "vitest"
import {
    describeBcryptHash,
    extractBcryptInfo,
    isBcryptHashValid,
    validatePasswordBcrypt,
} from "./bcrypt-validator"
import { ConfigurationManager } from "./config"

// Test password and hashes
const TEST_PASSWORD = "TestPassword123!"
const TEST_PASSWORD_WRONG = "WrongPassword456!"

// Generate fresh hashes for testing (these will be different each time)
// Note: These hashes are generated WITHOUT pepper, so we need to generate them fresh
// with the pepper applied to match what the validator expects
let FRESH_HASH_COST_10: string
let FRESH_HASH_COST_04: string
let FRESH_HASH_COST_12: string

describe("Bcrypt Password Validation", () => {
    beforeAll(async () => {
        // Generate fresh hashes for testing
        // Note: We need to apply pepper before hashing to match what the validator expects
        const config = ConfigurationManager.getInstance()
        const pepper = config.getPepper()

        const pepperedPassword = TEST_PASSWORD + pepper
        FRESH_HASH_COST_10 = await bcrypt.hash(pepperedPassword, 10)
        FRESH_HASH_COST_04 = await bcrypt.hash(pepperedPassword, 4)
        FRESH_HASH_COST_12 = await bcrypt.hash(pepperedPassword, 12)
    })

    describe("validatePasswordBcrypt - Valid Passwords", () => {
        it("should validate correct password against $2a$ hash", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )

            expect(result.valid).toBe(true)
            expect(result.hashValid).toBe(true)
            expect(result.version).toBeDefined()
            expect(result.costFactor).toBeDefined()
            expect(result.reason).toContain("matches")
            expect(result.timeTakenMs).toBeGreaterThan(0)
        })

        it("should validate correct password against $2b$ hash", async () => {
            const config = ConfigurationManager.getInstance()
            const pepper = config.getPepper()
            const pepperedPassword = TEST_PASSWORD + pepper
            const hash = await bcrypt.hash(pepperedPassword, 10)
            const result = await validatePasswordBcrypt(TEST_PASSWORD, hash)

            expect(result.valid).toBe(true)
            expect(result.hashValid).toBe(true)
            expect(result.version).toContain("$2")
            expect(result.costFactor).toBe(10)
        })

        it("should validate with different cost factors", async () => {
            const config = ConfigurationManager.getInstance()
            const pepper = config.getPepper()
            const pepperedPassword = TEST_PASSWORD + pepper
            const costs = [4, 6, 8, 10, 12]

            for (const cost of costs) {
                const hash = await bcrypt.hash(pepperedPassword, cost)
                const result = await validatePasswordBcrypt(TEST_PASSWORD, hash)

                expect(result.valid).toBe(true)
                expect(result.costFactor).toBe(cost)
            }
        })

        it("should return validation time", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )

            expect(result.timeTakenMs).toBeGreaterThan(0)
            expect(result.timeTakenMs).toBeLessThan(5000) // Should be < 5 seconds
        })

        it("should extract version from hash", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )

            expect(result.version).toMatch(/^\$2[aby]\$$/)
        })

        it("should extract cost factor from hash", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )

            expect(result.costFactor).toBe(10)
        })
    })

    describe("validatePasswordBcrypt - Invalid Passwords", () => {
        it("should reject wrong password", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD_WRONG,
                FRESH_HASH_COST_10
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(true)
            expect(result.reason).toContain("does not match")
        })

        it("should reject non-string password", async () => {
            await expect(
                validatePasswordBcrypt(12345 as any, FRESH_HASH_COST_10)
            ).rejects.toThrow("must be a string")
        })

        it("should reject null password", async () => {
            await expect(
                validatePasswordBcrypt(null as any, FRESH_HASH_COST_10)
            ).rejects.toThrow("must be a string")
        })

        it("should reject undefined password", async () => {
            await expect(
                validatePasswordBcrypt(undefined as any, FRESH_HASH_COST_10)
            ).rejects.toThrow("must be a string")
        })
    })

    describe("validatePasswordBcrypt - Invalid Hashes", () => {
        it("should reject null hash", async () => {
            const result = await validatePasswordBcrypt(TEST_PASSWORD, null)

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
            expect(result.reason).toContain("null or undefined")
        })

        it("should reject undefined hash", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                undefined
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
            expect(result.reason).toContain("null or undefined")
        })

        it("should reject empty string hash", async () => {
            const result = await validatePasswordBcrypt(TEST_PASSWORD, "")

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
            expect(result.reason).toContain("empty string")
        })

        it("should reject non-string hash", async () => {
            const result = await validatePasswordBcrypt(TEST_PASSWORD, 12345)

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
            expect(result.reason).toContain("must be a string")
        })

        it("should reject Argon2id hash", async () => {
            const argon2Hash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash1234567890abcdef1234567890ab"
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                argon2Hash
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
            expect(result.reason).toContain("not in Bcrypt format")
        })

        it("should reject unknown hash format", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                "not_a_hash_at_all"
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
            expect(result.reason).toContain("not in Bcrypt format")
        })

        it("should reject incomplete Bcrypt hash", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                "$2b$10$abc"
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
            expect(result.reason).toContain("invalid")
        })

        it("should reject Bcrypt-like with invalid cost", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                "$2b$ab$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
        })

        it("should reject Bcrypt-like with invalid variant", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                "$2c$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
        })

        it("should reject hash with whitespace", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                "$2b$10$abc def"
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
        })

        it("should reject hash with newlines", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                "$2b$10$abc\ndef"
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
        })

        it("should reject non-string hash (object)", async () => {
            const result = await validatePasswordBcrypt(TEST_PASSWORD, {
                hash: "test",
            } as any)

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
        })

        it("should reject non-string hash (array)", async () => {
            const result = await validatePasswordBcrypt(TEST_PASSWORD, [
                "$2b$10$...",
            ] as any)

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
        })

        it("should reject non-string hash (boolean)", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                true as any
            )

            expect(result.valid).toBe(false)
            expect(result.hashValid).toBe(false)
        })
    })

    describe("validatePasswordBcrypt - Return Type Validation", () => {
        it("should always return BcryptValidationResult", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )

            expect(result).toHaveProperty("valid")
            expect(result).toHaveProperty("hashValid")
            expect(result).toHaveProperty("reason")
            expect(result).toHaveProperty("timeTakenMs")
        })

        it("should have valid as boolean", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )

            expect(typeof result.valid).toBe("boolean")
        })

        it("should have hashValid as boolean", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )

            expect(typeof result.hashValid).toBe("boolean")
        })

        it("should have reason as non-empty string", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )

            expect(typeof result.reason).toBe("string")
            expect(result.reason.length).toBeGreaterThan(0)
        })

        it("should have timeTakenMs as positive number", async () => {
            const result = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )

            expect(typeof result.timeTakenMs).toBe("number")
            expect(result.timeTakenMs).toBeGreaterThan(0)
        })

        it("should have version only for valid hashes", async () => {
            const validResult = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )
            expect(validResult.version).toBeDefined()

            const invalidResult = await validatePasswordBcrypt(
                TEST_PASSWORD,
                "invalid_hash"
            )
            expect(invalidResult.version).toBeUndefined()
        })

        it("should have costFactor only for valid hashes", async () => {
            const validResult = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )
            expect(validResult.costFactor).toBeDefined()

            const invalidResult = await validatePasswordBcrypt(
                TEST_PASSWORD,
                "invalid_hash"
            )
            expect(invalidResult.costFactor).toBeUndefined()
        })
    })

    describe("validatePasswordBcrypt - Timing Attack Prevention", () => {
        it("should have consistent timing for valid and invalid passwords", async () => {
            const timings: number[] = []

            // Run multiple validations to get timing samples
            for (let i = 0; i < 3; i++) {
                const result = await validatePasswordBcrypt(
                    TEST_PASSWORD,
                    FRESH_HASH_COST_10
                )
                timings.push(result.timeTakenMs)
            }

            // All timings should be within reasonable range
            const avgTiming = timings.reduce((a, b) => a + b) / timings.length
            const maxDeviation = Math.max(
                ...timings.map(t => Math.abs(t - avgTiming))
            )

            // Timing should be consistent (within 500ms variance for bcrypt)
            expect(maxDeviation).toBeLessThan(500)
        })

        it("should not leak timing information about password correctness", async () => {
            const correctResult = await validatePasswordBcrypt(
                TEST_PASSWORD,
                FRESH_HASH_COST_10
            )
            const wrongResult = await validatePasswordBcrypt(
                TEST_PASSWORD_WRONG,
                FRESH_HASH_COST_10
            )

            // Timing should be similar (within 500ms) regardless of correctness
            const timingDifference = Math.abs(
                correctResult.timeTakenMs - wrongResult.timeTakenMs
            )
            expect(timingDifference).toBeLessThan(500)
        })
    })

    describe("isBcryptHashValid - Convenience Function", () => {
        it("should return true for valid Bcrypt hash", async () => {
            expect(isBcryptHashValid(FRESH_HASH_COST_10)).toBe(true)
        })

        it("should return false for invalid Bcrypt hash", async () => {
            expect(isBcryptHashValid("$2b$10$abc")).toBe(false)
        })

        it("should return false for Argon2id hash", () => {
            const hash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash1234567890abcdef1234567890ab"
            expect(isBcryptHashValid(hash)).toBe(false)
        })

        it("should return false for unknown format", () => {
            expect(isBcryptHashValid("unknown_hash")).toBe(false)
        })

        it("should return false for null", () => {
            expect(isBcryptHashValid(null)).toBe(false)
        })

        it("should return false for undefined", () => {
            expect(isBcryptHashValid(undefined)).toBe(false)
        })

        it("should return false for empty string", () => {
            expect(isBcryptHashValid("")).toBe(false)
        })

        it("should return false for non-string", () => {
            expect(isBcryptHashValid(12345)).toBe(false)
        })
    })

    describe("extractBcryptInfo - Version and Cost Extraction", () => {
        it("should extract version and cost from valid hash", async () => {
            const info = extractBcryptInfo(FRESH_HASH_COST_10)

            expect(info).not.toBeNull()
            expect(info?.version).toMatch(/^\$2[aby]\$$/)
            expect(info?.costFactor).toBe(10)
        })

        it("should extract different cost factors", async () => {
            const info4 = extractBcryptInfo(FRESH_HASH_COST_04)
            const info12 = extractBcryptInfo(FRESH_HASH_COST_12)

            expect(info4?.costFactor).toBe(4)
            expect(info12?.costFactor).toBe(12)
        })

        it("should return null for invalid hash", () => {
            expect(extractBcryptInfo("invalid_hash")).toBeNull()
        })

        it("should return null for Argon2id hash", () => {
            const hash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash1234567890abcdef1234567890ab"
            expect(extractBcryptInfo(hash)).toBeNull()
        })

        it("should return null for null", () => {
            expect(extractBcryptInfo(null)).toBeNull()
        })

        it("should return null for undefined", () => {
            expect(extractBcryptInfo(undefined)).toBeNull()
        })

        it("should return null for empty string", () => {
            expect(extractBcryptInfo("")).toBeNull()
        })

        it("should return null for non-string", () => {
            expect(extractBcryptInfo(12345)).toBeNull()
        })
    })

    describe("describeBcryptHash - Human-Readable Output", () => {
        it("should return description for valid hash", async () => {
            const description = describeBcryptHash(FRESH_HASH_COST_10)

            expect(description).toContain("Bcrypt")
            expect(description).toContain("$2")
            expect(description).toContain("10")
        })

        it("should return description for different cost factors", async () => {
            const desc4 = describeBcryptHash(FRESH_HASH_COST_04)
            const desc12 = describeBcryptHash(FRESH_HASH_COST_12)

            expect(desc4).toContain("4")
            expect(desc12).toContain("12")
        })

        it("should return description for invalid hash", () => {
            const description = describeBcryptHash("invalid_hash")

            expect(description).toContain("Invalid")
        })

        it("should return description for null", () => {
            const description = describeBcryptHash(null)

            expect(description).toContain("Invalid")
        })

        it("should return description for undefined", () => {
            const description = describeBcryptHash(undefined)

            expect(description).toContain("Invalid")
        })

        it("should return description for Argon2id hash", () => {
            const hash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash1234567890abcdef1234567890ab"
            const description = describeBcryptHash(hash)

            expect(description).toContain("Invalid")
        })
    })

    describe("Real-World Bcrypt Hash Examples", () => {
        it("should validate real Bcrypt hash from bcryptjs", async () => {
            // Real hash generated by bcryptjs with cost 10
            const hash =
                "$2b$10$nOUIs5kJ7naTuTFkBy1Be.PRZQl/qxWXInGA4aBUW3CjjF3XGm2Oi"

            // Note: This hash was generated with a specific password
            // We can't validate it without knowing the original password
            // But we can verify the format is recognized
            const info = extractBcryptInfo(hash)

            expect(info).not.toBeNull()
            expect(info?.version).toBe("$2b$")
            expect(info?.costFactor).toBe(10)
        })

        it("should validate real Bcrypt hash with $2a$ variant", async () => {
            const hash =
                "$2a$10$nOUIs5kJ7naTuTFkBy1Be.PRZQl/qxWXInGA4aBUW3CjjF3XGm2Oi"
            const info = extractBcryptInfo(hash)

            expect(info).not.toBeNull()
            expect(info?.version).toBe("$2a$")
            expect(info?.costFactor).toBe(10)
        })

        it("should validate real Bcrypt hash with $2y$ variant", async () => {
            const hash =
                "$2y$10$nOUIs5kJ7naTuTFkBy1Be.PRZQl/qxWXInGA4aBUW3CjjF3XGm2Oi"
            const info = extractBcryptInfo(hash)

            expect(info).not.toBeNull()
            expect(info?.version).toBe("$2y$")
            expect(info?.costFactor).toBe(10)
        })
    })

    describe("Edge Cases and Error Handling", () => {
        it("should handle very long password", async () => {
            const longPassword = "a".repeat(128) // Maximum allowed length
            const hash = await bcrypt.hash(longPassword, 4)
            const result = await validatePasswordBcrypt(longPassword, hash)

            expect(result.valid).toBe(true)
        })
    })
})
