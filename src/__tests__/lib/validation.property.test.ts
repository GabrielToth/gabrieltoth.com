/**
 * Property-Based Tests for Validation Functions
 * Tests universal properties of validation using fast-check
 * Validates: Requirements 2.3, 3.4, 7.1, 7.2, 7.3, 7.4, 7.5, 10.4, 2.3, 9.1
 */

import { validateEmail, validatePassword } from "@/lib/validation"
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

describe("Property 2: Email Format Validation", () => {
    /**
     * **Validates: Requirements 2.3, 9.1**
     *
     * Property: For any email string, the email validator SHALL correctly
     * validate RFC 5322 email format. Valid emails SHALL pass validation,
     * invalid emails SHALL fail validation, and edge cases SHALL be handled
     * consistently.
     */
    it("should correctly validate RFC 5322 email format for any email string", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s))
                ),
                ([localPart, domain]) => {
                    // Build a valid email with alphanumeric characters
                    const email = `${localPart}@${domain}.com`

                    const result = validateEmail(email)

                    // Property: emails with valid format should pass validation
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject emails with invalid format", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    fc.string({ minLength: 1, maxLength: 20 })
                ),
                ([localPart, domain]) => {
                    // Generate invalid emails by removing @ symbol
                    const invalidEmail = `${localPart}${domain}`

                    const result = validateEmail(invalidEmail)

                    // Property: emails without @ are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject emails with missing domain", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                localPart => {
                    const invalidEmail = `${localPart}@`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with @ but no domain are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject emails with missing local part", () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 20 }), domain => {
                const invalidEmail = `@${domain}`

                const result = validateEmail(invalidEmail)

                // Property: emails with @ but no local part are always invalid
                expect(result.isValid).toBe(false)
                expect(result.error).toBeDefined()
            }),
            { numRuns: 50 }
        )
    })

    it("should reject emails with consecutive dots in local part", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.string({ minLength: 1, maxLength: 10 })
                ),
                ([part1, part2]) => {
                    const invalidEmail = `${part1}..${part2}@example.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with consecutive dots are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject emails with leading dot in local part", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                localPart => {
                    const invalidEmail = `.${localPart}@example.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with leading dot in local part are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject emails with trailing dot in local part", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                localPart => {
                    const invalidEmail = `${localPart}.@example.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with trailing dot in local part are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject emails with leading hyphen in domain", () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 20 }), domain => {
                const invalidEmail = `user@-${domain}.com`

                const result = validateEmail(invalidEmail)

                // Property: emails with leading hyphen in domain are always invalid
                expect(result.isValid).toBe(false)
                expect(result.error).toBeDefined()
            }),
            { numRuns: 50 }
        )
    })

    it("should reject emails with trailing hyphen in domain", () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 20 }), domain => {
                const invalidEmail = `user@${domain}-.com`

                const result = validateEmail(invalidEmail)

                // Property: emails with trailing hyphen in domain are always invalid
                expect(result.isValid).toBe(false)
                expect(result.error).toBeDefined()
            }),
            { numRuns: 50 }
        )
    })

    it("should reject empty or null emails", () => {
        fc.assert(
            fc.property(
                fc.oneof(fc.constant(""), fc.constant(null as any)),
                email => {
                    const result = validateEmail(email)

                    // Property: empty or null emails are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should reject emails with spaces", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.string({ minLength: 1, maxLength: 10 })
                ),
                ([part1, part2]) => {
                    const invalidEmail = `${part1} ${part2}@example.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with spaces are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should trim whitespace from email before validation", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s))
                ),
                ([localPart, domain]) => {
                    const email = `${localPart}@${domain}.com`
                    const trimmedEmail = `  ${email}  `

                    const result = validateEmail(trimmedEmail)

                    // Property: emails with surrounding whitespace should be trimmed and validated
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should accept emails with valid special characters in local part", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc.constantFrom("+", "_", "-")
                ),
                ([localPart, specialChar]) => {
                    // Build email with special character
                    const email = `user${specialChar}${localPart}@example.com`

                    const result = validateEmail(email)

                    // Property: emails with valid special characters should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should accept emails with multiple domain levels", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s))
                ),
                ([subdomain, domain, tld]) => {
                    const email = `user@${subdomain}.${domain}.${tld}`

                    const result = validateEmail(email)

                    // Property: emails with multiple domain levels should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should always return a consistent result structure", () => {
        fc.assert(
            fc.property(fc.string(), email => {
                const result = validateEmail(email)

                // Property: result always has isValid property
                expect(result).toHaveProperty("isValid")
                expect(typeof result.isValid).toBe("boolean")

                // Property: error is either undefined or a string
                if (result.error !== undefined) {
                    expect(typeof result.error).toBe("string")
                    expect(result.error.length).toBeGreaterThan(0)
                }

                // Property: if valid, no error should be present
                if (result.isValid) {
                    expect(result.error).toBeUndefined()
                }

                // Property: if invalid, error should be present
                if (!result.isValid) {
                    expect(result.error).toBeDefined()
                }
            }),
            { numRuns: 100 }
        )
    })

    it("should validate the same email consistently across multiple calls", () => {
        fc.assert(
            fc.property(fc.emailAddress(), email => {
                const result1 = validateEmail(email)
                const result2 = validateEmail(email)
                const result3 = validateEmail(email)

                // Property: validating the same email multiple times yields identical results
                expect(result1.isValid).toBe(result2.isValid)
                expect(result2.isValid).toBe(result3.isValid)
                expect(result1.error).toBe(result2.error)
                expect(result2.error).toBe(result3.error)
            }),
            { numRuns: 50 }
        )
    })
})
