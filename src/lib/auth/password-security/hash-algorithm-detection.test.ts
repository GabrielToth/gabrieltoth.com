/**
 * Unit Tests: Hash Algorithm Detection
 * Tests: detectHashAlgorithm, isArgon2idHashFormat, isBcryptHashFormat, getAlgorithmDescription
 *
 * Validates: Requirements 5.1, 5.2, 6.4, 8.4, 8.5
 */

import { describe, expect, it } from "vitest"
import {
    detectHashAlgorithm,
    getAlgorithmDescription,
    isArgon2idHashFormat,
    isBcryptHashFormat,
} from "./hash-algorithm-detection"

describe("Hash Algorithm Detection", () => {
    describe("detectHashAlgorithm - Argon2id Detection", () => {
        it("should detect valid Argon2id hash", () => {
            const hash =
                "$argon2id$v=19$m=64000,t=3,p=2$abcdefghijklmnop$0123456789abcdef0123456789abcdef"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("argon2id")
            expect(result.version).toBe(19)
            expect(result.isValid).toBe(true)
            expect(result.reason).toContain("Valid Argon2id")
        })

        it("should detect Argon2id with different memory parameters", () => {
            const hash =
                "$argon2id$v=19$m=128000,t=4,p=3$salt1234567890ab$hash1234567890abcdef1234567890ab"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("argon2id")
            expect(result.version).toBe(19)
            expect(result.isValid).toBe(true)
        })

        it("should detect Argon2id with minimum parameters", () => {
            const hash =
                "$argon2id$v=19$m=16000,t=2,p=1$salt$hash1234567890abcdef1234567890ab"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("argon2id")
            expect(result.version).toBe(19)
            expect(result.isValid).toBe(true)
        })

        it("should detect Argon2id with maximum parameters", () => {
            const hash =
                "$argon2id$v=19$m=262144,t=10,p=4$salt1234567890ab$hash1234567890abcdef1234567890ab"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("argon2id")
            expect(result.version).toBe(19)
            expect(result.isValid).toBe(true)
        })

        it("should be case-insensitive for Argon2id detection", () => {
            const hashes = [
                "$ARGON2ID$V=19$M=64000,T=3,P=2$salt$hash",
                "$Argon2id$v=19$m=64000,t=3,p=2$salt$hash",
                "$argon2id$V=19$M=64000,T=3,P=2$salt$hash",
            ]

            hashes.forEach(hash => {
                const result = detectHashAlgorithm(hash)
                expect(result.algorithm).toBe("argon2id")
                expect(result.version).toBe(19)
            })
        })

        it("should detect malformed Argon2id (missing parameters)", () => {
            const hash = "$argon2id$v=19$salt$hash"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("argon2id")
            expect(result.version).toBe(19)
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("incomplete")
        })

        it("should detect incomplete Argon2id (missing hash)", () => {
            const hash = "$argon2id$v=19$m=64000,t=3,p=2$salt"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("argon2id")
            expect(result.version).toBe(19)
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("incomplete")
        })

        it("should detect Argon2id with long salt and hash", () => {
            const longSalt = "a".repeat(32)
            const longHash = "b".repeat(64)
            const hash = `$argon2id$v=19$m=64000,t=3,p=2$${longSalt}$${longHash}`
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("argon2id")
            expect(result.version).toBe(19)
            expect(result.isValid).toBe(true)
        })
    })

    describe("detectHashAlgorithm - Bcrypt Detection", () => {
        it("should detect valid Bcrypt $2a$ hash", () => {
            const hash =
                "$2a$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(true)
            expect(result.reason).toContain("Valid Bcrypt")
        })

        it("should detect valid Bcrypt $2b$ hash", () => {
            const hash =
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(true)
        })

        it("should detect valid Bcrypt $2y$ hash", () => {
            const hash =
                "$2y$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(true)
        })

        it("should detect valid Bcrypt $2x$ hash", () => {
            const hash =
                "$2x$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(true)
        })

        it("should detect Bcrypt with different cost factors", () => {
            const costs = ["04", "06", "10", "12", "14"]

            costs.forEach(cost => {
                const hash = `$2b$${cost}$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST`
                const result = detectHashAlgorithm(hash)

                expect(result.algorithm).toBe("bcrypt")
                expect(result.version).toBe(2)
                expect(result.isValid).toBe(true)
            })
        })

        it("should be case-insensitive for Bcrypt detection", () => {
            const hashes = [
                "$2A$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
                "$2B$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
            ]

            hashes.forEach(hash => {
                const result = detectHashAlgorithm(hash)
                expect(result.algorithm).toBe("bcrypt")
                expect(result.version).toBe(2)
            })
        })

        it("should detect incomplete Bcrypt (too short)", () => {
            const hash = "$2b$12$abcdefghijklmnopqrstuvwxyz"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("incomplete")
        })

        it("should detect standard Bcrypt length (60 characters)", () => {
            // Standard bcrypt hash is exactly 60 characters
            const hash = "$2b$12$" + "a".repeat(53) // 7 + 53 = 60
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(true)
        })

        it("should detect Bcrypt with longer hash", () => {
            const hash = "$2b$12$" + "a".repeat(100)
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(true)
        })
    })

    describe("detectHashAlgorithm - Edge Cases", () => {
        it("should handle null input", () => {
            const result = detectHashAlgorithm(null)

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("null or undefined")
        })

        it("should handle undefined input", () => {
            const result = detectHashAlgorithm(undefined)

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("null or undefined")
        })

        it("should handle empty string", () => {
            const result = detectHashAlgorithm("")

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("empty string")
        })

        it("should handle non-string input (number)", () => {
            const result = detectHashAlgorithm(12345)

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("must be a string")
        })

        it("should handle non-string input (object)", () => {
            const result = detectHashAlgorithm({ hash: "test" })

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("must be a string")
        })

        it("should handle non-string input (array)", () => {
            const result = detectHashAlgorithm(["$2b$12$..."])

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("must be a string")
        })

        it("should handle non-string input (boolean)", () => {
            const result = detectHashAlgorithm(true)

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain("must be a string")
        })

        it("should handle completely unknown format", () => {
            const result = detectHashAlgorithm("not_a_hash_at_all")

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
            expect(result.reason).toContain(
                "does not match any known algorithm"
            )
        })

        it("should handle hash starting with $ but wrong format", () => {
            const result = detectHashAlgorithm("$invalid$format$here")

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        })

        it("should handle MD5-like hash", () => {
            const result = detectHashAlgorithm(
                "5d41402abc4b2a76b9719d911017c592"
            )

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        })

        it("should handle SHA256-like hash", () => {
            const result = detectHashAlgorithm(
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            )

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        })

        it("should handle hash with whitespace", () => {
            const result = detectHashAlgorithm("$2b$12$abc def")

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        })

        it("should handle hash with newlines", () => {
            const result = detectHashAlgorithm("$2b$12$abc\ndef")

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        })

        it("should handle very long unknown string", () => {
            const result = detectHashAlgorithm("a".repeat(1000))

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        })

        it("should handle single character", () => {
            const result = detectHashAlgorithm("$")

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        })

        it("should handle Bcrypt-like but invalid cost", () => {
            const result = detectHashAlgorithm(
                "$2b$ab$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            )

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        })

        it("should handle Bcrypt-like but invalid variant", () => {
            const result = detectHashAlgorithm(
                "$2c$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            )

            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        })
    })

    describe("detectHashAlgorithm - Return Type Validation", () => {
        it("should always return HashAlgorithmDetectionResult", () => {
            const result = detectHashAlgorithm("$2b$12$abc")

            expect(result).toHaveProperty("algorithm")
            expect(result).toHaveProperty("isValid")
            expect(result).toHaveProperty("reason")
            expect(result).toHaveProperty("version")
        })

        it("should have algorithm as one of the expected values", () => {
            const testCases = [
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash",
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
                "unknown_hash",
                null,
            ]

            testCases.forEach(hash => {
                const result = detectHashAlgorithm(hash)
                expect(["argon2id", "bcrypt", "unknown"]).toContain(
                    result.algorithm
                )
            })
        })

        it("should have isValid as boolean", () => {
            const testCases = [
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash",
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
                "unknown_hash",
            ]

            testCases.forEach(hash => {
                const result = detectHashAlgorithm(hash)
                expect(typeof result.isValid).toBe("boolean")
            })
        })

        it("should have reason as non-empty string", () => {
            const testCases = [
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash",
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
                "unknown_hash",
            ]

            testCases.forEach(hash => {
                const result = detectHashAlgorithm(hash)
                expect(typeof result.reason).toBe("string")
                expect(result.reason.length).toBeGreaterThan(0)
            })
        })

        it("should have version only for known algorithms", () => {
            const argon2Result = detectHashAlgorithm(
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash"
            )
            expect(argon2Result.version).toBe(19)

            const bcryptResult = detectHashAlgorithm(
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            )
            expect(bcryptResult.version).toBe(2)

            const unknownResult = detectHashAlgorithm("unknown_hash")
            expect(unknownResult.version).toBeUndefined()
        })
    })

    describe("isArgon2idHashFormat - Convenience Function", () => {
        it("should return true for valid Argon2id hash", () => {
            const hash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash1234567890abcdef1234567890ab"
            expect(isArgon2idHashFormat(hash)).toBe(true)
        })

        it("should return false for invalid Argon2id hash", () => {
            const hash = "$argon2id$v=19$salt$hash"
            expect(isArgon2idHashFormat(hash)).toBe(false)
        })

        it("should return false for Bcrypt hash", () => {
            const hash =
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            expect(isArgon2idHashFormat(hash)).toBe(false)
        })

        it("should return false for unknown format", () => {
            expect(isArgon2idHashFormat("unknown_hash")).toBe(false)
        })

        it("should return false for null", () => {
            expect(isArgon2idHashFormat(null)).toBe(false)
        })

        it("should return false for undefined", () => {
            expect(isArgon2idHashFormat(undefined)).toBe(false)
        })

        it("should return false for empty string", () => {
            expect(isArgon2idHashFormat("")).toBe(false)
        })
    })

    describe("isBcryptHashFormat - Convenience Function", () => {
        it("should return true for valid Bcrypt $2a$ hash", () => {
            const hash =
                "$2a$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            expect(isBcryptHashFormat(hash)).toBe(true)
        })

        it("should return true for valid Bcrypt $2b$ hash", () => {
            const hash =
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            expect(isBcryptHashFormat(hash)).toBe(true)
        })

        it("should return true for valid Bcrypt $2y$ hash", () => {
            const hash =
                "$2y$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            expect(isBcryptHashFormat(hash)).toBe(true)
        })

        it("should return true for valid Bcrypt $2x$ hash", () => {
            const hash =
                "$2x$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            expect(isBcryptHashFormat(hash)).toBe(true)
        })

        it("should return false for invalid Bcrypt hash (too short)", () => {
            const hash = "$2b$12$abc"
            expect(isBcryptHashFormat(hash)).toBe(false)
        })

        it("should return false for Argon2id hash", () => {
            const hash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash1234567890abcdef1234567890ab"
            expect(isBcryptHashFormat(hash)).toBe(false)
        })

        it("should return false for unknown format", () => {
            expect(isBcryptHashFormat("unknown_hash")).toBe(false)
        })

        it("should return false for null", () => {
            expect(isBcryptHashFormat(null)).toBe(false)
        })

        it("should return false for undefined", () => {
            expect(isBcryptHashFormat(undefined)).toBe(false)
        })

        it("should return false for empty string", () => {
            expect(isBcryptHashFormat("")).toBe(false)
        })
    })

    describe("getAlgorithmDescription - Human-Readable Output", () => {
        it("should return description for Argon2id", () => {
            const hash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash1234567890abcdef1234567890ab"
            const description = getAlgorithmDescription(hash)

            expect(description).toContain("Argon2id")
            expect(description).toContain("19")
        })

        it("should return description for Bcrypt", () => {
            const hash =
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            const description = getAlgorithmDescription(hash)

            expect(description).toContain("Bcrypt")
            expect(description).toContain("2")
        })

        it("should return description for unknown", () => {
            const description = getAlgorithmDescription("unknown_hash")

            expect(description).toContain("Unknown")
        })

        it("should return description for null", () => {
            const description = getAlgorithmDescription(null)

            expect(description).toContain("Unknown")
        })

        it("should return description for undefined", () => {
            const description = getAlgorithmDescription(undefined)

            expect(description).toContain("Unknown")
        })
    })

    describe("Real-World Hash Examples", () => {
        it("should detect real Argon2id hash from argon2-cli", () => {
            // Real hash generated by argon2-cli
            const hash =
                "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObzlvQcozIQv9c"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("argon2id")
            expect(result.version).toBe(19)
            expect(result.isValid).toBe(true)
        })

        it("should detect real Bcrypt hash from bcryptjs", () => {
            // Real hash generated by bcryptjs
            const hash =
                "$2b$10$nOUIs5kJ7naTuTFkBy1Be.PRZQl/qxWXInGA4aBUW3CjjF3XGm2Oi"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(true)
        })

        it("should detect real Bcrypt hash with $2a$ variant", () => {
            const hash =
                "$2a$10$nOUIs5kJ7naTuTFkBy1Be.PRZQl/qxWXInGA4aBUW3CjjF3XGm2Oi"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(true)
        })

        it("should detect real Bcrypt hash with $2y$ variant", () => {
            const hash =
                "$2y$10$nOUIs5kJ7naTuTFkBy1Be.PRZQl/qxWXInGA4aBUW3CjjF3XGm2Oi"
            const result = detectHashAlgorithm(hash)

            expect(result.algorithm).toBe("bcrypt")
            expect(result.version).toBe(2)
            expect(result.isValid).toBe(true)
        })
    })
})
