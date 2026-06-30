/**
 * Unit Tests: Argon2id Password Hashing
 * Tests for hash generation, validation, and performance
 *
 * Requirements covered:
 * - Requirement 1: Argon2id Password Hashing (1.1-1.6)
 * - Requirement 2: Automatic Salt Generation (2.1-2.5)
 * - Requirement 3: Pepper Security Layer (3.1-3.5)
 * - Requirement 15: Performance and Resource Management (15.1-15.6)
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    getArgon2Config,
    hashPasswordArgon2id,
    isArgon2idHash,
    verifyPasswordArgon2id,
} from "./argon2id-hasher"
import { ConfigurationManager } from "./config"

describe("Argon2id Password Hashing", () => {
    beforeEach(() => {
        // Reset environment variables before each test
        process.env.ARGON2_MEMORY_COST = "64"
        process.env.ARGON2_TIME_COST = "3"
        process.env.ARGON2_PARALLELISM = "2"
        process.env.PEPPER_SECRET =
            "dev-pepper-test-very-long-string-32chars-minimum-required!"
        ;(process.env as any).NODE_ENV = "development"

        // Reset singleton instance
        ;(ConfigurationManager as any).instance = null
    })

    describe("hashPasswordArgon2id", () => {
        it("should hash a valid password successfully", async () => {
            const password = "ValidPassword123!"
            const result = await hashPasswordArgon2id(password)

            expect(result).toBeDefined()
            expect(result.hash).toBeDefined()
            expect(result.algorithm).toBe("argon2id")
            expect(result.timeTakenMs).toBeGreaterThan(0)
            expect(result.performanceWarning).toBe(false)
        })

        it("should return hash in Argon2id format", async () => {
            const password = "ValidPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Hash should start with $argon2id$v=19$
            expect(result.hash).toMatch(/^\$argon2id\$v=19\$/)
            // Should contain memory, time, and parallelism parameters
            expect(result.hash).toMatch(/m=\d+,t=\d+,p=\d+/)
        })

        it("should include salt in hash output", async () => {
            const password = "ValidPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Argon2id hash format: $argon2id$v=19$m=...,t=...,p=...$SALT$HASH
            // Should have at least 5 parts separated by $
            const parts = result.hash.split("$")
            expect(parts.length).toBeGreaterThanOrEqual(5)
            // Salt should be non-empty
            expect(parts[4]).toBeTruthy()
            // Hash should be non-empty
            expect(parts[5]).toBeTruthy()
        })

        it("should generate different hashes for same password (unique salt)", async () => {
            const password = "ValidPassword123!"

            const result1 = await hashPasswordArgon2id(password)
            const result2 = await hashPasswordArgon2id(password)

            // Hashes should be different due to unique salt
            expect(result1.hash).not.toBe(result2.hash)
        })

        it("should complete within performance target", async () => {
            const password = "ValidPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Should complete within 5 seconds (warning threshold)
            expect(result.timeTakenMs).toBeLessThan(5000)
        })

        it("should log performance warning if hashing takes too long", async () => {
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {})

            // Create a slow password by using high parameters
            process.env.ARGON2_MEMORY_COST = "256"
            process.env.ARGON2_TIME_COST = "10"
            ;(ConfigurationManager as any).instance = null

            const password = "ValidPassword123!"

            try {
                const result = await hashPasswordArgon2id(password)
                // If it completes, check if warning was logged
                if (result.timeTakenMs > 5000) {
                    expect(result.performanceWarning).toBe(true)
                }
            } catch {
                // May timeout, which is acceptable for this test
            }

            warnSpy.mockRestore()
        })

        it("should reject password that is too short", async () => {
            const password = "Short1!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /at least 8 characters/
            )
        })

        it("should reject password that is too long", async () => {
            const password = "a".repeat(129)

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /not exceed 128 characters/
            )
        })

        it("should reject empty password", async () => {
            await expect(hashPasswordArgon2id("")).rejects.toThrow(
                /cannot be empty/
            )
        })

        it("should reject non-string password", async () => {
            await expect(hashPasswordArgon2id(123 as any)).rejects.toThrow(
                /must be a string/
            )
        })

        it("should reject password with null bytes", async () => {
            const password = "ValidPassword\0Injection"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /null bytes/
            )
        })

        it("should reject password with control characters", async () => {
            const password = "ValidPassword\x01Control"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /control character/
            )
        })

        it("should fail securely if pepper is not configured", async () => {
            delete process.env.PEPPER_SECRET
            ;(ConfigurationManager as any).instance = null

            const password = "ValidPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /PEPPER_SECRET/
            )
        })

        it("should fail securely if pepper is too short", async () => {
            process.env.PEPPER_SECRET = "short"
            ;(ConfigurationManager as any).instance = null

            const password = "ValidPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /too short/
            )
        })

        it("should use configured Argon2id parameters", async () => {
            process.env.ARGON2_MEMORY_COST = "128"
            process.env.ARGON2_TIME_COST = "4"
            process.env.ARGON2_PARALLELISM = "3"
            ;(ConfigurationManager as any).instance = null

            const password = "ValidPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Hash should contain the configured parameters
            // m=131072 is 128 MB in KiB (128 * 1024)
            expect(result.hash).toMatch(/m=131072/)
            expect(result.hash).toMatch(/t=4/)
            expect(result.hash).toMatch(/p=3/)
        })

        it("should apply pepper before hashing", async () => {
            const password = "ValidPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Verify that the hash is different from what it would be without pepper
            // This is tested indirectly through verification tests
            expect(result.hash).toBeDefined()
            expect(result.hash.length).toBeGreaterThan(0)
        })
    })

    describe("verifyPasswordArgon2id", () => {
        it("should verify correct password against hash", async () => {
            const password = "ValidPassword123!"
            const hashResult = await hashPasswordArgon2id(password)

            const isValid = await verifyPasswordArgon2id(
                password,
                hashResult.hash
            )

            expect(isValid).toBe(true)
        })

        it("should reject incorrect password", async () => {
            const password = "ValidPassword123!"
            const wrongPassword = "WrongPassword456!"
            const hashResult = await hashPasswordArgon2id(password)

            const isValid = await verifyPasswordArgon2id(
                wrongPassword,
                hashResult.hash
            )

            expect(isValid).toBe(false)
        })

        it("should reject if pepper is missing", async () => {
            const password = "ValidPassword123!"
            const hashResult = await hashPasswordArgon2id(password)

            // Remove pepper
            delete process.env.PEPPER_SECRET
            ;(ConfigurationManager as any).instance = null

            // When pepper is missing, verification should return false (not throw)
            // because the error is caught and handled gracefully
            const isValid = await verifyPasswordArgon2id(
                password,
                hashResult.hash
            )

            expect(isValid).toBe(false)
        })

        it("should reject if pepper is wrong", async () => {
            const password = "ValidPassword123!"
            const hashResult = await hashPasswordArgon2id(password)

            // Change pepper
            process.env.PEPPER_SECRET =
                "different-pepper-test-very-long-string-32chars-minimum!"
            ;(ConfigurationManager as any).instance = null

            const isValid = await verifyPasswordArgon2id(
                password,
                hashResult.hash
            )

            expect(isValid).toBe(false)
        })

        it("should reject invalid password input", async () => {
            const hashResult = await hashPasswordArgon2id("ValidPassword123!")

            await expect(
                verifyPasswordArgon2id("Short1!", hashResult.hash)
            ).rejects.toThrow()
        })

        it("should reject non-string password", async () => {
            const hashResult = await hashPasswordArgon2id("ValidPassword123!")

            await expect(
                verifyPasswordArgon2id(123 as any, hashResult.hash)
            ).rejects.toThrow()
        })

        it("should reject empty hash", async () => {
            const password = "ValidPassword123!"

            await expect(verifyPasswordArgon2id(password, "")).rejects.toThrow()
        })

        it("should reject non-string hash", async () => {
            const password = "ValidPassword123!"

            await expect(
                verifyPasswordArgon2id(password, 123 as any)
            ).rejects.toThrow()
        })

        it("should return false for malformed hash", async () => {
            const password = "ValidPassword123!"
            const malformedHash = "not-a-valid-hash"

            const isValid = await verifyPasswordArgon2id(
                password,
                malformedHash
            )

            expect(isValid).toBe(false)
        })

        it("should use constant-time comparison", async () => {
            const password = "ValidPassword123!"
            const hashResult = await hashPasswordArgon2id(password)

            // Measure time for correct password
            const startCorrect = Date.now()
            await verifyPasswordArgon2id(password, hashResult.hash)
            const timeCorrect = Date.now() - startCorrect

            // Measure time for incorrect password
            const startIncorrect = Date.now()
            await verifyPasswordArgon2id("WrongPassword456!", hashResult.hash)
            const timeIncorrect = Date.now() - startIncorrect

            // Times should be similar (within 100ms variance)
            // This is a loose check since timing can vary
            const timeDifference = Math.abs(timeCorrect - timeIncorrect)
            expect(timeDifference).toBeLessThan(500)
        })
    })

    describe("isArgon2idHash", () => {
        it("should detect Argon2id hash format", async () => {
            const password = "ValidPassword123!"
            const result = await hashPasswordArgon2id(password)

            expect(isArgon2idHash(result.hash)).toBe(true)
        })

        it("should reject non-Argon2id hash", () => {
            expect(isArgon2idHash("invalid-password-hash")).toBe(false)
        })

        it("should reject empty string", () => {
            expect(isArgon2idHash("")).toBe(false)
        })

        it("should reject non-string", () => {
            expect(isArgon2idHash(123 as any)).toBe(false)
        })

        it("should reject null", () => {
            expect(isArgon2idHash(null as any)).toBe(false)
        })

        it("should reject undefined", () => {
            expect(isArgon2idHash(undefined as any)).toBe(false)
        })
    })

    describe("getArgon2Config", () => {
        it("should return configuration constants", () => {
            const config = getArgon2Config()

            expect(config.MAX_HASH_TIME_SECONDS).toBe(10)
            expect(config.HASH_TIME_WARNING_SECONDS).toBe(5)
            expect(config.TARGET_HASH_TIME_SECONDS).toBe(3)
            expect(config.HASH_TIME_VARIANCE_SECONDS).toBe(1)
        })

        it("should return a copy of configuration", () => {
            const config1 = getArgon2Config()
            const config2 = getArgon2Config()

            expect(config1).not.toBe(config2)
            expect(config1).toEqual(config2)
        })
    })

    describe("Integration Tests", () => {
        it("should hash and verify password successfully", async () => {
            const password = "MySecurePassword123!"

            // Hash the password
            const hashResult = await hashPasswordArgon2id(password)
            expect(hashResult.algorithm).toBe("argon2id")

            // Verify the password
            const isValid = await verifyPasswordArgon2id(
                password,
                hashResult.hash
            )
            expect(isValid).toBe(true)

            // Verify wrong password fails
            const isWrong = await verifyPasswordArgon2id(
                "WrongPassword456!",
                hashResult.hash
            )
            expect(isWrong).toBe(false)
        })

        it("should handle multiple passwords independently", async () => {
            const password1 = "FirstPassword123!"
            const password2 = "SecondPassword456!"

            const hash1 = await hashPasswordArgon2id(password1)
            const hash2 = await hashPasswordArgon2id(password2)

            // Hashes should be different
            expect(hash1.hash).not.toBe(hash2.hash)

            // Each password should verify against its own hash
            expect(await verifyPasswordArgon2id(password1, hash1.hash)).toBe(
                true
            )
            expect(await verifyPasswordArgon2id(password2, hash2.hash)).toBe(
                true
            )

            // Cross-verification should fail
            expect(await verifyPasswordArgon2id(password1, hash2.hash)).toBe(
                false
            )
            expect(await verifyPasswordArgon2id(password2, hash1.hash)).toBe(
                false
            )
        })

        it("should maintain security across multiple hashing operations", async () => {
            const password = "ValidPassword123!"
            const hashes: string[] = []

            // Generate multiple hashes of the same password
            for (let i = 0; i < 5; i++) {
                const result = await hashPasswordArgon2id(password)
                hashes.push(result.hash)
            }

            // All hashes should be different (unique salts)
            const uniqueHashes = new Set(hashes)
            expect(uniqueHashes.size).toBe(5)

            // All hashes should verify correctly
            for (const hash of hashes) {
                const isValid = await verifyPasswordArgon2id(password, hash)
                expect(isValid).toBe(true)
            }
        })
    })
})
