/**
 * Property-Based Test for Full Name Validation
 * Tests universal properties of name validation using fast-check
 *
 * **Validates: Requirements 4.3-4.5, 17.1-17.3**
 *
 * Property 4: Full Name Validation Correctness
 * For any name string, the validation function SHALL accept names with 2+ characters
 * and reject names with fewer than 2 characters.
 */

import { validateName } from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 4: Full Name Validation Correctness", () => {
    /**
     * **Validates: Requirements 4.3-4.5, 17.1-17.3**
     *
     * Property: For any name string, the validation function SHALL accept names with
     * 2+ characters and reject names with fewer than 2 characters.
     *
     * This property ensures that:
     * 1. Names with 2+ characters are always accepted
     * 2. Names with fewer than 2 characters are always rejected
     * 3. The same name always produces the same validation result
     * 4. Validation is deterministic and consistent
     */
    it("should consistently validate the same name across multiple invocations", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 100 })
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

                    // Property: valid names have no error
                    if (result1.isValid) {
                        expect(result1.error).toBeUndefined()
                    }

                    // Property: invalid names have an error message
                    if (!result1.isValid) {
                        expect(result1.error).toBeDefined()
                        expect(typeof result1.error).toBe("string")
                        expect(result1.error!.length).toBeGreaterThan(0)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with 2 or more characters", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 100 })
                    .filter(
                        s => /^[A-Za-z\s\-']+$/.test(s) && s.trim().length >= 2
                    ),
                name => {
                    const result = validateName(name)

                    // Property: names with 2+ characters should pass validation
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject names with fewer than 2 characters", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 0, maxLength: 1 })
                    .filter(
                        s => /^[A-Za-z\s\-']*$/.test(s) && s.trim().length < 2
                    ),
                name => {
                    const result = validateName(name)

                    // Property: names with fewer than 2 characters should fail validation
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    // Error can be either "required" or "at least 2 characters"
                    expect(
                        result.error!.includes("required") ||
                            result.error!.includes("2 characters")
                    ).toBe(true)
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with letters only", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 50 })
                    .filter(s => /^[A-Za-z]+$/.test(s)),
                name => {
                    const result = validateName(name)

                    // Property: names with only letters should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with spaces", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 20 })
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
            { numRuns: 100 }
        )
    })

    it("should accept names with hyphens", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 20 })
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
            { numRuns: 100 }
        )
    })

    it("should accept names with apostrophes", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 20 })
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
            { numRuns: 100 }
        )
    })

    it("should accept names with multiple spaces", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 15 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 15 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 15 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([part1, part2, part3]) => {
                    const name = `${part1} ${part2} ${part3}`

                    const result = validateName(name)

                    // Property: names with multiple spaces should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with mixed case", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 50 })
                    .filter(
                        s => /^[A-Za-z\s\-']+$/.test(s) && s.trim().length >= 2
                    ),
                name => {
                    const result = validateName(name)

                    // Property: names with mixed case should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject names with numbers", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc.integer({ min: 0, max: 999 })
                ),
                ([name, number]) => {
                    const invalidName = `${name}${number}`

                    const result = validateName(invalidName)

                    // Property: names with numbers should be invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject names with special characters (except hyphen and apostrophe)", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc.constantFrom(
                        "@",
                        "#",
                        "$",
                        "%",
                        "^",
                        "&",
                        "*",
                        "!",
                        "?",
                        "."
                    )
                ),
                ([name, specialChar]) => {
                    const invalidName = `${name}${specialChar}`

                    const result = validateName(invalidName)

                    // Property: names with special characters should be invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject empty names", () => {
        fc.assert(
            fc.property(fc.constant(""), name => {
                const result = validateName(name)

                // Property: empty names should be invalid
                expect(result.isValid).toBe(false)
                expect(result.error).toBeDefined()
            }),
            { numRuns: 100 }
        )
    })

    it("should reject null or undefined names", () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null as any),
                    fc.constant(undefined as any)
                ),
                name => {
                    const result = validateName(name)

                    // Property: null or undefined names should be invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should trim whitespace from names before validation", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 50 })
                    .filter(
                        s => /^[A-Za-z\s\-']+$/.test(s) && s.trim().length >= 2
                    ),
                name => {
                    const trimmedName = `  ${name}  `

                    const result = validateName(trimmedName)

                    // Property: names with surrounding whitespace should be trimmed and validated
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject names that are only whitespace", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 10 })
                    .filter(s => /^\s+$/.test(s)),
                name => {
                    const result = validateName(name)

                    // Property: names that are only whitespace should be invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should always return a consistent result structure", () => {
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
            { numRuns: 100 }
        )
    })

    it("should accept single letter names when combined with spaces or hyphens", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.constantFrom("A", "B", "C", "D", "E"),
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([initial, lastName]) => {
                    const name = `${initial} ${lastName}`

                    const result = validateName(name)

                    // Property: names like "J Smith" should be valid (2+ characters total)
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with multiple hyphens", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([part1, part2, part3]) => {
                    const name = `${part1}-${part2}-${part3}`

                    const result = validateName(name)

                    // Property: names with multiple hyphens should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with multiple apostrophes", () => {
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
                    const name = `${part1}'${part2}'s`

                    const result = validateName(name)

                    // Property: names with multiple apostrophes should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with combined hyphens, apostrophes, and spaces", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 10 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([part1, part2, part3]) => {
                    const name = `${part1}-${part2} ${part3}'s`

                    const result = validateName(name)

                    // Property: names with combined special characters should be valid
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
                    .string({ minLength: 2, maxLength: 10 })
                    .filter(s => /^\d+$/.test(s)),
                name => {
                    const result = validateName(name)

                    // Property: names with only numbers should be invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with only apostrophes if they are 2+ characters", () => {
        // Test specific cases rather than generating them
        const result1 = validateName("''")
        expect(result1.isValid).toBe(true)

        const result2 = validateName("'''")
        expect(result2.isValid).toBe(true)
    })

    it("should accept very long names (up to 100 characters)", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 2, maxLength: 100 })
                    .filter(
                        s => /^[A-Za-z\s\-']+$/.test(s) && s.trim().length >= 2
                    ),
                name => {
                    const result = validateName(name)

                    // Property: long names should be valid
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject single character names", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 1 })
                    .filter(s => /^[A-Za-z]$/.test(s)),
                name => {
                    const result = validateName(name)

                    // Property: single character names should be invalid
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                    expect(result.error).toContain("2 characters")
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should accept names with leading/trailing spaces that trim to 2+ characters", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s)),
                    fc
                        .string({ minLength: 1, maxLength: 20 })
                        .filter(s => /^[A-Za-z]+$/.test(s))
                ),
                ([part1, part2]) => {
                    const name = `   ${part1} ${part2}   `

                    const result = validateName(name)

                    // Property: names with leading/trailing spaces should be trimmed and validated
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })
})
