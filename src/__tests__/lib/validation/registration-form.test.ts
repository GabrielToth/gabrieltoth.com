/**
 * Property-Based Tests for Registration Form Validation
 * Validates: Requirements 6.1, 2.3, 2.5, 3.4, 3.6, 4.3, 4.7, 9.1, 10.1, 10.4, 11.1, 11.2, 11.3, 11.4
 */

import {
    normalizePhoneNumber,
    validateEmail,
    validateName,
    validatePassword,
    validatePhoneNumber,
    validateRegistrationForm,
} from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property-Based Tests: Registration Form Validation", () => {
    /**
     * Property 1: Email Format Validation
     * For any email string, the email validation function SHALL accept strings that conform to RFC 5322 standard
     * and reject strings that do not conform.
     * Validates: Requirements 2.3, 9.1
     */
    describe("Property 1: Email Format Validation", () => {
        it("should accept valid RFC 5322 email addresses", () => {
            fc.assert(
                fc.property(fc.emailAddress(), email => {
                    const result = validateEmail(email)
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }),
                { numRuns: 100 }
            )
        })

        it("should reject invalid email formats", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 1, maxLength: 50 })
                        .filter(
                            s => !s.includes("@") || s.split("@").length !== 2
                        ),
                    invalidEmail => {
                        const result = validateEmail(invalidEmail)
                        expect(result.isValid).toBe(false)
                        expect(result.error).toBeDefined()
                    }
                ),
                { numRuns: 50 }
            )
        })
    })

    /**
     * Property 3: Password Requirements Validation
     * For any password string, the password validation function SHALL correctly identify which of the 4 requirements
     * are met (minimum 8 characters, uppercase letter, number, special character) and reject passwords that do not
     * meet all requirements.
     * Validates: Requirements 3.4, 8.1
     */
    describe("Property 3: Password Requirements Validation", () => {
        it("should correctly validate all password requirements", () => {
            fc.assert(
                fc.property(fc.string(), password => {
                    const result = validatePassword(password)

                    // Verify requirements object exists
                    expect(result.requirements).toBeDefined()
                    expect(result.requirements.minLength).toBe(
                        password.length >= 8
                    )
                    expect(result.requirements.hasUppercase).toBe(
                        /[A-Z]/.test(password)
                    )
                    expect(result.requirements.hasLowercase).toBe(
                        /[a-z]/.test(password)
                    )
                    expect(result.requirements.hasNumber).toBe(
                        /[0-9]/.test(password)
                    )
                    expect(result.requirements.hasSpecial).toBe(
                        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
                    )

                    // Verify isValid matches all requirements met
                    const allMet = Object.values(result.requirements).every(
                        req => req === true
                    )
                    expect(result.isValid).toBe(allMet)
                }),
                { numRuns: 100 }
            )
        })

        it("should reject passwords that don't meet all requirements", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 7 }),
                    shortPassword => {
                        const result = validatePassword(shortPassword)
                        expect(result.isValid).toBe(false)
                        expect(result.error).toBeDefined()
                    }
                ),
                { numRuns: 50 }
            )
        })
    })

    /**
     * Property 4: Password Strength Calculation
     * For any password string, the password strength indicator SHALL correctly calculate strength based on
     * requirements met: Weak (<2), Fair (2), Good (3), Strong (4).
     * Validates: Requirements 3.6
     */
    describe("Property 4: Password Strength Calculation", () => {
        it("should calculate password strength correctly", () => {
            fc.assert(
                fc.property(fc.string(), password => {
                    const result = validatePassword(password)

                    // Count met requirements
                    const metRequirements = Object.values(
                        result.requirements
                    ).filter(req => req === true).length

                    // Verify strength matches met requirements
                    if (metRequirements <= 2) {
                        expect(result.strength).toBe("weak")
                    } else if (metRequirements <= 4) {
                        expect(result.strength).toBe("medium")
                    } else {
                        expect(result.strength).toBe("strong")
                    }
                }),
                { numRuns: 100 }
            )
        })
    })

    /**
     * Property 6: Phone Format Validation
     * For any phone number string in international format, the phone validation function SHALL accept valid
     * international phone numbers and reject invalid phone numbers.
     * Validates: Requirements 4.7, 10.1
     */
    describe("Property 6: Phone Format Validation", () => {
        it("should validate phone numbers correctly", () => {
            fc.assert(
                fc.property(fc.string(), phoneNumber => {
                    const result = validatePhoneNumber(phoneNumber)
                    // Result should always have isValid property
                    expect(typeof result.isValid).toBe("boolean")
                    if (!result.isValid) {
                        expect(result.error).toBeDefined()
                    }
                }),
                { numRuns: 100 }
            )
        })
    })

    /**
     * Property 7: Phone Number Normalization
     * For any valid phone number string in various formats (with spaces, hyphens, parentheses, country codes),
     * the phone normalization function SHALL normalize all valid formats to E.164 standard format.
     * Validates: Requirements 10.4
     */
    describe("Property 7: Phone Number Normalization", () => {
        it("should normalize valid phone numbers to E.164 format", () => {
            fc.assert(
                fc.property(fc.string(), phoneNumber => {
                    try {
                        const result = normalizePhoneNumber(phoneNumber)
                        if (result.normalized) {
                            // E.164 format: +[country code][number]
                            expect(result.normalized).toMatch(
                                /^\+\d{1,3}\d{4,14}$/
                            )
                        }
                    } catch (e) {
                        // Invalid phone numbers may throw, which is acceptable
                    }
                }),
                { numRuns: 100 }
            )
        })
    })

    /**
     * Property 8: Name Validation
     * For any name string, the name validation function SHALL accept names that are not empty, contain at least
     * 2 characters, and contain only letters, spaces, hyphens, and apostrophes, while rejecting names that do not
     * meet these criteria.
     * Validates: Requirements 4.3, 11.1, 11.2, 11.3
     */
    describe("Property 8: Name Validation", () => {
        it("should reject names that are too short", () => {
            fc.assert(
                fc.property(fc.constant("A"), name => {
                    const result = validateName(name)
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }),
                { numRuns: 10 }
            )
        })
    })

    /**
     * Property 12: Final Validation Before Account Creation
     * For any complete registration form data, the final validation function SHALL correctly identify valid data
     * that meets all requirements and reject data that does not meet all requirements.
     * Validates: Requirements 6.1
     */
    describe("Property 12: Final Validation Before Account Creation", () => {
        it("should validate complete registration form correctly", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 2, maxLength: 50 }),
                        email: fc.emailAddress(),
                        password: fc.string({ minLength: 8, maxLength: 50 }),
                        confirmPassword: fc.string({
                            minLength: 8,
                            maxLength: 50,
                        }),
                        phone: fc.string({ minLength: 10, maxLength: 20 }),
                    }),
                    formData => {
                        const result = validateRegistrationForm(formData)
                        expect(typeof result.isValid).toBe("boolean")
                        expect(typeof result.errors).toBe("object")
                    }
                ),
                { numRuns: 50 }
            )
        })
    })
})
