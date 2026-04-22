/**
 * Account Completion Flow - Property-Based Tests
 *
 * Property-based tests for account completion validation and persistence logic.
 * Tests universal properties that should hold across all inputs.
 *
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */

import fc from "fast-check"
import { describe, expect, it } from "vitest"
import {
    validateAccountCompletionData,
    validateBirthDate,
    validateEmail,
    validateName,
    validatePassword,
    validatePhoneNumber,
} from "./account-completion-validation"

describe("Account Completion - Property-Based Tests", () => {
    /**
     * Property 1: Password Strength Invariant
     *
     * **Validates: Requirements 11.1**
     *
     * All accepted passwords must meet security requirements
     */
    describe("Property 1: Password Strength Invariant", () => {
        it("should accept only passwords that meet all security requirements", () => {
            fc.assert(
                fc.property(fc.string(), password => {
                    const result = validatePassword(password)

                    if (result.valid) {
                        // If valid, must have all required character types
                        expect(/[A-Z]/.test(password)).toBe(true)
                        expect(/[a-z]/.test(password)).toBe(true)
                        expect(/\d/.test(password)).toBe(true)
                        expect(/[!@#$%^&*]/.test(password)).toBe(true)
                        expect(password.length).toBeGreaterThanOrEqual(8)
                    }
                }),
                { numRuns: 20 }
            )
        })
    })

    /**
     * Property 2: Phone Number Format Consistency
     *
     * **Validates: Requirements 11.2**
     *
     * Valid phone numbers must always be in international format
     */
    describe("Property 2: Phone Number Format Consistency", () => {
        it("should accept only phone numbers in international format", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    phone => {
                        const isValid = validatePhoneNumber(phone)

                        if (isValid) {
                            // Must start with + and contain only digits after
                            expect(phone.startsWith("+")).toBe(true)
                            expect(/^\+\d+$/.test(phone)).toBe(true)
                            // Must have 7-15 digits (international standard)
                            const digitCount = phone.slice(1).length
                            expect(digitCount).toBeGreaterThanOrEqual(7)
                            expect(digitCount).toBeLessThanOrEqual(15)
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    /**
     * Property 3: Birth Date Age Calculation Consistency
     *
     * **Validates: Requirements 11.3**
     *
     * Birth date validation must be consistent
     */
    describe("Property 3: Birth Date Age Calculation Consistency", () => {
        it("should correctly validate age for any birth date", () => {
            fc.assert(
                fc.property(
                    fc.date({ min: new Date(1900, 0, 1), max: new Date() }),
                    birthDate => {
                        const dateStr = birthDate.toISOString().split("T")[0]
                        const result = validateBirthDate(dateStr)

                        // Calculate expected age
                        const today = new Date()
                        let age = today.getFullYear() - birthDate.getFullYear()
                        const monthDiff =
                            today.getMonth() - birthDate.getMonth()

                        if (
                            monthDiff < 0 ||
                            (monthDiff === 0 &&
                                today.getDate() < birthDate.getDate())
                        ) {
                            age--
                        }

                        if (age >= 13) {
                            expect(result.valid).toBe(true)
                        } else {
                            expect(result.valid).toBe(false)
                            expect(result.error).toBe(
                                "You must be at least 13 years old"
                            )
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should reject all future dates", () => {
            fc.assert(
                fc.property(fc.integer({ min: 1, max: 100 }), daysInFuture => {
                    const futureDate = new Date()
                    futureDate.setDate(futureDate.getDate() + daysInFuture)
                    const dateStr = futureDate.toISOString().split("T")[0]

                    const result = validateBirthDate(dateStr)
                    expect(result.valid).toBe(false)
                    expect(result.error).toBe(
                        "Birth date cannot be in the future"
                    )
                }),
                { numRuns: 20 }
            )
        })
    })

    /**
     * Property 4: Email Format Consistency
     *
     * **Validates: Requirements 11.4**
     *
     * Email validation must be consistent and format-correct
     */
    describe("Property 4: Email Format Consistency", () => {
        it("should accept only valid email formats", () => {
            fc.assert(
                fc.property(fc.string(), email => {
                    const isValid = validateEmail(email)

                    if (isValid) {
                        // Must contain exactly one @
                        expect((email.match(/@/g) || []).length).toBe(1)
                        // Must have local part and domain
                        const [localPart, domain] = email.split("@")
                        expect(localPart.length).toBeGreaterThan(0)
                        expect(domain.length).toBeGreaterThan(0)
                        // Domain must have at least one dot
                        expect(domain).toContain(".")
                    }
                }),
                { numRuns: 20 }
            )
        })
    })

    /**
     * Property 5: Validation Data Consistency
     *
     * **Validates: Requirements 11.5**
     *
     * Data submitted must be validated consistently
     */
    describe("Property 5: Validation Data Consistency", () => {
        it("should validate complete data consistently", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        email: fc.emailAddress(),
                        name: fc.string({ minLength: 2, maxLength: 100 }),
                        password: fc
                            .string({ minLength: 8, maxLength: 50 })
                            .filter(
                                p =>
                                    /[A-Z]/.test(p) &&
                                    /[a-z]/.test(p) &&
                                    /\d/.test(p) &&
                                    /[!@#$%^&*]/.test(p)
                            ),
                        phone: fc
                            .string({ minLength: 7, maxLength: 15 })
                            .filter(s => /^\d+$/.test(s))
                            .map(digits => `+${digits}`),
                        birthDate: fc
                            .date({
                                min: new Date(1900, 0, 1),
                                max: new Date(2011, 0, 1),
                            })
                            .map(d => d.toISOString().split("T")[0]),
                    }),
                    data => {
                        const result = validateAccountCompletionData(data)
                        expect(result.valid).toBe(true)
                        expect(Object.keys(result.errors).length).toBe(0)
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    /**
     * Property 6: Validation Idempotence
     *
     * **Validates: Requirements 11.6**
     *
     * Validating the same data twice should produce the same result
     */
    describe("Property 6: Validation Idempotence", () => {
        it("should produce identical results for repeated validation", () => {
            fc.assert(
                fc.property(fc.string(), password => {
                    const result1 = validatePassword(password)
                    const result2 = validatePassword(password)

                    expect(result1.valid).toBe(result2.valid)
                    expect(result1.errors).toEqual(result2.errors)
                }),
                { numRuns: 20 }
            )
        })

        it("should produce identical phone validation results", () => {
            fc.assert(
                fc.property(fc.string(), phone => {
                    const result1 = validatePhoneNumber(phone)
                    const result2 = validatePhoneNumber(phone)

                    expect(result1).toBe(result2)
                }),
                { numRuns: 20 }
            )
        })

        it("should produce identical birth date validation results", () => {
            fc.assert(
                fc.property(fc.string(), birthDate => {
                    const result1 = validateBirthDate(birthDate)
                    const result2 = validateBirthDate(birthDate)

                    expect(result1.valid).toBe(result2.valid)
                    expect(result1.error).toBe(result2.error)
                }),
                { numRuns: 20 }
            )
        })

        it("should produce identical email validation results", () => {
            fc.assert(
                fc.property(fc.string(), email => {
                    const result1 = validateEmail(email)
                    const result2 = validateEmail(email)

                    expect(result1).toBe(result2)
                }),
                { numRuns: 20 }
            )
        })

        it("should produce identical name validation results", () => {
            fc.assert(
                fc.property(fc.string(), name => {
                    const result1 = validateName(name)
                    const result2 = validateName(name)

                    expect(result1.valid).toBe(result2.valid)
                    expect(result1.error).toBe(result2.error)
                }),
                { numRuns: 20 }
            )
        })
    })

    /**
     * Property 7: Validation Error Consistency
     *
     * **Validates: Requirements 11.7**
     *
     * Invalid inputs must always produce consistent error messages
     */
    describe("Property 7: Validation Error Consistency", () => {
        it("should provide consistent error messages for invalid passwords", () => {
            fc.assert(
                fc.property(fc.string(), password => {
                    const result1 = validatePassword(password)
                    const result2 = validatePassword(password)

                    // Same input should produce same errors
                    expect(result1.errors.sort()).toEqual(result2.errors.sort())
                    expect(result1.valid).toBe(result2.valid)
                }),
                { numRuns: 20 }
            )
        })

        it("should provide consistent error messages for invalid emails", () => {
            fc.assert(
                fc.property(fc.string(), email => {
                    const result1 = validateEmail(email)
                    const result2 = validateEmail(email)

                    expect(result1).toBe(result2)
                }),
                { numRuns: 20 }
            )
        })

        it("should provide consistent error messages for invalid names", () => {
            fc.assert(
                fc.property(fc.string(), name => {
                    const result1 = validateName(name)
                    const result2 = validateName(name)

                    expect(result1.error).toBe(result2.error)
                    expect(result1.valid).toBe(result2.valid)
                }),
                { numRuns: 20 }
            )
        })

        it("should provide consistent error messages for invalid birth dates", () => {
            fc.assert(
                fc.property(fc.string(), birthDate => {
                    const result1 = validateBirthDate(birthDate)
                    const result2 = validateBirthDate(birthDate)

                    expect(result1.error).toBe(result2.error)
                    expect(result1.valid).toBe(result2.valid)
                }),
                { numRuns: 20 }
            )
        })

        it("should provide consistent error messages for invalid phone numbers", () => {
            fc.assert(
                fc.property(fc.string(), phone => {
                    const result1 = validatePhoneNumber(phone)
                    const result2 = validatePhoneNumber(phone)

                    expect(result1).toBe(result2)
                }),
                { numRuns: 20 }
            )
        })
    })

    /**
     * Property 8: Data Integrity
     *
     * **Validates: Requirements 11.8**
     *
     * All required fields must be validated and errors must be reported
     */
    describe("Property 8: Data Integrity", () => {
        it("should validate all required fields", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        email: fc.string(),
                        name: fc.string(),
                        password: fc.string(),
                        phone: fc.string(),
                        birthDate: fc.string(),
                    }),
                    data => {
                        const result = validateAccountCompletionData(data)

                        // If any field is invalid, should have errors
                        if (!result.valid) {
                            expect(
                                Object.keys(result.errors).length
                            ).toBeGreaterThan(0)
                        }

                        // All error keys should be valid field names
                        const validFields = [
                            "email",
                            "name",
                            "password",
                            "phone",
                            "birthDate",
                        ]
                        Object.keys(result.errors).forEach(field => {
                            expect(validFields).toContain(field)
                        })
                    }
                ),
                { numRuns: 20 }
            )
        })
    })
})
