/**
 * Property-Based Tests for Password Validation
 * Feature: oauth-password-requirement
 */

import { validatePassword } from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 1: Password Validation Completeness", () => {
    /**
     * **Validates: Requirements 2.3, 3.4, 7.1, 7.2, 7.3, 7.4, 7.5, 10.4**
     *
     * For any password string, the password validator SHALL correctly identify
     * whether it meets ALL security requirements (minimum 8 characters, at least
     * one uppercase letter, at least one lowercase letter, at least one number,
     * at least one special character), and SHALL provide specific feedback for
     * each unmet requirement.
     */
    it("should correctly validate all password requirements for any string", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = validatePassword(password)

                // Calculate expected requirements based on actual password characteristics
                const expectedRequirements = {
                    minLength: password.length >= 8,
                    hasUppercase: /[A-Z]/.test(password),
                    hasLowercase: /[a-z]/.test(password),
                    hasNumber: /[0-9]/.test(password),
                    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                        password
                    ),
                    // notCommon is checked by the validator's internal logic
                }

                // Property: validation result correctly identifies each requirement
                expect(result.requirements.minLength).toBe(
                    expectedRequirements.minLength
                )
                expect(result.requirements.hasUppercase).toBe(
                    expectedRequirements.hasUppercase
                )
                expect(result.requirements.hasLowercase).toBe(
                    expectedRequirements.hasLowercase
                )
                expect(result.requirements.hasNumber).toBe(
                    expectedRequirements.hasNumber
                )
                expect(result.requirements.hasSpecial).toBe(
                    expectedRequirements.hasSpecial
                )

                // Property: isValid is true only when ALL requirements are met
                const allRequirementsMet = Object.values(
                    result.requirements
                ).every(req => req === true)
                expect(result.isValid).toBe(allRequirementsMet)

                // Property: error message is provided when validation fails
                if (!result.isValid) {
                    expect(result.error).toBeDefined()
                    expect(typeof result.error).toBe("string")
                    expect(result.error!.length).toBeGreaterThan(0)
                }

                // Property: error message is specific to the first unmet requirement
                if (!result.isValid && result.error) {
                    // Special case: empty or invalid input returns "Password is required"
                    if (!password || typeof password !== "string") {
                        expect(result.error).toContain("required")
                    } else if (!expectedRequirements.minLength) {
                        expect(result.error).toContain("8 characters")
                    } else if (!expectedRequirements.hasUppercase) {
                        expect(result.error).toContain("uppercase")
                    } else if (!expectedRequirements.hasLowercase) {
                        expect(result.error).toContain("lowercase")
                    } else if (!expectedRequirements.hasNumber) {
                        expect(result.error).toContain("number")
                    } else if (!expectedRequirements.hasSpecial) {
                        expect(result.error).toContain("special character")
                    } else if (!result.requirements.notCommon) {
                        expect(result.error).toContain("common")
                    }
                }

                // Property: strength is always defined
                expect(result.strength).toBeDefined()
                expect(["weak", "medium", "strong"]).toContain(result.strength)
            }),
            { numRuns: 20 }
        )
    })

    it("should correctly validate passwords with all requirements met", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 10 }), // base string
                fc.integer({ min: 0, max: 9 }), // number
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
                ), // special char
                (base, num, special) => {
                    // Construct a password that meets all requirements
                    // Ensure it has uppercase, lowercase, number, special, and >= 8 chars
                    const password = `Aa${base}${num}${special}`.padEnd(8, "x")

                    const result = validatePassword(password)

                    // Property: passwords with all basic requirements should have correct requirement flags
                    expect(result.requirements.minLength).toBe(true)
                    expect(result.requirements.hasUppercase).toBe(true)
                    expect(result.requirements.hasLowercase).toBe(true)
                    expect(result.requirements.hasNumber).toBe(true)
                    expect(result.requirements.hasSpecial).toBe(true)

                    // Note: isValid might still be false if password is common
                    // but all structural requirements should be met
                }
            ),
            { numRuns: 20 }
        )
    })

    it("should provide specific error messages for each unmet requirement", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    { password: "short", expectedError: "8 characters" },
                    {
                        password: "lowercase123!",
                        expectedError: "uppercase",
                    },
                    {
                        password: "UPPERCASE123!",
                        expectedError: "lowercase",
                    },
                    { password: "NoNumbers!", expectedError: "number" },
                    {
                        password: "NoSpecial123",
                        expectedError: "special character",
                    }
                ),
                testCase => {
                    const result = validatePassword(testCase.password)

                    // Property: validation should fail for passwords missing requirements
                    expect(result.isValid).toBe(false)

                    // Property: error message should be specific to the unmet requirement
                    expect(result.error).toBeDefined()
                    expect(result.error!.toLowerCase()).toContain(
                        testCase.expectedError.toLowerCase()
                    )
                }
            ),
            { numRuns: 20 }
        )
    })

    it("should handle edge cases gracefully", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    "", // empty string
                    " ", // whitespace
                    "        ", // 8 spaces
                    "12345678", // only numbers
                    "abcdefgh", // only lowercase
                    "ABCDEFGH", // only uppercase
                    "!@#$%^&*", // only special chars
                    "\n\t\r", // control characters
                    "🔒🔑🔐🔓🔔🔕🔖🔗" // unicode/emoji
                ),
                password => {
                    const result = validatePassword(password)

                    // Property: validator should always return a valid result structure
                    expect(result).toBeDefined()
                    expect(typeof result.isValid).toBe("boolean")
                    expect(result.requirements).toBeDefined()
                    expect(typeof result.requirements.minLength).toBe("boolean")
                    expect(typeof result.requirements.hasUppercase).toBe(
                        "boolean"
                    )
                    expect(typeof result.requirements.hasLowercase).toBe(
                        "boolean"
                    )
                    expect(typeof result.requirements.hasNumber).toBe("boolean")
                    expect(typeof result.requirements.hasSpecial).toBe(
                        "boolean"
                    )
                    expect(typeof result.requirements.notCommon).toBe("boolean")

                    // Property: strength should always be defined
                    expect(result.strength).toBeDefined()
                    expect(["weak", "medium", "strong"]).toContain(
                        result.strength
                    )
                }
            ),
            { numRuns: 20 }
        )
    })

    it("should maintain consistency across multiple validations of the same password", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                // Property: validating the same password multiple times should yield identical results
                const result1 = validatePassword(password)
                const result2 = validatePassword(password)
                const result3 = validatePassword(password)

                expect(result1.isValid).toBe(result2.isValid)
                expect(result2.isValid).toBe(result3.isValid)

                expect(result1.error).toBe(result2.error)
                expect(result2.error).toBe(result3.error)

                expect(result1.strength).toBe(result2.strength)
                expect(result2.strength).toBe(result3.strength)

                expect(result1.requirements).toEqual(result2.requirements)
                expect(result2.requirements).toEqual(result3.requirements)
            }),
            { numRuns: 20 }
        )
    })

    it("should correctly calculate password strength based on met requirements", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = validatePassword(password)

                // Count how many requirements are met
                const metRequirements = Object.values(
                    result.requirements
                ).filter(req => req === true).length

                // Property: strength should correlate with number of met requirements
                if (metRequirements <= 2) {
                    expect(result.strength).toBe("weak")
                } else if (metRequirements <= 4) {
                    expect(result.strength).toBe("medium")
                } else {
                    expect(result.strength).toBe("strong")
                }
            }),
            { numRuns: 20 }
        )
    })
})
