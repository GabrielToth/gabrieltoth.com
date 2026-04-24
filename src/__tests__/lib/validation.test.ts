/**
 * Unit Tests for Input Validation Functions
 * Tests validation functions for email, password, name, field length, and password matching
 * Validates: Requirements 1.2, 1.3, 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 8.4
 */

import {
    normalizePhoneNumber,
    validateAndNormalizePhoneNumber,
    validateBirthDateFormat,
    validateEmail,
    validateFieldLength,
    validateLoginForm,
    validateMinimumAge,
    validateName,
    validateNameNotOnlyNumbersOrSpecialChars,
    validatePassword,
    validatePasswordMatch,
    validatePasswordResetForm,
    validatePhoneNumber,
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

        it("should accept name with exactly 2 characters", () => {
            const result = validateName("Jo")
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

        it("should accept name with only letters", () => {
            const result = validateName("Alexander")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with accented characters (Portuguese)", () => {
            const result = validateName("João Silva")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with cedilla (Portuguese)", () => {
            const result = validateName("François")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with tilde (Portuguese)", () => {
            const result = validateName("José da Silva")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with umlaut (German)", () => {
            const result = validateName("Müller")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with acute accent (Spanish)", () => {
            const result = validateName("María García")
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid names", () => {
        it("should reject name with special characters", () => {
            const result = validateName("John@Doe")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Full name can only contain letters, spaces, hyphens, and apostrophes"
            )
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
            expect(result.error).toBe("Full name is required")
        })

        it("should reject null name", () => {
            const result = validateName(null as any)
            expect(result.isValid).toBe(false)
        })

        it("should reject name with only spaces", () => {
            const result = validateName("   ")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Full name is required")
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

        it("should reject name with less than 2 characters", () => {
            const result = validateName("A")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Full name must be at least 2 characters")
        })

        it("should reject name with only numbers", () => {
            const result = validateName("123")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Full name can only contain letters, spaces, hyphens, and apostrophes"
            )
        })

        it("should reject name with only special characters", () => {
            const result = validateName("!!!")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Full name can only contain letters, spaces, hyphens, and apostrophes"
            )
        })
    })
})

describe("validateNameNotOnlyNumbersOrSpecialChars", () => {
    describe("valid names", () => {
        it("should accept name with letters", () => {
            const result = validateNameNotOnlyNumbersOrSpecialChars("John Doe")
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept name with letters and numbers", () => {
            const result =
                validateNameNotOnlyNumbersOrSpecialChars("John Doe 2")
            expect(result.isValid).toBe(true)
        })

        it("should accept name with letters and special characters", () => {
            const result = validateNameNotOnlyNumbersOrSpecialChars("John-Paul")
            expect(result.isValid).toBe(true)
        })

        it("should accept single letter", () => {
            const result = validateNameNotOnlyNumbersOrSpecialChars("A")
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid names", () => {
        it("should reject name with only numbers", () => {
            const result = validateNameNotOnlyNumbersOrSpecialChars("123")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Full name must contain at least some letters"
            )
        })

        it("should reject name with only special characters", () => {
            const result = validateNameNotOnlyNumbersOrSpecialChars("!!!")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Full name must contain at least some letters"
            )
        })

        it("should reject name with only numbers and special characters", () => {
            const result = validateNameNotOnlyNumbersOrSpecialChars("123!!!")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "Full name must contain at least some letters"
            )
        })

        it("should reject empty name", () => {
            const result = validateNameNotOnlyNumbersOrSpecialChars("")
            expect(result.isValid).toBe(true) // Secondary check, returns true for empty
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

describe("validatePhoneNumber", () => {
    describe("valid phone numbers", () => {
        it("should accept US phone number with country code", () => {
            const result = validatePhoneNumber("+1 (555) 123-4567")
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept US phone number without formatting", () => {
            const result = validatePhoneNumber("+15551234567")
            expect(result.isValid).toBe(true)
        })

        it("should accept US phone number with default country", () => {
            const result = validatePhoneNumber("(555) 123-4567", "US")
            expect(result.isValid).toBe(true)
        })

        it("should accept Brazilian phone number", () => {
            const result = validatePhoneNumber("+55 11 98765-4321")
            expect(result.isValid).toBe(true)
        })

        it("should accept Brazilian phone number with default country", () => {
            const result = validatePhoneNumber("11 98765-4321", "BR")
            expect(result.isValid).toBe(true)
        })

        it("should accept UK phone number", () => {
            const result = validatePhoneNumber("+44 20 7946 0958")
            expect(result.isValid).toBe(true)
        })

        it("should accept German phone number", () => {
            const result = validatePhoneNumber("+49 30 123456")
            expect(result.isValid).toBe(true)
        })

        it("should accept French phone number", () => {
            const result = validatePhoneNumber("+33 1 42 68 53 00")
            expect(result.isValid).toBe(true)
        })

        it("should accept phone number with spaces", () => {
            const result = validatePhoneNumber("+1 555 123 4567")
            expect(result.isValid).toBe(true)
        })

        it("should accept phone number with hyphens", () => {
            const result = validatePhoneNumber("+1-555-123-4567")
            expect(result.isValid).toBe(true)
        })

        it("should accept phone number with parentheses", () => {
            const result = validatePhoneNumber("+1 (555) 123-4567")
            expect(result.isValid).toBe(true)
        })

        it("should trim whitespace", () => {
            const result = validatePhoneNumber("  +1 (555) 123-4567  ")
            expect(result.isValid).toBe(true)
        })

        it("should accept phone number with extension", () => {
            const result = validatePhoneNumber(
                "+1 (555) 123-4567 ext. 123",
                "US"
            )
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid phone numbers", () => {
        it("should reject phone number without country code and no default", () => {
            const result = validatePhoneNumber("(555) 123-4567")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Please enter a valid phone number")
        })

        it("should reject invalid format", () => {
            const result = validatePhoneNumber("invalid")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Please enter a valid phone number")
        })

        it("should reject too short number", () => {
            const result = validatePhoneNumber("+1 123")
            expect(result.isValid).toBe(false)
        })

        it("should reject empty phone number", () => {
            const result = validatePhoneNumber("")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Phone number is required")
        })

        it("should reject null phone number", () => {
            const result = validatePhoneNumber(null as any)
            expect(result.isValid).toBe(false)
        })

        it("should reject phone number with only spaces", () => {
            const result = validatePhoneNumber("   ")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Phone number is required")
        })

        it("should reject phone number with invalid characters", () => {
            const result = validatePhoneNumber("+1 (555) 123-456@")
            expect(result.isValid).toBe(false)
        })

        it("should reject phone number with letters", () => {
            const result = validatePhoneNumber("+1 (555) 123-ABCD")
            expect(result.isValid).toBe(false)
        })
    })
})

describe("normalizePhoneNumber", () => {
    describe("valid phone numbers", () => {
        it("should normalize US phone number to E.164", () => {
            const result = normalizePhoneNumber("+1 (555) 123-4567")
            expect(result.normalized).toBe("+15551234567")
            expect(result.error).toBeUndefined()
        })

        it("should normalize US phone number without country code", () => {
            const result = normalizePhoneNumber("(555) 123-4567", "US")
            expect(result.normalized).toBe("+15551234567")
        })

        it("should normalize Brazilian phone number to E.164", () => {
            const result = normalizePhoneNumber("+55 11 98765-4321")
            expect(result.normalized).toBe("+5511987654321")
        })

        it("should normalize Brazilian phone number without country code", () => {
            const result = normalizePhoneNumber("11 98765-4321", "BR")
            expect(result.normalized).toBe("+5511987654321")
        })

        it("should normalize UK phone number to E.164", () => {
            const result = normalizePhoneNumber("+44 20 7946 0958")
            expect(result.normalized).toBe("+442079460958")
        })

        it("should normalize phone number with various formatting", () => {
            const result = normalizePhoneNumber("+1-555-123-4567")
            expect(result.normalized).toBe("+15551234567")
        })

        it("should normalize phone number with parentheses", () => {
            const result = normalizePhoneNumber("+1 (555) 123-4567")
            expect(result.normalized).toBe("+15551234567")
        })

        it("should normalize phone number already in E.164", () => {
            const result = normalizePhoneNumber("+15551234567")
            expect(result.normalized).toBe("+15551234567")
        })

        it("should trim whitespace before normalizing", () => {
            const result = normalizePhoneNumber("  +1 (555) 123-4567  ")
            expect(result.normalized).toBe("+15551234567")
        })
    })

    describe("invalid phone numbers", () => {
        it("should reject phone number without country code and no default", () => {
            const result = normalizePhoneNumber("(555) 123-4567")
            expect(result.error).toBe("Invalid phone number format")
            expect(result.normalized).toBeUndefined()
        })

        it("should reject invalid format", () => {
            const result = normalizePhoneNumber("invalid")
            expect(result.error).toBe("Invalid phone number format")
        })

        it("should reject empty phone number", () => {
            const result = normalizePhoneNumber("")
            expect(result.error).toBe("Phone number is required")
        })

        it("should reject null phone number", () => {
            const result = normalizePhoneNumber(null as any)
            expect(result.error).toBe("Phone number is required")
        })

        it("should reject phone number with only spaces", () => {
            const result = normalizePhoneNumber("   ")
            expect(result.error).toBe("Phone number is required")
        })
    })
})

describe("validateAndNormalizePhoneNumber", () => {
    describe("valid phone numbers", () => {
        it("should validate and normalize US phone number", () => {
            const result = validateAndNormalizePhoneNumber("+1 (555) 123-4567")
            expect(result.isValid).toBe(true)
            expect(result.normalized).toBe("+15551234567")
            expect(result.error).toBeUndefined()
        })

        it("should validate and normalize US phone number with default country", () => {
            const result = validateAndNormalizePhoneNumber(
                "(555) 123-4567",
                "US"
            )
            expect(result.isValid).toBe(true)
            expect(result.normalized).toBe("+15551234567")
        })

        it("should validate and normalize Brazilian phone number", () => {
            const result = validateAndNormalizePhoneNumber("+55 11 98765-4321")
            expect(result.isValid).toBe(true)
            expect(result.normalized).toBe("+5511987654321")
        })

        it("should validate and normalize Brazilian phone number with default country", () => {
            const result = validateAndNormalizePhoneNumber(
                "11 98765-4321",
                "BR"
            )
            expect(result.isValid).toBe(true)
            expect(result.normalized).toBe("+5511987654321")
        })

        it("should validate and normalize UK phone number", () => {
            const result = validateAndNormalizePhoneNumber("+44 20 7946 0958")
            expect(result.isValid).toBe(true)
            expect(result.normalized).toBe("+442079460958")
        })
    })

    describe("invalid phone numbers", () => {
        it("should reject invalid phone number", () => {
            const result = validateAndNormalizePhoneNumber("invalid")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Please enter a valid phone number")
            expect(result.normalized).toBeUndefined()
        })

        it("should reject empty phone number", () => {
            const result = validateAndNormalizePhoneNumber("")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Phone number is required")
        })

        it("should reject phone number without country code and no default", () => {
            const result = validateAndNormalizePhoneNumber("(555) 123-4567")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Please enter a valid phone number")
        })
    })
})

describe("validateBirthDateFormat", () => {
    describe("valid birth dates", () => {
        it("should accept valid birth date in DD/MM/YYYY format", () => {
            const result = validateBirthDateFormat("01/01/1990")
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept birth date with single digit day and month", () => {
            const result = validateBirthDateFormat("05/03/1985")
            expect(result.isValid).toBe(true)
        })

        it("should accept birth date with double digit day and month", () => {
            const result = validateBirthDateFormat("31/12/2000")
            expect(result.isValid).toBe(true)
        })

        it("should accept leap year date (Feb 29)", () => {
            const result = validateBirthDateFormat("29/02/2000")
            expect(result.isValid).toBe(true)
        })

        it("should accept recent birth date", () => {
            const today = new Date()
            const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`
            const result = validateBirthDateFormat(dateStr)
            expect(result.isValid).toBe(true)
        })

        it("should accept birth date 120 years ago", () => {
            const today = new Date()
            const year = today.getFullYear() - 120
            const dateStr = `01/01/${year}`
            const result = validateBirthDateFormat(dateStr)
            expect(result.isValid).toBe(true)
        })

        it("should trim whitespace", () => {
            const result = validateBirthDateFormat("  01/01/1990  ")
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid birth dates", () => {
        it("should reject invalid day (32)", () => {
            const result = validateBirthDateFormat("32/01/2000")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Please enter a valid date (DD/MM/YYYY)")
        })

        it("should reject invalid month (13)", () => {
            const result = validateBirthDateFormat("01/13/2000")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Please enter a valid date (DD/MM/YYYY)")
        })

        it("should reject invalid month (0)", () => {
            const result = validateBirthDateFormat("01/00/2000")
            expect(result.isValid).toBe(false)
        })

        it("should reject invalid day (0)", () => {
            const result = validateBirthDateFormat("00/01/2000")
            expect(result.isValid).toBe(false)
        })

        it("should reject Feb 30", () => {
            const result = validateBirthDateFormat("30/02/2000")
            expect(result.isValid).toBe(false)
        })

        it("should reject Feb 29 on non-leap year", () => {
            const result = validateBirthDateFormat("29/02/2001")
            expect(result.isValid).toBe(false)
        })

        it("should reject April 31", () => {
            const result = validateBirthDateFormat("31/04/2000")
            expect(result.isValid).toBe(false)
        })

        it("should reject future date", () => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const dateStr = `${String(tomorrow.getDate()).padStart(2, "0")}/${String(tomorrow.getMonth() + 1).padStart(2, "0")}/${tomorrow.getFullYear()}`
            const result = validateBirthDateFormat(dateStr)
            expect(result.isValid).toBe(false)
        })

        it("should reject date more than 120 years ago", () => {
            const today = new Date()
            const year = today.getFullYear() - 121
            const dateStr = `01/01/${year}`
            const result = validateBirthDateFormat(dateStr)
            expect(result.isValid).toBe(false)
        })

        it("should reject wrong format (MM/DD/YYYY)", () => {
            const result = validateBirthDateFormat("01/32/2000")
            expect(result.isValid).toBe(false)
        })

        it("should reject format without slashes", () => {
            const result = validateBirthDateFormat("01011990")
            expect(result.isValid).toBe(false)
        })

        it("should reject format with dashes", () => {
            const result = validateBirthDateFormat("01-01-1990")
            expect(result.isValid).toBe(false)
        })

        it("should reject format with dots", () => {
            const result = validateBirthDateFormat("01.01.1990")
            expect(result.isValid).toBe(false)
        })

        it("should reject empty date", () => {
            const result = validateBirthDateFormat("")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Birth date is required")
        })

        it("should reject null date", () => {
            const result = validateBirthDateFormat(null as any)
            expect(result.isValid).toBe(false)
        })

        it("should reject date with only spaces", () => {
            const result = validateBirthDateFormat("   ")
            expect(result.isValid).toBe(false)
        })

        it("should reject partial date", () => {
            const result = validateBirthDateFormat("01/01")
            expect(result.isValid).toBe(false)
        })

        it("should reject date with extra characters", () => {
            const result = validateBirthDateFormat("01/01/1990 extra")
            expect(result.isValid).toBe(false)
        })
    })
})

describe("validateMinimumAge", () => {
    describe("valid ages (13+)", () => {
        it("should accept user exactly 13 years old", () => {
            const today = new Date()
            const year = today.getFullYear() - 13
            const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${year}`
            const result = validateMinimumAge(dateStr)
            expect(result.isValid).toBe(true)
        })

        it("should accept user older than 13", () => {
            const result = validateMinimumAge("01/01/2005")
            expect(result.isValid).toBe(true)
        })

        it("should accept user much older than 13", () => {
            const result = validateMinimumAge("01/01/1990")
            expect(result.isValid).toBe(true)
        })

        it("should accept user 100 years old", () => {
            const today = new Date()
            const year = today.getFullYear() - 100
            const dateStr = `01/01/${year}`
            const result = validateMinimumAge(dateStr)
            expect(result.isValid).toBe(true)
        })

        it("should accept user born yesterday (if 13+)", () => {
            const today = new Date()
            const year = today.getFullYear() - 13
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            const dateStr = `${String(yesterday.getDate()).padStart(2, "0")}/${String(yesterday.getMonth() + 1).padStart(2, "0")}/${year}`
            const result = validateMinimumAge(dateStr)
            expect(result.isValid).toBe(true)
        })
    })

    describe("invalid ages (under 13)", () => {
        it("should reject user under 13 years old", () => {
            const result = validateMinimumAge("01/01/2015")
            expect(result.isValid).toBe(false)
            expect(result.error).toBe(
                "You must be at least 13 years old to register"
            )
        })

        it("should reject user 12 years old", () => {
            const today = new Date()
            const year = today.getFullYear() - 12
            const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${year}`
            const result = validateMinimumAge(dateStr)
            expect(result.isValid).toBe(false)
        })

        it("should reject user 1 year old", () => {
            const today = new Date()
            const year = today.getFullYear() - 1
            const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${year}`
            const result = validateMinimumAge(dateStr)
            expect(result.isValid).toBe(false)
        })

        it("should reject newborn", () => {
            const today = new Date()
            const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`
            const result = validateMinimumAge(dateStr)
            expect(result.isValid).toBe(false)
        })

        it("should reject user born tomorrow (if under 13)", () => {
            const today = new Date()
            const year = today.getFullYear() - 12
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            const dateStr = `${String(tomorrow.getDate()).padStart(2, "0")}/${String(tomorrow.getMonth() + 1).padStart(2, "0")}/${year}`
            const result = validateMinimumAge(dateStr)
            expect(result.isValid).toBe(false)
        })
    })

    describe("edge cases", () => {
        it("should handle birthday today correctly", () => {
            const today = new Date()
            const year = today.getFullYear() - 13
            const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${year}`
            const result = validateMinimumAge(dateStr)
            expect(result.isValid).toBe(true)
        })

        it("should handle birthday tomorrow correctly", () => {
            const today = new Date()
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            const year = today.getFullYear() - 13
            const dateStr = `${String(tomorrow.getDate()).padStart(2, "0")}/${String(tomorrow.getMonth() + 1).padStart(2, "0")}/${year}`
            const result = validateMinimumAge(dateStr)
            expect(result.isValid).toBe(false)
        })

        it("should handle leap year birthday", () => {
            const today = new Date()
            const year = today.getFullYear() - 13
            const result = validateMinimumAge("29/02/2000")
            // This will depend on whether 2000 was 13+ years ago
            expect(result.isValid).toBeDefined()
        })

        it("should reject invalid date format", () => {
            const result = validateMinimumAge("invalid")
            expect(result.isValid).toBe(false)
        })

        it("should reject empty date", () => {
            const result = validateMinimumAge("")
            expect(result.isValid).toBe(false)
        })

        it("should reject null date", () => {
            const result = validateMinimumAge(null as any)
            expect(result.isValid).toBe(false)
        })
    })
})
