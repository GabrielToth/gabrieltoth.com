import { validateEmail } from "@/lib/auth/validation"
import { describe, expect, it } from "vitest"

/**
 * Simplified validation tests
 *
 * These tests were converted from property-based tests that used .filter() chains
 * which caused the test suite to hang. Instead of generating random data and filtering,
 * we now use explicit test cases that cover the same validation scenarios.
 */

describe("Email Validation", () => {
    describe("Invalid Emails", () => {
        it("should reject emails without @ symbol", () => {
            const invalidEmails = [
                "notanemail",
                "test.com",
                "userexample.com",
                "hello world",
                "test123",
            ]

            invalidEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(false)
            })
        })

        it("should reject emails with multiple @ symbols", () => {
            const invalidEmails = [
                "user@@example.com",
                "test@test@example.com",
                "@@example.com",
                "user@test@test.com",
                "a@b@c@d.com",
            ]

            invalidEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(false)
            })
        })

        it("should reject emails without domain extension", () => {
            const invalidEmails = [
                "user@domain",
                "test@example",
                "hello@world",
                "admin@localhost",
                "user@server",
            ]

            invalidEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(false)
            })
        })

        it("should reject emails with empty local part", () => {
            const invalidEmails = [
                "@example.com",
                "@test.com",
                "@domain.org",
                "@server.net",
                "@mail.io",
            ]

            invalidEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(false)
            })
        })

        it("should reject emails with spaces", () => {
            const invalidEmails = [
                "user name@example.com",
                "user@exam ple.com",
                " user@example.com",
                "user@example.com ",
                "user @example.com",
            ]

            invalidEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(false)
            })
        })
    })

    describe("Valid Emails", () => {
        it("should accept standard email formats", () => {
            const validEmails = [
                "user@example.com",
                "test.user@example.com",
                "user+tag@example.com",
                "user_name@example.com",
                "user123@example.com",
            ]

            validEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(true)
            })
        })

        it("should accept emails with subdomains", () => {
            const validEmails = [
                "user@mail.example.com",
                "user@subdomain.example.com",
                "user@deep.sub.domain.example.com",
            ]

            validEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(true)
            })
        })

        it("should accept emails with various TLDs", () => {
            const validEmails = [
                "user@example.com",
                "user@example.org",
                "user@example.net",
                "user@example.io",
                "user@example.co.uk",
            ]

            validEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(true)
            })
        })

        it("should accept emails with numbers in domain", () => {
            const validEmails = [
                "user@example123.com",
                "user@123example.com",
                "user@ex123ample.com",
            ]

            validEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(true)
            })
        })

        it("should accept emails with hyphens in domain", () => {
            const validEmails = [
                "user@my-domain.com",
                "user@example-site.com",
                "user@test-mail-server.com",
            ]

            validEmails.forEach(email => {
                const isValid = validateEmail(email)
                expect(isValid).toBe(true)
            })
        })
    })

    describe("Edge Cases", () => {
        it("should handle empty strings", () => {
            expect(validateEmail("")).toBe(false)
        })

        it("should handle whitespace", () => {
            expect(validateEmail(" ")).toBe(false)
            expect(validateEmail("  ")).toBe(false)
        })

        it("should handle very long emails", () => {
            const longLocal = "a".repeat(64)
            const longDomain = "b".repeat(63)
            const longEmail = `${longLocal}@${longDomain}.com`

            // This might be valid or invalid depending on implementation
            // Just verify it doesn't crash
            const result = validateEmail(longEmail)
            expect(typeof result).toBe("boolean")
        })
    })
})
