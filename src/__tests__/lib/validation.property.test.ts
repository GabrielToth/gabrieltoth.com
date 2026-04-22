/**
 * Property-Based Tests for Validation Functions
 * Tests universal properties of validation using fast-check
 * Validates: Requirements 2.3, 3.4, 7.1, 7.2, 7.3, 7.4, 7.5, 10.4, 2.3, 9.1
 */

import {
    validateEmail,
    validateName,
    validateNameNotOnlyNumbersOrSpecialChars,
    validatePassword,
} from "@/lib/validation"
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
            { numRuns: 20 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 10 }
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
            { numRuns: 20 }
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
            { numRuns: 10 }
        )
    })
})

describe("Property 8: Name Validation", () => {
    /**
     * **Validates: Requirements 4.3, 11.1, 11.2, 11.3**
     *
     * Property: For any name string, the name validator SHALL correctly validate
     * that the name is not empty, contains at least 2 characters, and contains only
     * letters, spaces, hyphens, and apostrophes. Valid names SHALL pass validation,
     * invalid names SHALL fail validation.
     */
    it("should correctly validate name format for any name string", () => {
        fc.assert(
            fc.property(fc.string(), name => {
                const result = validateName(name)

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
            { numRuns: 50 }
        )
    })

    it("should reject empty or null names", () => {
        fc.assert(
            fc.property(
                fc.oneof(fc.constant(""), fc.constant(null as any)),
                name => {
                    const result = validateName(name)

                    // Property: empty or null names are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("required")
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should reject names with less than 2 characters", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 1 })
                    .filter(s => s.trim().length > 0),
                name => {
                    const result = validateName(name)

                    // Property: names with less than 2 characters are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("2 characters")
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should accept names with 2 or more letters", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 25 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 25 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([part1, part2]) => {
                    const name = `${part1} ${part2}`

                    const result = validateName(name)

                    // Property: names with 2+ letters should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should accept names with spaces", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([firstName, lastName]) => {
                    const name = `${firstName} ${lastName}`

                    const result = validateName(name)

                    // Property: names with spaces should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should accept names with hyphens", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([part1, part2]) => {
                    const name = `${part1}-${part2}`

                    const result = validateName(name)

                    // Property: names with hyphens should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should accept names with apostrophes", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([part1, part2]) => {
                    const name = `${part1}'${part2}`

                    const result = validateName(name)

                    // Property: names with apostrophes should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject names with numbers", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc.integer({ min: 0, max: 9 })
                ),
                ([name, digit]) => {
                    const invalidName = `${name}${digit}`

                    const result = validateName(invalidName)

                    // Property: names with numbers are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain(
                        "letters, spaces, hyphens, and apostrophes"
                    )
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject names with special characters", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc.constantFrom(
                        "@",
                        "#",
                        "$",
                        "%",
                        "!",
                        "&",
                        "*",
                        ".",
                        ",",
                        "?"
                    )
                ),
                ([name, specialChar]) => {
                    const invalidName = `${name}${specialChar}`

                    const result = validateName(invalidName)

                    // Property: names with special characters are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain(
                        "letters, spaces, hyphens, and apostrophes"
                    )
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should trim whitespace from name before validation", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 25 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 25 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([part1, part2]) => {
                    const name = `${part1} ${part2}`
                    const trimmedName = `  ${name}  `

                    const result = validateName(trimmedName)

                    // Property: names with surrounding whitespace should be trimmed and validated
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should validate the same name consistently across multiple calls", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 50 })
                    .filter(s => /^[A-Za-z\s\-']+$/.test(s)),
                name => {
                    const result1 = validateName(name)
                    const result2 = validateName(name)
                    const result3 = validateName(name)

                    // Property: validating the same name multiple times yields identical results
                    expect(result1.isValid).toBe(result2.isValid)
                    expect(result2.isValid).toBe(result3.isValid)
                    expect(result1.error).toBe(result2.error)
                    expect(result2.error).toBe(result3.error)
                }
            ),
            { numRuns: 50 }
        )
    })
})

describe("Property 9: Name Rejection for Invalid Characters", () => {
    /**
     * **Validates: Requirements 11.4**
     *
     * Property: For any string composed entirely of numbers or special characters,
     * the name validator SHALL reject the string as invalid. Names must contain
     * at least some letters.
     */
    it("should reject names composed entirely of numbers", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => /^[0-9]+$/.test(s)),
                name => {
                    const result =
                        validateNameNotOnlyNumbersOrSpecialChars(name)

                    // Property: names with only numbers are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("letters")
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject names composed entirely of special characters", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s =>
                        /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(s)
                    ),
                name => {
                    const result =
                        validateNameNotOnlyNumbersOrSpecialChars(name)

                    // Property: names with only special characters are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("letters")
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should accept names with at least one letter", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 0, maxLength: 10 })
                        .filter(s =>
                            /^[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(
                                s
                            )
                        )
                ),
                ([letters, others]) => {
                    const name = `${letters}${others}`

                    const result =
                        validateNameNotOnlyNumbersOrSpecialChars(name)

                    // Property: names with at least one letter should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should accept empty strings (secondary validation)", () => {
        fc.assert(
            fc.property(fc.constant(""), name => {
                const result = validateNameNotOnlyNumbersOrSpecialChars(name)

                // Property: empty strings are accepted (primary validation handles this)
                expect(result.isValid).toBe(true)
            }),
            { numRuns: 10 }
        )
    })

    it("should validate consistently across multiple calls", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => /^[0-9]+$/.test(s)),
                name => {
                    const result1 =
                        validateNameNotOnlyNumbersOrSpecialChars(name)
                    const result2 =
                        validateNameNotOnlyNumbersOrSpecialChars(name)
                    const result3 =
                        validateNameNotOnlyNumbersOrSpecialChars(name)

                    // Property: validating the same name multiple times yields identical results
                    expect(result1.isValid).toBe(result2.isValid)
                    expect(result2.isValid).toBe(result3.isValid)
                    expect(result1.error).toBe(result2.error)
                    expect(result2.error).toBe(result3.error)
                }
            ),
            { numRuns: 50 }
        )
    })
})

describe("Property 4: Full Name Validation Correctness", () => {
    /**
     * **Validates: Requirements 4.3-4.5, 17.1-17.3**
     *
     * Property: For any name string, the validation function SHALL accept names
     * with 2+ characters and reject names with fewer than 2 characters. The function
     * SHALL accept names with letters, spaces, hyphens, and apostrophes, and SHALL
     * reject names with only numbers or special characters.
     */
    it("should accept all valid names with 2+ characters", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 100 })
                    .filter(
                        s => /^[A-Za-z\s\-']+$/.test(s) && s.trim().length >= 2
                    ),
                name => {
                    const result = validateName(name)

                    // Property: names with 2+ characters and valid characters are always accepted
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject all names with fewer than 2 characters", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 0, maxLength: 1 })
                    .filter(s => s.trim().length < 2),
                name => {
                    const result = validateName(name)

                    // Property: names with fewer than 2 characters are always rejected
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with letters, spaces, hyphens, and apostrophes", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc.constantFrom(" ", "-", "'"),
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([part1, separator, part2]) => {
                    const name = `${part1}${separator}${part2}`

                    const result = validateName(name)

                    // Property: names with allowed characters (letters, spaces, hyphens, apostrophes) are valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject names with only numbers", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 20 })
                    .filter(s => /^[0-9]+$/.test(s)),
                name => {
                    const result = validateName(name)

                    // Property: names with only numbers are always rejected
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain(
                        "letters, spaces, hyphens, and apostrophes"
                    )
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject names with only special characters", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 20 })
                    .filter(
                        s =>
                            /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(
                                s
                            ) && !/^[\-']+$/.test(s)
                    ),
                name => {
                    const result = validateName(name)

                    // Property: names with only special characters (excluding hyphens and apostrophes) are rejected
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should validate consistently across multiple invocations", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 50 })
                    .filter(
                        s => /^[A-Za-z\s\-']+$/.test(s) && s.trim().length >= 2
                    ),
                name => {
                    const result1 = validateName(name)
                    const result2 = validateName(name)
                    const result3 = validateName(name)
                    const result4 = validateName(name)
                    const result5 = validateName(name)

                    // Property: validating the same name multiple times yields identical results
                    expect(result1.isValid).toBe(result2.isValid)
                    expect(result2.isValid).toBe(result3.isValid)
                    expect(result3.isValid).toBe(result4.isValid)
                    expect(result4.isValid).toBe(result5.isValid)
                    expect(result1.error).toBe(result2.error)
                    expect(result2.error).toBe(result3.error)
                    expect(result3.error).toBe(result4.error)
                    expect(result4.error).toBe(result5.error)
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should handle edge cases: exactly 2 characters", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.constantFrom(
                        "A",
                        "B",
                        "C",
                        "D",
                        "E",
                        "F",
                        "G",
                        "H",
                        "I",
                        "J"
                    ),
                    fc.constantFrom(
                        "a",
                        "b",
                        "c",
                        "d",
                        "e",
                        "f",
                        "g",
                        "h",
                        "i",
                        "j"
                    )
                ),
                ([char1, char2]) => {
                    const name = `${char1}${char2}`

                    const result = validateName(name)

                    // Property: names with exactly 2 characters should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should handle edge cases: exactly 1 character", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    "A",
                    "B",
                    "C",
                    "D",
                    "E",
                    "F",
                    "G",
                    "H",
                    "I",
                    "J"
                ),
                char => {
                    const result = validateName(char)

                    // Property: names with exactly 1 character should be invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("2 characters")
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should trim whitespace and validate correctly", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^\s*$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^\s*$/.test(s))
                ),
                ([part1, part2, leadingSpace, trailingSpace]) => {
                    const name = `${leadingSpace}${part1} ${part2}${trailingSpace}`

                    const result = validateName(name)

                    // Property: names with surrounding whitespace should be trimmed and validated
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })
})

describe("Property 10: Final Data Validation Completeness", () => {
    /**
     * **Validates: Requirements 8.1-8.2**
     *
     * Property: For any registration data set, final validation before account creation
     * SHALL accept all valid data and reject any data with invalid fields.
     *
     * This property ensures that the final validation catches all invalid data before
     * account creation, preventing invalid data from being persisted to the database.
     *
     * The validation checks:
     * - All fields present (name, email, password, confirmPassword, phone)
     * - All fields valid according to their individual validators
     * - No partial validation (all fields must be checked)
     * - Consistent error reporting for invalid fields
     */
    it("should accept all valid registration data and reject any data with invalid fields", () => {
        fc.assert(
            fc.property(
                fc.record({
                    // Generate valid name (2+ letters)
                    name: fc
                        .tuple(
                            fc
                                .string({ minLength: 1, maxLength: 20 })
                                .filter(s => /^[A-Za-z]+$/.test(s)),
                            fc
                                .string({ minLength: 1, maxLength: 20 })
                                .filter(s => /^[A-Za-z]+$/.test(s))
                        )
                        .map(([first, last]) => `${first} ${last}`),
                    // Generate valid email
                    email: fc
                        .tuple(
                            fc
                                .string({ minLength: 1, maxLength: 10 })
                                .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                            fc
                                .string({ minLength: 1, maxLength: 10 })
                                .filter(s => /^[a-zA-Z0-9]+$/.test(s))
                        )
                        .map(([local, domain]) => `${local}@${domain}.com`),
                    // Generate valid password (8+ chars, uppercase, lowercase, number, special)
                    password: fc.string({ minLength: 8, maxLength: 20 }).map(
                        base => `${base}Aa1!` // Ensure all requirements are met
                    ),
                    // Generate valid phone (with country code)
                    phone: fc
                        .string({ minLength: 10, maxLength: 15 })
                        .filter(s => /^\d+$/.test(s))
                        .map(digits => `+1${digits}`),
                    // Flag to test invalid data
                    invalidField: fc.constantFrom(
                        null,
                        "name",
                        "email",
                        "password",
                        "confirmPassword",
                        "phone"
                    ),
                }),
                config => {
                    let testData: any = {
                        name: config.name,
                        email: config.email,
                        password: config.password,
                        confirmPassword: config.password,
                        phone: config.phone,
                    }

                    // Introduce invalid data based on flag
                    if (config.invalidField === "name") {
                        testData.name = "J" // Too short
                    } else if (config.invalidField === "email") {
                        testData.email = "invalid-email" // Invalid format
                    } else if (config.invalidField === "password") {
                        testData.password = "weak" // Too weak
                    } else if (config.invalidField === "confirmPassword") {
                        testData.confirmPassword = "DifferentPass123!" // Doesn't match
                    } else if (config.invalidField === "phone") {
                        testData.phone = "123" // Too short
                    }

                    const result = validateRegistrationForm(testData)

                    // Property: if no invalid field, validation should pass
                    if (config.invalidField === null) {
                        expect(result.isValid).toBe(true)
                        expect(Object.keys(result.errors).length).toBe(0)
                    } else {
                        // Property: if any field is invalid, validation should fail
                        expect(result.isValid).toBe(false)
                        expect(
                            Object.keys(result.errors).length
                        ).toBeGreaterThan(0)

                        // Property: error should be reported for the invalid field
                        if (config.invalidField === "name") {
                            expect(result.errors.name).toBeDefined()
                        } else if (config.invalidField === "email") {
                            expect(result.errors.email).toBeDefined()
                        } else if (config.invalidField === "password") {
                            expect(result.errors.password).toBeDefined()
                        } else if (config.invalidField === "confirmPassword") {
                            expect(result.errors.confirmPassword).toBeDefined()
                        } else if (config.invalidField === "phone") {
                            expect(result.errors.phone).toBeDefined()
                        }
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject data with multiple invalid fields", () => {
        fc.assert(
            fc.property(
                fc.record({
                    // Generate invalid name
                    name: fc.constantFrom("J", "123", "@#$"),
                    // Generate invalid email
                    email: fc.constantFrom(
                        "invalid",
                        "no-at-sign",
                        "@nodomain"
                    ),
                    // Generate invalid password
                    password: fc.constantFrom(
                        "weak",
                        "short",
                        "nouppercase123!"
                    ),
                    // Generate mismatched confirm password
                    confirmPassword: fc.string({ minLength: 8, maxLength: 20 }),
                    // Generate invalid phone
                    phone: fc.constantFrom("123", "abc", ""),
                }),
                config => {
                    const result = validateRegistrationForm(config)

                    // Property: validation should fail when multiple fields are invalid
                    expect(result.isValid).toBe(false)

                    // Property: errors should be reported for all invalid fields
                    expect(Object.keys(result.errors).length).toBeGreaterThan(0)

                    // Property: at least some of the fields should have errors
                    const hasNameError = result.errors.name !== undefined
                    const hasEmailError = result.errors.email !== undefined
                    const hasPasswordError =
                        result.errors.password !== undefined
                    const hasConfirmPasswordError =
                        result.errors.confirmPassword !== undefined
                    const hasPhoneError = result.errors.phone !== undefined

                    const errorCount = [
                        hasNameError,
                        hasEmailError,
                        hasPasswordError,
                        hasConfirmPasswordError,
                        hasPhoneError,
                    ].filter(Boolean).length

                    expect(errorCount).toBeGreaterThan(0)
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should validate all fields independently and report all errors", () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string(),
                    email: fc.string(),
                    password: fc.string(),
                    confirmPassword: fc.string(),
                    phone: fc.option(fc.string()),
                }),
                data => {
                    const result = validateRegistrationForm(data)

                    // Property: result always has isValid and errors properties
                    expect(result).toHaveProperty("isValid")
                    expect(result).toHaveProperty("errors")
                    expect(typeof result.isValid).toBe("boolean")
                    expect(typeof result.errors).toBe("object")

                    // Property: if isValid is true, errors object should be empty
                    if (result.isValid) {
                        expect(Object.keys(result.errors).length).toBe(0)
                    }

                    // Property: if isValid is false, errors object should have at least one error
                    if (!result.isValid) {
                        expect(
                            Object.keys(result.errors).length
                        ).toBeGreaterThan(0)
                    }

                    // Property: all error values should be non-empty strings
                    Object.values(result.errors).forEach(error => {
                        expect(typeof error).toBe("string")
                        expect(error.length).toBeGreaterThan(0)
                    })
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept valid data with all required fields present", () => {
        fc.assert(
            fc.property(
                fc.record({
                    // Valid name
                    name: fc
                        .tuple(
                            fc
                                .string({ minLength: 1, maxLength: 15 })
                                .filter(s => /^[A-Za-z]+$/.test(s)),
                            fc
                                .string({ minLength: 1, maxLength: 15 })
                                .filter(s => /^[A-Za-z]+$/.test(s))
                        )
                        .map(([first, last]) => `${first} ${last}`),
                    // Valid email
                    email: fc.emailAddress(),
                    // Valid password
                    password: fc
                        .string({ minLength: 8, maxLength: 20 })
                        .map(base => `${base}Aa1!`),
                    // Valid phone
                    phone: fc
                        .string({ minLength: 10, maxLength: 15 })
                        .filter(s => /^\d+$/.test(s))
                        .map(digits => `+1${digits}`),
                }),
                data => {
                    const testData = {
                        ...data,
                        confirmPassword: data.password,
                    }

                    const result = validateRegistrationForm(testData)

                    // Property: all valid data should pass validation
                    expect(result.isValid).toBe(true)
                    expect(Object.keys(result.errors).length).toBe(0)
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should reject data with empty required fields", () => {
        fc.assert(
            fc.property(
                fc.constantFrom("name", "email", "password", "confirmPassword"),
                emptyField => {
                    const validData = {
                        name: "John Doe",
                        email: "john@example.com",
                        password: "ValidPass123!",
                        confirmPassword: "ValidPass123!",
                        phone: "+15551234567",
                    }

                    // Set one field to empty
                    const testData = {
                        ...validData,
                        [emptyField]: "",
                    }

                    const result = validateRegistrationForm(testData)

                    // Property: validation should fail when required field is empty
                    expect(result.isValid).toBe(false)
                    expect(result.errors[emptyField]).toBeDefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should validate password confirmation matches password", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 8, maxLength: 20 })
                        .map(base => `${base}Aa1!`),
                    fc.boolean()
                ),
                ([password, shouldMatch]) => {
                    const confirmPassword = shouldMatch
                        ? password
                        : password + "Different"

                    const result = validateRegistrationForm({
                        name: "John Doe",
                        email: "john@example.com",
                        password,
                        confirmPassword,
                        phone: "+15551234567",
                    })

                    // Property: if passwords match, no error for confirmPassword
                    if (shouldMatch) {
                        expect(result.errors.confirmPassword).toBeUndefined()
                    } else {
                        // Property: if passwords don't match, error for confirmPassword
                        expect(result.errors.confirmPassword).toBeDefined()
                        expect(result.errors.confirmPassword).toContain("match")
                    }
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should handle optional phone field correctly", () => {
        fc.assert(
            fc.property(
                fc.option(
                    fc
                        .string({ minLength: 10, maxLength: 15 })
                        .filter(s => /^\d+$/.test(s))
                        .map(digits => `+1${digits}`)
                ),
                phone => {
                    const result = validateRegistrationForm({
                        name: "John Doe",
                        email: "john@example.com",
                        password: "ValidPass123!",
                        confirmPassword: "ValidPass123!",
                        phone: phone || undefined,
                    })

                    // Property: validation should pass with or without phone
                    expect(result.isValid).toBe(true)
                    expect(result.errors.phone).toBeUndefined()
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should validate consistently across multiple calls with same data", () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc
                        .tuple(
                            fc
                                .string({ minLength: 1, maxLength: 15 })
                                .filter(s => /^[A-Za-z]+$/.test(s)),
                            fc
                                .string({ minLength: 1, maxLength: 15 })
                                .filter(s => /^[A-Za-z]+$/.test(s))
                        )
                        .map(([first, last]) => `${first} ${last}`),
                    email: fc.emailAddress(),
                    password: fc
                        .string({ minLength: 8, maxLength: 20 })
                        .map(base => `${base}Aa1!`),
                    phone: fc
                        .string({ minLength: 10, maxLength: 15 })
                        .filter(s => /^\d+$/.test(s))
                        .map(digits => `+1${digits}`),
                }),
                data => {
                    const testData = {
                        ...data,
                        confirmPassword: data.password,
                    }

                    // Validate the same data multiple times
                    const result1 = validateRegistrationForm(testData)
                    const result2 = validateRegistrationForm(testData)
                    const result3 = validateRegistrationForm(testData)

                    // Property: validation results should be consistent across multiple calls
                    expect(result1.isValid).toBe(result2.isValid)
                    expect(result2.isValid).toBe(result3.isValid)
                    expect(JSON.stringify(result1.errors)).toBe(
                        JSON.stringify(result2.errors)
                    )
                    expect(JSON.stringify(result2.errors)).toBe(
                        JSON.stringify(result3.errors)
                    )
                }
            ),
            { numRuns: 50 }
        )
    })

    it("should catch all invalid fields in a single validation call", () => {
        fc.assert(
            fc.property(
                fc.record({
                    // Invalid name (too short)
                    invalidName: fc.constantFrom("J", "1", "@"),
                    // Invalid email (no @)
                    invalidEmail: fc.constantFrom(
                        "nodomain",
                        "no-at",
                        "invalid"
                    ),
                    // Invalid password (too weak)
                    invalidPassword: fc.constantFrom(
                        "weak",
                        "short",
                        "nouppercase"
                    ),
                    // Mismatched confirm password
                    mismatchedConfirm: fc.boolean(),
                    // Invalid phone (too short)
                    invalidPhone: fc.constantFrom("123", "abc", ""),
                }),
                config => {
                    const result = validateRegistrationForm({
                        name: config.invalidName,
                        email: config.invalidEmail,
                        password: config.invalidPassword,
                        confirmPassword: config.mismatchedConfirm
                            ? "DifferentPass123!"
                            : config.invalidPassword,
                        phone: config.invalidPhone,
                    })

                    // Property: validation should fail
                    expect(result.isValid).toBe(false)

                    // Property: should report errors for invalid fields
                    expect(result.errors.name).toBeDefined()
                    expect(result.errors.email).toBeDefined()
                    expect(result.errors.password).toBeDefined()

                    // Property: should report error for mismatched passwords
                    if (config.mismatchedConfirm) {
                        expect(result.errors.confirmPassword).toBeDefined()
                    }

                    // Property: should report error for invalid phone
                    expect(result.errors.phone).toBeDefined()
                }
            ),
            { numRuns: 50 }
        )
    })
})
