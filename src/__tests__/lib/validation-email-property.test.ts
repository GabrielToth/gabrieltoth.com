/**
 * Property-Based Test for Email Format Validation
 * Tests universal properties of email validation using fast-check
 *
 * **Validates: Requirements 2.3, 15.1**
 *
 * Property 1: Email Format Validation Consistency
 * For any email address, the validation function SHALL consistently accept valid RFC 5322
 * formatted emails and reject invalid formats across all invocations.
 */

import { validateEmail } from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 1: Email Format Validation Consistency", () => {
    /**
     * **Validates: Requirements 2.3, 15.1**
     *
     * Property: For any email address, the validation function SHALL consistently
     * accept valid RFC 5322 formatted emails and reject invalid formats across all invocations.
     *
     * This property ensures that:
     * 1. Valid RFC 5322 emails are always accepted
     * 2. Invalid emails are always rejected
     * 3. The same email always produces the same validation result
     * 4. Validation is deterministic and consistent
     */
    it("should consistently validate the same email across multiple invocations", () => {
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

                // Property: valid emails have no error
                if (result1.isValid) {
                    expect(result1.error).toBeUndefined()
                }

                // Property: invalid emails have an error message
                if (!result1.isValid) {
                    expect(result1.error).toBeDefined()
                    expect(typeof result1.error).toBe("string")
                    expect(result1.error!.length).toBeGreaterThan(0)
                }
            }),
            { numRuns: 100 }
        )
    })

    it("should accept valid RFC 5322 formatted emails", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z]+$/.test(s))
                ),
                ([localPart, domain, tld]) => {
                    // Build a valid RFC 5322 email
                    const email = `${localPart}@${domain}.${tld}`

                    const result = validateEmail(email)

                    // Property: valid emails should pass validation
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept emails with valid special characters in local part", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc.constantFrom("+", "_", "-", "."),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s))
                ),
                ([part1, specialChar, part2]) => {
                    // Build email with special character (avoiding leading/trailing dots)
                    const email = `${part1}${specialChar}${part2}@example.com`

                    const result = validateEmail(email)

                    // Property: emails with valid special characters should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept emails with multiple domain levels", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^[a-zA-Z]+$/.test(s))
                ),
                ([localPart, subdomain, domain, tld]) => {
                    const email = `${localPart}@${subdomain}.${domain}.${tld}`

                    const result = validateEmail(email)

                    // Property: emails with multiple domain levels should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject emails without @ symbol", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    fc.string({ minLength: 1, maxLength: 20 })
                ),
                ([part1, part2]) => {
                    // Generate invalid email by removing @ symbol
                    const invalidEmail = `${part1}${part2}`

                    const result = validateEmail(invalidEmail)

                    // Property: emails without @ are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject emails with missing local part", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => /^[a-zA-Z0-9.]+$/.test(s)),
                domain => {
                    const invalidEmail = `@${domain}.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with @ but no local part are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject emails with missing domain", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => /^[a-zA-Z0-9.]+$/.test(s)),
                localPart => {
                    const invalidEmail = `${localPart}@`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with @ but no domain are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject emails with consecutive dots in local part", () => {
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
                ([part1, part2]) => {
                    const invalidEmail = `${part1}..${part2}@example.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with consecutive dots are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject emails with leading dot in local part", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                localPart => {
                    const invalidEmail = `.${localPart}@example.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with leading dot in local part are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject emails with trailing dot in local part", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                localPart => {
                    const invalidEmail = `${localPart}.@example.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with trailing dot in local part are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject emails with leading hyphen in domain", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                domain => {
                    const invalidEmail = `user@-${domain}.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with leading hyphen in domain are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject emails with trailing hyphen in domain", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                domain => {
                    const invalidEmail = `user@${domain}-.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with trailing hyphen in domain are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
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
            { numRuns: 100 }
        )
    })

    it("should reject emails with spaces", () => {
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
                ([part1, part2]) => {
                    const invalidEmail = `${part1} ${part2}@example.com`

                    const result = validateEmail(invalidEmail)

                    // Property: emails with spaces are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
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
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^[a-zA-Z]+$/.test(s))
                ),
                ([localPart, domain, tld]) => {
                    const email = `${localPart}@${domain}.${tld}`
                    const trimmedEmail = `  ${email}  `

                    const result = validateEmail(trimmedEmail)

                    // Property: emails with surrounding whitespace should be trimmed and validated
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
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

    it("should reject emails without TLD (top-level domain)", () => {
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
                    const invalidEmail = `${localPart}@${domain}`

                    const result = validateEmail(invalidEmail)

                    // Property: emails without TLD are always invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept emails with hyphens in domain", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 5 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s))
                ),
                ([localPart, domain1, domain2]) => {
                    const email = `${localPart}@${domain1}-${domain2}.com`

                    const result = validateEmail(email)

                    // Property: emails with hyphens in domain should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept emails with numbers in domain", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[a-zA-Z0-9]+$/.test(s)),
                    fc.integer({ min: 0, max: 999 })
                ),
                ([localPart, number]) => {
                    const email = `${localPart}@example${number}.com`

                    const result = validateEmail(email)

                    // Property: emails with numbers in domain should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept emails with plus sign in local part", () => {
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
                ([part1, part2]) => {
                    const email = `${part1}+${part2}@example.com`

                    const result = validateEmail(email)

                    // Property: emails with plus sign should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept emails with underscore in local part", () => {
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
                ([part1, part2]) => {
                    const email = `${part1}_${part2}@example.com`

                    const result = validateEmail(email)

                    // Property: emails with underscore should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept emails with dots in local part (not consecutive)", () => {
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
                ([part1, part2]) => {
                    const email = `${part1}.${part2}@example.com`

                    const result = validateEmail(email)

                    // Property: emails with single dots in local part should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })
})
