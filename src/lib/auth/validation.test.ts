/**
 * Account Completion Validation Unit Tests
 *
 * Standard unit tests complementing the property-based tests in validation.property.test.ts.
 * Covers specific success paths, error paths, and edge cases for all validation functions.
 *
 * Validates: Requirements 5.1-5.8, 6.1-6.7
 */

import { describe, expect, it } from "vitest"
import {
    validateAccountCompletionData,
    validateBirthDate,
    validateEmail,
    validateName,
    validatePassword,
    validatePhoneNumber,
} from "./validation"

// ============================================================================
// validatePassword() Tests
// ============================================================================

describe("validatePassword()", () => {
    it("should accept a valid strong password", () => {
        const result = validatePassword("SecurePass123!")
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it("should reject empty password", () => {
        const result = validatePassword("")
        expect(result.valid).toBe(false)
        expect(result.errors).toContain("Password is required")
    })

    it("should reject undefined/empty string password", () => {
        const result = validatePassword("")
        expect(result.valid).toBe(false)
    })

    it("should reject password shorter than 8 characters", () => {
        const result = validatePassword("Ab1!")
        expect(result.valid).toBe(false)
        expect(result.errors).toContain(
            "Password must be at least 8 characters"
        )
    })

    it("should reject password without uppercase letter", () => {
        const result = validatePassword("abcdefgh1!")
        expect(result.valid).toBe(false)
        expect(result.errors).toContain(
            "Password must contain at least one uppercase letter"
        )
    })

    it("should reject password without lowercase letter", () => {
        const result = validatePassword("ABCDEFGH1!")
        expect(result.valid).toBe(false)
        expect(result.errors).toContain(
            "Password must contain at least one lowercase letter"
        )
    })

    it("should reject password without number", () => {
        const result = validatePassword("Abcdefgh!")
        expect(result.valid).toBe(false)
        expect(result.errors).toContain(
            "Password must contain at least one number"
        )
    })

    it("should reject password without special character", () => {
        const result = validatePassword("Abcdefgh1")
        expect(result.valid).toBe(false)
        expect(result.errors).toContain(
            "Password must contain at least one special character (!@#$%^&*)"
        )
    })

    it("should return multiple errors when password fails multiple rules", () => {
        const result = validatePassword("weak")
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(1)
    })
})

// ============================================================================
// validatePhoneNumber() Tests
// ============================================================================

describe("validatePhoneNumber()", () => {
    it("should accept a valid international phone number", () => {
        expect(validatePhoneNumber("+1234567890")).toBe(true)
    })

    it("should accept a valid phone number with country code", () => {
        expect(validatePhoneNumber("+5511999999999")).toBe(true)
    })

    it("should reject empty string", () => {
        expect(validatePhoneNumber("")).toBe(false)
    })

    it("should reject phone number without + prefix", () => {
        expect(validatePhoneNumber("1234567890")).toBe(false)
    })

    it("should reject phone number with non-digit characters after +", () => {
        expect(validatePhoneNumber("+abc1234567")).toBe(false)
    })

    it("should reject phone number that is too short", () => {
        expect(validatePhoneNumber("+123")).toBe(false)
    })

    it("should reject phone number that is too long", () => {
        expect(validatePhoneNumber("+12345678901234567890")).toBe(false)
    })

    it("should accept phone number at minimum length boundary", () => {
        // 10 digits after + = 11 chars total
        expect(validatePhoneNumber("+1234567890")).toBe(true)
    })

    it("should accept phone number at maximum length boundary", () => {
        // 15 digits after + = 16 chars total
        expect(validatePhoneNumber("+123456789012345")).toBe(true)
    })

    it("should reject phone number below minimum boundary (9 digits)", () => {
        expect(validatePhoneNumber("+123456789")).toBe(false)
    })

    it("should reject phone number above maximum boundary (16 digits)", () => {
        expect(validatePhoneNumber("+1234567890123456")).toBe(false)
    })
})

// ============================================================================
// validateBirthDate() Tests
// ============================================================================

describe("validateBirthDate()", () => {
    it("should accept a valid birth date for someone 13 or older", () => {
        const result = validateBirthDate("2000-01-01")
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    it("should reject empty birth date", () => {
        const result = validateBirthDate("")
        expect(result.valid).toBe(false)
        expect(result.error).toBe("Birth date is required")
    })

    it("should reject non-ISO 8601 format", () => {
        const result = validateBirthDate("01/01/2000")
        expect(result.valid).toBe(false)
        expect(result.error).toBe("Birth date must be in YYYY-MM-DD format")
    })

    it("should reject future dates", () => {
        const result = validateBirthDate("2099-01-01")
        expect(result.valid).toBe(false)
        expect(result.error).toBe("Birth date cannot be in the future")
    })

    it("should reject dates for users under 13", () => {
        const result = validateBirthDate("2020-06-01")
        expect(result.valid).toBe(false)
        expect(result.error).toBe("You must be at least 13 years old")
    })

    it("should reject invalid date strings", () => {
        const result = validateBirthDate("not-a-date")
        expect(result.valid).toBe(false)
    })

    it("should reject month overflow dates", () => {
        const result = validateBirthDate("2024-13-01")
        expect(result.valid).toBe(false)
    })

    it("should reject day overflow dates", () => {
        const result = validateBirthDate("2024-01-32")
        expect(result.valid).toBe(false)
    })

    it("should accept boundary: exactly 13 years old (birthday was today, 13 years ago)", () => {
        const today = new Date()
        const thirteenYearsAgo = new Date(
            today.getFullYear() - 13,
            today.getMonth(),
            today.getDate()
        )
        const dateStr = thirteenYearsAgo.toISOString().split("T")[0]
        const result = validateBirthDate(dateStr)
        expect(result.valid).toBe(true)
    })
})

// ============================================================================
// validateEmail() Tests
// ============================================================================

describe("validateEmail()", () => {
    it("should accept a valid email address", () => {
        expect(validateEmail("user@example.com")).toBe(true)
    })

    it("should accept email with subdomain", () => {
        expect(validateEmail("user@sub.example.com")).toBe(true)
    })

    it("should accept email with plus addressing", () => {
        expect(validateEmail("user+tag@example.com")).toBe(true)
    })

    it("should reject empty string", () => {
        expect(validateEmail("")).toBe(false)
    })

    it("should reject email without @ symbol", () => {
        expect(validateEmail("userexample.com")).toBe(false)
    })

    it("should reject email without domain", () => {
        expect(validateEmail("user@")).toBe(false)
    })

    it("should reject email with spaces", () => {
        expect(validateEmail("user @example.com")).toBe(false)
    })

    it("should reject email without TLD", () => {
        expect(validateEmail("user@example")).toBe(false)
    })
})

// ============================================================================
// validateName() Tests
// ============================================================================

describe("validateName()", () => {
    it("should accept a valid name", () => {
        const result = validateName("John Doe")
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    it("should accept a single character name (boundary: exactly 2 chars)", () => {
        const result = validateName("Jo")
        expect(result.valid).toBe(true)
    })

    it("should accept a 100 character name (boundary)", () => {
        const name = "A".repeat(100)
        const result = validateName(name)
        expect(result.valid).toBe(true)
    })

    it("should reject empty name", () => {
        const result = validateName("")
        expect(result.valid).toBe(false)
        expect(result.error).toBe("Name is required")
    })

    it("should reject name shorter than 2 characters", () => {
        const result = validateName("J")
        expect(result.valid).toBe(false)
        expect(result.error).toBe("Name must be at least 2 characters")
    })

    it("should reject name longer than 100 characters", () => {
        const name = "A".repeat(101)
        const result = validateName(name)
        expect(result.valid).toBe(false)
        expect(result.error).toBe("Name must be at most 100 characters")
    })
})

// ============================================================================
// validateAccountCompletionData() Tests
// ============================================================================

describe("validateAccountCompletionData()", () => {
    it("should validate complete and correct data", () => {
        const result = validateAccountCompletionData({
            email: "user@example.com",
            name: "John Doe",
            password: "SecurePass123!",
            phone: "+1234567890",
            birthDate: "1990-01-01",
        })
        expect(result.valid).toBe(true)
        expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it("should return errors when all fields are missing", () => {
        const result = validateAccountCompletionData({})
        expect(result.valid).toBe(false)
        expect(result.errors.email).toBe("Email is required")
        expect(result.errors.name).toBe("Name is required")
        expect(result.errors.password).toBe("Password is required")
        expect(result.errors.phone).toBe("Phone number is required")
        expect(result.errors.birthDate).toBe("Birth date is required")
    })

    it("should return validation errors for invalid fields", () => {
        const result = validateAccountCompletionData({
            email: "invalid",
            name: "J",
            password: "weak",
            phone: "12345",
            birthDate: "invalid-date",
        })
        expect(result.valid).toBe(false)
        expect(result.errors.email).toBe(
            "Please enter a valid email address"
        )
        expect(result.errors.name).toBe(
            "Name must be at least 2 characters"
        )
        expect(result.errors.password).toBeTruthy()
        expect(result.errors.phone).toBe(
            "Please enter a valid international phone number"
        )
        expect(result.errors.birthDate).toBe(
            "Birth date must be in YYYY-MM-DD format"
        )
    })

    it("should only validate fields that are provided", () => {
        const result = validateAccountCompletionData({
            email: "user@example.com",
        })
        expect(result.valid).toBe(false)
        // email should be valid
        expect(result.errors.email).toBeUndefined()
        // other fields should have "required" errors
        expect(result.errors.name).toBe("Name is required")
        expect(result.errors.password).toBe("Password is required")
        expect(result.errors.phone).toBe("Phone number is required")
        expect(result.errors.birthDate).toBe("Birth date is required")
    })

    it("should handle empty strings for all fields", () => {
        const result = validateAccountCompletionData({
            email: "",
            name: "",
            password: "",
            phone: "",
            birthDate: "",
        })
        expect(result.valid).toBe(false)
        expect(result.errors.email).toBe("Email is required")
        expect(result.errors.name).toBe("Name is required")
        expect(result.errors.password).toBe("Password is required")
        expect(result.errors.phone).toBe("Phone number is required")
        expect(result.errors.birthDate).toBe("Birth date is required")
    })
})
