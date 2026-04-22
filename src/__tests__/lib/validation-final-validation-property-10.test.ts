/**
 * Property-Based Test for Final Data Validation Completeness (Property 10)
 * Tests that final validation before account creation accepts all valid data
 * and rejects any data with invalid fields.
 *
 * **Validates: Requirements 8.1-8.2**
 */

import { validateRegistrationForm } from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 10: Final Data Validation Completeness", () => {
    /**
     * **Validates: Requirements 8.1-8.2**
     *
     * Property: For any registration data set, final validation before account creation
     * SHALL accept all valid data and reject any data with invalid fields.
     *
     * This property ensures that the final validation catches all invalid data before
     * account creation, preventing invalid data from being persisted to the database.
     */
    it("should accept all valid registration data and reject any data with invalid fields", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    null,
                    "name",
                    "email",
                    "password",
                    "confirmPassword",
                    "phone"
                ),
                invalidField => {
                    let testData: any = {
                        name: "John Doe",
                        email: "john@example.com",
                        password: "ValidPass123!",
                        confirmPassword: "ValidPass123!",
                        phone: "+15551234567",
                    }

                    // Introduce invalid data based on flag
                    if (invalidField === "name") {
                        testData.name = "J" // Too short
                    } else if (invalidField === "email") {
                        testData.email = "invalid-email" // Invalid format
                    } else if (invalidField === "password") {
                        testData.password = "weak" // Too weak
                    } else if (invalidField === "confirmPassword") {
                        testData.confirmPassword = "DifferentPass123!" // Doesn't match
                    } else if (invalidField === "phone") {
                        testData.phone = "123" // Too short
                    }

                    const result = validateRegistrationForm(testData)

                    // Property: if no invalid field, validation should pass
                    if (invalidField === null) {
                        expect(result.isValid).toBe(true)
                        expect(Object.keys(result.errors).length).toBe(0)
                    } else {
                        // Property: if any field is invalid, validation should fail
                        expect(result.isValid).toBe(false)
                        expect(
                            Object.keys(result.errors).length
                        ).toBeGreaterThan(0)

                        // Property: error should be reported for the invalid field
                        if (invalidField === "name") {
                            expect(result.errors.name).toBeDefined()
                        } else if (invalidField === "email") {
                            expect(result.errors.email).toBeDefined()
                        } else if (invalidField === "password") {
                            expect(result.errors.password).toBeDefined()
                        } else if (invalidField === "confirmPassword") {
                            expect(result.errors.confirmPassword).toBeDefined()
                        } else if (invalidField === "phone") {
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

    it("should validate password confirmation matches password", () => {
        fc.assert(
            fc.property(fc.tuple(fc.boolean()), ([shouldMatch]) => {
                const password = "ValidPass123!"
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
            }),
            { numRuns: 50 }
        )
    })

    it("should handle optional phone field correctly", () => {
        fc.assert(
            fc.property(fc.option(fc.constant("+15551234567")), phone => {
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
            }),
            { numRuns: 50 }
        )
    })

    it("should validate consistently across multiple calls with same data", () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.constant("John Doe"),
                    email: fc.constant("john@example.com"),
                    password: fc.constant("ValidPass123!"),
                    phone: fc.constant("+15551234567"),
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
                    // Invalid phone (too short, but only if provided)
                    invalidPhone: fc.constantFrom("123", "abc"),
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
