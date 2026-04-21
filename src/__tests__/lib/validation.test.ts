/**
 * Unit Tests for Input Validation Functions
 * Tests validation functions for email, password, name, field length, and password matching
 * Validates: Requirements 1.2, 1.3, 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 8.4
 */

import {
    validateEmail,
    validateFieldLength,
    validateLoginForm,
    validateName,
    validatePassword,
    validatePasswordMatch,
    validatePasswordResetForm,
    validateRegistrationForm,
} from "@/lib/validation"
import { describe, expect, it } from "vitest"

describe("validateEmail", () => {
    describe("valid emails", () => {
        it("should accept standard email format", () => {
            const result = validateEmail("user@example.com")
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept email with numbers", () => {
            const result = validateEmail("user123@example.com")
            expect(result.isValid).toBe(true)
        })

        it("should accept email with dots in local part", () => {
            const result = validateEmail("user.name@example.com")
            expect(result.isValid).toBe(true)
        })

        it("should accept email with hyphens in domain", () => {
            const result = validateEmail("user@example-domain.com")
            expect(result.isValid).toBe(true)
        })

        it("should accept email with plus sign", () => {
            const result = validateEmail("user+tag@example.com")
            expect(result.isValid).toBe(true)
        })

        it("should accept email with underscore", () => {
            const result = validateEmail("user_name@example.com")
            expect(result.isValid).toBe(true)
        })

        it("should accept email with multiple domain levels", () => {
            const result = validateEmail("user@mail.example.co.uk")
            expect(result.isValid).toBe(true)
        })

        it("should trim whitespace", () => {
            const result = validateEmail("  user@example.com  ")
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid emails", () => {
        it("should reject email without @", () => {
            const result = validateEmail("userexample.com")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Invalid email format")
        })

        it("should reject email without domain", () => {
            const result = validateEmail("user@")
            expect(result.isValid).toBe(false)
        })

        it("should reject email without local part", () => {
            const result = validateEmail("@example.com")
            expect(result.isValid).toBe(false)
        })

        it("should reject email without TLD", () => {
            const result = validateEmail("user@example")
            expect(result.isValid).toBe(false)
        })

        it("should reject email with consecutive dots", () => {
            const result = validateEmail("user..name@example.com")
            expect(result.isValid).toBe(false)
        })

        it("should reject email with leading dot in local part", () => {
            const result = validateEmail(".user@example.com")
            expect(result.isValid).toBe(false)
        })

        it("should reject email with trailing dot in local part", () => {
            const result = validateEmail("user.@example.com")
            expect(result.isValid).toBe(false)
        })

        it("should reject email with leading hyphen in domain", () => {
            const result = validateEmail("user@-example.com")
            expect(result.isValid).toBe(false)
        })

        it("should reject email with trailing hyphen in domain", () => {
            const result = validateEmail("user@example-.com")
            expect(result.isValid).toBe(false)
        })

        it("should reject empty email", () => {
            const result = validateEmail("")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Email is required")
        })

        it("should reject null email", () => {
            const result = validateEmail(null as any)
            expect(result.isValid).toBe(false)
        })

        it("should reject email with spaces", () => {
            const result = validateEmail("user name@example.com")
            expect(result.isValid).toBe(false)
        })

        it("should reject email with special characters", () => {
            const result = validateEmail("user#name@example.com")
            expect(result.isValid).toBe(false)
        })
    })
})

describe("validatePassword", () => {
    describe("valid passwords", () => {
        it("should accept password with all requirements", () => {
            const result = validatePassword("ValidPass123!")
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
            expect(result.strength).toBe("strong")
            expect(result.requirements).toEqual({
                minLength: true,
                hasUppercase: true,
                hasLowercase: true,
                hasNumber: true,
                hasSpecial: true,
                notCommon: true,
            })
        })

        it("should accept password with multiple special characters", () => {
            const result = validatePassword("Pass@word#123")
            expect(result.isValid).toBe(true)
            expect(result.strength).toBe("strong")
        })

        it("should accept password with 8 characters exactly", () => {
            const result = validatePassword("Pass1234!")
            expect(result.isValid).toBe(true)
            expect(result.strength).toBe("strong")
        })

        it("should accept long password", () => {
            const result = validatePassword("VeryLongPassword123!@#$%")
            expect(result.isValid).toBe(true)
            expect(result.strength).toBe("strong")
        })

        it("should accept password with hyphen", () => {
            const result = validatePassword("Pass-word123!")
            expect(result.isValid).toBe(true)
        })

        it("should accept password with underscore", () => {
            const result = validatePassword("Pass_word123!")
            expect(result.isValid).toBe(true)
        })

        it("should accept password with parentheses", () => {
            const result = validatePassword("Pass(word)123!")
            expect(result.isValid).toBe(true)
        })

        it("should accept password with brackets", () => {
            const result = validatePassword("Pass[word]123!")
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid passwords", () => {
        it("should reject password shorter than 8 characters", () => {
            const result = validatePassword("Pass123")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Password must be at least 8 characters")
            expect(result.strength).toBe("medium") // Has 4/6 requirements
            expect(result.requirements.minLength).toBe(false)
        })

        it("should reject password without uppercase", () => {
            const result = validatePassword("password123!")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Password must contain at least one uppercase letter"
            )
            expect(result.requirements.hasUppercase).toBe(false)
            expect(result.requirements.minLength).toBe(true)
        })

        it("should reject password without lowercase", () => {
            const result = validatePassword("PASSWORD123!")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Password must contain at least one lowercase letter"
            )
            expect(result.requirements.hasLowercase).toBe(false)
        })

        it("should reject password without number", () => {
            const result = validatePassword("Password!")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Password must contain at least one number"
            )
            expect(result.requirements.hasNumber).toBe(false)
        })

        it("should reject password without special character", () => {
            const result = validatePassword("Password123")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Password must contain at least one special character"
            )
            expect(result.requirements.hasSpecial).toBe(false)
        })

        it("should reject common password", () => {
            const result = validatePassword("Password123!")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Password is too common. Please choose a more unique password"
            )
            expect(result.requirements.notCommon).toBe(false)
        })

        it("should reject empty password", () => {
            const result = validatePassword("")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Password is required")
            expect(result.strength).toBe("weak")
        })

        it("should reject null password", () => {
            const result = validatePassword(null as any)
            expect(result.isValid).toBe(false)
        })

        it("should reject password with only numbers and special chars", () => {
            const result = validatePassword("12345678!")
            expect(result.isValid).toBe(false)
            expect(result.requirements.hasUppercase).toBe(false)
            expect(result.requirements.hasLowercase).toBe(false)
        })

        it("should calculate medium strength for partially met requirements", () => {
            const result = validatePassword("Passw0rd")
            expect(result.isValid).toBe(false)
            expect(result.strength).toBe("medium")
        })
    })
})

describe("validateName", () => {
    describe("valid names", () => {
        it("should accept simple name", () => {
            const result = validateName("John Doe")
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept name with apostrophe", () => {
            const result = validateName("O'Brien")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with hyphen", () => {
            const result = validateName("John-Paul")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with multiple spaces", () => {
            const result = validateName("Jean Claude Van Damme")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with numbers", () => {
            const result = validateName("John Doe 2")
            expect(result.isValid).toBe(true)
        })

        it("should accept single character name", () => {
            const result = validateName("A")
            expect(result.isValid).toBe(true)
        })

        it("should trim whitespace", () => {
            const result = validateName("  John Doe  ")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with multiple hyphens and apostrophes", () => {
            const result = validateName("Mary-Jane O'Connor")
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid names", () => {
        it("should reject name with special characters", () => {
            const result = validateName("John@Doe")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Name contains invalid characters")
        })

        it("should reject name with exclamation mark", () => {
            const result = validateName("John!")
            expect(result.isValid).toBe(false)
        })

        it("should reject name with hash", () => {
            const result = validateName("John#Doe")
            expect(result.isValid).toBe(false)
        })

        it("should reject name with dollar sign", () => {
            const result = validateName("John$Doe")
            expect(result.isValid).toBe(false)
        })

        it("should reject name with percent sign", () => {
            const result = validateName("John%Doe")
            expect(result.isValid).toBe(false)
        })

        it("should reject name with ampersand", () => {
            const result = validateName("John&Doe")
            expect(result.isValid).toBe(false)
        })

        it("should reject name with asterisk", () => {
            const result = validateName("John*Doe")
            expect(result.isValid).toBe(false)
        })

        it("should reject empty name", () => {
            const result = validateName("")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Name is required")
        })

        it("should reject null name", () => {
            const result = validateName(null as any)
            expect(result.isValid).toBe(false)
        })

        it("should reject name with only spaces", () => {
            const result = validateName("   ")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Name is required")
        })

        it("should reject name with underscore", () => {
            const result = validateName("John_Doe")
            expect(result.isValid).toBe(false)
        })

        it("should reject name with period", () => {
            const result = validateName("John.Doe")
            expect(result.isValid).toBe(false)
        })

        it("should reject name with comma", () => {
            const result = validateName("John,Doe")
            expect(result.isValid).toBe(false)
        })
    })
})

describe("validateFieldLength", () => {
    describe("valid lengths", () => {
        it("should accept field within limit", () => {
            const result = validateFieldLength("John Doe", "name")
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept field at exactly 255 characters", () => {
            const longString = "a".repeat(255)
            const result = validateFieldLength(longString, "email")
            expect(result.isValid).toBe(true)
        })

        it("should accept empty field", () => {
            const result = validateFieldLength("", "name")
            expect(result.isValid).toBe(true)
        })

        it("should accept field with custom max length", () => {
            const result = validateFieldLength("Hello", "name", 10)
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid lengths", () => {
        it("should reject field exceeding 255 characters", () => {
            const longString = "a".repeat(256)
            const result = validateFieldLength(longString, "email")
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("must not exceed 255 characters")
        })

        it("should reject field exceeding custom max length", () => {
            const result = validateFieldLength("Hello World", "name", 5)
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("must not exceed 5 characters")
        })

        it("should capitalize field name in error message", () => {
            const longString = "a".repeat(256)
            const result = validateFieldLength(longString, "password")
            expect(result.error).toContain("Password")
        })
    })
})

describe("validatePasswordMatch", () => {
    describe("matching passwords", () => {
        it("should accept matching passwords", () => {
            const result = validatePasswordMatch(
                "ValidPass123!",
                "ValidPass123!"
            )
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept matching complex passwords", () => {
            const password = "C0mpl3x!P@ssw0rd#2024"
            const result = validatePasswordMatch(password, password)
            expect(result.isValid).toBe(true)
        })
    })

    describe("non-matching passwords", () => {
        it("should reject non-matching passwords", () => {
            const result = validatePasswordMatch(
                "ValidPass123!",
                "DifferentPass123!"
            )
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Passwords do not match")
        })

        it("should reject if only case differs", () => {
            const result = validatePasswordMatch(
                "ValidPass123!",
                "validpass123!"
            )
            expect(result.isValid).toBe(false)
        })

        it("should reject if one character differs", () => {
            const result = validatePasswordMatch(
                "ValidPass123!",
                "ValidPass124!"
            )
            expect(result.isValid).toBe(false)
        })

        it("should reject if password is empty", () => {
            const result = validatePasswordMatch("", "ValidPass123!")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Both password fields are required")
        })

        it("should reject if confirmPassword is empty", () => {
            const result = validatePasswordMatch("ValidPass123!", "")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Both password fields are required")
        })

        it("should reject if both are empty", () => {
            const result = validatePasswordMatch("", "")
            expect(result.isValid).toBe(false)
        })
    })
})

describe("validateRegistrationForm", () => {
    describe("valid registration data", () => {
        it("should accept valid registration form", () => {
            const result = validateRegistrationForm({
                name: "John Doe",
                email: "john@example.com",
                password: "ValidPass123!",
                confirmPassword: "ValidPass123!",
            })
            expect(result.isValid).toBe(true)
            expect(Object.keys(result.errors).length).toBe(0)
        })

        it("should accept registration with apostrophe in name", () => {
            const result = validateRegistrationForm({
                name: "O'Brien",
                email: "obrien@example.com",
                password: "ValidPass123!",
                confirmPassword: "ValidPass123!",
            })
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid registration data", () => {
        it("should reject invalid name", () => {
            const result = validateRegistrationForm({
                name: "John@Doe",
                email: "john@example.com",
                password: "ValidPass123!",
                confirmPassword: "ValidPass123!",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.name).toBeDefined()
        })

        it("should reject invalid email", () => {
            const result = validateRegistrationForm({
                name: "John Doe",
                email: "invalid-email",
                password: "ValidPass123!",
                confirmPassword: "ValidPass123!",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.email).toBeDefined()
        })

        it("should reject weak password", () => {
            const result = validateRegistrationForm({
                name: "John Doe",
                email: "john@example.com",
                password: "weak",
                confirmPassword: "weak",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.password).toBeDefined()
        })

        it("should reject mismatched passwords", () => {
            const result = validateRegistrationForm({
                name: "John Doe",
                email: "john@example.com",
                password: "ValidPass123!",
                confirmPassword: "DifferentPass123!",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.confirmPassword).toBeDefined()
        })

        it("should reject multiple invalid fields", () => {
            const result = validateRegistrationForm({
                name: "John@Doe",
                email: "invalid-email",
                password: "weak",
                confirmPassword: "different",
            })
            expect(result.isValid).toBe(false)
            expect(Object.keys(result.errors).length).toBeGreaterThan(1)
        })

        it("should reject name exceeding 255 characters", () => {
            const result = validateRegistrationForm({
                name: "a".repeat(256),
                email: "john@example.com",
                password: "ValidPass123!",
                confirmPassword: "ValidPass123!",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.name).toBeDefined()
        })

        it("should reject email exceeding 255 characters", () => {
            const result = validateRegistrationForm({
                name: "John Doe",
                email: "a".repeat(250) + "@example.com",
                password: "ValidPass123!",
                confirmPassword: "ValidPass123!",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.email).toBeDefined()
        })
    })
})

describe("validateLoginForm", () => {
    describe("valid login data", () => {
        it("should accept valid login form", () => {
            const result = validateLoginForm({
                email: "john@example.com",
                password: "ValidPass123!",
            })
            expect(result.isValid).toBe(true)
            expect(Object.keys(result.errors).length).toBe(0)
        })
    })

    describe("invalid login data", () => {
        it("should reject invalid email", () => {
            const result = validateLoginForm({
                email: "invalid-email",
                password: "ValidPass123!",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.email).toBeDefined()
        })

        it("should reject missing password", () => {
            const result = validateLoginForm({
                email: "john@example.com",
                password: "",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.password).toBeDefined()
        })

        it("should reject both invalid", () => {
            const result = validateLoginForm({
                email: "invalid-email",
                password: "",
            })
            expect(result.isValid).toBe(false)
            expect(Object.keys(result.errors).length).toBe(2)
        })
    })
})

describe("validatePasswordResetForm", () => {
    describe("valid password reset data", () => {
        it("should accept valid password reset form", () => {
            const result = validatePasswordResetForm({
                password: "NewPass123!",
                confirmPassword: "NewPass123!",
            })
            expect(result.isValid).toBe(true)
            expect(Object.keys(result.errors).length).toBe(0)
        })
    })

    describe("invalid password reset data", () => {
        it("should reject weak password", () => {
            const result = validatePasswordResetForm({
                password: "weak",
                confirmPassword: "weak",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.password).toBeDefined()
        })

        it("should reject mismatched passwords", () => {
            const result = validatePasswordResetForm({
                password: "NewPass123!",
                confirmPassword: "DifferentPass123!",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.confirmPassword).toBeDefined()
        })

        it("should reject both invalid", () => {
            const result = validatePasswordResetForm({
                password: "weak",
                confirmPassword: "different",
            })
            expect(result.isValid).toBe(false)
            expect(Object.keys(result.errors).length).toBeGreaterThan(0)
        })
    })
})
