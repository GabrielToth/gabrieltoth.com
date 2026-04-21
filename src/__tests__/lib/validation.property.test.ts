/**
 * Property-Based Tests for Password Validation
 * Feature: oauth-password-requirement
 * Tests universal properties of password validation using fast-check
 * Validates: Requirements 2.3, 3.4, 7.1, 7.2, 7.3, 7.4, 7.5, 10.4
 */

import { validatePassword } from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 1: Password Validation Completeness", () => {
    /**
     * **Validates: Requirements 2.3, 3.4, 7.1, 7.2, 7.3, 7.4, 7.5, 10.4**
     *
     * Property: For any password string, the password validator SHALL correctly
     * identify whether it meets ALL security requirements (minimum 8 characters,
     * at least one uppercase letter, at least one lowercase letter, at least one
     * number, at least one special character), and SHALL provide specific feedback
     * for each unmet requirement.
     */
    it("should correctly validate all password requirements for any password string", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = validatePassword(password)

                // Property: validation result is consistent with actual password characteristics
                const hasMinLength = password.length >= 8
                const hasUppercase = /[A-Z]/.test(password)
                const hasLowercase = /[a-z]/.test(password)
                const hasNumber = /[0-9]/.test(password)
                const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                    password
                )

                // Verify each requirement is correctly identified
                expect(result.requirements.minLength).toBe(hasMinLength)
                expect(result.requirements.hasUppercase).toBe(hasUppercase)
                expect(result.requirements.hasLowercase).toBe(hasLowercase)
                expect(result.requirements.hasNumber).toBe(hasNumber)
                expect(result.requirements.hasSpecial).toBe(hasSpecial)

                // Property: isValid is true only when ALL requirements are met
                const shouldBeValid =
                    hasMinLength &&
                    hasUppercase &&
                    hasLowercase &&
                    hasNumber &&
                    hasSpecial &&
                    result.requirements.notCommon

                expect(result.isValid).toBe(shouldBeValid)

                // Property: error message is provided when invalid
                if (!result.isValid) {
                    expect(result.error).toBeDefined()
                    expect(typeof result.error).toBe("string")
                    expect(result.error!.length).toBeGreaterThan(0)

                    // Property: error message is specific to the first unmet requirement
                    // Empty/null passwords get "Password is required" message
                    if (!password || password === "") {
                        expect(result.error).toContain("required")
                    } else if (!hasMinLength) {
                        expect(result.error).toContain("8 characters")
                    } else if (!hasUppercase) {
                        expect(result.error).toContain("uppercase")
                    } else if (!hasLowercase) {
                        expect(result.error).toContain("lowercase")
                    } else if (!hasNumber) {
                        expect(result.error).toContain("number")
                    } else if (!hasSpecial) {
                        expect(result.error).toContain("special character")
                    } else if (!result.requirements.notCommon) {
                        expect(result.error).toContain("common")
                    }
                } else {
                    // Property: no error when valid
                    expect(result.error).toBeUndefined()
                }

                // Property: strength is always defined
                expect(result.strength).toBeDefined()
                expect(["weak", "medium", "strong"]).toContain(result.strength)
            }),
            { numRuns: 50 }
        )
    })

    it("should correctly identify requirement satisfaction for passwords with known characteristics", () => {
        fc.assert(
            fc.property(
                fc.record({
                    base: fc.string({ minLength: 8, maxLength: 20 }),
                    hasUpper: fc.boolean(),
                    hasLower: fc.boolean(),
                    hasDigit: fc.boolean(),
                    hasSpecial: fc.boolean(),
                }),
                config => {
                    // Build password with specific characteristics
                    let password = config.base

                    if (config.hasUpper) {
                        password = "A" + password
                    }
                    if (config.hasLower) {
                        password = "a" + password
                    }
                    if (config.hasDigit) {
                        password = "1" + password
                    }
                    if (config.hasSpecial) {
                        password = "!" + password
                    }

                    const result = validatePassword(password)

                    // Property: validator correctly identifies each characteristic
                    if (config.hasUpper) {
                        expect(result.requirements.hasUppercase).toBe(true)
                    }
                    if (config.hasLower) {
                        expect(result.requirements.hasLowercase).toBe(true)
                    }
                    if (config.hasDigit) {
                        expect(result.requirements.hasNumber).toBe(true)
                    }
                    if (config.hasSpecial) {
                        expect(result.requirements.hasSpecial).toBe(true)
                    }

                    // Property: minimum length is always checked correctly
                    expect(result.requirements.minLength).toBe(
                        password.length >= 8
                    )
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should provide detailed feedback for UI rendering", () => {
        fc.assert(
            fc.property(fc.string(), password => {
                const result = validatePassword(password)

                // Property: requirements object is always complete
                expect(result.requirements).toBeDefined()
                expect(result.requirements).toHaveProperty("minLength")
                expect(result.requirements).toHaveProperty("hasUppercase")
                expect(result.requirements).toHaveProperty("hasLowercase")
                expect(result.requirements).toHaveProperty("hasNumber")
                expect(result.requirements).toHaveProperty("hasSpecial")
                expect(result.requirements).toHaveProperty("notCommon")

                // Property: all requirement values are boolean
                expect(typeof result.requirements.minLength).toBe("boolean")
                expect(typeof result.requirements.hasUppercase).toBe("boolean")
                expect(typeof result.requirements.hasLowercase).toBe("boolean")
                expect(typeof result.requirements.hasNumber).toBe("boolean")
                expect(typeof result.requirements.hasSpecial).toBe("boolean")
                expect(typeof result.requirements.notCommon).toBe("boolean")

                // Property: isValid is boolean
                expect(typeof result.isValid).toBe("boolean")

                // Property: strength is one of the allowed values
                expect(["weak", "medium", "strong"]).toContain(result.strength)
            }),
            { numRuns: 50 }
        )
    })

    it("should handle edge cases consistently", () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(""),
                    fc.constant(null as any),
                    fc.constant(undefined as any),
                    fc.string({ maxLength: 7 }),
                    fc.string({ minLength: 8, maxLength: 100 })
                ),
                password => {
                    const result = validatePassword(password)

                    // Property: validator always returns a valid result structure
                    expect(result).toBeDefined()
                    expect(result).toHaveProperty("isValid")
                    expect(result).toHaveProperty("requirements")
                    expect(result).toHaveProperty("strength")

                    // Property: empty/null/undefined passwords are always invalid
                    if (!password || password === "") {
                        expect(result.isValid).toBe(false)
                        expect(result.error).toBeDefined()
                    }
                }
            ),
            { numRuns: 50 }
        )
    })
})
