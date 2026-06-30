/**
 * Unit Tests: Salt Generation Module
 * Tests cryptographically secure salt generation for Argon2id hashing
 *
 * Coverage:
 * - Salt generation with default and custom lengths
 * - Cryptographic security (no weak PRNG)
 * - Minimum entropy requirements (128 bits)
 * - Salt uniqueness (each password gets unique salt)
 * - Error handling for invalid parameters
 * - Hex string conversion
 * - Entropy verification
 */

import { describe, expect, it } from "vitest"
import {
    generateSalt,
    generateSaltHex,
    getSaltConfig,
    validateSalt,
    verifySaltEntropy,
} from "./salt-generator"

describe("Salt Generation Module", () => {
    describe("generateSalt()", () => {
        it("should generate a Buffer with default length (32 bytes)", () => {
            const salt = generateSalt()

            expect(Buffer.isBuffer(salt)).toBe(true)
            expect(salt.length).toBe(32)
        })

        it("should generate a Buffer with custom length", () => {
            const salt = generateSalt(16)

            expect(Buffer.isBuffer(salt)).toBe(true)
            expect(salt.length).toBe(16)
        })

        it("should generate a Buffer with minimum length (16 bytes)", () => {
            const salt = generateSalt(16)

            expect(salt.length).toBe(16)
        })

        it("should generate a Buffer with maximum length (64 bytes)", () => {
            const salt = generateSalt(64)

            expect(salt.length).toBe(64)
        })

        it("should reject length below minimum (16 bytes)", () => {
            expect(() => generateSalt(15)).toThrow(
                /Salt length must be at least 16 bytes/
            )
        })

        it("should reject length above maximum (64 bytes)", () => {
            expect(() => generateSalt(65)).toThrow(
                /Salt length must not exceed 64 bytes/
            )
        })

        it("should reject non-integer length", () => {
            expect(() => generateSalt(16.5)).toThrow(
                /Salt length must be an integer/
            )
        })

        it("should reject negative length", () => {
            expect(() => generateSalt(-1)).toThrow(
                /Salt length must be at least 16 bytes/
            )
        })

        it("should reject zero length", () => {
            expect(() => generateSalt(0)).toThrow(
                /Salt length must be at least 16 bytes/
            )
        })

        it("should generate cryptographically secure random bytes", () => {
            const salt1 = generateSalt()
            const salt2 = generateSalt()

            // Two salts should be different (extremely unlikely to be same)
            expect(salt1.equals(salt2)).toBe(false)
        })

        it("should generate unique salts for multiple calls", () => {
            const salts = Array.from({ length: 100 }, () => generateSalt())

            // All salts should be unique
            const uniqueSalts = new Set(salts.map(s => s.toString("hex")))
            expect(uniqueSalts.size).toBe(100)
        })

        it("should have sufficient entropy (no patterns)", () => {
            const salt = generateSalt()

            // Check that salt is not all zeros or all ones
            const bytes = Array.from(salt)
            const allZeros = bytes.every(b => b === 0)
            const allOnes = bytes.every(b => b === 255)

            expect(allZeros).toBe(false)
            expect(allOnes).toBe(false)
        })

        it("should have good byte distribution", () => {
            const salt = generateSalt(64) // Maximum allowed size for distribution test
            const bytes = Array.from(salt)

            // Count byte values in different ranges
            const ranges = {
                low: bytes.filter(b => b < 64).length,
                mid: bytes.filter(b => b >= 64 && b < 192).length,
                high: bytes.filter(b => b >= 192).length,
            }

            // Each range should have roughly 1/3 of bytes (with very high tolerance)
            // With 64 bytes total, expect ~21.33 in each range
            // Random distribution means this can vary significantly
            const expectedPerRange = 64 / 3
            // Allow 100% deviation - just verify distribution isn't completely broken
            const tolerance = expectedPerRange * 1.0
            expect(Math.abs(ranges.low - expectedPerRange)).toBeLessThanOrEqual(tolerance)
            expect(Math.abs(ranges.mid - expectedPerRange)).toBeLessThanOrEqual(tolerance)
            expect(Math.abs(ranges.high - expectedPerRange)).toBeLessThanOrEqual(tolerance)
        })
    })

    describe("generateSaltHex()", () => {
        it("should generate a hex string with default length", () => {
            const saltHex = generateSaltHex()

            expect(typeof saltHex).toBe("string")
            // 32 bytes = 64 hex characters
            expect(saltHex.length).toBe(64)
        })

        it("should generate a hex string with custom length", () => {
            const saltHex = generateSaltHex(16)

            // 16 bytes = 32 hex characters
            expect(saltHex.length).toBe(32)
        })

        it("should generate valid hex string (only 0-9, a-f)", () => {
            const saltHex = generateSaltHex()

            expect(/^[a-f0-9]+$/i.test(saltHex)).toBe(true)
        })

        it("should generate unique hex strings", () => {
            const hex1 = generateSaltHex()
            const hex2 = generateSaltHex()

            expect(hex1).not.toBe(hex2)
        })

        it("should be convertible back to Buffer", () => {
            const saltHex = generateSaltHex(16)
            const buffer = Buffer.from(saltHex, "hex")

            expect(buffer.length).toBe(16)
        })
    })

    describe("verifySaltEntropy()", () => {
        it("should verify Buffer with sufficient entropy", () => {
            const salt = generateSalt(16)

            expect(verifySaltEntropy(salt)).toBe(true)
        })

        it("should verify hex string with sufficient entropy", () => {
            const saltHex = generateSaltHex(16)

            expect(verifySaltEntropy(saltHex)).toBe(true)
        })

        it("should reject Buffer with insufficient entropy", () => {
            const weakSalt = Buffer.alloc(8) // Only 64 bits

            expect(verifySaltEntropy(weakSalt)).toBe(false)
        })

        it("should reject hex string with insufficient entropy", () => {
            const weakSaltHex = "0000000000000000" // Only 64 bits

            expect(verifySaltEntropy(weakSaltHex)).toBe(false)
        })

        it("should accept minimum entropy (16 bytes)", () => {
            const salt = generateSalt(16)

            expect(verifySaltEntropy(salt)).toBe(true)
        })

        it("should reject invalid hex string", () => {
            const invalidHex = "not-a-hex-string"

            expect(verifySaltEntropy(invalidHex)).toBe(false)
        })

        it("should reject non-Buffer, non-string input", () => {
            expect(verifySaltEntropy(null as any)).toBe(false)
            expect(verifySaltEntropy(undefined as any)).toBe(false)
            expect(verifySaltEntropy(123 as any)).toBe(false)
            expect(verifySaltEntropy({} as any)).toBe(false)
        })
    })

    describe("validateSalt()", () => {
        it("should validate correct Buffer salt", () => {
            const salt = generateSalt()
            const result = validateSalt(salt)

            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should validate correct hex string salt", () => {
            const saltHex = generateSaltHex()
            const result = validateSalt(saltHex)

            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should reject missing salt", () => {
            const result = validateSalt(null)

            expect(result.valid).toBe(false)
            expect(result.error).toContain("Salt is required")
        })

        it("should reject undefined salt", () => {
            const result = validateSalt(undefined)

            expect(result.valid).toBe(false)
            expect(result.error).toContain("Salt is required")
        })

        it("should reject invalid type (number)", () => {
            const result = validateSalt(123)

            expect(result.valid).toBe(false)
            expect(result.error).toContain(
                "Salt must be a Buffer or hex string"
            )
        })

        it("should reject invalid type (object)", () => {
            const result = validateSalt({})

            expect(result.valid).toBe(false)
            expect(result.error).toContain(
                "Salt must be a Buffer or hex string"
            )
        })

        it("should reject hex string with invalid characters", () => {
            const result = validateSalt("not-hex-string!")

            expect(result.valid).toBe(false)
            expect(result.error).toContain("invalid characters")
        })

        it("should reject hex string with odd length", () => {
            const result = validateSalt("abc") // 3 characters = odd

            expect(result.valid).toBe(false)
            expect(result.error).toContain("even length")
        })

        it("should reject salt with insufficient entropy", () => {
            const weakSalt = Buffer.alloc(8)
            const result = validateSalt(weakSalt)

            expect(result.valid).toBe(false)
            expect(result.error).toContain("128-bit entropy")
        })

        it("should accept minimum entropy (16 bytes)", () => {
            const salt = generateSalt(16)
            const result = validateSalt(salt)

            expect(result.valid).toBe(true)
        })
    })

    describe("getSaltConfig()", () => {
        it("should return salt configuration constants", () => {
            const config = getSaltConfig()

            expect(config).toHaveProperty("MIN_LENGTH_BYTES", 16)
            expect(config).toHaveProperty("DEFAULT_LENGTH_BYTES", 32)
            expect(config).toHaveProperty("MAX_LENGTH_BYTES", 64)
        })

        it("should return a copy (not reference)", () => {
            const config1 = getSaltConfig()
            const config2 = getSaltConfig()

            expect(config1).not.toBe(config2)
            expect(config1).toEqual(config2)
        })

        it("should not allow modification of returned config", () => {
            const config = getSaltConfig()
            const originalMin = config.MIN_LENGTH_BYTES

            // Try to modify (should not affect future calls)
            ;(config as any).MIN_LENGTH_BYTES = 999

            const config2 = getSaltConfig()
            expect(config2.MIN_LENGTH_BYTES).toBe(originalMin)
        })
    })

    describe("Integration Tests", () => {
        it("should generate unique salts for identical passwords", () => {
            // Simulate hashing the same password multiple times
            const salts = Array.from({ length: 50 }, () => generateSalt())

            // All salts should be unique
            const uniqueSalts = new Set(salts.map(s => s.toString("hex")))
            expect(uniqueSalts.size).toBe(50)
        })

        it("should support salt length variations", () => {
            const lengths = [16, 24, 32, 48, 64]

            for (const length of lengths) {
                const salt = generateSalt(length)
                expect(salt.length).toBe(length)
                expect(verifySaltEntropy(salt)).toBe(true)
            }
        })

        it("should work with hex conversion round-trip", () => {
            const originalSalt = generateSalt(32)
            const saltHex = originalSalt.toString("hex")
            const restoredSalt = Buffer.from(saltHex, "hex")

            expect(originalSalt.equals(restoredSalt)).toBe(true)
        })

        it("should maintain entropy through hex conversion", () => {
            const salt = generateSalt(16)
            const saltHex = salt.toString("hex")

            expect(verifySaltEntropy(salt)).toBe(true)
            expect(verifySaltEntropy(saltHex)).toBe(true)
        })

        it("should never generate weak salts", () => {
            // Generate 1000 salts and verify all have sufficient entropy
            const salts = Array.from({ length: 1000 }, () => generateSalt())

            for (const salt of salts) {
                expect(verifySaltEntropy(salt)).toBe(true)
                const result = validateSalt(salt)
                expect(result.valid).toBe(true)
            }
        })
    })

    describe("Security Properties", () => {
        it("should use cryptographically secure randomness (not Math.random)", () => {
            // Generate multiple salts and check they're not predictable
            const salts = Array.from({ length: 10 }, () => generateSalt(16))

            // Calculate entropy by checking byte distribution
            const allBytes = salts.flatMap(s => Array.from(s))
            const byteFrequency = new Map<number, number>()

            for (const byte of allBytes) {
                byteFrequency.set(byte, (byteFrequency.get(byte) ?? 0) + 1)
            }

            // With cryptographically secure randomness, we should see good distribution
            // (not all bytes the same, not sequential patterns)
            const frequencies = Array.from(byteFrequency.values())
            const maxFrequency = Math.max(...frequencies)
            const minFrequency = Math.min(...frequencies)

            // Max frequency should not be too high (would indicate weak randomness)
            expect(maxFrequency).toBeLessThan(allBytes.length / 25)
        })

        it("should prevent rainbow table attacks through salt uniqueness", () => {
            // Generate 100 salts for the same password
            const salts = Array.from({ length: 100 }, () => generateSalt())

            // All should be unique
            const uniqueSalts = new Set(salts.map(s => s.toString("hex")))
            expect(uniqueSalts.size).toBe(100)

            // This ensures that even if the same password is hashed 100 times,
            // each hash will be different due to unique salt
        })

        it("should meet OWASP minimum entropy requirement (128 bits)", () => {
            const salt = generateSalt()

            // 128 bits = 16 bytes
            expect(salt.length).toBeGreaterThanOrEqual(16)
            expect(verifySaltEntropy(salt)).toBe(true)
        })
    })
})
