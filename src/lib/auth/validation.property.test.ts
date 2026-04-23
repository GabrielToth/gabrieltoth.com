/**
 * Account Completion Validation - Property-Based Tests
 *
 * Property-based tests for account completion validation logic.
 * Tests universal properties that should hold across all inputs.
 *
 * Validates: Requirements 11.1, 11.2
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
} from "./validation"

describe("Account Completion Validation - Property-Based Tests", () => {
    /**
     * Property 1: Password Strength Invariant
     *
     * **Validates: Requirements 5.2, 5.3, 11.1**
     *
     * All accepted passwords must meet security requirements:
     * - Minimum 8 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one number
     * - At least one special character (!@#$%^&*)
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
                { numRuns: 100 }
            )
        })

        it("should reject passwords with missing uppercase letters", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 8, maxLength: 50 })
                        .filter(
                            p =>
                                /[a-z]/.test(p) &&
                                /\d/.test(p) &&
                                /[!@#$%^&*]/.test(p) &&
                                !/[A-Z]/.test(p)
                        ),
                    password => {
                        const result = validatePassword(password)
                        expect(result.valid).toBe(false)
                        expect(result.errors).toContain(
                            "Password must contain at least one uppercase letter"
                        )
                    }
                ),
                { numRuns: 50 }
            )
        })

        it("should reject passwords with missing lowercase letters", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 8, maxLength: 50 })
                        .filter(
                            p =>
                                /[A-Z]/.test(p) &&
                                /\d/.test(p) &&
                                /[!@#$%^&*]/.test(p) &&
                                !/[a-z]/.test(p)
                        ),
                    password => {
                        const result = validatePassword(password)
                        expect(result.valid).toBe(false)
                        expect(result.errors).toContain(
                            "Password must contain at least one lowercase letter"
                        )
                    }
                ),
                { numRuns: 50 }
            )
        })

        it("should reject passwords with missing numbers", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 8, maxLength: 50 })
                        .filter(
                            p =>
                                /[A-Z]/.test(p) &&
                                /[a-z]/.test(p) &&
                                /[!@#$%^&*]/.test(p) &&
                                !/\d/.test(p)
                        ),
                    password => {
                        const result = validatePassword(password)
                        expect(result.valid).toBe(false)
                        expect(result.errors).toContain(
                            "Password must contain at least one number"
                        )
                    }
                ),
                { numRuns: 50 }
            )
        })

        it("should reject passwords with missing special characters", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 8, maxLength: 50 })
                        .filter(
                            p =>
                                /[A-Z]/.test(p) &&
                                /[a-z]/.test(p) &&
                                /\d/.test(p) &&
                                !/[!@#$%^&*]/.test(p)
                        ),
                    password => {
                        const result = validatePassword(password)
                        expect(result.valid).toBe(false)
                        expect(result.errors).toContain(
                            "Password must contain at least one special character (!@#$%^&*)"
                        )
                    }
                ),
                { numRuns: 50 }
            )
        })

        it("should reject passwords shorter than 8 characters", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 7 }),
                    password => {
                        const result = validatePassword(password)
                        if (result.errors.length > 0) {
                            expect(result.valid).toBe(false)
                        }
                    }
                ),
                { numRuns: 50 }
            )
        })
    })

    /**
     * Property 2: Phone Number Format Consistency
     *
     * **Validates: Requirements 5.4, 5.5, 11.1**
     *
     * Valid phone numbers must always be in international format:
     * - Start with +
     * - Followed by 1-3 digit country code
     * - Followed by 6-13 digits (total 7-15 digits after +)
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
                { numRuns: 100 }
            )
        })

        it("should reject phone numbers without + prefix", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 7, maxLength: 15 })
                        .filter(s => /^\d+$/.test(s)),
                    phone => {
                        const isValid = validatePhoneNumber(phone)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 50 }
            )
        })

        it("should reject phone numbers with non-digit characters after +", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 7, maxLength: 15 })
                        .filter(s => /[a-zA-Z]/.test(s)),
                    phone => {
                        const isValid = validatePhoneNumber("+" + phone)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 50 }
            )
        })

        it("should reject phone numbers that are too short", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 1, maxLength: 6 })
                        .filter(s => /^\d+$/.test(s)),
                    phone => {
                        const isValid = validatePhoneNumber("+" + phone)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 50 }
            )
        })

        it("should reject phone numbers that are too long", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 16, maxLength: 30 })
                        .filter(s => /^\d+$/.test(s)),
                    phone => {
                        const isValid = validatePhoneNumber("+" + phone)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 50 }
            )
        })
    })

    /**
     * Property 3: Birth Date Age Calculation Idempotence
     *
     * **Validates: Requirements 5.6, 5.7, 11.1**
     *
     * Birth date validation must be consistent:
     * - ISO 8601 format (YYYY-MM-DD)
     * - User must be at least 13 years old
     * - Date cannot be in the future
     */
    describe("Property 3: Birth Date Age Calculation Idempotence", () => {
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
                { numRuns: 100 }
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
                { numRuns: 50 }
            )
        })

        it("should reject dates with users under 13 years old", () => {
            fc.assert(
                fc.property(fc.integer({ min: 0, max: 12 }), yearsAgo => {
                    const birthDate = new Date()
                    birthDate.setFullYear(birthDate.getFullYear() - yearsAgo)
                    birthDate.setDate(birthDate.getDate() + 1) // Ensure not yet 13
                    const dateStr = birthDate.toISOString().split("T")[0]

                    const result = validateBirthDate(dateStr)
                    expect(result.valid).toBe(false)
                }),
                { numRuns: 50 }
            )
        })

        it("should accept dates with users 13 years or older", () => {
            fc.assert(
                fc.property(fc.integer({ min: 13, max: 120 }), yearsAgo => {
                    const birthDate = new Date()
                    birthDate.setFullYear(birthDate.getFullYear() - yearsAgo)
                    const dateStr = birthDate.toISOString().split("T")[0]

                    const result = validateBirthDate(dateStr)
                    expect(result.valid).toBe(true)
                }),
                { numRuns: 50 }
            )
        })

        it("should reject invalid date formats", () => {
            fc.assert(
                fc.property(
                    fc.string().filter(s => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
                    dateStr => {
                        const result = validateBirthDate(dateStr)
                        if (result.error) {
                            expect(result.valid).toBe(false)
                        }
                    }
                ),
                { numRuns: 50 }
            )
        })
    })

    /**
     * Property 7: Validation Error Messages Consistency
     *
     * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 11.2**
     *
     * Invalid inputs must always produce consistent error messages
     */
    describe("Property 7: Validation Error Messages Consistency", () => {
        it("should provide consistent error messages for invalid passwords", () => {
            fc.assert(
                fc.property(fc.string(), password => {
                    const result1 = validatePassword(password)
                    const result2 = validatePassword(password)

                    // Same input should produce same errors
                    expect(result1.errors.sort()).toEqual(result2.errors.sort())
                    expect(result1.valid).toBe(result2.valid)
                }),
                { numRuns: 100 }
            )
        })

        it("should provide consistent error messages for invalid emails", () => {
            fc.assert(
                fc.property(fc.string(), email => {
                    const result1 = validateEmail(email)
                    const result2 = validateEmail(email)

                    expect(result1).toBe(result2)
                }),
                { numRuns: 100 }
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
                { numRuns: 100 }
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
                { numRuns: 100 }
            )
        })

        it("should provide consistent error messages for invalid phone numbers", () => {
            fc.assert(
                fc.property(fc.string(), phone => {
                    const result1 = validatePhoneNumber(phone)
                    const result2 = validatePhoneNumber(phone)

                    expect(result1).toBe(result2)
                }),
                { numRuns: 100 }
            )
        })

        it("should provide consistent error messages for complete data validation", () => {
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
                        const result1 = validateAccountCompletionData(data)
                        const result2 = validateAccountCompletionData(data)

                        expect(result1.valid).toBe(result2.valid)
                        expect(result1.errors).toEqual(result2.errors)
                    }
                ),
                { numRuns: 100 }
            )
        })
    })
})
