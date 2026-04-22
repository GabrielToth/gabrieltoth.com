/**
 * Account Completion Validation Tests
 *
 * Tests for password, phone, birth date, email, and complete account data validation
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 6.1
 */

import {
    validateAccountCompletionData,
    validateBirthDate,
    validateEmail,
    validateName,
    validatePassword,
    validatePhoneNumber,
} from "./account-completion-validation"

describe("Account Completion Validation", () => {
    describe("validatePassword", () => {
        it("should reject password without uppercase letter", () => {
            const result = validatePassword("lowercase123!")
            expect(result.valid).toBe(false)
            expect(result.errors).toContain(
                "Password must contain at least one uppercase letter"
            )
        })

        it("should reject password without lowercase letter", () => {
            const result = validatePassword("UPPERCASE123!")
            expect(result.valid).toBe(false)
            expect(result.errors).toContain(
                "Password must contain at least one lowercase letter"
            )
        })

        it("should reject password without number", () => {
            const result = validatePassword("NoNumbers!")
            expect(result.valid).toBe(false)
            expect(result.errors).toContain(
                "Password must contain at least one number"
            )
        })

        it("should reject password without special character", () => {
            const result = validatePassword("NoSpecial123")
            expect(result.valid).toBe(false)
            expect(result.errors).toContain(
                "Password must contain at least one special character (!@#$%^&*)"
            )
        })

        it("should reject password shorter than 8 characters", () => {
            const result = validatePassword("Pass1!")
            expect(result.valid).toBe(false)
            expect(result.errors).toContain(
                "Password must be at least 8 characters"
            )
        })

        it("should reject empty password", () => {
            const result = validatePassword("")
            expect(result.valid).toBe(false)
            expect(result.errors).toContain("Password is required")
        })

        it("should accept valid password", () => {
            const result = validatePassword("SecurePass123!")
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it("should accept valid password with multiple special characters", () => {
            const result = validatePassword("MyPass@2024#Secure")
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe("validatePhoneNumber", () => {
        it("should accept valid international phone number", () => {
            expect(validatePhoneNumber("+1234567890")).toBe(true)
        })

        it("should accept valid Brazilian phone number", () => {
            expect(validatePhoneNumber("+551199999999")).toBe(true)
        })

        it("should accept valid German phone number", () => {
            expect(validatePhoneNumber("+491234567890")).toBe(true)
        })

        it("should reject phone number without +", () => {
            expect(validatePhoneNumber("1234567890")).toBe(false)
        })

        it("should reject phone number with too few digits", () => {
            expect(validatePhoneNumber("+123")).toBe(false)
        })

        it("should reject phone number with too many digits", () => {
            expect(validatePhoneNumber("+12345678901234567")).toBe(false)
        })

        it("should reject empty phone number", () => {
            expect(validatePhoneNumber("")).toBe(false)
        })

        it("should reject phone number with letters", () => {
            expect(validatePhoneNumber("+123456789a")).toBe(false)
        })
    })

    describe("validateBirthDate", () => {
        it("should accept valid birth date", () => {
            const result = validateBirthDate("1990-01-01")
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should reject birth date in the future", () => {
            const futureDate = new Date()
            futureDate.setFullYear(futureDate.getFullYear() + 1)
            const dateStr = futureDate.toISOString().split("T")[0]

            const result = validateBirthDate(dateStr)
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Birth date cannot be in the future")
        })

        it("should reject birth date for user under 13 years old", () => {
            const today = new Date()
            const birthDate = new Date(
                today.getFullYear() - 12,
                today.getMonth(),
                today.getDate()
            )
            const dateStr = birthDate.toISOString().split("T")[0]

            const result = validateBirthDate(dateStr)
            expect(result.valid).toBe(false)
            expect(result.error).toBe("You must be at least 13 years old")
        })

        it("should accept birth date for user exactly 13 years old", () => {
            const today = new Date()
            const birthDate = new Date(
                today.getFullYear() - 13,
                today.getMonth(),
                today.getDate()
            )
            const dateStr = birthDate.toISOString().split("T")[0]

            const result = validateBirthDate(dateStr)
            expect(result.valid).toBe(true)
        })

        it("should reject invalid date format", () => {
            const result = validateBirthDate("01-01-1990")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Birth date must be in YYYY-MM-DD format")
        })

        it("should reject empty birth date", () => {
            const result = validateBirthDate("")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Birth date is required")
        })

        it("should reject invalid date", () => {
            const result = validateBirthDate("1990-13-32")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid birth date")
        })
    })

    describe("validateEmail", () => {
        it("should accept valid email", () => {
            expect(validateEmail("user@example.com")).toBe(true)
        })

        it("should accept email with subdomain", () => {
            expect(validateEmail("user@mail.example.com")).toBe(true)
        })

        it("should reject email without @", () => {
            expect(validateEmail("userexample.com")).toBe(false)
        })

        it("should reject email without domain", () => {
            expect(validateEmail("user@")).toBe(false)
        })

        it("should reject email without local part", () => {
            expect(validateEmail("@example.com")).toBe(false)
        })

        it("should reject empty email", () => {
            expect(validateEmail("")).toBe(false)
        })

        it("should reject email with spaces", () => {
            expect(validateEmail("user @example.com")).toBe(false)
        })
    })

    describe("validateName", () => {
        it("should accept valid name", () => {
            const result = validateName("John Doe")
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept name with minimum length", () => {
            const result = validateName("Jo")
            expect(result.valid).toBe(true)
        })

        it("should accept name with maximum length", () => {
            const result = validateName("A".repeat(100))
            expect(result.valid).toBe(true)
        })

        it("should reject name shorter than 2 characters", () => {
            const result = validateName("J")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Name must be at least 2 characters")
        })

        it("should reject name longer than 100 characters", () => {
            const result = validateName("A".repeat(101))
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Name must be at most 100 characters")
        })

        it("should reject empty name", () => {
            const result = validateName("")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Name is required")
        })
    })

    describe("validateAccountCompletionData", () => {
        it("should accept valid complete data", () => {
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

        it("should reject data with invalid email", () => {
            const result = validateAccountCompletionData({
                email: "invalid-email",
                name: "John Doe",
                password: "SecurePass123!",
                phone: "+1234567890",
                birthDate: "1990-01-01",
            })
            expect(result.valid).toBe(false)
            expect(result.errors.email).toBeDefined()
        })

        it("should reject data with invalid password", () => {
            const result = validateAccountCompletionData({
                email: "user@example.com",
                name: "John Doe",
                password: "weak",
                phone: "+1234567890",
                birthDate: "1990-01-01",
            })
            expect(result.valid).toBe(false)
            expect(result.errors.password).toBeDefined()
        })

        it("should reject data with invalid phone", () => {
            const result = validateAccountCompletionData({
                email: "user@example.com",
                name: "John Doe",
                password: "SecurePass123!",
                phone: "1234567890",
                birthDate: "1990-01-01",
            })
            expect(result.valid).toBe(false)
            expect(result.errors.phone).toBeDefined()
        })

        it("should reject data with invalid birth date", () => {
            const result = validateAccountCompletionData({
                email: "user@example.com",
                name: "John Doe",
                password: "SecurePass123!",
                phone: "+1234567890",
                birthDate: "2020-01-01",
            })
            expect(result.valid).toBe(false)
            expect(result.errors.birthDate).toBeDefined()
        })

        it("should reject data with missing fields", () => {
            const result = validateAccountCompletionData({})
            expect(result.valid).toBe(false)
            expect(result.errors.email).toBeDefined()
            expect(result.errors.name).toBeDefined()
            expect(result.errors.password).toBeDefined()
            expect(result.errors.phone).toBeDefined()
            expect(result.errors.birthDate).toBeDefined()
        })

        it("should reject data with multiple invalid fields", () => {
            const result = validateAccountCompletionData({
                email: "invalid",
                name: "J",
                password: "weak",
                phone: "123",
                birthDate: "2025-01-01",
            })
            expect(result.valid).toBe(false)
            expect(Object.keys(result.errors).length).toBeGreaterThan(1)
        })
    })
})
