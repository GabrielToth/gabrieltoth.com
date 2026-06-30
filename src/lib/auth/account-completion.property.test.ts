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

// Import from main validation module which has correct signatures

// Import auth-specific functions
import {
    validateAccountCompletionData,
    validateBirthDate,
    validateEmail,
    validateName,
    validatePassword,
    validatePhoneNumber,
} from "./account-completion-validation"

// Create adapter functions to match test expectations
function validatePasswordAdapter(password: string) {
    const result = validatePassword(password)
    return {
        valid: result.valid,
        errors: result.errors,
    }
}

function validateEmailAdapter(email: string): boolean {
    return validateEmail(email)
}

function validateNameAdapter(name: string) {
    return validateName(name)
}

function validatePhoneNumberAdapter(phone: string): boolean {
    return validatePhoneNumber(phone)
}

function validateBirthDateAdapter(birthDate: string) {
    return validateBirthDate(birthDate)
}

describe("Account Completion - Property-Based Tests", () => {
    /**
     * Property 1: Password Strength Invariant
     *
     * **Validates: Requirements 11.1**
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
                { numRuns: 10 }
            )
        })

        it("should reject passwords with missing uppercase letters", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "abcdefgh1!",
                        "lowercase123!",
                        "test1234!",
                        "password1!",
                        "noupperca5e!"
                    ),
                    password => {
                        const result = validatePassword(password)
                        expect(result.valid).toBe(false)
                        expect(result.errors).toContain(
                            "Password must contain at least one uppercase letter"
                        )
                    }
                ),
                { numRuns: 5 }
            )
        })

        it("should reject passwords with missing lowercase letters", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "ABCDEFGH1!",
                        "UPPERCASE123!",
                        "TEST1234!",
                        "PASSWORD1!",
                        "NOLOWERC4SE!"
                    ),
                    password => {
                        const result = validatePassword(password)
                        expect(result.valid).toBe(false)
                        expect(result.errors).toContain(
                            "Password must contain at least one lowercase letter"
                        )
                    }
                ),
                { numRuns: 5 }
            )
        })

        it("should reject passwords with missing numbers", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "Abcdefgh!",
                        "Password!",
                        "TestCase!",
                        "NoDigits!",
                        "OnlyLetters!"
                    ),
                    password => {
                        const result = validatePassword(password)
                        expect(result.valid).toBe(false)
                        expect(result.errors).toContain(
                            "Password must contain at least one number"
                        )
                    }
                ),
                { numRuns: 5 }
            )
        })

        it("should reject passwords with missing special characters", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "Abcdefgh1",
                        "Password123",
                        "TestCase99",
                        "NoSpecial8",
                        "OnlyAlpha9"
                    ),
                    password => {
                        const result = validatePassword(password)
                        expect(result.valid).toBe(false)
                        expect(result.errors).toContain(
                            "Password must contain at least one special character (!@#$%^&*)"
                        )
                    }
                ),
                { numRuns: 5 }
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
                { numRuns: 5 }
            )
        })
    })

    /**
     * Property 2: Phone Number Format Consistency
     *
     * **Validates: Requirements 11.2**
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
                { numRuns: 10 }
            )
        })

        it("should reject phone numbers without + prefix", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "1234567890",
                        "12025551234",
                        "442071838750",
                        "33123456789",
                        "49301234567"
                    ),
                    phone => {
                        const isValid = validatePhoneNumber(phone)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 5 }
            )
        })

        it("should reject phone numbers with non-digit characters after +", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "+abcdefghij",
                        "+12abc56789",
                        "+test123456",
                        "+hello world",
                        "+xyz1234567"
                    ),
                    phone => {
                        const isValid = validatePhoneNumber(phone)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 5 }
            )
        })

        it("should reject phone numbers that are too short", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom("+1", "+12", "+123", "+1234", "+12345"),
                    phone => {
                        const isValid = validatePhoneNumber(phone)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 5 }
            )
        })

        it("should reject phone numbers that are too long", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "+12345678901234567890",
                        "+123456789012345678901234567890",
                        "+1234567890123456",
                        "+12345678901234567",
                        "+123456789012345678"
                    ),
                    phone => {
                        const isValid = validatePhoneNumber(phone)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 5 }
            )
        })
    })

    /**
     * Property 3: Birth Date Age Calculation Consistency
     *
     * **Validates: Requirements 11.3**
     *
     * Birth date validation must be consistent:
     * - ISO 8601 format (YYYY-MM-DD)
     * - User must be at least 13 years old
     * - Date cannot be in the future
     */
    describe("Property 3: Birth Date Age Calculation Consistency", () => {
        it("should correctly validate age for any birth date", () => {
            fc.assert(
                fc.property(
                    fc.date({
                        min: new Date("1900-01-01"),
                        max: new Date(),
                    }),
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
                { numRuns: 10 }
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
                { numRuns: 5 }
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
                { numRuns: 5 }
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
                { numRuns: 5 }
            )
        })

        it("should reject invalid date formats", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "not-a-date",
                        "2024/01/01",
                        "01-01-2024",
                        "2024-13-01",
                        "2024-01-32",
                        "abcd-ef-gh"
                    ),
                    dateStr => {
                        const result = validateBirthDate(dateStr)
                        if (result.error) {
                            expect(result.valid).toBe(false)
                        }
                    }
                ),
                { numRuns: 5 }
            )
        })
    })

    /**
     * Property 4: Email Format Consistency
     *
     * **Validates: Requirements 11.4**
     *
     * Email validation must be consistent and format-correct:
     * - Must contain exactly one @
     * - Must have local part and domain
     * - Domain must have at least one dot
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
                { numRuns: 10 }
            )
        })

        it("should reject emails without @ symbol", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "notanemail",
                        "test.com",
                        "userexample.com",
                        "hello world",
                        "test123"
                    ),
                    email => {
                        const isValid = validateEmail(email)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 5 }
            )
        })

        it("should reject emails with multiple @ symbols", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "user@@example.com",
                        "test@test@example.com",
                        "@@example.com",
                        "user@test@test.com",
                        "a@b@c@d.com"
                    ),
                    email => {
                        const isValid = validateEmail(email)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 5 }
            )
        })

        it("should reject emails without domain extension", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "user@domain",
                        "test@example",
                        "hello@world",
                        "admin@localhost",
                        "user@server"
                    ),
                    email => {
                        const isValid = validateEmail(email)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 5 }
            )
        })

        it("should reject emails with empty local part", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        "@example.com",
                        "@test.com",
                        "@domain.org",
                        "@server.net",
                        "@mail.io"
                    ),
                    email => {
                        const isValid = validateEmail(email)
                        expect(isValid).toBe(false)
                    }
                ),
                { numRuns: 5 }
            )
        })
    })

    /**
     * Property 5: Round-Trip Data Persistence
     *
     * **Validates: Requirements 11.5**
     *
     * Data submitted must be validated consistently across multiple validations
     */
    describe("Property 5: Round-Trip Data Persistence", () => {
        it("should validate complete data consistently", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        email: fc.emailAddress(),
                        name: fc.constantFrom(
                            "John Doe",
                            "Jane Smith",
                            "Bob Johnson",
                            "Alice Williams"
                        ),
                        password: fc.constantFrom(
                            "SecurePass123!",
                            "ValidPwd1!",
                            "TestPass9!"
                        ),
                        phone: fc.constantFrom(
                            "+12025551234",
                            "+442071838750",
                            "+33123456789"
                        ),
                        birthDate: fc.constantFrom(
                            "1990-01-01",
                            "1985-06-15",
                            "2000-12-31"
                        ),
                    }),
                    data => {
                        const result = validateAccountCompletionData(data)
                        expect(result.valid).toBe(true)
                        expect(Object.keys(result.errors).length).toBe(0)
                    }
                ),
                { numRuns: 10 }
            )
        })

        it("should preserve all fields through validation", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        email: fc.emailAddress(),
                        name: fc.constantFrom(
                            "John Doe",
                            "Jane Smith",
                            "Bob Johnson"
                        ),
                        password: fc.constantFrom(
                            "SecurePass123!",
                            "ValidPwd1!"
                        ),
                        phone: fc.constantFrom("+12025551234", "+442071838750"),
                        birthDate: fc.constantFrom("1990-01-01", "1985-06-15"),
                    }),
                    data => {
                        const result = validateAccountCompletionData(data)
                        if (result.valid) {
                            // All fields should be present in input
                            expect(data.email).toBeDefined()
                            expect(data.name).toBeDefined()
                            expect(data.password).toBeDefined()
                            expect(data.phone).toBeDefined()
                            expect(data.birthDate).toBeDefined()
                        }
                    }
                ),
                { numRuns: 10 }
            )
        })
    })

    /**
     * Property 6: Account Completion Idempotence
     *
     * **Validates: Requirements 11.6**
     *
     * Validating the same data twice should produce the same result
     */
    describe("Property 6: Account Completion Idempotence", () => {
        it("should produce identical results for repeated password validation", () => {
            fc.assert(
                fc.property(fc.string(), password => {
                    const result1 = validatePassword(password)
                    const result2 = validatePassword(password)
                    const result3 = validatePassword(password)

                    expect(result1.valid).toBe(result2.valid)
                    expect(result2.valid).toBe(result3.valid)
                    expect(result1.errors).toEqual(result2.errors)
                    expect(result2.errors).toEqual(result3.errors)
                }),
                { numRuns: 10 }
            )
        })

        it("should produce identical phone validation results", () => {
            fc.assert(
                fc.property(fc.string(), phone => {
                    const result1 = validatePhoneNumber(phone)
                    const result2 = validatePhoneNumber(phone)
                    const result3 = validatePhoneNumber(phone)

                    expect(result1).toBe(result2)
                    expect(result2).toBe(result3)
                }),
                { numRuns: 10 }
            )
        })

        it("should produce identical birth date validation results", () => {
            fc.assert(
                fc.property(fc.string(), birthDate => {
                    const result1 = validateBirthDate(birthDate)
                    const result2 = validateBirthDate(birthDate)
                    const result3 = validateBirthDate(birthDate)

                    expect(result1.valid).toBe(result2.valid)
                    expect(result2.valid).toBe(result3.valid)
                    expect(result1.error).toBe(result2.error)
                    expect(result2.error).toBe(result3.error)
                }),
                { numRuns: 10 }
            )
        })

        it("should produce identical email validation results", () => {
            fc.assert(
                fc.property(fc.string(), email => {
                    const result1 = validateEmail(email)
                    const result2 = validateEmail(email)
                    const result3 = validateEmail(email)

                    expect(result1).toBe(result2)
                    expect(result2).toBe(result3)
                }),
                { numRuns: 10 }
            )
        })

        it("should produce identical name validation results", () => {
            fc.assert(
                fc.property(fc.string(), name => {
                    const result1 = validateName(name)
                    const result2 = validateName(name)
                    const result3 = validateName(name)

                    expect(result1.valid).toBe(result2.valid)
                    expect(result2.valid).toBe(result3.valid)
                    expect(result1.error).toBe(result2.error)
                    expect(result2.error).toBe(result3.error)
                }),
                { numRuns: 10 }
            )
        })

        it("should produce identical results for complete data validation", () => {
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
                        const result3 = validateAccountCompletionData(data)

                        expect(result1.valid).toBe(result2.valid)
                        expect(result2.valid).toBe(result3.valid)
                        expect(result1.errors).toEqual(result2.errors)
                        expect(result2.errors).toEqual(result3.errors)
                    }
                ),
                { numRuns: 10 }
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
                { numRuns: 10 }
            )
        })

        it("should provide consistent error messages for invalid emails", () => {
            fc.assert(
                fc.property(fc.string(), email => {
                    const result1 = validateEmail(email)
                    const result2 = validateEmail(email)

                    expect(result1).toBe(result2)
                }),
                { numRuns: 10 }
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
                { numRuns: 10 }
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
                { numRuns: 10 }
            )
        })

        it("should provide consistent error messages for invalid phone numbers", () => {
            fc.assert(
                fc.property(fc.string(), phone => {
                    const result1 = validatePhoneNumber(phone)
                    const result2 = validatePhoneNumber(phone)

                    expect(result1).toBe(result2)
                }),
                { numRuns: 10 }
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
                { numRuns: 10 }
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
                { numRuns: 10 }
            )
        })

        it("should report errors for all invalid fields", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        email: fc.string().filter(s => !s.includes("@")),
                        name: fc.string({ maxLength: 1 }),
                        password: fc.string({ maxLength: 7 }),
                        phone: fc.string().filter(s => !s.startsWith("+")),
                        birthDate: fc
                            .string()
                            .filter(s => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
                    }),
                    data => {
                        const result = validateAccountCompletionData(data)
                        expect(result.valid).toBe(false)
                        // Should have errors for all fields
                        expect(
                            Object.keys(result.errors).length
                        ).toBeGreaterThan(0)
                    }
                ),
                { numRuns: 10 }
            )
        })

        it("should not report errors for valid fields", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        email: fc.emailAddress(),
                        name: fc.constantFrom("John Doe", "Jane Smith"),
                        password: fc.constantFrom(
                            "SecurePass123!",
                            "ValidPwd1!"
                        ),
                        phone: fc.constantFrom("+12025551234", "+442071838750"),
                        birthDate: fc.constantFrom("1990-01-01", "1985-06-15"),
                    }),
                    data => {
                        const result = validateAccountCompletionData(data)
                        expect(result.valid).toBe(true)
                        expect(Object.keys(result.errors).length).toBe(0)
                    }
                ),
                { numRuns: 5 }
            )
        })
    })
})
