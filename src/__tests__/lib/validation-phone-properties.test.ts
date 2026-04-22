/**
 * Property-Based Tests for Phone Validation Functions
 * Tests universal properties of phone validation using fast-check
 * Validates: Requirements 4.7, 10.1, 10.4
 */

import { normalizePhoneNumber, validatePhoneNumber } from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 7: Phone Number Format Validation", () => {
    /**
     * **Validates: Requirements 4.13-4.14, 16.1-16.2**
     *
     * Property: For any phone number string, the validation function SHALL accept
     * valid international phone formats and reject invalid formats. The validator
     * SHALL support phone numbers with country codes and various formatting characters.
     */
    it("should correctly validate international phone numbers with country codes", () => {
        // Use specific valid phone numbers instead of random generation
        const validPhones = [
            "+12025551234", // US
            "+442071838750", // UK
            "+33123456789", // France
            "+49301234567", // Germany
            "+551140411234", // Brazil
            "+81312345678", // Japan
            "+8613800000000", // China
            "+919876543210", // India
        ]

        validPhones.forEach(phone => {
            const result = validatePhoneNumber(phone)

            // Property: valid international phone numbers should pass validation
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })
    }, 30000)

    it("should correctly validate US phone numbers with various formats", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 200, max: 999 }), // Area code
                    fc.integer({ min: 200, max: 999 }), // Exchange code
                    fc.integer({ min: 1000, max: 9999 }) // Subscriber number
                ),
                ([areaCode, exchangeCode, subscriberNumber]) => {
                    // Test various US phone number formats
                    const formats = [
                        `+1${areaCode}${exchangeCode}${subscriberNumber}`,
                        `+1 (${areaCode}) ${exchangeCode}-${subscriberNumber}`,
                        `+1-${areaCode}-${exchangeCode}-${subscriberNumber}`,
                        `(${areaCode}) ${exchangeCode}-${subscriberNumber}`,
                    ]

                    formats.forEach(phone => {
                        const result = validatePhoneNumber(phone, "US")

                        // Property: US phone numbers in various formats should be valid
                        expect(result.isValid).toBe(true)
                        expect(result.error).toBeUndefined()
                    })
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should correctly validate Brazilian phone numbers with various formats", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 11, max: 99 }), // Area code
                    fc.integer({ min: 90000000, max: 99999999 }) // Phone number
                ),
                ([areaCode, phoneNumber]) => {
                    // Test various Brazilian phone number formats
                    const formats = [
                        `+55${areaCode}${phoneNumber}`,
                        `+55 (${areaCode}) ${String(phoneNumber).slice(0, 5)}-${String(phoneNumber).slice(5)}`,
                        `+55 ${areaCode} ${String(phoneNumber).slice(0, 5)}-${String(phoneNumber).slice(5)}`,
                    ]

                    formats.forEach(phone => {
                        const result = validatePhoneNumber(phone, "BR")

                        // Property: Brazilian phone numbers in various formats should be valid
                        expect(result.isValid).toBe(true)
                        expect(result.error).toBeUndefined()
                    })
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should reject phone numbers with invalid format", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => !/^\+?\d/.test(s)),
                invalidPhone => {
                    const result = validatePhoneNumber(invalidPhone)

                    // Property: phone numbers with invalid format should fail validation
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should reject empty or null phone numbers", () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(""),
                    fc.constant("   "),
                    fc.constant(null as any),
                    fc.constant(undefined as any)
                ),
                phone => {
                    const result = validatePhoneNumber(phone)

                    // Property: empty, null, or whitespace-only phones are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should reject phone numbers that are too short", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 5 })
                    .filter(s => /^\d+$/.test(s)),
                shortPhone => {
                    const result = validatePhoneNumber(`+${shortPhone}`)

                    // Property: phone numbers that are too short should fail validation
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should reject phone numbers that are too long", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 20, maxLength: 30 })
                    .filter(s => /^\d+$/.test(s)),
                longPhone => {
                    const result = validatePhoneNumber(`+${longPhone}`)

                    // Property: phone numbers that are too long should fail validation
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should trim whitespace from phone numbers before validation", () => {
        // Use specific valid phone numbers
        const validPhones = [
            "+12025551234", // US
            "+442071838750", // UK
            "+33123456789", // France
        ]

        validPhones.forEach(phone => {
            const trimmedPhone = `  ${phone}  `

            const result = validatePhoneNumber(trimmedPhone)

            // Property: phone numbers with surrounding whitespace should be trimmed and validated
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })
    }, 30000)

    it("should accept phone numbers with formatting characters", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 200, max: 999 }), // Area code
                    fc.integer({ min: 200, max: 999 }), // Exchange code
                    fc.integer({ min: 1000, max: 9999 }) // Subscriber number
                ),
                ([areaCode, exchangeCode, subscriberNumber]) => {
                    // Test phone numbers with various formatting characters
                    const formattedPhones = [
                        `+1 (${areaCode}) ${exchangeCode}-${subscriberNumber}`,
                        `+1-${areaCode}-${exchangeCode}-${subscriberNumber}`,
                        `+1 ${areaCode} ${exchangeCode} ${subscriberNumber}`,
                        `(${areaCode}) ${exchangeCode}-${subscriberNumber}`,
                    ]

                    formattedPhones.forEach(phone => {
                        const result = validatePhoneNumber(phone, "US")

                        // Property: phone numbers with formatting characters should be valid
                        expect(result.isValid).toBe(true)
                        expect(result.error).toBeUndefined()
                    })
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should always return a consistent result structure", () => {
        fc.assert(
            fc.property(fc.string(), phone => {
                const result = validatePhoneNumber(phone)

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
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should validate the same phone number consistently across multiple calls", () => {
        // Use specific valid phone numbers
        const validPhones = [
            "+12025551234", // US
            "+442071838750", // UK
            "+33123456789", // France
        ]

        validPhones.forEach(phone => {
            const result1 = validatePhoneNumber(phone)
            const result2 = validatePhoneNumber(phone)
            const result3 = validatePhoneNumber(phone)

            // Property: validating the same phone multiple times yields identical results
            expect(result1.isValid).toBe(result2.isValid)
            expect(result2.isValid).toBe(result3.isValid)
            expect(result1.error).toBe(result2.error)
            expect(result2.error).toBe(result3.error)
        })
    }, 30000)
})

describe("Property 8: Phone Number Normalization Consistency", () => {
    /**
     * **Validates: Requirements 4.15, 6.15, 16.4**
     *
     * Property: For any valid phone number in various formats (with/without spaces,
     * hyphens, parentheses), the system SHALL normalize it to a standard format for
     * storage and the normalized format SHALL be consistent across multiple normalizations
     * of the same input.
     */
    it("should normalize US phone numbers to E.164 format", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 200, max: 999 }), // Area code
                    fc.integer({ min: 200, max: 999 }), // Exchange code
                    fc.integer({ min: 1000, max: 9999 }) // Subscriber number
                ),
                ([areaCode, exchangeCode, subscriberNumber]) => {
                    // Test various US phone number formats
                    const formats = [
                        `+1${areaCode}${exchangeCode}${subscriberNumber}`,
                        `+1 (${areaCode}) ${exchangeCode}-${subscriberNumber}`,
                        `+1-${areaCode}-${exchangeCode}-${subscriberNumber}`,
                        `(${areaCode}) ${exchangeCode}-${subscriberNumber}`,
                    ]

                    formats.forEach(phone => {
                        const result = normalizePhoneNumber(phone, "US")

                        // Property: normalization should succeed for valid phones
                        expect(result.normalized).toBeDefined()
                        expect(result.error).toBeUndefined()

                        // Property: normalized phone should be in E.164 format
                        expect(result.normalized).toMatch(/^\+\d{1,3}\d{4,14}$/)

                        // Property: normalized phone should start with +1 for US
                        expect(result.normalized).toMatch(/^\+1/)

                        // Property: normalized phone should contain the area code
                        expect(result.normalized).toContain(String(areaCode))
                    })
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should normalize Brazilian phone numbers to E.164 format", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 11, max: 99 }), // Area code
                    fc.integer({ min: 90000000, max: 99999999 }) // Phone number
                ),
                ([areaCode, phoneNumber]) => {
                    // Test various Brazilian phone number formats
                    const formats = [
                        `+55${areaCode}${phoneNumber}`,
                        `+55 (${areaCode}) ${String(phoneNumber).slice(0, 5)}-${String(phoneNumber).slice(5)}`,
                        `+55 ${areaCode} ${String(phoneNumber).slice(0, 5)}-${String(phoneNumber).slice(5)}`,
                    ]

                    formats.forEach(phone => {
                        const result = normalizePhoneNumber(phone, "BR")

                        // Property: normalization should succeed for valid phones
                        expect(result.normalized).toBeDefined()
                        expect(result.error).toBeUndefined()

                        // Property: normalized phone should be in E.164 format
                        expect(result.normalized).toMatch(/^\+\d{1,3}\d{4,14}$/)

                        // Property: normalized phone should start with +55 for Brazil
                        expect(result.normalized).toMatch(/^\+55/)
                    })
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should normalize international phone numbers to E.164 format", () => {
        // Use specific valid phone numbers
        const validPhones = [
            "+12025551234", // US
            "+442071838750", // UK
            "+33123456789", // France
            "+49301234567", // Germany
            "+551140411234", // Brazil
        ]

        validPhones.forEach(phone => {
            const result = normalizePhoneNumber(phone)

            // Property: normalization should succeed for valid phones
            expect(result.normalized).toBeDefined()
            expect(result.error).toBeUndefined()

            // Property: normalized phone should be in E.164 format
            expect(result.normalized).toMatch(/^\+\d{1,3}\d{4,14}$/)
        })
    }, 30000)

    it("should normalize phone numbers with spaces to E.164 format", () => {
        // Use specific valid phone numbers with spaces
        const phonesWithSpaces = [
            "+1 202 555 1234", // US
            "+44 207 183 8750", // UK
            "+33 1 2345 6789", // France
        ]

        phonesWithSpaces.forEach(phone => {
            const result = normalizePhoneNumber(phone)

            // Property: normalization should succeed for phones with spaces
            expect(result.normalized).toBeDefined()
            expect(result.error).toBeUndefined()

            // Property: normalized phone should be in E.164 format (no spaces)
            expect(result.normalized).toMatch(/^\+\d{1,3}\d{4,14}$/)
            expect(result.normalized).not.toContain(" ")
        })
    }, 30000)

    it("should normalize phone numbers with hyphens to E.164 format", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 200, max: 999 }), // Area code
                    fc.integer({ min: 200, max: 999 }), // Exchange code
                    fc.integer({ min: 1000, max: 9999 }) // Subscriber number
                ),
                ([areaCode, exchangeCode, subscriberNumber]) => {
                    // Build phone numbers with hyphens
                    const phonesWithHyphens = [
                        `+1-${areaCode}-${exchangeCode}-${subscriberNumber}`,
                        `+1-${areaCode}${exchangeCode}${subscriberNumber}`,
                    ]

                    phonesWithHyphens.forEach(phone => {
                        const result = normalizePhoneNumber(phone, "US")

                        // Property: normalization should succeed for phones with hyphens
                        expect(result.normalized).toBeDefined()
                        expect(result.error).toBeUndefined()

                        // Property: normalized phone should be in E.164 format (no hyphens)
                        expect(result.normalized).toMatch(/^\+\d{1,3}\d{4,14}$/)
                        expect(result.normalized).not.toContain("-")
                    })
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should normalize phone numbers with parentheses to E.164 format", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 200, max: 999 }), // Area code
                    fc.integer({ min: 200, max: 999 }), // Exchange code
                    fc.integer({ min: 1000, max: 9999 }) // Subscriber number
                ),
                ([areaCode, exchangeCode, subscriberNumber]) => {
                    // Build phone numbers with parentheses
                    const phonesWithParens = [
                        `+1 (${areaCode}) ${exchangeCode}-${subscriberNumber}`,
                        `+1(${areaCode})${exchangeCode}${subscriberNumber}`,
                    ]

                    phonesWithParens.forEach(phone => {
                        const result = normalizePhoneNumber(phone, "US")

                        // Property: normalization should succeed for phones with parentheses
                        expect(result.normalized).toBeDefined()
                        expect(result.error).toBeUndefined()

                        // Property: normalized phone should be in E.164 format (no parentheses)
                        expect(result.normalized).toMatch(/^\+\d{1,3}\d{4,14}$/)
                        expect(result.normalized).not.toContain("(")
                        expect(result.normalized).not.toContain(")")
                    })
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should reject invalid phone numbers during normalization", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => !/^\+?\d/.test(s)),
                invalidPhone => {
                    const result = normalizePhoneNumber(invalidPhone)

                    // Property: normalization should fail for invalid phones
                    expect(result.normalized).toBeUndefined()
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should reject empty or null phone numbers during normalization", () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(""),
                    fc.constant("   "),
                    fc.constant(null as any),
                    fc.constant(undefined as any)
                ),
                phone => {
                    const result = normalizePhoneNumber(phone)

                    // Property: normalization should fail for empty/null phones
                    expect(result.normalized).toBeUndefined()
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should normalize the same phone number consistently across multiple calls", () => {
        // Use specific valid phone numbers
        const validPhones = [
            "+12025551234", // US
            "+442071838750", // UK
            "+33123456789", // France
        ]

        validPhones.forEach(phone => {
            const result1 = normalizePhoneNumber(phone)
            const result2 = normalizePhoneNumber(phone)
            const result3 = normalizePhoneNumber(phone)

            // Property: normalizing the same phone multiple times yields identical results
            expect(result1.normalized).toBe(result2.normalized)
            expect(result2.normalized).toBe(result3.normalized)
            expect(result1.error).toBe(result2.error)
            expect(result2.error).toBe(result3.error)
        })
    }, 30000)

    it("should always return a consistent result structure", () => {
        fc.assert(
            fc.property(fc.string(), phone => {
                const result = normalizePhoneNumber(phone)

                // Property: result always has normalized or error property
                expect(
                    result.normalized !== undefined ||
                        result.error !== undefined
                ).toBe(true)

                // Property: normalized is either undefined or a string
                if (result.normalized !== undefined) {
                    expect(typeof result.normalized).toBe("string")
                    expect(result.normalized.length).toBeGreaterThan(0)
                }

                // Property: error is either undefined or a string
                if (result.error !== undefined) {
                    expect(typeof result.error).toBe("string")
                    expect(result.error.length).toBeGreaterThan(0)
                }

                // Property: if normalized, no error should be present
                if (result.normalized !== undefined) {
                    expect(result.error).toBeUndefined()
                }

                // Property: if error, normalized should not be present
                if (result.error !== undefined) {
                    expect(result.normalized).toBeUndefined()
                }
            }),
            { numRuns: 5, timeout: 5000 }
        )
    }, 30000)

    it("should normalize phone numbers to exactly E.164 format pattern", () => {
        // Use specific valid phone numbers
        const validPhones = [
            "+12025551234", // US
            "+442071838750", // UK
            "+33123456789", // France
            "+49301234567", // Germany
            "+551140411234", // Brazil
        ]

        validPhones.forEach(phone => {
            const result = normalizePhoneNumber(phone)

            if (result.normalized) {
                // Property: E.164 format is +[country code][number]
                // - Starts with +
                expect(result.normalized[0]).toBe("+")

                // - Contains only digits after +
                expect(result.normalized.slice(1)).toMatch(/^\d+$/)

                // - Total length is between 7 and 15 digits (after +)
                const digitsOnly = result.normalized.slice(1)
                expect(digitsOnly.length).toBeGreaterThanOrEqual(7)
                expect(digitsOnly.length).toBeLessThanOrEqual(15)

                // - No spaces, hyphens, parentheses, or other formatting
                expect(result.normalized).not.toContain(" ")
                expect(result.normalized).not.toContain("-")
                expect(result.normalized).not.toContain("(")
                expect(result.normalized).not.toContain(")")
            }
        })
    }, 30000)
})

