/**
 * Property-Based Tests for Password Validation and Hashing
 * Feature: registration-flow-redesign
 * Task 1.5: Write property tests for password validation
 *
 * Tests Properties 2 and 3 from the design document
 */

import { comparePassword, hashPassword } from "@/lib/auth/password-hashing"
import { validatePassword } from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 2: Password Strength Validation Correctness", () => {
    /**
     * **Validates: Requirements 3.4, 19.1**
     *
     * For any password string, the validation function SHALL accept passwords
     * meeting all requirements (8+ characters, uppercase, number, special character)
     * and reject passwords missing any requirement.
     *
     * Property: The validator SHALL correctly identify whether a password meets
     * ALL security requirements and only mark isValid as true when ALL requirements
     * are met (excluding common password check which is secondary).
     */
    it("should accept passwords meeting all requirements (8+ chars, uppercase, number, special)", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom(
                        "!",
                        "@",
                        "#",
                        "$",
                        "%",
                        "^",
                        "&",
                        "*",
                        "(",
                        ")",
                        "_",
                        "+",
                        "-",
                        "=",
                        "[",
                        "]",
                        "{",
                        "}",
                        ";",
                        "'",
                        ":",
                        '"',
                        "\\",
                        "|",
                        ",",
                        ".",
                        "<",
                        ">",
                        "/",
                        "?"
                    )
                ),
                ([base, num, special]) => {
                    // Construct a password that meets all 4 structural requirements
                    // Uppercase (A), lowercase (a), number (num), special (special), and >= 8 chars
                    const password = `Aa${base}${num}${special}`.padEnd(8, "x")

                    const result = validatePassword(password)

                    // Property: All 4 structural requirements should be met
                    expect(result.requirements.minLength).toBe(true)
                    expect(result.requirements.hasUppercase).toBe(true)
                    expect(result.requirements.hasLowercase).toBe(true)
                    expect(result.requirements.hasNumber).toBe(true)
                    expect(result.requirements.hasSpecial).toBe(true)

                    // Note: isValid might still be false if password is common,
                    // but all 4 structural requirements should be met
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject passwords missing minimum length requirement (< 8 characters)", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 7 }),
                    fc.constantFrom("A", "B", "C", "D", "E", "F", "G", "H"),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom("!", "@", "#", "$", "%", "^", "&", "*")
                ),
                ([base, upper, num, special]) => {
                    // Construct password with uppercase, number, special but < 8 chars
                    const password =
                        `${upper}${base}${num}${special}`.substring(0, 7)

                    const result = validatePassword(password)

                    // Property: Passwords shorter than 8 characters should fail
                    expect(result.requirements.minLength).toBe(false)
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("8 characters")
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject passwords missing uppercase letter requirement", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 8, maxLength: 20 })
                        .filter(s => !/[A-Z]/.test(s)),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom("!", "@", "#", "$", "%", "^", "&", "*")
                ),
                ([base, num, special]) => {
                    // Construct password without uppercase
                    const password = `${base}${num}${special}`.padEnd(8, "a")

                    const result = validatePassword(password)

                    // Property: Passwords without uppercase should fail
                    expect(result.requirements.hasUppercase).toBe(false)
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("uppercase")
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject passwords missing number requirement", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 8, maxLength: 20 })
                        .filter(s => !/[0-9]/.test(s)),
                    fc.constantFrom("!", "@", "#", "$", "%", "^", "&", "*")
                ),
                ([base, special]) => {
                    // Construct password without number
                    const password = `Aa${base}${special}`.padEnd(8, "x")

                    const result = validatePassword(password)

                    // Property: Passwords without number should fail
                    expect(result.requirements.hasNumber).toBe(false)
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("number")
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject passwords missing special character requirement", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 8, maxLength: 20 })
                        .filter(
                            s =>
                                !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s)
                        ),
                    fc.integer({ min: 0, max: 9 })
                ),
                ([base, num]) => {
                    // Construct password without special character
                    const password = `Aa${base}${num}`.padEnd(8, "x")

                    const result = validatePassword(password)

                    // Property: Passwords without special character should fail
                    expect(result.requirements.hasSpecial).toBe(false)
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("special character")
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should correctly identify each requirement independently for any password", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = validatePassword(password)

                // Calculate expected requirements based on actual password characteristics
                const expectedMinLength = password.length >= 8
                const expectedHasUppercase = /[A-Z]/.test(password)
                const expectedHasLowercase = /[a-z]/.test(password)
                const expectedHasNumber = /[0-9]/.test(password)
                const expectedHasSpecial =
                    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

                // Property: Each requirement is correctly identified
                expect(result.requirements.minLength).toBe(expectedMinLength)
                expect(result.requirements.hasUppercase).toBe(
                    expectedHasUppercase
                )
                expect(result.requirements.hasLowercase).toBe(
                    expectedHasLowercase
                )
                expect(result.requirements.hasNumber).toBe(expectedHasNumber)
                expect(result.requirements.hasSpecial).toBe(expectedHasSpecial)

                // Property: isValid is true ONLY when ALL structural requirements are met
                const allStructuralRequirementsMet =
                    expectedMinLength &&
                    expectedHasUppercase &&
                    expectedHasLowercase &&
                    expectedHasNumber &&
                    expectedHasSpecial

                // Note: isValid might still be false if password is common,
                // but if all structural requirements are met, isValid should be true
                // (unless the password is in the common passwords list)
                if (allStructuralRequirementsMet) {
                    // If all structural requirements are met, isValid should be true
                    // (unless password is common, which is a secondary check)
                    expect(result.isValid).toBe(result.requirements.notCommon)
                } else {
                    // If any structural requirement is not met, isValid should be false
                    expect(result.isValid).toBe(false)
                }
            }),
            { numRuns: 100 }
        )
    })

    it("should provide specific error message for first unmet requirement", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    { password: "short", expectedError: "8 characters" },
                    { password: "lowercase123!", expectedError: "uppercase" },
                    { password: "UPPERCASE123!", expectedError: "lowercase" },
                    { password: "NoNumbers!", expectedError: "number" },
                    {
                        password: "NoSpecial123",
                        expectedError: "special character",
                    }
                ),
                testCase => {
                    const result = validatePassword(testCase.password)

                    // Property: Validation should fail for passwords missing requirements
                    expect(result.isValid).toBe(false)

                    // Property: Error message should be specific to the unmet requirement
                    expect(result.error).toBeDefined()
                    expect(result.error!.toLowerCase()).toContain(
                        testCase.expectedError.toLowerCase()
                    )
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should maintain consistency across multiple validations of the same password", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                // Property: Validating the same password multiple times should yield identical results
                const result1 = validatePassword(password)
                const result2 = validatePassword(password)
                const result3 = validatePassword(password)

                expect(result1.isValid).toBe(result2.isValid)
                expect(result2.isValid).toBe(result3.isValid)

                expect(result1.error).toBe(result2.error)
                expect(result2.error).toBe(result3.error)

                expect(result1.requirements).toEqual(result2.requirements)
                expect(result2.requirements).toEqual(result3.requirements)
            }),
            { numRuns: 100 }
        )
    })
})

describe("Property 3: Password Hashing Security", () => {
    /**
     * **Validates: Requirements 8.4, 19.3**
     *
     * For any password, hashing the same password multiple times SHALL produce
     * different hashes (due to salt), but verification SHALL succeed for all hashes.
     *
     * Property: Password hashing must use bcrypt with salt to ensure:
     * 1. Same password produces different hashes each time (due to random salt)
     * 2. Verification succeeds for all hashes of the same password
     * 3. Verification fails for different passwords
     */
    it("should produce different hashes for the same password (due to salt)", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom(
                        "!",
                        "@",
                        "#",
                        "$",
                        "%",
                        "^",
                        "&",
                        "*",
                        "(",
                        ")",
                        "_",
                        "+",
                        "-",
                        "=",
                        "[",
                        "]",
                        "{",
                        "}",
                        ";",
                        "'",
                        ":",
                        '"',
                        "\\",
                        "|",
                        ",",
                        ".",
                        "<",
                        ">",
                        "/",
                        "?"
                    )
                ),
                async ([base, num, special]) => {
                    // Construct a valid password
                    const password = `Aa${base}${num}${special}`.padEnd(8, "x")

                    // Hash the same password multiple times
                    const hash1 = await hashPassword(password)
                    const hash2 = await hashPassword(password)
                    const hash3 = await hashPassword(password)

                    // Property: Different hashes should be produced (due to random salt)
                    expect(hash1).not.toBe(hash2)
                    expect(hash2).not.toBe(hash3)
                    expect(hash1).not.toBe(hash3)

                    // Property: All hashes should be valid bcrypt hashes
                    // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters
                    expect(hash1).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/)
                    expect(hash2).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/)
                    expect(hash3).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/)
                }
            ),
            { numRuns: 10 }
        )
    }, 30000)

    it("should verify the same password against all its hashes", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom(
                        "!",
                        "@",
                        "#",
                        "$",
                        "%",
                        "^",
                        "&",
                        "*",
                        "(",
                        ")",
                        "_",
                        "+",
                        "-",
                        "=",
                        "[",
                        "]",
                        "{",
                        "}",
                        ";",
                        "'",
                        ":",
                        '"',
                        "\\",
                        "|",
                        ",",
                        ".",
                        "<",
                        ">",
                        "/",
                        "?"
                    )
                ),
                async ([base, num, special]) => {
                    // Construct a valid password
                    const password = `Aa${base}${num}${special}`.padEnd(8, "x")

                    // Hash the same password multiple times
                    const hash1 = await hashPassword(password)
                    const hash2 = await hashPassword(password)
                    const hash3 = await hashPassword(password)

                    // Property: Verification should succeed for all hashes
                    const verify1 = await comparePassword(password, hash1)
                    const verify2 = await comparePassword(password, hash2)
                    const verify3 = await comparePassword(password, hash3)

                    expect(verify1).toBe(true)
                    expect(verify2).toBe(true)
                    expect(verify3).toBe(true)
                }
            ),
            { numRuns: 10 }
        )
    }, 30000)

    it("should fail verification for different passwords", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom(
                        "!",
                        "@",
                        "#",
                        "$",
                        "%",
                        "^",
                        "&",
                        "*",
                        "(",
                        ")",
                        "_",
                        "+",
                        "-",
                        "=",
                        "[",
                        "]",
                        "{",
                        "}",
                        ";",
                        "'",
                        ":",
                        '"',
                        "\\",
                        "|",
                        ",",
                        ".",
                        "<",
                        ">",
                        "/",
                        "?"
                    ),
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom(
                        "!",
                        "@",
                        "#",
                        "$",
                        "%",
                        "^",
                        "&",
                        "*",
                        "(",
                        ")",
                        "_",
                        "+",
                        "-",
                        "=",
                        "[",
                        "]",
                        "{",
                        "}",
                        ";",
                        "'",
                        ":",
                        '"',
                        "\\",
                        "|",
                        ",",
                        ".",
                        "<",
                        ">",
                        "/",
                        "?"
                    )
                ),
                async ([base1, num1, special1, base2, num2, special2]) => {
                    // Construct two different passwords
                    const password1 = `Aa${base1}${num1}${special1}`.padEnd(
                        8,
                        "x"
                    )
                    const password2 = `Bb${base2}${num2}${special2}`.padEnd(
                        8,
                        "y"
                    )

                    // Only test if passwords are actually different
                    if (password1 === password2) {
                        return
                    }

                    // Hash the first password
                    const hash1 = await hashPassword(password1)

                    // Property: Verification should fail for different password
                    const verify = await comparePassword(password2, hash1)

                    expect(verify).toBe(false)
                }
            ),
            { numRuns: 10 }
        )
    }, 30000)

    it("should use bcrypt with cost factor of at least 10", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom(
                        "!",
                        "@",
                        "#",
                        "$",
                        "%",
                        "^",
                        "&",
                        "*",
                        "(",
                        ")",
                        "_",
                        "+",
                        "-",
                        "=",
                        "[",
                        "]",
                        "{",
                        "}",
                        ";",
                        "'",
                        ":",
                        '"',
                        "\\",
                        "|",
                        ",",
                        ".",
                        "<",
                        ">",
                        "/",
                        "?"
                    )
                ),
                async ([base, num, special]) => {
                    // Construct a valid password
                    const password = `Aa${base}${num}${special}`.padEnd(8, "x")

                    // Hash the password
                    const hash = await hashPassword(password)

                    // Property: Hash should be in bcrypt format with cost factor
                    // Bcrypt format: $2a$12$... or $2b$12$... (12 is the cost factor)
                    // Cost factor should be at least 10
                    const costFactorMatch = hash.match(/^\$2[aby]\$(\d{2})\$/)
                    expect(costFactorMatch).not.toBeNull()

                    if (costFactorMatch) {
                        const costFactor = parseInt(costFactorMatch[1], 10)
                        // Property: Cost factor should be at least 10
                        expect(costFactor).toBeGreaterThanOrEqual(10)
                    }
                }
            ),
            { numRuns: 10 }
        )
    }, 30000)

    it("should handle edge cases gracefully", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    "ValidPass123!",
                    "AnotherPass456@",
                    "ThirdPass789#",
                    "FourthPass000$",
                    "FifthPass111%"
                ),
                async password => {
                    // Property: Should be able to hash and verify valid passwords
                    const hash = await hashPassword(password)
                    const isMatch = await comparePassword(password, hash)

                    expect(isMatch).toBe(true)

                    // Property: Hash should be a valid bcrypt hash
                    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/)
                }
            ),
            { numRuns: 10 }
        )
    }, 30000)

    it("should maintain security properties across multiple hashing operations", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom(
                        "!",
                        "@",
                        "#",
                        "$",
                        "%",
                        "^",
                        "&",
                        "*",
                        "(",
                        ")",
                        "_",
                        "+",
                        "-",
                        "=",
                        "[",
                        "]",
                        "{",
                        "}",
                        ";",
                        "'",
                        ":",
                        '"',
                        "\\",
                        "|",
                        ",",
                        ".",
                        "<",
                        ">",
                        "/",
                        "?"
                    )
                ),
                async ([base, num, special]) => {
                    // Construct a valid password
                    const password = `Aa${base}${num}${special}`.padEnd(8, "x")

                    // Hash the password 5 times
                    const hashes = await Promise.all([
                        hashPassword(password),
                        hashPassword(password),
                        hashPassword(password),
                        hashPassword(password),
                        hashPassword(password),
                    ])

                    // Property: All hashes should be different (due to random salt)
                    const uniqueHashes = new Set(hashes)
                    expect(uniqueHashes.size).toBe(5)

                    // Property: All hashes should verify correctly
                    const verifications = await Promise.all(
                        hashes.map(hash => comparePassword(password, hash))
                    )

                    verifications.forEach(result => {
                        expect(result).toBe(true)
                    })
                }
            ),
            { numRuns: 10 }
        )
    }, 30000)
})
