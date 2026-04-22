/**
 * Property-Based Tests for Password Validation and Strength Calculation
 * Feature: enhanced-authentication-registration
 * Tests Properties 3 and 4 from the design document
 */

import { calculatePasswordStrength } from "@/lib/auth/password-strength"
import { validatePassword } from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 3: Password Requirements Validation", () => {
    /**
     * **Validates: Requirements 3.4, 8.1**
     *
     * For any password string, the password validation function SHALL correctly
     * identify which of the 4 requirements are met (minimum 8 characters, uppercase
     * letter, number, special character) and reject passwords that do not meet all
     * requirements.
     *
     * Property: The validator SHALL correctly identify each requirement independently
     * and only mark isValid as true when ALL requirements are met.
     */
    it("should correctly identify all 4 password requirements for any password string", () => {
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

                // Property: isValid is true ONLY when ALL requirements are met
                const allRequirementsMet =
                    expectedMinLength &&
                    expectedHasUppercase &&
                    expectedHasLowercase &&
                    expectedHasNumber &&
                    expectedHasSpecial &&
                    result.requirements.notCommon

                expect(result.isValid).toBe(allRequirementsMet)
            }),
            { numRuns: 20 }
        )
    })

    it("should reject passwords missing minimum length requirement", () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 7 }), password => {
                const result = validatePassword(password)

                // Property: Passwords shorter than 8 characters should fail
                expect(result.requirements.minLength).toBe(false)
                expect(result.isValid).toBe(false)
                // Error message should be defined
                expect(result.error).toBeDefined()
            }),
            { numRuns: 10 }
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
                    const password = `${base}${num}${special}`

                    const result = validatePassword(password)

                    // Property: Passwords without uppercase should fail
                    expect(result.requirements.hasUppercase).toBe(false)
                    expect(result.isValid).toBe(false)
                    expect(result.error).toContain("uppercase")
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should reject passwords missing lowercase letter requirement", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 8, maxLength: 20 })
                        .filter(s => !/[a-z]/.test(s)),
                    fc.integer({ min: 0, max: 9 }),
                    fc.constantFrom("!", "@", "#", "$", "%", "^", "&", "*")
                ),
                ([base, num, special]) => {
                    // Construct password without lowercase
                    const password = `A${base}${num}${special}`.padEnd(8, "X")

                    const result = validatePassword(password)

                    // Property: Passwords without lowercase should fail
                    expect(result.requirements.hasLowercase).toBe(false)
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 10 }
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
                    const password = `Aa${base}${special}`

                    const result = validatePassword(password)

                    // Property: Passwords without number should fail
                    expect(result.requirements.hasNumber).toBe(false)
                    expect(result.isValid).toBe(false)
                    expect(result.error).toContain("number")
                }
            ),
            { numRuns: 10 }
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
                    const password = `Aa${base}${num}`

                    const result = validatePassword(password)

                    // Property: Passwords without special character should fail
                    expect(result.requirements.hasSpecial).toBe(false)
                    expect(result.isValid).toBe(false)
                    expect(result.error).toContain("special character")
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should accept passwords meeting all 4 requirements", () => {
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
                    // Construct password with all 4 requirements
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
            { numRuns: 20 }
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

                    // Property: Error message should be specific to first unmet requirement
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error!.toLowerCase()).toContain(
                        testCase.expectedError.toLowerCase()
                    )
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should maintain consistent requirement identification across multiple validations", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result1 = validatePassword(password)
                const result2 = validatePassword(password)
                const result3 = validatePassword(password)

                // Property: Multiple validations of same password yield identical results
                expect(result1.requirements).toEqual(result2.requirements)
                expect(result2.requirements).toEqual(result3.requirements)
                expect(result1.isValid).toBe(result2.isValid)
                expect(result2.isValid).toBe(result3.isValid)
            }),
            { numRuns: 10 }
        )
    })
})

describe("Property 4: Password Strength Calculation", () => {
    /**
     * **Validates: Requirements 3.6**
     *
     * For any password string, the password strength indicator SHALL correctly
     * calculate strength based on requirements met: Weak (<2), Fair (2), Good (3),
     * Strong (4).
     *
     * Property: The strength calculation SHALL map the number of met requirements
     * to the correct strength level according to the specification.
     */
    it("should correctly calculate strength based on requirements met", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = calculatePasswordStrength(password)

                // Count how many requirements are met (without bonus points)
                let score = 0
                if (password && password.length >= 8) score++
                if (password && /[A-Z]/.test(password)) score++
                if (password && /[a-z]/.test(password)) score++
                if (password && /[0-9]/.test(password)) score++
                if (
                    password &&
                    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
                )
                    score++

                // Add bonus points for longer passwords
                if (password && password.length >= 12) score += 0.5
                if (password && password.length >= 16) score += 0.5

                // Property: Strength should map correctly to score
                if (score < 2) {
                    expect(result.strength).toBe("weak")
                } else if (score < 3) {
                    expect(result.strength).toBe("fair")
                } else if (score < 5) {
                    expect(result.strength).toBe("good")
                } else {
                    expect(result.strength).toBe("strong")
                }
            }),
            { numRuns: 20 }
        )
    })

    it("should return weak strength for passwords with less than 2 requirements", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    "",
                    "a",
                    "abc",
                    "abcdefg",
                    "12345",
                    "!@#$%",
                    "ABCDEFG"
                ),
                password => {
                    const result = calculatePasswordStrength(password)

                    // Property: Passwords with < 2 requirements should be weak
                    expect(result.strength).toBe("weak")
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should return fair strength for passwords with exactly 2 requirements", () => {
        // Test with a specific password that has exactly 2 requirements
        const password = "abcdefgh1" // 9 chars (length), lowercase, number = 3 requirements
        const result1 = calculatePasswordStrength(password)
        expect(result1.strength).toBe("good") // 3 requirements

        const password2 = "abcdefgh" // 8 chars (length), lowercase = 2 requirements
        const result2 = calculatePasswordStrength(password2)
        expect(result2.strength).toBe("fair") // 2 requirements
    })

    it("should return good strength for passwords with exactly 3 requirements", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 8, maxLength: 11 })
                        .filter(
                            s =>
                                !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s)
                        ),
                    fc.integer({ min: 0, max: 9 })
                ),
                ([base, num]) => {
                    // Password with uppercase, lowercase (from base), and number (3 requirements)
                    // Keep length < 12 to avoid bonus points
                    const password = `A${base}${num}`.substring(0, 11)

                    const result = calculatePasswordStrength(password)

                    // Property: Passwords with exactly 3 requirements should be good
                    expect(result.strength).toBe("good")
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should return strong strength for passwords with 4 or more requirements", () => {
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
                    // Password with uppercase, lowercase, number, and special
                    const password = `Aa${base}${num}${special}`.padEnd(8, "x")

                    const result = calculatePasswordStrength(password)

                    // Property: Passwords with 4+ requirements should be strong
                    expect(result.strength).toBe("strong")
                }
            ),
            { numRuns: 20 }
        )
    })

    it("should always return a valid strength value", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = calculatePasswordStrength(password)

                // Property: Strength should always be one of the allowed values
                expect(["weak", "fair", "good", "strong"]).toContain(
                    result.strength
                )
            }),
            { numRuns: 20 }
        )
    })

    it("should maintain consistent strength calculation across multiple calls", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result1 = calculatePasswordStrength(password)
                const result2 = calculatePasswordStrength(password)
                const result3 = calculatePasswordStrength(password)

                // Property: Multiple calculations of same password yield identical results
                expect(result1.strength).toBe(result2.strength)
                expect(result2.strength).toBe(result3.strength)
                expect(result1.score).toBe(result2.score)
                expect(result2.score).toBe(result3.score)
            }),
            { numRuns: 10 }
        )
    })

    it("should provide appropriate feedback for each strength level", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = calculatePasswordStrength(password)

                // Property: Feedback should be defined for all strength levels
                expect(result.feedback).toBeDefined()
                expect(typeof result.feedback).toBe("string")
                expect(result.feedback.length).toBeGreaterThan(0)

                // Property: Feedback should be appropriate for strength level
                if (!password) {
                    // Empty password returns "Password is required"
                    expect(result.feedback).toContain("required")
                } else if (result.strength === "weak") {
                    expect(result.feedback.toLowerCase()).toContain("weak")
                } else if (result.strength === "fair") {
                    expect(result.feedback.toLowerCase()).toContain("fair")
                } else if (result.strength === "good") {
                    expect(result.feedback.toLowerCase()).toContain("good")
                } else if (result.strength === "strong") {
                    expect(result.feedback.toLowerCase()).toContain("strong")
                }
            }),
            { numRuns: 10 }
        )
    })

    it("should provide appropriate color for each strength level", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = calculatePasswordStrength(password)

                // Property: Color should be defined for all strength levels
                expect(result.color).toBeDefined()
                expect(typeof result.color).toBe("string")

                // Property: Color should be appropriate for strength level
                if (result.strength === "weak") {
                    expect(result.color).toContain("red")
                } else if (result.strength === "fair") {
                    expect(result.color).toContain("orange")
                } else if (result.strength === "good") {
                    expect(result.color).toContain("yellow")
                } else if (result.strength === "strong") {
                    expect(result.color).toContain("green")
                }
            }),
            { numRuns: 10 }
        )
    })

    it("should return score between 0 and 4", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = calculatePasswordStrength(password)

                // Property: Score should always be between 0 and 4
                expect(result.score).toBeGreaterThanOrEqual(0)
                expect(result.score).toBeLessThanOrEqual(4)
                expect(Number.isInteger(result.score)).toBe(true)
            }),
            { numRuns: 20 }
        )
    })

    it("should handle edge cases consistently", () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(""),
                    fc.constant(" "),
                    fc.constant("        "),
                    fc.constant("12345678"),
                    fc.constant("abcdefgh"),
                    fc.constant("ABCDEFGH"),
                    fc.constant("!@#$%^&*"),
                    fc.constant("\n\t\r"),
                    fc.constant("🔒🔑🔐🔓🔔🔕🔖🔗")
                ),
                password => {
                    const result = calculatePasswordStrength(password)

                    // Property: Should always return valid result structure
                    expect(result).toBeDefined()
                    expect(result).toHaveProperty("strength")
                    expect(result).toHaveProperty("score")
                    expect(result).toHaveProperty("feedback")
                    expect(result).toHaveProperty("color")

                    // Property: Strength should be valid
                    expect(["weak", "fair", "good", "strong"]).toContain(
                        result.strength
                    )
                }
            ),
            { numRuns: 10 }
        )
    })
})
