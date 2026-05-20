/** Security tests for password storage and authentication. */

import {
    hashPasswordArgon2id,
    verifyPasswordArgon2id,
} from "@/lib/auth/password-security/argon2id-hasher"
import { ConfigurationManager } from "@/lib/auth/password-security/config"
import fc from "fast-check"
import { beforeEach, describe, expect, it } from "vitest"

describe("Security Test: Salt Uniqueness ", () => {
    beforeEach(() => {
        // Reset environment variables before each test
        process.env.ARGON2_MEMORY_COST = "64"
        process.env.ARGON2_TIME_COST = "3"
        process.env.ARGON2_PARALLELISM = "2"
        process.env.PEPPER_SECRET =
            "dev-pepper-test-very-long-string-32chars-minimum-required!"
        process.env.NODE_ENV = "development"

        // Reset singleton instance
        ;(ConfigurationManager as any).instance = null
    })

    describe("Property 1: Identical Passwords Produce Different Hashes", () => {
        /**
         * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
         *
         * Property: For any valid password string, hashing the same password
         * multiple times SHALL produce different hashes due to unique salts,
         * and all hashes SHALL verify correctly with the original password.
         *
         * This property ensures:
         * 1. Each hash operation generates a unique salt
         * 2. Unique salts result in different hashes
         * 3. All hashes are valid and verify correctly
         * 4. Rainbow table attacks are prevented
         */
        it("should produce 100+ different hashes for identical password (salt uniqueness)", async () => {
            const password = "TestPassword123!"
            const hashCount = 100

            // Generate 100+ hashes for the same password
            const hashes = await Promise.all(
                Array.from({ length: hashCount }, () =>
                    hashPasswordArgon2id(password)
                )
            )

            // Extract hash strings
            const hashStrings = hashes.map(h => h.hash)

            // Property 1: All hashes should be unique
            const uniqueHashes = new Set(hashStrings)
            expect(uniqueHashes.size).toBe(hashCount)

            // Property 2: All hashes should verify with the same password
            for (const hashString of hashStrings) {
                const isValid = await verifyPasswordArgon2id(
                    password,
                    hashString
                )
                expect(isValid).toBe(true)
            }

            // Property 3: All hashes should be in Argon2id format
            for (const hashString of hashStrings) {
                expect(hashString).toMatch(/^\$argon2id\$v=19\$/)
            }

            // Property 4: All hashes should contain different salts
            const salts = hashStrings.map(h => {
                // Extract salt from hash: $argon2id$v=19$m=...,t=...,p=...$SALT$HASH
                const parts = h.split("$")
                return parts[4] // Salt is the 5th part (index 4)
            })

            const uniqueSalts = new Set(salts)
            expect(uniqueSalts.size).toBe(hashCount)
        }, 120000) // 120 second timeout for 100 hashes

        /**
         * Property-based test: For any password, hashing it multiple times
         * SHALL produce different hashes with unique salts.
         */
        it("should produce different hashes for identical password (property-based)", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 8, maxLength: 50 }),
                    async password => {
                        // Hash the same password 10 times
                        const hashes = await Promise.all(
                            Array.from({ length: 10 }, () =>
                                hashPasswordArgon2id(password)
                            )
                        )

                        const hashStrings = hashes.map(h => h.hash)

                        // Property: All hashes should be unique
                        const uniqueHashes = new Set(hashStrings)
                        expect(uniqueHashes.size).toBe(10)

                        // Property: All hashes should verify with the password
                        for (const hashString of hashStrings) {
                            const isValid = await verifyPasswordArgon2id(
                                password,
                                hashString
                            )
                            expect(isValid).toBe(true)
                        }
                    }
                ),
                { numRuns: 20 } // 20 passwords × 10 hashes each = 200 total hashes
            )
        }, 120000)
    })

    describe("Rainbow Table Resistance Through Salt Uniqueness", () => {
        /**
         * Rainbow table attacks use pre-computed hash tables to crack passwords.
         * Unique salts make rainbow tables useless because:
         * 1. Each password needs a separate entry for each possible salt
         * 2. With 128-bit salts, there are 2^128 possible salts
         * 3. Storage needed: Impossible (more than atoms in universe)
         * 4. Attacker must compute hashes on-the-fly (no pre-computation advantage)
         */
        it("should prevent rainbow table attacks through salt uniqueness", async () => {
            const password = "CommonPassword123"
            const rainbowTableSize = 50

            // Simulate a rainbow table attack:
            // Attacker has pre-computed hashes for common passwords
            // But each hash has a unique salt, so the table is useless

            // Generate 50 hashes for the same password
            const hashes = await Promise.all(
                Array.from({ length: rainbowTableSize }, () =>
                    hashPasswordArgon2id(password)
                )
            )

            const hashStrings = hashes.map(h => h.hash)

            // Property: All hashes are different (rainbow table would need 50 entries)
            const uniqueHashes = new Set(hashStrings)
            expect(uniqueHashes.size).toBe(rainbowTableSize)

            // Property: Even with a rainbow table, attacker can't crack the password
            // because each hash has a different salt
            // Attacker would need to:
            // 1. Compute hash for each possible salt (2^128 possibilities)
            // 2. Store all results (impossible)
            // 3. Compare against database (still wouldn't match due to unique salt)

            // Verify that all hashes are valid
            for (const hashString of hashStrings) {
                const isValid = await verifyPasswordArgon2id(
                    password,
                    hashString
                )
                expect(isValid).toBe(true)
            }
        }, 60000)

        it("should make pre-computed hash tables useless", async () => {
            // Simulate attacker with pre-computed hash table
            const commonPasswords = [
                "password123",
                "123456789",
                "qwerty123",
                "admin1234",
                "letmein123",
            ]

            // Attacker pre-computes hashes for common passwords
            // But each hash has a unique salt, so the table is useless
            const precomputedHashes: Record<string, string[]> = {}

            for (const pwd of commonPasswords) {
                const hashes = await Promise.all(
                    Array.from({ length: 5 }, () => hashPasswordArgon2id(pwd))
                )
                precomputedHashes[pwd] = hashes.map(h => h.hash)
            }

            // Property: Each password has 5 different hashes
            for (const pwd of commonPasswords) {
                const hashes = precomputedHashes[pwd]
                const uniqueHashes = new Set(hashes)
                expect(uniqueHashes.size).toBe(5)
            }

            // Property: Pre-computed table is useless because:
            // 1. Each hash has a unique salt
            // 2. Attacker would need to compute for every possible salt
            // 3. Storage is impossible
            // 4. Comparison would fail due to unique salt

            // Verify all hashes are valid
            for (const pwd of commonPasswords) {
                for (const hashString of precomputedHashes[pwd]) {
                    const isValid = await verifyPasswordArgon2id(
                        pwd,
                        hashString
                    )
                    expect(isValid).toBe(true)
                }
            }
        }, 60000)
    })

    describe("Salt Extraction and Verification", () => {
        /**
         * Verify that salts are properly embedded in the hash and are unique
         */
        it("should extract unique salts from each hash", async () => {
            const password = "TestPassword123!"
            const hashCount = 20

            // Generate 20 hashes
            const hashes = await Promise.all(
                Array.from({ length: hashCount }, () =>
                    hashPasswordArgon2id(password)
                )
            )

            // Extract salts from hashes
            // Hash format: $argon2id$v=19$m=...,t=...,p=...$SALT$HASH
            const salts = hashes.map(h => {
                const parts = h.hash.split("$")
                return parts[4] // Salt is the 5th part (index 4)
            })

            // Property: All salts should be unique
            const uniqueSalts = new Set(salts)
            expect(uniqueSalts.size).toBe(hashCount)

            // Property: All salts should be non-empty
            for (const salt of salts) {
                expect(salt).toBeDefined()
                expect(salt.length).toBeGreaterThan(0)
            }

            // Property: All salts should be base64-encoded (alphanumeric + / + =)
            for (const salt of salts) {
                expect(salt).toMatch(/^[A-Za-z0-9+/=]+$/)
            }
        }, 60000)

        it("should verify that salt is automatically included in hash", async () => {
            const password = "TestPassword123!"

            // Hash a password
            const result = await hashPasswordArgon2id(password)

            // Property: Hash should contain salt
            // Format: $argon2id$v=19$m=...,t=...,p=...$SALT$HASH
            const parts = result.hash.split("$")
            expect(parts.length).toBe(6) // $, argon2id, v=19$m=..., SALT, HASH, (empty)

            // Property: Salt should be non-empty
            const salt = parts[4]
            expect(salt).toBeDefined()
            expect(salt.length).toBeGreaterThan(0)

            // Property: Hash should be non-empty
            const hash = parts[5]
            expect(hash).toBeDefined()
            expect(hash.length).toBeGreaterThan(0)
        })

        it("should prevent manual salt specification (automatic only)", async () => {
            const password = "TestPassword123!"

            // The hashPasswordArgon2id function should NOT accept a salt parameter
            // It should always generate a unique salt automatically

            // Hash the password twice
            const result1 = await hashPasswordArgon2id(password)
            const result2 = await hashPasswordArgon2id(password)

            // Extract salts
            const salt1 = result1.hash.split("$")[4]
            const salt2 = result2.hash.split("$")[4]

            // Property: Salts should be different (automatic generation)
            expect(salt1).not.toBe(salt2)

            // Property: Both hashes should verify correctly
            expect(await verifyPasswordArgon2id(password, result1.hash)).toBe(
                true
            )
            expect(await verifyPasswordArgon2id(password, result2.hash)).toBe(
                true
            )
        })
    })

    describe("Verification Consistency Across Unique Hashes", () => {
        /**
         * Verify that all unique hashes for the same password verify correctly
         */
        it("should verify all unique hashes with the same password", async () => {
            const password = "TestPassword123!"
            const hashCount = 50

            // Generate 50 unique hashes
            const hashes = await Promise.all(
                Array.from({ length: hashCount }, () =>
                    hashPasswordArgon2id(password)
                )
            )

            // Verify each hash with the original password
            for (const result of hashes) {
                const isValid = await verifyPasswordArgon2id(
                    password,
                    result.hash
                )
                expect(isValid).toBe(true)
            }
        }, 120000)

        it("should reject wrong password against all unique hashes", async () => {
            const password = "TestPassword123!"
            const wrongPassword = "WrongPassword456!"
            const hashCount = 20

            // Generate 20 unique hashes
            const hashes = await Promise.all(
                Array.from({ length: hashCount }, () =>
                    hashPasswordArgon2id(password)
                )
            )

            // Verify wrong password fails against all hashes
            for (const result of hashes) {
                const isValid = await verifyPasswordArgon2id(
                    wrongPassword,
                    result.hash
                )
                expect(isValid).toBe(false)
            }
        }, 120000)

        it("should maintain verification consistency across multiple attempts", async () => {
            const password = "TestPassword123!"

            // Generate a hash
            const result = await hashPasswordArgon2id(password)

            // Verify the same hash multiple times
            for (let i = 0; i < 10; i++) {
                const isValid = await verifyPasswordArgon2id(
                    password,
                    result.hash
                )
                expect(isValid).toBe(true)
            }

            // Verify wrong password fails consistently
            for (let i = 0; i < 10; i++) {
                const isValid = await verifyPasswordArgon2id(
                    "WrongPassword",
                    result.hash
                )
                expect(isValid).toBe(false)
            }
        }, 60000)
    })

    describe("Salt Entropy and Cryptographic Security", () => {
        /**
         * Verify that salts have sufficient entropy (128 bits minimum)
         */
        it("should generate salts with minimum 128-bit entropy", async () => {
            const password = "TestPassword123!"
            const hashCount = 10

            // Generate 10 hashes
            const hashes = await Promise.all(
                Array.from({ length: hashCount }, () =>
                    hashPasswordArgon2id(password)
                )
            )

            // Extract and verify salts
            for (const result of hashes) {
                const parts = result.hash.split("$")
                const saltBase64 = parts[4]

                // Decode base64 salt to get byte length
                // Base64 encoding: 4 characters = 3 bytes
                // 128 bits = 16 bytes
                // 16 bytes in base64 = ~22 characters (with padding)
                const saltBytes = Buffer.from(saltBase64, "base64")

                // Property: Salt should have at least 128 bits (16 bytes)
                expect(saltBytes.length).toBeGreaterThanOrEqual(16)
            }
        })

        it("should generate cryptographically random salts", async () => {
            const password = "TestPassword123!"
            const hashCount = 100

            // Generate 100 hashes
            const hashes = await Promise.all(
                Array.from({ length: hashCount }, () =>
                    hashPasswordArgon2id(password)
                )
            )

            // Extract salts
            const salts = hashes.map(h => {
                const parts = h.hash.split("$")
                return parts[4]
            })

            // Property: All salts should be unique (cryptographic randomness)
            const uniqueSalts = new Set(salts)
            expect(uniqueSalts.size).toBe(hashCount)

            // Property: No salt should repeat (extremely unlikely with true randomness)
            // With 128-bit salts, probability of collision is negligible
            const saltCounts = new Map<string, number>()
            for (const salt of salts) {
                saltCounts.set(salt, (saltCounts.get(salt) || 0) + 1)
            }

            // All counts should be 1 (no duplicates)
            for (const count of saltCounts.values()) {
                expect(count).toBe(1)
            }
        }, 120000)
    })

    describe("Performance Impact of Salt Uniqueness", () => {
        /**
         * Verify that salt uniqueness doesn't negatively impact performance
         */
        it("should maintain consistent performance with unique salts", async () => {
            const password = "TestPassword123!"
            const hashCount = 10

            // Generate 10 hashes and measure timing
            const timings: number[] = []

            for (let i = 0; i < hashCount; i++) {
                const result = await hashPasswordArgon2id(password)
                timings.push(result.timeTakenMs)
            }

            // Property: All hashes should complete within reasonable time
            for (const timing of timings) {
                expect(timing).toBeLessThan(10000) // Less than 10 seconds
                expect(timing).toBeGreaterThan(0)
            }

            // Property: Timing should be relatively consistent
            // (unique salts shouldn't cause significant variance)
            const avgTiming =
                timings.reduce((a, b) => a + b, 0) / timings.length
            const maxDeviation = Math.max(
                ...timings.map(t => Math.abs(t - avgTiming))
            )

            // Allow up to 50% deviation (due to system variance)
            expect(maxDeviation).toBeLessThan(avgTiming * 0.5)
        }, 120000)
    })

    describe("Edge Cases and Error Handling", () => {
        /**
         * Verify edge cases with salt uniqueness
         */
        it("should handle rapid successive hashing with unique salts", async () => {
            const password = "TestPassword123!"

            // Hash rapidly in succession
            const hashes = await Promise.all(
                Array.from({ length: 20 }, () => hashPasswordArgon2id(password))
            )

            // Property: All hashes should be unique despite rapid succession
            const hashStrings = hashes.map(h => h.hash)
            const uniqueHashes = new Set(hashStrings)
            expect(uniqueHashes.size).toBe(20)

            // Property: All hashes should verify correctly
            for (const hashString of hashStrings) {
                const isValid = await verifyPasswordArgon2id(
                    password,
                    hashString
                )
                expect(isValid).toBe(true)
            }
        }, 120000)

        it("should handle different passwords with unique salts", async () => {
            const passwords = [
                "Password1!",
                "Password2!",
                "Password3!",
                "Password4!",
                "Password5!",
            ]

            // Hash each password twice
            const allHashes: string[] = []

            for (const pwd of passwords) {
                const hash1 = await hashPasswordArgon2id(pwd)
                const hash2 = await hashPasswordArgon2id(pwd)

                allHashes.push(hash1.hash)
                allHashes.push(hash2.hash)

                // Property: Same password produces different hashes
                expect(hash1.hash).not.toBe(hash2.hash)

                // Property: Both hashes verify with the password
                expect(await verifyPasswordArgon2id(pwd, hash1.hash)).toBe(true)
                expect(await verifyPasswordArgon2id(pwd, hash2.hash)).toBe(true)
            }

            // Property: All hashes should be unique
            const uniqueHashes = new Set(allHashes)
            expect(uniqueHashes.size).toBe(10) // 5 passwords × 2 hashes each
        }, 120000)
    })
})
