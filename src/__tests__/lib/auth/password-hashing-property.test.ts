/**
 * Property-Based Tests for Password Hashing
 * Feature: oauth-password-requirement
 */

import { comparePassword, hashPassword } from "@/lib/auth/password-hashing"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 2: Password Hashing Consistency", () => {
    /**
     * **Validates: Requirements 2.4, 3.5, 7.6**
     *
     * For any valid password string, hashing the password SHALL produce a bcrypt
     * hash with 12 salt rounds in the format `$2b$12$...`, and comparing the
     * original password with the hash SHALL return true, while comparing any
     * different password with the hash SHALL return false.
     */
    it("should produce consistent bcrypt hashes with 12 salt rounds", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 72 }), // bcrypt max length is 72
                async password => {
                    const hash = await hashPassword(password)

                    // Property: hash format is bcrypt with 12 rounds
                    expect(hash).toBeDefined()
                    expect(typeof hash).toBe("string")
                    expect(hash).toMatch(/^\$2[aby]\$12\$/)

                    // Property: hash should be at least 60 characters (bcrypt standard)
                    expect(hash.length).toBeGreaterThanOrEqual(60)
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should correctly compare original password with its hash", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 72 }),
                async password => {
                    const hash = await hashPassword(password)

                    // Property: original password matches hash
                    const matches = await comparePassword(password, hash)
                    expect(matches).toBe(true)
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should reject different passwords when compared with hash", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 72 }),
                fc.string({ minLength: 1, maxLength: 72 }),
                async (password1, password2) => {
                    // Only test when passwords are actually different
                    fc.pre(password1 !== password2)

                    const hash = await hashPassword(password1)

                    // Property: different password doesn't match
                    const matches = await comparePassword(password2, hash)
                    expect(matches).toBe(false)
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should produce different hashes for the same password due to salt", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 72 }),
                async password => {
                    const hash1 = await hashPassword(password)
                    const hash2 = await hashPassword(password)

                    // Property: same password produces different hashes (due to random salt)
                    expect(hash1).not.toBe(hash2)

                    // Property: but both hashes should validate the original password
                    const matches1 = await comparePassword(password, hash1)
                    const matches2 = await comparePassword(password, hash2)
                    expect(matches1).toBe(true)
                    expect(matches2).toBe(true)
                }
            ),
            { numRuns: 20 }
        )
    }, 60000)

    it("should handle edge case passwords correctly", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    "a", // single character
                    "12345678", // only numbers
                    "ABCDEFGH", // only uppercase
                    "abcdefgh", // only lowercase
                    "!@#$%^&*", // only special chars
                    "Pass123!", // valid password
                    "A".repeat(50), // long but under limit
                    "🔒🔑🔐", // unicode/emoji
                    "   spaces   ", // with spaces
                    "\n\t\r", // control characters
                    "Mixed123!@#UpperLower" // complex password
                ),
                async password => {
                    const hash = await hashPassword(password)

                    // Property: hash format is always bcrypt with 12 rounds
                    expect(hash).toMatch(/^\$2[aby]\$12\$/)

                    // Property: original password always matches
                    const matches = await comparePassword(password, hash)
                    expect(matches).toBe(true)

                    // Property: modified password never matches (only if under 72 char limit)
                    // bcrypt truncates at 72 bytes, so we need to ensure modification is visible
                    if (password.length < 70) {
                        const modifiedPassword = password + "XY"
                        const doesNotMatch = await comparePassword(
                            modifiedPassword,
                            hash
                        )
                        expect(doesNotMatch).toBe(false)
                    }
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should maintain hash consistency across multiple comparisons", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 72 }),
                async password => {
                    const hash = await hashPassword(password)

                    // Property: comparing the same password multiple times yields consistent results
                    const result1 = await comparePassword(password, hash)
                    const result2 = await comparePassword(password, hash)
                    const result3 = await comparePassword(password, hash)

                    expect(result1).toBe(true)
                    expect(result2).toBe(true)
                    expect(result3).toBe(true)
                    expect(result1).toBe(result2)
                    expect(result2).toBe(result3)
                }
            ),
            { numRuns: 20 }
        )
    }, 60000)

    it("should handle case sensitivity correctly", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc
                    .string({ minLength: 1, maxLength: 72 })
                    .filter(s => s.toLowerCase() !== s.toUpperCase()), // only strings with letters
                async password => {
                    const hash = await hashPassword(password)

                    // Property: password comparison is case-sensitive
                    const lowerCase = password.toLowerCase()
                    const upperCase = password.toUpperCase()

                    // Only test if case conversion actually changes the password
                    if (lowerCase !== password) {
                        const matchesLower = await comparePassword(
                            lowerCase,
                            hash
                        )
                        expect(matchesLower).toBe(false)
                    }

                    if (upperCase !== password) {
                        const matchesUpper = await comparePassword(
                            upperCase,
                            hash
                        )
                        expect(matchesUpper).toBe(false)
                    }
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should handle special characters and unicode correctly", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    "password!@#$%^&*()",
                    "пароль123", // Cyrillic
                    "密码123", // Chinese
                    "パスワード123", // Japanese
                    "🔒password🔑",
                    "tab\there",
                    "new\nline",
                    "quote'test",
                    'double"quote',
                    "back\\slash",
                    "forward/slash"
                ),
                async password => {
                    const hash = await hashPassword(password)

                    // Property: special characters and unicode are handled correctly
                    expect(hash).toMatch(/^\$2[aby]\$12\$/)

                    const matches = await comparePassword(password, hash)
                    expect(matches).toBe(true)
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)
})

describe("Property 6: Password Comparison Correctness", () => {
    /**
     * **Validates: Requirements 4.2**
     *
     * For any password and bcrypt hash pair:
     * - If the password was used to generate the hash, then `comparePassword(password, hash)` SHALL return true
     * - If a different password is compared with the hash, it SHALL return false
     * - Comparing with an invalid hash format SHALL return false without throwing an error
     */

    it("should return true when comparing password with its own hash", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 72 }),
                async password => {
                    // Generate hash from password
                    const hash = await hashPassword(password)

                    // Property: password used to generate hash should match
                    const result = await comparePassword(password, hash)
                    expect(result).toBe(true)
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should return false when comparing different password with hash", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 72 }),
                fc.string({ minLength: 1, maxLength: 72 }),
                async (password1, password2) => {
                    // Only test when passwords are actually different
                    fc.pre(password1 !== password2)

                    // Generate hash from password1
                    const hash = await hashPassword(password1)

                    // Property: different password should not match
                    const result = await comparePassword(password2, hash)
                    expect(result).toBe(false)
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should return false for invalid hash formats without throwing", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 72 }), // valid password
                fc.constantFrom(
                    "", // empty string
                    "invalid", // not a hash
                    "12345", // too short
                    "$2b$10$short", // incomplete bcrypt hash
                    "$2b$12$", // missing hash data
                    "not-a-bcrypt-hash-at-all",
                    "$2x$12$invalidalgorithm", // invalid algorithm
                    "plaintext-password",
                    "   ", // whitespace only
                    "$2b$12$" + "a".repeat(100), // malformed but long
                    null as any, // null (will be caught by type guard)
                    undefined as any // undefined (will be caught by type guard)
                ),
                async (password, invalidHash) => {
                    // Property: invalid hash format should return false without throwing
                    let result: boolean
                    let threwError = false

                    try {
                        result = await comparePassword(password, invalidHash)
                    } catch (error) {
                        threwError = true
                        throw error // Re-throw to fail the test
                    }

                    expect(threwError).toBe(false)
                    expect(result).toBe(false)
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should handle edge cases in password comparison", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    "a", // single character
                    "12345678", // only numbers
                    "ABCDEFGH", // only uppercase
                    "abcdefgh", // only lowercase
                    "!@#$%^&*", // only special chars
                    "Pass123!", // valid password
                    "🔒🔑🔐", // unicode/emoji
                    "   spaces   ", // with spaces
                    "\n\t\r" // control characters
                ),
                async password => {
                    const hash = await hashPassword(password)

                    // Property: correct password always matches
                    const correctMatch = await comparePassword(password, hash)
                    expect(correctMatch).toBe(true)

                    // Property: modified password never matches
                    const modifiedPassword = password + "X"
                    const incorrectMatch = await comparePassword(
                        modifiedPassword,
                        hash
                    )
                    expect(incorrectMatch).toBe(false)
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should maintain comparison correctness across multiple calls", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 72 }),
                async password => {
                    const hash = await hashPassword(password)

                    // Property: multiple comparisons with same password yield consistent results
                    const result1 = await comparePassword(password, hash)
                    const result2 = await comparePassword(password, hash)
                    const result3 = await comparePassword(password, hash)

                    expect(result1).toBe(true)
                    expect(result2).toBe(true)
                    expect(result3).toBe(true)

                    // All results should be identical
                    expect(result1).toBe(result2)
                    expect(result2).toBe(result3)
                }
            ),
            { numRuns: 20 }
        )
    }, 60000)

    it("should correctly distinguish between similar passwords", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 2, maxLength: 71 }), // Leave room for modifications
                async basePassword => {
                    const hash = await hashPassword(basePassword)

                    // Property: exact password matches
                    const exactMatch = await comparePassword(basePassword, hash)
                    expect(exactMatch).toBe(true)

                    // Property: password with extra character doesn't match
                    const withExtra = basePassword + "X"
                    const extraMatch = await comparePassword(withExtra, hash)
                    expect(extraMatch).toBe(false)

                    // Property: password missing last character doesn't match
                    const withoutLast = basePassword.slice(0, -1)
                    const missingMatch = await comparePassword(
                        withoutLast,
                        hash
                    )
                    expect(missingMatch).toBe(false)

                    // Property: password with character replaced doesn't match
                    const replaced =
                        basePassword.slice(0, -1) +
                        (basePassword[basePassword.length - 1] === "X"
                            ? "Y"
                            : "X")
                    const replacedMatch = await comparePassword(replaced, hash)
                    expect(replacedMatch).toBe(false)
                }
            ),
            { numRuns: 20 }
        )
    }, 60000)
})
