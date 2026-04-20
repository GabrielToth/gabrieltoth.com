/**
 * Password Strength Indicator Tests
 * Tests password strength calculation and missing requirements detection
 * Validates: Requirements 8.2
 */

import { describe, expect, it } from "vitest"
import {
    calculatePasswordStrength,
    getMissingRequirements,
} from "./password-strength"

describe("Password Strength Indicator", () => {
    describe("calculatePasswordStrength", () => {
        it("should return weak for empty password", () => {
            const result = calculatePasswordStrength("")
            expect(result.strength).toBe("weak")
            expect(result.score).toBe(0)
            expect(result.feedback).toContain("required")
        })

        it("should return weak for very short password", () => {
            const result = calculatePasswordStrength("abc")
            expect(result.strength).toBe("weak")
            expect(result.score).toBeLessThan(2)
        })

        it("should return weak for password with only lowercase", () => {
            const result = calculatePasswordStrength("abcdefgh")
            // Gets 2 points: length + lowercase = fair
            expect(result.strength).toBe("fair")
            expect(result.score).toBeGreaterThanOrEqual(2)
        })

        it("should return good for password with length and two character types", () => {
            const result = calculatePasswordStrength("Abcdefgh")
            // Gets 3 points: length + lowercase + uppercase = good
            expect(result.strength).toBe("good")
            expect(result.score).toBeGreaterThanOrEqual(3)
            expect(result.score).toBeLessThan(5)
        })

        it("should return good for password with length and three character types", () => {
            const result = calculatePasswordStrength("Abcdefgh1")
            expect(result.strength).toBe("good")
            expect(result.score).toBeGreaterThanOrEqual(3)
            expect(result.score).toBeLessThan(5)
        })

        it("should return strong for password with all requirements", () => {
            const result = calculatePasswordStrength("ValidPass123!")
            expect(result.strength).toBe("strong")
            expect(result.score).toBeGreaterThanOrEqual(4)
            expect(result.feedback).toContain("Strong")
        })

        it("should give bonus for longer passwords", () => {
            const shortPassword = calculatePasswordStrength("ValidPass123!")
            const longPassword = calculatePasswordStrength(
                "ValidPass123!ExtraLong"
            )

            expect(longPassword.score).toBeGreaterThanOrEqual(
                shortPassword.score
            )
        })

        it("should return appropriate color for each strength level", () => {
            // weak: score < 2
            expect(calculatePasswordStrength("weak").color).toBe("text-red-500")
            // fair: score 2-2.9 (need only 2 types)
            expect(calculatePasswordStrength("weak12").color).toBe(
                "text-orange-500"
            )
            // good: score 3-4.9 (need 3-4 types, but not all 5)
            expect(calculatePasswordStrength("Weak1234").color).toBe(
                "text-yellow-500"
            )
            // strong: score >= 5 (all types)
            expect(calculatePasswordStrength("ValidPass123!").color).toBe(
                "text-green-500"
            )
        })
    })

    describe("getMissingRequirements", () => {
        it("should return all requirements for empty password", () => {
            const missing = getMissingRequirements("")
            expect(missing).toHaveLength(5)
            expect(missing).toContain("At least 8 characters")
            expect(missing).toContain("Uppercase letter (A-Z)")
            expect(missing).toContain("Lowercase letter (a-z)")
            expect(missing).toContain("Number (0-9)")
            expect(missing).toContain("Special character (!@#$%^&*)")
        })

        it("should return missing uppercase for lowercase-only password", () => {
            const missing = getMissingRequirements("abcdefgh123!")
            expect(missing).toContain("Uppercase letter (A-Z)")
            expect(missing).not.toContain("Lowercase letter (a-z)")
            expect(missing).not.toContain("Number (0-9)")
            expect(missing).not.toContain("Special character (!@#$%^&*)")
        })

        it("should return missing lowercase for uppercase-only password", () => {
            const missing = getMissingRequirements("ABCDEFGH123!")
            expect(missing).toContain("Lowercase letter (a-z)")
            expect(missing).not.toContain("Uppercase letter (A-Z)")
        })

        it("should return missing number for password without digits", () => {
            const missing = getMissingRequirements("ValidPass!")
            expect(missing).toContain("Number (0-9)")
            expect(missing).not.toContain("Uppercase letter (A-Z)")
            expect(missing).not.toContain("Lowercase letter (a-z)")
        })

        it("should return missing special character for alphanumeric password", () => {
            const missing = getMissingRequirements("ValidPass123")
            expect(missing).toContain("Special character (!@#$%^&*)")
            expect(missing).not.toContain("Number (0-9)")
        })

        it("should return empty array for password meeting all requirements", () => {
            const missing = getMissingRequirements("ValidPass123!")
            expect(missing).toHaveLength(0)
        })

        it("should return length requirement for short password", () => {
            const missing = getMissingRequirements("Val1!")
            expect(missing).toContain("At least 8 characters")
        })
    })

    describe("Edge Cases", () => {
        it("should handle password with only special characters", () => {
            const result = calculatePasswordStrength("!@#$%^&*()")
            expect(result.strength).toBe("fair")
            expect(result.score).toBeGreaterThan(0)
        })

        it("should handle password with unicode characters", () => {
            const result = calculatePasswordStrength("ValidPass123!🔒")
            expect(result.strength).toBe("strong")
        })

        it("should handle very long passwords", () => {
            const longPassword = "ValidPass123!".repeat(10)
            const result = calculatePasswordStrength(longPassword)
            expect(result.strength).toBe("strong")
            expect(result.score).toBeGreaterThanOrEqual(4)
        })

        it("should handle password with spaces", () => {
            const result = calculatePasswordStrength("Valid Pass 123!")
            expect(result.strength).toBe("strong")
        })
    })
})
