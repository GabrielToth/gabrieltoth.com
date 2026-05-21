/**
 * Input Validation Tests
 * Tests for input validation and sanitization functions
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import {
    containsSQLInjectionPattern,
    containsXSSPattern,
    sanitizeInput,
    validateCSRFToken,
    validateEmail,
    validateLoginRequest,
    validatePassword,
    validatePayloadSize,
    validateRequestBody,
} from "./input-validation"

describe("Input Validation Module", () => {
    describe("validateEmail", () => {
        it("should validate correct email format", () => {
            const result = validateEmail("user@example.com")
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should reject email without @", () => {
            const result = validateEmail("userexample.com")
            expect(result.isValid).toBe(false)
            expect(result.error).toBeDefined()
        })

        it("should reject email without domain", () => {
            const result = validateEmail("user@")
            expect(result.isValid).toBe(false)
            expect(result.error).toBeDefined()
        })

        it("should reject email exceeding 255 characters", () => {
            const longEmail = "a".repeat(250) + "@example.com"
            const result = validateEmail(longEmail)
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("255 characters")
        })

        it("should reject empty email", () => {
            const result = validateEmail("")
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("required")
        })

        it("should reject non-string email", () => {
            const result = validateEmail(null as unknown as string)
            expect(result.isValid).toBe(false)
        })

        it("should validate email with subdomain", () => {
            const result = validateEmail("user@mail.example.co.uk")
            expect(result.isValid).toBe(true)
        })

        it("should validate email with numbers and dots", () => {
            const result = validateEmail("user.name+tag@example.com")
            expect(result.isValid).toBe(true)
        })
    })

    describe("validatePassword", () => {
        it("should validate non-empty password", () => {
            const result = validatePassword("SecurePass123!")
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should reject empty password", () => {
            const result = validatePassword("")
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("required")
        })

        it("should reject whitespace-only password", () => {
            const result = validatePassword("   ")
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("empty")
        })

        it("should reject password exceeding 1024 characters", () => {
            const longPassword = "a".repeat(1025)
            const result = validatePassword(longPassword)
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("1024 characters")
        })

        it("should reject non-string password", () => {
            const result = validatePassword(null as unknown as string)
            expect(result.isValid).toBe(false)
        })

        it("should accept password with special characters", () => {
            const result = validatePassword("P@ssw0rd!#$%")
            expect(result.isValid).toBe(true)
        })
    })

    describe("validateCSRFToken", () => {
        it("should validate correct CSRF token format", () => {
            const token = "a".repeat(64)
            const result = validateCSRFToken(token)
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should reject token with incorrect length", () => {
            const token = "a".repeat(63)
            const result = validateCSRFToken(token)
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("Invalid token format")
        })

        it("should reject token with non-hex characters", () => {
            const token = "z".repeat(64)
            const result = validateCSRFToken(token)
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("Invalid token format")
        })

        it("should reject empty token", () => {
            const result = validateCSRFToken("")
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("required")
        })

        it("should accept valid hex token", () => {
            const token =
                "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
            const result = validateCSRFToken(token)
            expect(result.isValid).toBe(true)
        })
    })

    describe("sanitizeInput", () => {
        it("should remove HTML tags", () => {
            const input = "<script>alert('xss')</script>"
            const result = sanitizeInput(input)
            expect(result).not.toContain("<")
            expect(result).not.toContain(">")
        })

        it("should remove null bytes", () => {
            const input = "test\x00value"
            const result = sanitizeInput(input)
            expect(result).not.toContain("\x00")
        })

        it("should remove control characters", () => {
            const input = "test\x01\x02value"
            const result = sanitizeInput(input)
            expect(result).not.toContain("\x01")
            expect(result).not.toContain("\x02")
        })

        it("should trim whitespace", () => {
            const input = "  test value  "
            const result = sanitizeInput(input)
            expect(result).toBe("test value")
        })

        it("should handle empty input", () => {
            const result = sanitizeInput("")
            expect(result).toBe("")
        })

        it("should preserve normal text", () => {
            const input = "normal text with numbers 123"
            const result = sanitizeInput(input)
            expect(result).toBe(input)
        })
    })

    describe("validateRequestBody", () => {
        it("should accept valid object with allowed fields", () => {
            const body = { email: "test@example.com", password: "pass" }
            const allowedFields = new Set(["email", "password"])
            const result = validateRequestBody(body, allowedFields)
            expect(result.isValid).toBe(true)
        })

        it("should reject object with extra fields", () => {
            const body = {
                email: "test@example.com",
                password: "pass",
                extra: "field",
            }
            const allowedFields = new Set(["email", "password"])
            const result = validateRequestBody(body, allowedFields)
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("Invalid request fields")
        })

        it("should reject non-object body", () => {
            const result = validateRequestBody(
                "not an object",
                new Set(["email"])
            )
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("JSON object")
        })

        it("should reject array body", () => {
            const result = validateRequestBody([], new Set(["email"]))
            expect(result.isValid).toBe(false)
        })

        it("should reject null body", () => {
            const result = validateRequestBody(null, new Set(["email"]))
            expect(result.isValid).toBe(false)
        })

        it("should accept object with subset of allowed fields", () => {
            const body = { email: "test@example.com" }
            const allowedFields = new Set(["email", "password", "rememberMe"])
            const result = validateRequestBody(body, allowedFields)
            expect(result.isValid).toBe(true)
        })
    })

    describe("validateLoginRequest", () => {
        it("should validate correct login request", () => {
            const body = {
                email: "user@example.com",
                password: "SecurePass123!",
                rememberMe: false,
                csrfToken: "a".repeat(64),
            }
            const result = validateLoginRequest(body)
            expect(result.isValid).toBe(true)
            expect(Object.keys(result.errors).length).toBe(0)
        })

        it("should reject request with missing email", () => {
            const body = { password: "SecurePass123!" }
            const result = validateLoginRequest(body)
            expect(result.isValid).toBe(false)
            expect(result.errors.email).toBeDefined()
        })

        it("should reject request with missing password", () => {
            const body = { email: "user@example.com" }
            const result = validateLoginRequest(body)
            expect(result.isValid).toBe(false)
            expect(result.errors.password).toBeDefined()
        })

        it("should reject request with invalid email", () => {
            const body = {
                email: "invalid-email",
                password: "SecurePass123!",
            }
            const result = validateLoginRequest(body)
            expect(result.isValid).toBe(false)
            expect(result.errors.email).toBeDefined()
        })

        it("should accept request with optional rememberMe", () => {
            const body = {
                email: "user@example.com",
                password: "SecurePass123!",
                rememberMe: true,
            }
            const result = validateLoginRequest(body)
            expect(result.isValid).toBe(true)
        })

        it("should reject request with invalid rememberMe type", () => {
            const body = {
                email: "user@example.com",
                password: "SecurePass123!",
                rememberMe: "yes",
            }
            const result = validateLoginRequest(body)
            expect(result.isValid).toBe(false)
            expect(result.errors.rememberMe).toBeDefined()
        })
    })

    describe("containsSQLInjectionPattern", () => {
        it("should detect SQL injection with OR clause", () => {
            const input = "' OR '1'='1"
            expect(containsSQLInjectionPattern(input)).toBe(true)
        })

        it("should detect SQL injection with UNION SELECT", () => {
            const input = "' UNION SELECT * FROM users--"
            expect(containsSQLInjectionPattern(input)).toBe(true)
        })

        it("should detect SQL injection with DROP TABLE", () => {
            const input = "'; DROP TABLE users;--"
            expect(containsSQLInjectionPattern(input)).toBe(true)
        })

        it("should not flag normal text", () => {
            const input = "normal email text"
            expect(containsSQLInjectionPattern(input)).toBe(false)
        })

        it("should detect SQL comments", () => {
            const input = "test -- comment"
            expect(containsSQLInjectionPattern(input)).toBe(true)
        })

        it("should detect stored procedures", () => {
            const input = "exec xp_cmdshell"
            expect(containsSQLInjectionPattern(input)).toBe(true)
        })
    })

    describe("containsXSSPattern", () => {
        it("should detect script tags", () => {
            const input = "<script>alert('xss')</script>"
            expect(containsXSSPattern(input)).toBe(true)
        })

        it("should detect event handlers", () => {
            const input = '<img src="x" onerror="alert(\'xss\')">'
            expect(containsXSSPattern(input)).toBe(true)
        })

        it("should detect javascript protocol", () => {
            const input = "<a href=\"javascript:alert('xss')\">click</a>"
            expect(containsXSSPattern(input)).toBe(true)
        })

        it("should detect iframe tags", () => {
            const input = '<iframe src="http://evil.com"></iframe>'
            expect(containsXSSPattern(input)).toBe(true)
        })

        it("should not flag normal text", () => {
            const input = "normal email text"
            expect(containsXSSPattern(input)).toBe(false)
        })

        it("should detect object tags", () => {
            const input = '<object data="http://evil.com"></object>'
            expect(containsXSSPattern(input)).toBe(true)
        })
    })

    describe("validatePayloadSize", () => {
        it("should accept payload within size limit", () => {
            const payload = "a".repeat(1000) // ~1KB
            expect(validatePayloadSize(payload, 10)).toBe(true)
        })

        it("should reject payload exceeding size limit", () => {
            const payload = "a".repeat(11 * 1024) // ~11KB
            expect(validatePayloadSize(payload, 10)).toBe(false)
        })

        it("should accept empty payload", () => {
            expect(validatePayloadSize("", 10)).toBe(true)
        })

        it("should use default 10KB limit", () => {
            const payload = "a".repeat(9 * 1024) // ~9KB
            expect(validatePayloadSize(payload)).toBe(true)
        })

        it("should handle unicode characters correctly", () => {
            const payload = "你好世界".repeat(1000) // Unicode characters
            expect(validatePayloadSize(payload, 100)).toBe(true)
        })
    })
})
