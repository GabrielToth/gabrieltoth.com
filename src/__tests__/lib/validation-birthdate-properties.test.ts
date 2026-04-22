/**
 * Property-Based Tests for Birth Date Validation
 * Feature: registration-flow-redesign
 *
 * These tests validate the universal correctness properties for birth date validation
 * using property-based testing with fast-check framework.
 */

import { validateBirthDateFormat, validateMinimumAge } from "@/lib/validation"
import fc from "fast-check"
import { describe, expect, it } from "vitest"

describe("Property 5: Birth Date Format Validation", () => {
    /**
     * **Validates: Requirements 4.8-4.9, 18.1-18.2**
     *
     * For any date string, the validation function SHALL accept valid DD/MM/YYYY
     * formatted dates and reject invalid formats or impossible dates.
     *
     * This property ensures that:
     * - Valid DD/MM/YYYY dates are consistently accepted
     * - Invalid formats are consistently rejected
     * - Impossible dates (e.g., 32/13/2000) are rejected
     * - Future dates are rejected
     * - Dates more than 120 years in the past are rejected
     */
    it("should accept valid DD/MM/YYYY formatted dates and reject invalid formats", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 1, max: 31 }), // day
                    fc.integer({ min: 1, max: 12 }), // month
                    fc.integer({ min: 1900, max: 2024 }) // year
                ),
                ([day, month, year]) => {
                    // Format the date as DD/MM/YYYY
                    const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`

                    const result = validateBirthDateFormat(dateStr)

                    // Property: result should always have isValid boolean
                    expect(typeof result.isValid).toBe("boolean")

                    // Property: if isValid is false, error should be defined
                    if (!result.isValid) {
                        expect(result.error).toBeDefined()
                        expect(typeof result.error).toBe("string")
                        expect(result.error).toBe(
                            "Please enter a valid date (DD/MM/YYYY)"
                        )
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should correctly validate dates with proper day/month combinations", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 1, max: 12 }), // month
                    fc.integer({ min: 1900, max: 2024 }) // year
                ),
                ([month, year]) => {
                    // Determine valid days for this month
                    const daysInMonth = [
                        31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
                    ]
                    const isLeapYear =
                        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
                    if (isLeapYear) {
                        daysInMonth[1] = 29
                    }

                    const maxDay = daysInMonth[month - 1]

                    // Test with valid day
                    const validDay = fc.sample(
                        fc.integer({ min: 1, max: maxDay }),
                        1
                    )[0]
                    const validDateStr = `${String(validDay).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
                    const validResult = validateBirthDateFormat(validDateStr)

                    // Property: valid dates should be accepted (unless in future or too old)
                    const today = new Date()
                    const dateObj = new Date(year, month - 1, validDay)
                    const isFuture = dateObj > today
                    const age = today.getFullYear() - year
                    const isTooOld = age > 120

                    if (!isFuture && !isTooOld) {
                        expect(validResult.isValid).toBe(true)
                    }

                    // Test with invalid day (one past max)
                    const invalidDay = maxDay + 1
                    const invalidDateStr = `${String(invalidDay).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
                    const invalidResult =
                        validateBirthDateFormat(invalidDateStr)

                    // Property: invalid days should be rejected
                    expect(invalidResult.isValid).toBe(false)
                    expect(invalidResult.error).toBe(
                        "Please enter a valid date (DD/MM/YYYY)"
                    )
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject invalid formats consistently", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    "01-01-1990", // dashes instead of slashes
                    "01.01.1990", // dots instead of slashes
                    "01011990", // no separators
                    "1/1/1990", // single digit day/month
                    "01/01/90", // 2-digit year
                    "2024-01-01", // ISO format
                    "01/01/1990 extra", // extra characters
                    "01/01", // missing year
                    "01/1990", // missing month
                    "1990", // only year
                    "invalid", // completely invalid
                    "", // empty string
                    "   ", // only spaces
                    "32/01/1990", // invalid day
                    "01/13/1990", // invalid month
                    "00/01/1990", // day 0
                    "01/00/1990" // month 0
                ),
                invalidDate => {
                    const result = validateBirthDateFormat(invalidDate)

                    // Property: invalid formats should always be rejected
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should handle leap year dates correctly", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 1900, max: 2024 }), // year
                    fc.boolean() // whether to test Feb 29
                ),
                ([year, testLeapDay]) => {
                    if (testLeapDay) {
                        const isLeapYear =
                            (year % 4 === 0 && year % 100 !== 0) ||
                            year % 400 === 0

                        const dateStr = "29/02/" + year

                        const result = validateBirthDateFormat(dateStr)

                        if (isLeapYear) {
                            // Property: leap year Feb 29 should be valid (unless future or too old)
                            const today = new Date()
                            const dateObj = new Date(year, 1, 29)
                            const isFuture = dateObj > today
                            const age = today.getFullYear() - year
                            const isTooOld = age > 120

                            if (!isFuture && !isTooOld) {
                                expect(result.isValid).toBe(true)
                            }
                        } else {
                            // Property: non-leap year Feb 29 should be invalid
                            expect(result.isValid).toBe(false)
                        }
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject future dates consistently", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 365 }), // days in future
                daysInFuture => {
                    const futureDate = new Date()
                    futureDate.setDate(futureDate.getDate() + daysInFuture)

                    const dateStr = `${String(futureDate.getDate()).padStart(2, "0")}/${String(futureDate.getMonth() + 1).padStart(2, "0")}/${futureDate.getFullYear()}`

                    const result = validateBirthDateFormat(dateStr)

                    // Property: future dates should always be rejected
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBe(
                        "Please enter a valid date (DD/MM/YYYY)"
                    )
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject dates more than 120 years in the past", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 121, max: 200 }), // years in past (more than 120)
                yearsInPast => {
                    const oldDate = new Date()
                    oldDate.setFullYear(oldDate.getFullYear() - yearsInPast)

                    const dateStr = `${String(oldDate.getDate()).padStart(2, "0")}/${String(oldDate.getMonth() + 1).padStart(2, "0")}/${oldDate.getFullYear()}`

                    const result = validateBirthDateFormat(dateStr)

                    // Property: dates more than 120 years old should be rejected
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBe(
                        "Please enter a valid date (DD/MM/YYYY)"
                    )
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should maintain consistency across multiple validations of the same date", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 1, max: 31 }),
                    fc.integer({ min: 1, max: 12 }),
                    fc.integer({ min: 1900, max: 2024 })
                ),
                ([day, month, year]) => {
                    const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`

                    // Property: validating the same date multiple times should yield identical results
                    const result1 = validateBirthDateFormat(dateStr)
                    const result2 = validateBirthDateFormat(dateStr)
                    const result3 = validateBirthDateFormat(dateStr)

                    expect(result1.isValid).toBe(result2.isValid)
                    expect(result2.isValid).toBe(result3.isValid)

                    expect(result1.error).toBe(result2.error)
                    expect(result2.error).toBe(result3.error)
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should handle whitespace trimming correctly", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 1, max: 31 }),
                    fc.integer({ min: 1, max: 12 }),
                    fc.integer({ min: 1900, max: 2024 })
                ),
                ([day, month, year]) => {
                    const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
                    const trimmedDateStr = `  ${dateStr}  `

                    // Property: dates with leading/trailing whitespace should be treated same as without
                    const resultWithoutWhitespace =
                        validateBirthDateFormat(dateStr)
                    const resultWithWhitespace =
                        validateBirthDateFormat(trimmedDateStr)

                    expect(resultWithWhitespace.isValid).toBe(
                        resultWithoutWhitespace.isValid
                    )
                    expect(resultWithWhitespace.error).toBe(
                        resultWithoutWhitespace.error
                    )
                }
            ),
            { numRuns: 100 }
        )
    })
})

describe("Property 6: Age Validation Correctness", () => {
    /**
     * **Validates: Requirements 4.10-4.11, 6.10-6.11, 18.3**
     *
     * For any birth date, age calculation SHALL correctly determine if the user
     * is at least 13 years old, rejecting users under 13 and accepting users
     * 13 and older.
     *
     * This property ensures that:
     * - Users exactly 13 years old are accepted
     * - Users older than 13 are accepted
     * - Users under 13 are rejected
     * - Age calculation is accurate across month/day boundaries
     */
    it("should accept users 13 years old or older", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 100 }), // years older than 13
                yearsOlderThan13 => {
                    const today = new Date()
                    const year = today.getFullYear() - 13 - yearsOlderThan13
                    const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${year}`

                    const result = validateMinimumAge(dateStr)

                    // Property: users 13 or older should be accepted
                    expect(result.isValid).toBe(true)
                    expect(result.error).toBeUndefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject users under 13 years old", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 12 }), // years younger than 13
                yearsYoungerThan13 => {
                    const today = new Date()
                    const year = today.getFullYear() - yearsYoungerThan13
                    const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${year}`

                    const result = validateMinimumAge(dateStr)

                    // Property: users under 13 should be rejected
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBe(
                        "You must be at least 13 years old to register"
                    )
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should correctly handle age calculation across month boundaries", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 1, max: 12 }), // birth month
                    fc.integer({ min: 1, max: 28 }) // birth day (safe for all months)
                ),
                ([birthMonth, birthDay]) => {
                    const today = new Date()
                    const currentMonth = today.getMonth() + 1
                    const currentDay = today.getDate()

                    // Calculate year for someone who will be exactly 13 today or tomorrow
                    let year = today.getFullYear() - 13

                    // If birthday hasn't occurred yet this year, they're still 12
                    if (
                        birthMonth > currentMonth ||
                        (birthMonth === currentMonth && birthDay > currentDay)
                    ) {
                        year += 1
                    }

                    const dateStr = `${String(birthDay).padStart(2, "0")}/${String(birthMonth).padStart(2, "0")}/${year}`

                    const result = validateMinimumAge(dateStr)

                    // Calculate expected age
                    let expectedAge = today.getFullYear() - year
                    const monthDiff = today.getMonth() + 1 - birthMonth
                    if (
                        monthDiff < 0 ||
                        (monthDiff === 0 && today.getDate() < birthDay)
                    ) {
                        expectedAge--
                    }

                    // Property: validation should match calculated age
                    if (expectedAge >= 13) {
                        expect(result.isValid).toBe(true)
                    } else {
                        expect(result.isValid).toBe(false)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should correctly handle age calculation across day boundaries", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 28 }), // day of month
                day => {
                    const today = new Date()
                    const year = today.getFullYear() - 13
                    const month = today.getMonth() + 1

                    const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`

                    const result = validateMinimumAge(dateStr)

                    // Calculate expected age
                    let expectedAge = today.getFullYear() - year
                    if (today.getDate() < day) {
                        expectedAge--
                    }

                    // Property: validation should match calculated age
                    if (expectedAge >= 13) {
                        expect(result.isValid).toBe(true)
                    } else {
                        expect(result.isValid).toBe(false)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should reject invalid date formats before checking age", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    "01-01-2010", // invalid format
                    "01.01.2010", // invalid format
                    "2010-01-01", // invalid format
                    "invalid", // invalid format
                    "32/13/2010", // invalid date
                    "29/02/2001" // invalid leap year
                ),
                invalidDate => {
                    const result = validateMinimumAge(invalidDate)

                    // Property: invalid formats should be rejected
                    expect(result.isValid).toBe(false)
                    expect(result.error).toBeDefined()
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should maintain consistency across multiple validations of the same birth date", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 1, max: 28 }),
                    fc.integer({ min: 1, max: 12 }),
                    fc.integer({ min: 1900, max: 2024 })
                ),
                ([day, month, year]) => {
                    const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`

                    // Property: validating the same birth date multiple times should yield identical results
                    const result1 = validateMinimumAge(dateStr)
                    const result2 = validateMinimumAge(dateStr)
                    const result3 = validateMinimumAge(dateStr)

                    expect(result1.isValid).toBe(result2.isValid)
                    expect(result2.isValid).toBe(result3.isValid)

                    expect(result1.error).toBe(result2.error)
                    expect(result2.error).toBe(result3.error)
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should correctly handle edge case of exactly 13 years old", () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 1, max: 28 }), // day
                    fc.integer({ min: 1, max: 12 }) // month
                ),
                ([day, month]) => {
                    const today = new Date()
                    const year = today.getFullYear() - 13

                    const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`

                    const result = validateMinimumAge(dateStr)

                    // Calculate if birthday has occurred this year
                    const currentMonth = today.getMonth() + 1
                    const currentDay = today.getDate()

                    const birthdayOccurred =
                        month < currentMonth ||
                        (month === currentMonth && day <= currentDay)

                    // Property: if birthday has occurred, should be accepted (exactly 13)
                    // if birthday hasn't occurred, should be rejected (still 12)
                    if (birthdayOccurred) {
                        expect(result.isValid).toBe(true)
                    } else {
                        expect(result.isValid).toBe(false)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it("should handle leap year birth dates correctly for age calculation", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1920, max: 2020 }), // year (must be within 120 years and be a leap year)
                year => {
                    const isLeapYear =
                        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

                    if (isLeapYear) {
                        const dateStr = `29/02/${year}`
                        const result = validateMinimumAge(dateStr)

                        // Calculate expected age
                        const today = new Date()
                        let age = today.getFullYear() - year

                        // Adjust for birthday not yet occurred this year
                        // Feb 29 only occurs in leap years, so we need special handling
                        const currentMonth = today.getMonth() + 1
                        const currentDay = today.getDate()

                        if (
                            currentMonth < 2 ||
                            (currentMonth === 2 && currentDay < 29)
                        ) {
                            age--
                        }

                        // Property: age calculation should be correct
                        if (age >= 13) {
                            expect(result.isValid).toBe(true)
                        } else {
                            expect(result.isValid).toBe(false)
                        }
                    }
                }
            ),
            { numRuns: 100 }
        )
    })
})
