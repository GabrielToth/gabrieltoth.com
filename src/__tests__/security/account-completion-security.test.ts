/**
 * Account Completion Security Tests
 *
 * Tests for CSRF protection, input sanitization, SQL injection prevention,
 * XSS prevention, and rate limiting.
 *
 * Validates: Phase 9 - Security Testing
 */

import {
    DEFAULT_RATE_LIMIT_CONFIG,
    clearFailedAttempts,
    generateCSRFToken,
    getRateLimitStatus,
    isRateLimited,
    recordFailedAttempt,
    sanitizeEmail,
    sanitizeInput,
    sanitizeName,
    sanitizePhoneNumber,
    validateInputLength,
    validateSQLInjectionPattern,
    validateSecurityInput,
    validateXSSPattern,
    verifyCSRFToken,
} from "@/lib/auth/account-completion-security"
import { beforeEach, describe, expect, it } from "vitest"

describe("Account Completion Security Tests", () => {
    describe("CSRF Protection", () => {
        it("should generate unique CSRF tokens", () => {
            const token1 = generateCSRFToken()
            const token2 = generateCSRFToken()

            expect(token1).toBeDefined()
            expect(token2).toBeDefined()
            expect(token1).not.toBe(token2)
        })

        it("should verify valid CSRF tokens", () => {
            const token = generateCSRFToken()
            const isValid = verifyCSRFToken(token)

            expect(isValid).toBe(true)
        })

        it("should reject invalid CSRF tokens", () => {
            const isValid = verifyCSRFToken("invalid-token")
            expect(isValid).toBe(false)
        })

        it("should invalidate token after verification", () => {
            const token = generateCSRFToken()

            // First verification should succeed
            expect(verifyCSRFToken(token)).toBe(true)

            // Second verification should fail (token already used)
            expect(verifyCSRFToken(token)).toBe(false)
        })
    })

    describe("Input Sanitization", () => {
        it("should sanitize basic input", () => {
            const input = "  Hello World  "
            const sanitized = sanitizeInput(input)

            expect(sanitized).toBe("Hello World")
        })

        it("should remove HTML tags from input", () => {
            const input = "<script>alert('xss')</script>Hello"
            const sanitized = sanitizeInput(input)

            expect(sanitized).not.toContain("<script>")
            expect(sanitized).not.toContain("</script>")
        })

        it("should remove control characters", () => {
            const input = "Hello\x00World\x1F"
            const sanitized = sanitizeInput(input)

            expect(sanitized).not.toContain("\x00")
            expect(sanitized).not.toContain("\x1F")
        })

        it("should sanitize email addresses", () => {
            const email = "  TEST@EXAMPLE.COM  "
            const sanitized = sanitizeEmail(email)

            expect(sanitized).toBe("test@example.com")
        })

        it("should remove invalid characters from email", () => {
            const email = "test<script>@example.com"
            const sanitized = sanitizeEmail(email)

            expect(sanitized).not.toContain("<")
            expect(sanitized).not.toContain(">")
        })

        it("should sanitize name fields", () => {
            const name = "John O'Brien-Smith"
            const sanitized = sanitizeName(name)

            expect(sanitized).toBe("John O'Brien-Smith")
        })

        it("should remove invalid characters from name", () => {
            const name = "John<script>Doe"
            const sanitized = sanitizeName(name)

            expect(sanitized).not.toContain("<")
            expect(sanitized).not.toContain(">")
        })

        it("should sanitize phone numbers", () => {
            const phone = "+1 (234) 567-8900"
            const sanitized = sanitizePhoneNumber(phone)

            expect(sanitized).toBe("+1 (234) 567-8900")
        })

        it("should remove invalid characters from phone", () => {
            const phone = "+1<script>234567890"
            const sanitized = sanitizePhoneNumber(phone)

            expect(sanitized).not.toContain("<")
            expect(sanitized).not.toContain(">")
        })
    })

    describe("Input Length Validation", () => {
        it("should validate input length", () => {
            const result = validateInputLength("Hello", 10, "Name")
            expect(result.valid).toBe(true)
        })

        it("should reject input exceeding max length", () => {
            const result = validateInputLength("Hello World", 5, "Name")
            expect(result.valid).toBe(false)
            expect(result.error).toContain("must not exceed")
        })

        it("should reject empty input", () => {
            const result = validateInputLength("", 10, "Name")
            expect(result.valid).toBe(false)
            expect(result.error).toContain("required")
        })
    })

    describe("SQL Injection Prevention", () => {
        it("should detect SQL injection patterns", () => {
            const sqlInjectionAttempts = [
                "'; DROP TABLE users; --",
                "1' UNION SELECT * FROM users --",
                "admin' OR '1'='1",
                "1; DELETE FROM users",
                "1' OR 1=1 --",
                "admin' --",
                "' OR 'a'='a",
            ]

            for (const attempt of sqlInjectionAttempts) {
                const isValid = validateSQLInjectionPattern(attempt)
                expect(isValid).toBe(false)
            }
        })

        it("should allow legitimate input", () => {
            const legitimateInputs = [
                "john.doe@example.com",
                "John Doe",
                "+1234567890",
                "1990-01-01",
            ]

            for (const input of legitimateInputs) {
                const isValid = validateSQLInjectionPattern(input)
                expect(isValid).toBe(true)
            }
        })
    })

    describe("XSS Prevention", () => {
        it("should detect XSS patterns", () => {
            const xssAttempts = [
                "<script>alert('xss')</script>",
                "javascript:alert('xss')",
                "<img src=x onerror=alert('xss')>",
                "<iframe src='javascript:alert(1)'></iframe>",
                "<object data='javascript:alert(1)'></object>",
                "<embed src='javascript:alert(1)'>",
                "<svg onload=alert('xss')>",
            ]

            for (const attempt of xssAttempts) {
                const isValid = validateXSSPattern(attempt)
                expect(isValid).toBe(false)
            }
        })

        it("should allow legitimate input", () => {
            const legitimateInputs = [
                "Hello World",
                "john.doe@example.com",
                "John O'Brien",
                "123-456-7890",
            ]

            for (const input of legitimateInputs) {
                const isValid = validateXSSPattern(input)
                expect(isValid).toBe(true)
            }
        })
    })

    describe("Comprehensive Security Validation", () => {
        it("should validate secure input", () => {
            const result = validateSecurityInput(
                "john.doe@example.com",
                "Email"
            )
            expect(result.valid).toBe(true)
        })

        it("should reject input with SQL injection", () => {
            const result = validateSecurityInput(
                "'; DROP TABLE users; --",
                "Name"
            )
            expect(result.valid).toBe(false)
        })

        it("should reject input with XSS", () => {
            const result = validateSecurityInput(
                "<script>alert('xss')</script>",
                "Name"
            )
            expect(result.valid).toBe(false)
        })

        it("should reject input exceeding max length", () => {
            const longInput = "a".repeat(300)
            const result = validateSecurityInput(longInput, "Name", 255)
            expect(result.valid).toBe(false)
        })
    })

    describe("Rate Limiting", () => {
        beforeEach(() => {
            clearFailedAttempts("192.168.1.1")
        })

        it("should not rate limit on first attempt", () => {
            const isLimited = isRateLimited("192.168.1.1")
            expect(isLimited).toBe(false)
        })

        it("should record failed attempts", () => {
            recordFailedAttempt("192.168.1.1")
            const status = getRateLimitStatus("192.168.1.1")

            expect(status.attempts).toBe(1)
            expect(status.remainingAttempts).toBe(
                DEFAULT_RATE_LIMIT_CONFIG.maxAttempts - 1
            )
        })

        it("should rate limit after max attempts", () => {
            const config = DEFAULT_RATE_LIMIT_CONFIG

            for (let i = 0; i < config.maxAttempts; i++) {
                recordFailedAttempt("192.168.1.1")
            }

            const isLimited = isRateLimited("192.168.1.1")
            expect(isLimited).toBe(true)
        })

        it("should track remaining attempts", () => {
            recordFailedAttempt("192.168.1.1")
            recordFailedAttempt("192.168.1.1")

            const status = getRateLimitStatus("192.168.1.1")
            expect(status.attempts).toBe(2)
            expect(status.remainingAttempts).toBe(
                DEFAULT_RATE_LIMIT_CONFIG.maxAttempts - 2
            )
        })

        it("should clear failed attempts", () => {
            recordFailedAttempt("192.168.1.1")
            clearFailedAttempts("192.168.1.1")

            const status = getRateLimitStatus("192.168.1.1")
            expect(status.attempts).toBe(0)
            expect(status.isLimited).toBe(false)
        })

        it("should track block duration", () => {
            const config = DEFAULT_RATE_LIMIT_CONFIG

            for (let i = 0; i < config.maxAttempts; i++) {
                recordFailedAttempt("192.168.1.1")
            }

            const status = getRateLimitStatus("192.168.1.1")
            expect(status.blockedUntil).toBeDefined()
            expect(status.isLimited).toBe(true)
        })

        it("should handle multiple IPs independently", () => {
            recordFailedAttempt("192.168.1.1")
            recordFailedAttempt("192.168.1.2")

            const status1 = getRateLimitStatus("192.168.1.1")
            const status2 = getRateLimitStatus("192.168.1.2")

            expect(status1.attempts).toBe(1)
            expect(status2.attempts).toBe(1)
        })
    })

    describe("Security Best Practices", () => {
        it("should sanitize all user inputs before processing", () => {
            const userInputs = {
                email: "  TEST@EXAMPLE.COM  ",
                name: "  John Doe  ",
                phone: "  +1 (234) 567-8900  ",
            }

            const sanitized = {
                email: sanitizeEmail(userInputs.email),
                name: sanitizeName(userInputs.name),
                phone: sanitizePhoneNumber(userInputs.phone),
            }

            expect(sanitized.email).toBe("test@example.com")
            expect(sanitized.name).toBe("John Doe")
            expect(sanitized.phone).toBe("+1 (234) 567-8900")
        })

        it("should validate all inputs for security threats", () => {
            const inputs = ["john.doe@example.com", "John Doe", "+1234567890"]

            for (const input of inputs) {
                const result = validateSecurityInput(input, "Field")
                expect(result.valid).toBe(true)
            }
        })

        it("should protect against common attack vectors", () => {
            const attackVectors = [
                "'; DROP TABLE users; --", // SQL injection
                "<script>alert('xss')</script>", // XSS
                "javascript:alert('xss')", // JavaScript injection
                "<img src=x onerror=alert('xss')>", // Event handler injection
            ]

            for (const vector of attackVectors) {
                const result = validateSecurityInput(vector, "Field")
                expect(result.valid).toBe(false)
            }
        })
    })
})
