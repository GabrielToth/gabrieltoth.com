/**
 * Unit Tests: Hash Format Validation
 * Tests: validateHashFormat, isValidHashFormat, getGenericHashValidationError
 *
 * Validates: Requirements 8.4, 8.5, 8.8, 14.1, 14.5
 */

import { logger } from "@/lib/logger"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    getGenericHashValidationError,
    isValidHashFormat,
    validateHashFormat,
} from "./hash-format-validator"

// Mock the logger
vi.mock("@/lib/logger", () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

describe("Hash Format Validation", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("validateHashFormat - Valid Hashes", () => {
        it("should validate valid Argon2id hash", () => {
            const hash =
                "$argon2id$v=19$m=64000,t=3,p=2$abcdefghijklmnop$0123456789abcdef0123456789abcdef"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(true)
            expect(result.algorithm).toBe("argon2id")
            expect(result.isMalformed).toBe(false)
            expect(result.userMessage).toBe("Authentication failed")
            expect(logger.warn).not.toHaveBeenCalled()
        })

        it("should reject legacy Bcrypt hashes", () => {
            const hash =
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should validate Argon2id with different parameters", () => {
            const hash =
                "$argon2id$v=19$m=128000,t=4,p=3$salt1234567890ab$hash1234567890abcdef1234567890ab"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(true)
            expect(result.algorithm).toBe("argon2id")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).not.toHaveBeenCalled()
        })

        it("should validate Argon2id with minimum parameters", () => {
            const hash =
                "$argon2id$v=19$m=16000,t=2,p=1$salt$hash1234567890abcdef1234567890ab"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(true)
            expect(result.algorithm).toBe("argon2id")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).not.toHaveBeenCalled()
        })

        it("should validate Argon2id with maximum parameters", () => {
            const hash =
                "$argon2id$v=19$m=262144,t=10,p=4$salt1234567890ab$hash1234567890abcdef1234567890ab"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(true)
            expect(result.algorithm).toBe("argon2id")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).not.toHaveBeenCalled()
        })
    })

    describe("validateHashFormat - Malformed Hashes", () => {
        it("should reject malformed Argon2id (missing parameters)", () => {
            const hash = "$argon2id$v=19$salt$hash"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("argon2id")
            expect(result.isMalformed).toBe(true)
            expect(result.userMessage).toBe("Authentication failed")
            expect(logger.warn).toHaveBeenCalledWith(
                "Malformed password hash detected",
                expect.objectContaining({
                    context: "HashFormatValidator",
                    data: expect.objectContaining({
                        algorithm: "argon2id",
                        isMalformed: true,
                    }),
                })
            )
        })

        it("should reject incomplete Argon2id (missing hash)", () => {
            const hash = "$argon2id$v=19$m=64000,t=3,p=2$salt"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("argon2id")
            expect(result.isMalformed).toBe(true)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject incomplete legacy Bcrypt (too short)", () => {
            const hash = "$2b$12$abcdefghijklmnopqrstuvwxyz"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should log malformed hash without exposing full hash", () => {
            const hash = "$argon2id$v=19$salt$hash"
            validateHashFormat(hash)

            expect(logger.warn).toHaveBeenCalledWith(
                "Malformed password hash detected",
                expect.objectContaining({
                    data: expect.objectContaining({
                        hashPrefix: "$argon2id$...",
                    }),
                })
            )

            // Verify full hash is not in the log
            const callArgs = (logger.warn as any).mock.calls[0]
            const logData = JSON.stringify(callArgs[1])
            expect(logData).not.toContain("$argon2id$v=19$salt$hash")
        })

        it("should log malformed hash with email when provided", () => {
            const hash = "$argon2id$v=19$salt$hash"
            const email = "user@example.com"
            validateHashFormat(hash, email)

            expect(logger.warn).toHaveBeenCalledWith(
                "Malformed password hash detected",
                expect.objectContaining({
                    data: expect.objectContaining({
                        email,
                    }),
                })
            )
        })

        it("should not log email when not provided", () => {
            const hash = "$argon2id$v=19$salt$hash"
            validateHashFormat(hash)

            const callArgs = (logger.warn as any).mock.calls[0]
            const logData = callArgs[1].data
            expect(logData).not.toHaveProperty("email")
        })

        it("should truncate long hashes in logs", () => {
            // Use an invalid long hash that will be logged
            const longHash = "$invalid$" + "a".repeat(1000)
            validateHashFormat(longHash)

            expect(logger.warn).toHaveBeenCalledWith(
                "Malformed password hash detected",
                expect.objectContaining({
                    data: expect.objectContaining({
                        hashPrefix: "$invalid$a...",
                    }),
                })
            )
        })

        it("should handle non-string hash in logs", () => {
            const result = validateHashFormat(12345)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(logger.warn).toHaveBeenCalledWith(
                "Malformed password hash detected",
                expect.objectContaining({
                    data: expect.objectContaining({
                        hashPrefix: "[non-string]",
                    }),
                })
            )
        })
    })

    describe("validateHashFormat - Unknown/Invalid Hashes", () => {
        it("should reject completely unknown format", () => {
            const hash = "not_a_hash_at_all"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(result.userMessage).toBe("Authentication failed")
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject MD5-like hash", () => {
            const hash = "5d41402abc4b2a76b9719d911017c592"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject SHA256-like hash", () => {
            const hash =
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject hash with invalid Bcrypt variant", () => {
            const hash =
                "$2c$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject hash with invalid Bcrypt cost", () => {
            const hash =
                "$2b$ab$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject hash with whitespace", () => {
            const hash = "$2b$12$abc def"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject hash with newlines", () => {
            const hash = "$2b$12$abc\ndef"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })
    })

    describe("validateHashFormat - Edge Cases", () => {
        it("should reject null hash", () => {
            const result = validateHashFormat(null)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(result.userMessage).toBe("Authentication failed")
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject undefined hash", () => {
            const result = validateHashFormat(undefined)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject empty string", () => {
            const result = validateHashFormat("")

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject number input", () => {
            const result = validateHashFormat(12345)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject object input", () => {
            const result = validateHashFormat({ hash: "test" })

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject array input", () => {
            const result = validateHashFormat(["$2b$12$..."])

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject boolean input", () => {
            const result = validateHashFormat(true)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject very long unknown string", () => {
            const result = validateHashFormat("a".repeat(1000))

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })

        it("should reject single character", () => {
            const result = validateHashFormat("$")

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).toHaveBeenCalled()
        })
    })

    describe("validateHashFormat - Return Type Validation", () => {
        it("should always return HashFormatValidationResult", () => {
            const result = validateHashFormat("$2b$12$abc")

            expect(result).toHaveProperty("isValid")
            expect(result).toHaveProperty("algorithm")
            expect(result).toHaveProperty("userMessage")
            expect(result).toHaveProperty("isMalformed")
        })

        it("should have isValid as boolean", () => {
            const testCases = [
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash",
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
                "unknown_hash",
                null,
            ]

            testCases.forEach(hash => {
                const result = validateHashFormat(hash)
                expect(typeof result.isValid).toBe("boolean")
            })
        })

        it("should have algorithm as one of the expected values", () => {
            const testCases = [
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash",
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
                "unknown_hash",
                null,
            ]

            testCases.forEach(hash => {
                const result = validateHashFormat(hash)
                expect(["argon2id", "unknown"]).toContain(
                    result.algorithm
                )
            })
        })

        it("should have userMessage as non-empty string", () => {
            const testCases = [
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash",
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
                "unknown_hash",
            ]

            testCases.forEach(hash => {
                const result = validateHashFormat(hash)
                expect(typeof result.userMessage).toBe("string")
                expect(result.userMessage.length).toBeGreaterThan(0)
            })
        })

        it("should have isMalformed as boolean", () => {
            const testCases = [
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash",
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST",
                "unknown_hash",
            ]

            testCases.forEach(hash => {
                const result = validateHashFormat(hash)
                expect(typeof result.isMalformed).toBe("boolean")
            })
        })

        it("should have consistent userMessage for all invalid hashes", () => {
            const invalidHashes = [
                "$argon2id$v=19$salt$hash",
                "$2b$12$abc",
                "unknown_hash",
                null,
                undefined,
            ]

            invalidHashes.forEach(hash => {
                const result = validateHashFormat(hash)
                if (!result.isValid) {
                    expect(result.userMessage).toBe("Authentication failed")
                }
            })
        })
    })

    describe("validateHashFormat - Logging Error Handling", () => {
        it("should handle logger.warn errors gracefully", () => {
            ;(logger.warn as any).mockImplementation(() => {
                throw new Error("Logger error")
            })

            const result = validateHashFormat("invalid_hash")

            expect(result.isValid).toBe(false)
            expect(logger.error).toHaveBeenCalledWith(
                "Failed to log malformed hash attempt",
                expect.objectContaining({
                    context: "HashFormatValidator",
                })
            )
        })

        it("should not throw when logging fails", () => {
            ;(logger.warn as any).mockImplementation(() => {
                throw new Error("Logger error")
            })

            expect(() => {
                validateHashFormat("invalid_hash")
            }).not.toThrow()
        })
    })

    describe("isValidHashFormat - Convenience Function", () => {
        it("should return true for valid Argon2id hash", () => {
            const hash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt$hash1234567890abcdef1234567890ab"
            expect(isValidHashFormat(hash)).toBe(true)
        })

        it("should return false for legacy Bcrypt hash", () => {
            const hash =
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            expect(isValidHashFormat(hash)).toBe(false)
        })

        it("should return false for invalid Argon2id hash", () => {
            const hash = "$argon2id$v=19$salt$hash"
            expect(isValidHashFormat(hash)).toBe(false)
        })

        it("should return false for invalid Bcrypt hash", () => {
            const hash = "$2b$12$abc"
            expect(isValidHashFormat(hash)).toBe(false)
        })

        it("should return false for unknown format", () => {
            expect(isValidHashFormat("unknown_hash")).toBe(false)
        })

        it("should return false for null", () => {
            expect(isValidHashFormat(null)).toBe(false)
        })

        it("should return false for undefined", () => {
            expect(isValidHashFormat(undefined)).toBe(false)
        })

        it("should return false for empty string", () => {
            expect(isValidHashFormat("")).toBe(false)
        })

        it("should not log when checking validity", () => {
            vi.clearAllMocks()
            isValidHashFormat("invalid_hash")
            expect(logger.warn).not.toHaveBeenCalled()
        })
    })

    describe("getGenericHashValidationError - Error Message", () => {
        it("should return generic error message", () => {
            const message = getGenericHashValidationError()
            expect(message).toBe("Authentication failed")
        })

        it("should not reveal algorithm type", () => {
            const message = getGenericHashValidationError()
            expect(message).not.toContain("Argon2")
            expect(message).not.toContain("Bcrypt")
            expect(message).not.toContain("algorithm")
        })

        it("should not reveal hash format", () => {
            const message = getGenericHashValidationError()
            expect(message).not.toContain("$")
            expect(message).not.toContain("format")
        })

        it("should be consistent across calls", () => {
            const message1 = getGenericHashValidationError()
            const message2 = getGenericHashValidationError()
            expect(message1).toBe(message2)
        })
    })

    describe("Real-World Hash Examples", () => {
        it("should validate real Argon2id hash from argon2-cli", () => {
            const hash =
                "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObzlvQcozIQv9c"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(true)
            expect(result.algorithm).toBe("argon2id")
            expect(result.isMalformed).toBe(false)
            expect(logger.warn).not.toHaveBeenCalled()
        })

        it("rejects real bcryptjs hashes", () => {
            const hash =
                "$2b$10$nOUIs5kJ7naTuTFkBy1Be.PRZQl/qxWXInGA4aBUW3CjjF3XGm2Oi"
            const result = validateHashFormat(hash)

            expect(result.isValid).toBe(false)
            expect(result.algorithm).toBe("unknown")
        })
    })

    describe("Security Properties", () => {
        it("should not expose full hash in error messages", () => {
            const hash =
                "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRST"
            const result = validateHashFormat(hash)

            expect(result.userMessage).not.toContain(hash)
            expect(result.userMessage).not.toContain("$2b$")
        })

        it("should not expose algorithm type in error messages", () => {
            const result = validateHashFormat("invalid_hash")

            expect(result.userMessage).not.toContain("Argon2")
            expect(result.userMessage).not.toContain("Bcrypt")
            expect(result.userMessage).not.toContain("algorithm")
        })

        it("should return same error message for all invalid hashes", () => {
            const invalidHashes = [
                "$argon2id$v=19$salt$hash",
                "$2b$12$abc",
                "unknown_hash",
                null,
            ]

            const messages = invalidHashes.map(hash => {
                const result = validateHashFormat(hash)
                return result.isValid ? null : result.userMessage
            })

            const uniqueMessages = new Set(messages.filter(m => m !== null))
            expect(uniqueMessages.size).toBe(1)
        })

        it("should truncate hash in logs to prevent exposure", () => {
            // Use an invalid long hash that will be logged
            const longHash = "$invalid$" + "a".repeat(1000)
            validateHashFormat(longHash)

            const callArgs = (logger.warn as any).mock.calls[0]
            const logData = JSON.stringify(callArgs[1])

            // Verify hash is truncated
            expect(logData).toContain("...")
            // Verify full hash is not in logs
            expect(logData).not.toContain("a".repeat(100))
        })
    })
})
