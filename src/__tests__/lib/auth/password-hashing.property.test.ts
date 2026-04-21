/**
 * Property-Based Tests for Password Hashing
 * Feature: oauth-password-requirement
 * Tests universal properties of password hashing using fast-check
 * Validates: Requirements 2.4, 3.5, 7.6
 */

import { comparePassword, hashPassword } from "@/lib/auth/password-hashing"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 2: Password Hashing Consistency", () => {
    /**
     * **Validates: Requirements 2.4, 3.5, 7.6**
     *
     * Property: For any valid password string, hashing the password SHALL produce
     * a bcrypt hash with 12 salt rounds in the format `$2b$12$...`, and comparing
     * the original password with the hash SHALL return true, while comparing any
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
                    expect(hash).toMatch(/^\$2b\$12\$/)

                    // Property: hash should be at least 60 characters (bcrypt standard)
                    expect(hash.length).toBeGreaterThanOrEqual(60)

                    // Property: original password matches hash
                    const matches = await comparePassword(password, hash)
                    expect(matches).toBe(true)
                }
            ),
            { numRuns: 50 }
        )
    }, 60000) // 60 second timeout for bcrypt operations

    it("should produce different hashes for the same password (salt uniqueness)", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 8, maxLength: 50 }),
                async password => {
                    // Hash the same password twice
                    const hash1 = await hashPassword(password)
                    const hash2 = await hashPassword(password)

                    // Property: different hashes due to different salts
                    expect(hash1).not.toBe(hash2)

                    // Property: both hashes should validate the same password
                    expect(await comparePassword(password, hash1)).toBe(true)
                    expect(await comparePassword(password, hash2)).toBe(true)
                }
            ),
            { numRuns: 50 } // Reduced runs since hashing is expensive
        )
    }, 60000)

    it("should reject different passwords when compared with hash", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 8, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                async (password, differentPassword) => {
                    // Skip if passwords are the same
                    fc.pre(password !== differentPassword)

                    const hash = await hashPassword(password)

                    // Property: different password doesn't match
                    const doesNotMatch = await comparePassword(
                        differentPassword,
                        hash
                    )
                    expect(doesNotMatch).toBe(false)
                }
            ),
            { numRuns: 50 } // Reduced runs since hashing is expensive
        )
    }, 60000)

    it("should handle edge cases in password comparison", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 50 }),
                async password => {
                    const hash = await hashPassword(password)

                    // Property: empty string doesn't match
                    expect(await comparePassword("", hash)).toBe(false)

                    // Property: case sensitivity - different case doesn't match
                    if (password !== password.toUpperCase()) {
                        expect(
                            await comparePassword(password.toUpperCase(), hash)
                        ).toBe(false)
                    }

                    if (password !== password.toLowerCase()) {
                        expect(
                            await comparePassword(password.toLowerCase(), hash)
                        ).toBe(false)
                    }

                    // Property: password with extra character doesn't match
                    expect(await comparePassword(password + "x", hash)).toBe(
                        false
                    )

                    // Property: password with missing character doesn't match
                    if (password.length > 1) {
                        expect(
                            await comparePassword(password.slice(0, -1), hash)
                        ).toBe(false)
                    }
                }
            ),
            { numRuns: 30 } // Reduced runs since this test does multiple comparisons
        )
    }, 60000)

    it("should handle special characters in passwords", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 8, maxLength: 50 }),
                async password => {
                    // Skip empty passwords
                    fc.pre(password.length > 0)

                    const hash = await hashPassword(password)

                    // Property: hash format is correct
                    expect(hash).toMatch(/^\$2b\$12\$/)

                    // Property: original password matches
                    expect(await comparePassword(password, hash)).toBe(true)
                }
            ),
            { numRuns: 50 }
        )
    }, 60000)

    it("should handle invalid inputs gracefully", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 50 }),
                async password => {
                    const hash = await hashPassword(password)

                    // Property: null password returns false
                    expect(await comparePassword(null as any, hash)).toBe(false)

                    // Property: undefined password returns false
                    expect(await comparePassword(undefined as any, hash)).toBe(
                        false
                    )

                    // Property: null hash returns false
                    expect(await comparePassword(password, null as any)).toBe(
                        false
                    )

                    // Property: undefined hash returns false
                    expect(
                        await comparePassword(password, undefined as any)
                    ).toBe(false)

                    // Property: empty hash returns false
                    expect(await comparePassword(password, "")).toBe(false)

                    // Property: invalid hash format returns false (should not throw)
                    expect(
                        await comparePassword(password, "invalid-hash")
                    ).toBe(false)
                }
            ),
            { numRuns: 30 }
        )
    }, 60000)

    it("should maintain consistency across multiple hash-compare cycles", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 8, maxLength: 50 }),
                async password => {
                    // Property: multiple hash-compare cycles should be consistent
                    for (let i = 0; i < 3; i++) {
                        const hash = await hashPassword(password)
                        expect(await comparePassword(password, hash)).toBe(true)
                        expect(
                            await comparePassword(password + "x", hash)
                        ).toBe(false)
                    }
                }
            ),
            { numRuns: 20 } // Reduced runs since this does multiple hashing operations
        )
    }, 60000)
})
