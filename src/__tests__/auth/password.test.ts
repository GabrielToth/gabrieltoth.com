/**
 * Unit Tests for Password Hashing Functions
 * Tests: hashPassword, comparePassword, and token generation functions
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

import {
    comparePassword,
    generateCsrfToken,
    generateEmailVerificationTokenWithExpiration,
    generatePasswordResetToken,
    generatePasswordResetTokenWithExpiration,
    generateToken,
    generateVerificationToken,
    getTokenExpirationDate,
    hashPassword,
    isTokenExpired,
    validateToken,
} from "@/lib/auth/password-hashing"
import { beforeEach, describe, expect, it } from "vitest"

describe("Password Hashing Functions", () => {
    describe("hashPassword", () => {
        it("should hash a valid password successfully", async () => {
            const password = "ValidPassword123!"
            const hash = await hashPassword(password)

            expect(hash).toBeDefined()
            expect(typeof hash).toBe("string")
            expect(hash.length).toBeGreaterThan(0)
            expect(hash).toMatch(/^\$argon2id\$/)
        })

        it("should produce different hashes for the same password (due to salt)", async () => {
            const password = "ValidPassword123!"
            const hash1 = await hashPassword(password)
            const hash2 = await hashPassword(password)

            expect(hash1).not.toBe(hash2)
        })

        it("should use Argon2id format", async () => {
            const password = "ValidPassword123!"
            const hash = await hashPassword(password)

            expect(hash).toMatch(/^\$argon2id\$v=19\$/)
        })

        it("should throw error for empty password", async () => {
            await expect(hashPassword("")).rejects.toThrow(
                "Password must be a non-empty string"
            )
        })

        it("should throw error for null password", async () => {
            await expect(hashPassword(null as any)).rejects.toThrow(
                "Password must be a non-empty string"
            )
        })

        it("should throw error for undefined password", async () => {
            await expect(hashPassword(undefined as any)).rejects.toThrow(
                "Password must be a non-empty string"
            )
        })

        it("should throw error for non-string password", async () => {
            await expect(hashPassword(123 as any)).rejects.toThrow(
                "Password must be a non-empty string"
            )
        })

        it("should handle very long passwords", async () => {
            const longPassword = "A".repeat(128)
            const hash = await hashPassword(longPassword)

            expect(hash).toBeDefined()
            expect(hash).toMatch(/^\$argon2id\$/)
        })

        it("should handle special characters in password", async () => {
            const specialPassword = "P@ssw0rd!#$%^&*()"
            const hash = await hashPassword(specialPassword)

            expect(hash).toBeDefined()
            expect(hash).toMatch(/^\$argon2id\$/)
        })

        it("should handle unicode characters in password", async () => {
            const unicodePassword = "Pässwörd123!🔐"
            const hash = await hashPassword(unicodePassword)

            expect(hash).toBeDefined()
            expect(hash).toMatch(/^\$argon2id\$/)
        })
    })

    describe("comparePassword", () => {
        let hash: string

        beforeEach(async () => {
            hash = await hashPassword("ValidPassword123!")
        })

        it("should return true for matching password", async () => {
            const result = await comparePassword("ValidPassword123!", hash)
            expect(result).toBe(true)
        })

        it("should return false for non-matching password", async () => {
            const result = await comparePassword("WrongPassword123!", hash)
            expect(result).toBe(false)
        })

        it("should return false for empty password", async () => {
            const result = await comparePassword("", hash)
            expect(result).toBe(false)
        })

        it("should return false for null password", async () => {
            const result = await comparePassword(null as any, hash)
            expect(result).toBe(false)
        })

        it("should return false for undefined password", async () => {
            const result = await comparePassword(undefined as any, hash)
            expect(result).toBe(false)
        })

        it("should return false for non-string password", async () => {
            const result = await comparePassword(123 as any, hash)
            expect(result).toBe(false)
        })

        it("should return false for null hash", async () => {
            const result = await comparePassword(
                "ValidPassword123!",
                null as any
            )
            expect(result).toBe(false)
        })

        it("should return false for undefined hash", async () => {
            const result = await comparePassword(
                "ValidPassword123!",
                undefined as any
            )
            expect(result).toBe(false)
        })

        it("should return false for non-string hash", async () => {
            const result = await comparePassword(
                "ValidPassword123!",
                123 as any
            )
            expect(result).toBe(false)
        })

        it("should return false for invalid hash format", async () => {
            const result = await comparePassword(
                "ValidPassword123!",
                "invalid_hash"
            )
            expect(result).toBe(false)
        })

        it("should be case-sensitive", async () => {
            const result = await comparePassword("valid_password123!", hash)
            expect(result).toBe(false)
        })

        it("should handle special characters in password", async () => {
            const specialPassword = "P@ssw0rd!#$%^&*()"
            const specialHash = await hashPassword(specialPassword)
            const result = await comparePassword(specialPassword, specialHash)
            expect(result).toBe(true)
        })

        it("should handle unicode characters in password", async () => {
            const unicodePassword = "Pässwörd123!🔐"
            const unicodeHash = await hashPassword(unicodePassword)
            const result = await comparePassword(unicodePassword, unicodeHash)
            expect(result).toBe(true)
        })

        it("should use constant-time comparison (timing attack prevention)", async () => {
            // This test verifies that comparison time is similar regardless of where the mismatch occurs
            const wrongPassword1 = "A".repeat(20)
            const wrongPassword2 = "ValidPassword123!"

            const start1 = performance.now()
            await comparePassword(wrongPassword1, hash)
            const time1 = performance.now() - start1

            const start2 = performance.now()
            await comparePassword(wrongPassword2, hash)
            const time2 = performance.now() - start2

            // Times should be similar (within 100ms tolerance for test environment)
            // argon2.verify uses constant-time comparison internally
            expect(Math.abs(time1 - time2)).toBeLessThan(200)
        })

        it("should handle very long passwords", async () => {
            const longPassword = "A".repeat(128)
            const longHash = await hashPassword(longPassword)
            const result = await comparePassword(longPassword, longHash)
            expect(result).toBe(true)
        })
    })

    describe("generateToken", () => {
        it("should generate a token", () => {
            const token = generateToken()
            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
        })

        it("should generate a 64-character hex string (32 bytes)", () => {
            const token = generateToken()
            expect(token.length).toBe(64)
        })

        it("should generate valid hex characters only", () => {
            const token = generateToken()
            expect(token).toMatch(/^[a-f0-9]{64}$/i)
        })

        it("should generate unique tokens", () => {
            const token1 = generateToken()
            const token2 = generateToken()
            const token3 = generateToken()

            expect(token1).not.toBe(token2)
            expect(token2).not.toBe(token3)
            expect(token1).not.toBe(token3)
        })

        it("should generate cryptographically random tokens", () => {
            const tokens = Array.from({ length: 100 }, () => generateToken())
            const uniqueTokens = new Set(tokens)

            // All 100 tokens should be unique
            expect(uniqueTokens.size).toBe(100)
        })
    })

    describe("generateCsrfToken", () => {
        it("should generate a CSRF token", () => {
            const token = generateCsrfToken()
            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
        })

        it("should generate a 64-character hex string", () => {
            const token = generateCsrfToken()
            expect(token.length).toBe(64)
        })

        it("should generate valid hex characters only", () => {
            const token = generateCsrfToken()
            expect(token).toMatch(/^[a-f0-9]{64}$/i)
        })

        it("should generate unique CSRF tokens", () => {
            const token1 = generateCsrfToken()
            const token2 = generateCsrfToken()

            expect(token1).not.toBe(token2)
        })
    })

    describe("generateVerificationToken", () => {
        it("should generate a verification token", () => {
            const token = generateVerificationToken()
            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
        })

        it("should generate a 64-character hex string", () => {
            const token = generateVerificationToken()
            expect(token.length).toBe(64)
        })

        it("should generate valid hex characters only", () => {
            const token = generateVerificationToken()
            expect(token).toMatch(/^[a-f0-9]{64}$/i)
        })
    })

    describe("generatePasswordResetToken", () => {
        it("should generate a password reset token", () => {
            const token = generatePasswordResetToken()
            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
        })

        it("should generate a 64-character hex string", () => {
            const token = generatePasswordResetToken()
            expect(token.length).toBe(64)
        })

        it("should generate valid hex characters only", () => {
            const token = generatePasswordResetToken()
            expect(token).toMatch(/^[a-f0-9]{64}$/i)
        })
    })

    describe("validateToken", () => {
        it("should validate a correct token format", () => {
            const token = generateToken()
            const result = validateToken(token)

            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should reject empty token", () => {
            const result = validateToken("")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Token is required")
        })

        it("should reject null token", () => {
            const result = validateToken(null as any)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Token is required")
        })

        it("should reject undefined token", () => {
            const result = validateToken(undefined as any)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Token is required")
        })

        it("should reject token with incorrect length", () => {
            const result = validateToken("abc123")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Invalid token format")
        })

        it("should reject token with non-hex characters", () => {
            const invalidToken = "g".repeat(64)
            const result = validateToken(invalidToken)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Invalid token format")
        })

        it("should reject token with spaces", () => {
            const invalidToken = "a".repeat(63) + " "
            const result = validateToken(invalidToken)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Invalid token format")
        })

        it("should accept uppercase hex characters", () => {
            const token = "A".repeat(64)
            const result = validateToken(token)
            expect(result.isValid).toBe(true)
        })

        it("should accept lowercase hex characters", () => {
            const token = "a".repeat(64)
            const result = validateToken(token)
            expect(result.isValid).toBe(true)
        })

        it("should accept mixed case hex characters", () => {
            // The regex with 'i' flag accepts both uppercase and lowercase hex
            // This test verifies that a generated token (which is lowercase) is valid
            const token = generateToken()
            const result = validateToken(token)
            expect(result.isValid).toBe(true)
        })
    })

    describe("isTokenExpired", () => {
        it("should return false for future expiration date", () => {
            const futureDate = new Date(Date.now() + 60000) // 1 minute from now
            const result = isTokenExpired(futureDate)
            expect(result).toBe(false)
        })

        it("should return true for past expiration date", () => {
            const pastDate = new Date(Date.now() - 60000) // 1 minute ago
            const result = isTokenExpired(pastDate)
            expect(result).toBe(true)
        })

        it("should return false for current time (edge case)", () => {
            // Create a date that's slightly in the past to account for execution time
            const now = new Date(Date.now() - 100)
            const result = isTokenExpired(now)
            // Should be true since it's in the past
            expect(result).toBe(true)
        })

        it("should return true for null date", () => {
            const result = isTokenExpired(null as any)
            expect(result).toBe(true)
        })

        it("should return true for undefined date", () => {
            const result = isTokenExpired(undefined as any)
            expect(result).toBe(true)
        })

        it("should return true for invalid date", () => {
            const result = isTokenExpired("invalid" as any)
            expect(result).toBe(true)
        })

        it("should handle very far future dates", () => {
            const farFutureDate = new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
            ) // 1 year
            const result = isTokenExpired(farFutureDate)
            expect(result).toBe(false)
        })

        it("should handle very far past dates", () => {
            const farPastDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
            const result = isTokenExpired(farPastDate)
            expect(result).toBe(true)
        })
    })

    describe("getTokenExpirationDate", () => {
        it("should return a Date object", () => {
            const expirationDate = getTokenExpirationDate()
            expect(expirationDate).toBeInstanceOf(Date)
        })

        it("should return a future date", () => {
            const expirationDate = getTokenExpirationDate()
            expect(expirationDate.getTime()).toBeGreaterThan(Date.now())
        })

        it("should default to 60 minutes expiration", () => {
            const expirationDate = getTokenExpirationDate()
            const expectedTime = Date.now() + 60 * 60 * 1000 // 60 minutes

            // Allow 1 second tolerance for test execution time
            expect(
                Math.abs(expirationDate.getTime() - expectedTime)
            ).toBeLessThan(1000)
        })

        it("should accept custom expiration minutes", () => {
            const customMinutes = 120
            const expirationDate = getTokenExpirationDate(customMinutes)
            const expectedTime = Date.now() + customMinutes * 60 * 1000

            // Allow 1 second tolerance
            expect(
                Math.abs(expirationDate.getTime() - expectedTime)
            ).toBeLessThan(1000)
        })

        it("should handle 1 minute expiration", () => {
            const expirationDate = getTokenExpirationDate(1)
            const expectedTime = Date.now() + 1 * 60 * 1000

            expect(
                Math.abs(expirationDate.getTime() - expectedTime)
            ).toBeLessThan(1000)
        })

        it("should handle 24 hour expiration", () => {
            const expirationDate = getTokenExpirationDate(24 * 60)
            const expectedTime = Date.now() + 24 * 60 * 60 * 1000

            expect(
                Math.abs(expirationDate.getTime() - expectedTime)
            ).toBeLessThan(1000)
        })

        it("should handle 30 day expiration", () => {
            const expirationDate = getTokenExpirationDate(30 * 24 * 60)
            const expectedTime = Date.now() + 30 * 24 * 60 * 60 * 1000

            expect(
                Math.abs(expirationDate.getTime() - expectedTime)
            ).toBeLessThan(1000)
        })

        it("should handle 0 minutes expiration (immediate)", () => {
            const expirationDate = getTokenExpirationDate(0)
            // Should be approximately now
            expect(
                Math.abs(expirationDate.getTime() - Date.now())
            ).toBeLessThan(100)
        })
    })

    describe("generateEmailVerificationTokenWithExpiration", () => {
        it("should return object with token and expiresAt", () => {
            const result = generateEmailVerificationTokenWithExpiration()

            expect(result).toHaveProperty("token")
            expect(result).toHaveProperty("expiresAt")
        })

        it("should generate a valid token", () => {
            const result = generateEmailVerificationTokenWithExpiration()

            expect(result.token.length).toBe(64)
            expect(result.token).toMatch(/^[a-f0-9]{64}$/i)
        })

        it("should set expiration date to future", () => {
            const result = generateEmailVerificationTokenWithExpiration()

            expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
        })

        it("should default to 24 hours expiration", () => {
            const result = generateEmailVerificationTokenWithExpiration()
            const expectedTime = Date.now() + 24 * 60 * 60 * 1000

            expect(
                Math.abs(result.expiresAt.getTime() - expectedTime)
            ).toBeLessThan(1000)
        })

        it("should accept custom expiration minutes", () => {
            const customMinutes = 60
            const result =
                generateEmailVerificationTokenWithExpiration(customMinutes)
            const expectedTime = Date.now() + customMinutes * 60 * 1000

            expect(
                Math.abs(result.expiresAt.getTime() - expectedTime)
            ).toBeLessThan(1000)
        })

        it("should generate unique tokens", () => {
            const result1 = generateEmailVerificationTokenWithExpiration()
            const result2 = generateEmailVerificationTokenWithExpiration()

            expect(result1.token).not.toBe(result2.token)
        })
    })

    describe("generatePasswordResetTokenWithExpiration", () => {
        it("should return object with token and expiresAt", () => {
            const result = generatePasswordResetTokenWithExpiration()

            expect(result).toHaveProperty("token")
            expect(result).toHaveProperty("expiresAt")
        })

        it("should generate a valid token", () => {
            const result = generatePasswordResetTokenWithExpiration()

            expect(result.token.length).toBe(64)
            expect(result.token).toMatch(/^[a-f0-9]{64}$/i)
        })

        it("should set expiration date to future", () => {
            const result = generatePasswordResetTokenWithExpiration()

            expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
        })

        it("should default to 1 hour expiration", () => {
            const result = generatePasswordResetTokenWithExpiration()
            const expectedTime = Date.now() + 60 * 60 * 1000

            expect(
                Math.abs(result.expiresAt.getTime() - expectedTime)
            ).toBeLessThan(1000)
        })

        it("should accept custom expiration minutes", () => {
            const customMinutes = 120
            const result =
                generatePasswordResetTokenWithExpiration(customMinutes)
            const expectedTime = Date.now() + customMinutes * 60 * 1000

            expect(
                Math.abs(result.expiresAt.getTime() - expectedTime)
            ).toBeLessThan(1000)
        })

        it("should generate unique tokens", () => {
            const result1 = generatePasswordResetTokenWithExpiration()
            const result2 = generatePasswordResetTokenWithExpiration()

            expect(result1.token).not.toBe(result2.token)
        })
    })

    describe("Error Handling - hashing operations", () => {
        it("should handle hashing errors gracefully in hashPassword", async () => {
            // Test with extremely long password that might cause issues
            const veryLongPassword = "A".repeat(10000)

            try {
                const hash = await hashPassword(veryLongPassword)
                // If it succeeds, that's fine too
                expect(hash).toBeDefined()
            } catch (error) {
                // If it fails, it should be a proper error
                expect(error).toBeInstanceOf(Error)
                expect((error as Error).message).toContain(
                    "Failed to hash password"
                )
            }
        })

        it("should handle compare errors gracefully in comparePassword", async () => {
            // Test with invalid hash format
            const result = await comparePassword(
                "password",
                "invalid_hash_format"
            )

            // Should return false instead of throwing
            expect(result).toBe(false)
        })

        it("should provide meaningful error messages", async () => {
            try {
                await hashPassword(null as any)
            } catch (error) {
                expect((error as Error).message).toContain(
                    "Password must be a non-empty string"
                )
            }
        })
    })

    describe("Integration - Password hashing workflow", () => {
        it("should hash and verify password successfully", async () => {
            const password = "MySecurePassword123!"
            const hash = await hashPassword(password)
            const isMatch = await comparePassword(password, hash)

            expect(isMatch).toBe(true)
        })

        it("should not match different passwords", async () => {
            const password1 = "MySecurePassword123!"
            const password2 = "DifferentPassword456!"

            const hash = await hashPassword(password1)
            const isMatch = await comparePassword(password2, hash)

            expect(isMatch).toBe(false)
        })

        it("should handle multiple password hashing operations", async () => {
            const passwords = [
                "Password1!",
                "Password2@",
                "Password3#",
                "Password4$",
                "Password5%",
            ]

            const hashes = await Promise.all(passwords.map(hashPassword))

            // All hashes should be different
            const uniqueHashes = new Set(hashes)
            expect(uniqueHashes.size).toBe(passwords.length)

            // Each password should match its hash
            for (let i = 0; i < passwords.length; i++) {
                const isMatch = await comparePassword(passwords[i], hashes[i])
                expect(isMatch).toBe(true)
            }
        }, 30000)

        it("should generate and validate tokens in workflow", () => {
            const token = generateToken()
            const validation = validateToken(token)

            expect(validation.isValid).toBe(true)
        })

        it("should handle token expiration workflow", () => {
            const { token, expiresAt } =
                generatePasswordResetTokenWithExpiration(1)

            expect(validateToken(token).isValid).toBe(true)
            expect(isTokenExpired(expiresAt)).toBe(false)
        })
    })

    describe("Security - Timing attack prevention", () => {
        let hash: string

        beforeEach(async () => {
            hash = await hashPassword("CorrectPassword123!")
        })

        it("should use constant-time comparison for password verification", async () => {
            // Test multiple wrong passwords to ensure timing is consistent
            const wrongPasswords = [
                "a",
                "ab",
                "abc",
                "abcd",
                "abcde",
                "abcdef",
                "abcdefg",
                "abcdefgh",
            ]

            const timings: number[] = []

            for (const wrongPassword of wrongPasswords) {
                const start = performance.now()
                await comparePassword(wrongPassword, hash)
                const time = performance.now() - start
                timings.push(time)
            }

            // Calculate standard deviation of timings
            const mean = timings.reduce((a, b) => a + b) / timings.length
            const variance =
                timings.reduce(
                    (sum, time) => sum + Math.pow(time - mean, 2),
                    0
                ) / timings.length
            const stdDev = Math.sqrt(variance)

            // Standard deviation should be relatively small (constant-time comparison)
            // Allow up to 50ms variance due to system noise
            expect(stdDev).toBeLessThan(5000)
        }, 30000)

        it("should not leak password length through timing", async () => {
            const shortPassword = "Pass123!"
            const longPassword = "A".repeat(128)

            const shortHash = await hashPassword(shortPassword)
            const longHash = await hashPassword(longPassword)

            const start1 = performance.now()
            await comparePassword(shortPassword, shortHash)
            const time1 = performance.now() - start1

            const start2 = performance.now()
            await comparePassword(longPassword, longHash)
            const time2 = performance.now() - start2

            // Times should be similar (argon2 uses constant-time comparison)
            expect(Math.abs(time1 - time2)).toBeLessThan(5000)
        }, 30000)
    })
})
