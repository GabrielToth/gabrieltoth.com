/**
 * Unit Tests for Password Hashing and Cryptography Functions
 * Tests password hashing, comparison, and token generation
 * Validates: Requirements 1.6, 3.4, 5.6, 6.1, 2.1, 5.8
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

describe("hashPassword", () => {
    it("should hash a password", async () => {
        const password = "ValidPass123!"
        const hash = await hashPassword(password)

        expect(hash).toBeDefined()
        expect(hash).not.toBe(password)
        expect(hash.length).toBeGreaterThan(0)
    })

    it("should produce different hashes for the same password (due to salt)", async () => {
        const password = "ValidPass123!"
        const hash1 = await hashPassword(password)
        const hash2 = await hashPassword(password)

        expect(hash1).not.toBe(hash2)
    })

    it("should throw error for empty password", async () => {
        await expect(hashPassword("")).rejects.toThrow()
    })

    it("should throw error for null password", async () => {
        await expect(hashPassword(null as any)).rejects.toThrow()
    })

    it("should produce bcrypt hash format", async () => {
        const password = "ValidPass123!"
        const hash = await hashPassword(password)

        // Bcrypt hashes start with $2a$, $2b$, or $2y$
        expect(hash).toMatch(/^\$2[aby]\$/)
    })
})

describe("comparePassword", () => {
    let hash: string

    beforeEach(async () => {
        hash = await hashPassword("ValidPass123!")
    })

    it("should return true for correct password", async () => {
        const result = await comparePassword("ValidPass123!", hash)
        expect(result).toBe(true)
    })

    it("should return false for incorrect password", async () => {
        const result = await comparePassword("WrongPass123!", hash)
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

    it("should return false for null hash", async () => {
        const result = await comparePassword("ValidPass123!", null as any)
        expect(result).toBe(false)
    })

    it("should be case-sensitive", async () => {
        const result = await comparePassword("validpass123!", hash)
        expect(result).toBe(false)
    })
})

describe("generateToken", () => {
    it("should generate a token", () => {
        const token = generateToken()
        expect(token).toBeDefined()
        expect(typeof token).toBe("string")
    })

    it("should generate a 64-character hex string", () => {
        const token = generateToken()
        expect(token.length).toBe(64)
        expect(/^[a-f0-9]{64}$/i.test(token)).toBe(true)
    })

    it("should generate unique tokens", () => {
        const token1 = generateToken()
        const token2 = generateToken()
        expect(token1).not.toBe(token2)
    })
})

describe("generateCsrfToken", () => {
    it("should generate a CSRF token", () => {
        const token = generateCsrfToken()
        expect(token).toBeDefined()
        expect(token.length).toBe(64)
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
        expect(token.length).toBe(64)
    })
})

describe("generatePasswordResetToken", () => {
    it("should generate a password reset token", () => {
        const token = generatePasswordResetToken()
        expect(token).toBeDefined()
        expect(token.length).toBe(64)
    })
})

describe("validateToken", () => {
    it("should accept valid token", () => {
        const token = generateToken()
        const result = validateToken(token)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    it("should reject token that is too short", () => {
        const result = validateToken("abc123")
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
    })

    it("should reject token that is too long", () => {
        const result = validateToken("a".repeat(65))
        expect(result.isValid).toBe(false)
    })

    it("should reject non-hex token", () => {
        const result = validateToken("z".repeat(64))
        expect(result.isValid).toBe(false)
    })

    it("should reject empty token", () => {
        const result = validateToken("")
        expect(result.isValid).toBe(false)
        expect(result.error).toBe("Token is required")
    })

    it("should reject null token", () => {
        const result = validateToken(null as any)
        expect(result.isValid).toBe(false)
    })
})

describe("isTokenExpired", () => {
    it("should return false for future date", () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60) // 1 hour from now
        expect(isTokenExpired(futureDate)).toBe(false)
    })

    it("should return true for past date", () => {
        const pastDate = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        expect(isTokenExpired(pastDate)).toBe(true)
    })

    it("should return true for null date", () => {
        expect(isTokenExpired(null as any)).toBe(true)
    })

    it("should return true for invalid date", () => {
        expect(isTokenExpired("invalid" as any)).toBe(true)
    })
})

describe("getTokenExpirationDate", () => {
    it("should return a date in the future", () => {
        const expiresAt = getTokenExpirationDate(60)
        expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it("should add specified minutes", () => {
        const before = Date.now()
        const expiresAt = getTokenExpirationDate(60)
        const after = Date.now()

        const expectedMin = before + 60 * 60 * 1000
        const expectedMax = after + 60 * 60 * 1000

        expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin - 1000)
        expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax + 1000)
    })

    it("should use default 60 minutes", () => {
        const expiresAt = getTokenExpirationDate()
        const now = new Date()
        const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60)

        expect(diffMinutes).toBeGreaterThan(59)
        expect(diffMinutes).toBeLessThan(61)
    })
})

describe("generateEmailVerificationTokenWithExpiration", () => {
    it("should generate token with expiration", () => {
        const result = generateEmailVerificationTokenWithExpiration()
        expect(result.token).toBeDefined()
        expect(result.expiresAt).toBeDefined()
        expect(result.token.length).toBe(64)
    })

    it("should use default 24 hours expiration", () => {
        const result = generateEmailVerificationTokenWithExpiration()
        const now = new Date()
        const diffHours =
            (result.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

        expect(diffHours).toBeGreaterThan(23)
        expect(diffHours).toBeLessThan(25)
    })

    it("should use custom expiration minutes", () => {
        const result = generateEmailVerificationTokenWithExpiration(120)
        const now = new Date()
        const diffMinutes =
            (result.expiresAt.getTime() - now.getTime()) / (1000 * 60)

        expect(diffMinutes).toBeGreaterThan(119)
        expect(diffMinutes).toBeLessThan(121)
    })
})

describe("generatePasswordResetTokenWithExpiration", () => {
    it("should generate token with expiration", () => {
        const result = generatePasswordResetTokenWithExpiration()
        expect(result.token).toBeDefined()
        expect(result.expiresAt).toBeDefined()
        expect(result.token.length).toBe(64)
    })

    it("should use default 1 hour expiration", () => {
        const result = generatePasswordResetTokenWithExpiration()
        const now = new Date()
        const diffMinutes =
            (result.expiresAt.getTime() - now.getTime()) / (1000 * 60)

        expect(diffMinutes).toBeGreaterThan(59)
        expect(diffMinutes).toBeLessThan(61)
    })

    it("should use custom expiration minutes", () => {
        const result = generatePasswordResetTokenWithExpiration(30)
        const now = new Date()
        const diffMinutes =
            (result.expiresAt.getTime() - now.getTime()) / (1000 * 60)

        expect(diffMinutes).toBeGreaterThan(29)
        expect(diffMinutes).toBeLessThan(31)
    })
})
