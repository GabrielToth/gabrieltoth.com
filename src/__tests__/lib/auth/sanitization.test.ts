/**
 * Unit Tests for Sanitization Functions
 * Tests sanitization functions for input, name, email, and HTML escaping
 * Validates: Requirements 1.5, 7.3, 12.1, 12.2, 12.3, 12.4
 */

import {
    escapeHtml,
    sanitizeEmail,
    sanitizeInput,
    sanitizeLoginForm,
    sanitizeName,
    sanitizePassword,
    sanitizePasswordResetForm,
    sanitizeRegistrationForm,
} from "@/lib/auth/sanitization"
import { describe, expect, it } from "vitest"

describe("sanitizeInput", () => {
    it("should remove HTML tags", () => {
        const result = sanitizeInput("<script>alert('XSS')</script>")
        expect(result).not.toContain("<")
        expect(result).not.toContain(">")
    })

    it("should remove null bytes", () => {
        const result = sanitizeInput("test\x00value")
        expect(result).not.toContain("\x00")
    })

    it("should remove control characters", () => {
        const result = sanitizeInput("test\x01\x02value")
        expect(result).toBe("testvalue")
    })

    it("should trim whitespace", () => {
        const result = sanitizeInput("  test  ")
        expect(result).toBe("test")
    })

    it("should handle empty input", () => {
        expect(sanitizeInput("")).toBe("")
        expect(sanitizeInput(null as any)).toBe("")
    })

    it("should preserve normal text", () => {
        const result = sanitizeInput("Hello World")
        expect(result).toBe("Hello World")
    })
})

describe("sanitizeName", () => {
    it("should sanitize name and normalize whitespace", () => {
        const result = sanitizeName("  John   Doe  ")
        expect(result).toBe("John Doe")
    })

    it("should remove HTML tags from name", () => {
        const result = sanitizeName("<b>John</b> Doe")
        expect(result).toBe("John Doe")
    })

    it("should handle empty input", () => {
        expect(sanitizeName("")).toBe("")
        expect(sanitizeName(null as any)).toBe("")
    })

    it("should preserve apostrophes and hyphens", () => {
        const result = sanitizeName("O'Brien-Smith")
        expect(result).toBe("O'Brien-Smith")
    })
})

describe("sanitizeEmail", () => {
    it("should convert email to lowercase", () => {
        const result = sanitizeEmail("John@Example.COM")
        expect(result).toBe("john@example.com")
    })

    it("should trim whitespace", () => {
        const result = sanitizeEmail("  john@example.com  ")
        expect(result).toBe("john@example.com")
    })

    it("should remove HTML tags", () => {
        const result = sanitizeEmail("<b>john@example.com</b>")
        expect(result).toBe("john@example.com")
    })

    it("should handle empty input", () => {
        expect(sanitizeEmail("")).toBe("")
        expect(sanitizeEmail(null as any)).toBe("")
    })
})

describe("escapeHtml", () => {
    it("should escape HTML special characters", () => {
        const result = escapeHtml('<script>alert("XSS")</script>')
        expect(result).toContain("&lt;")
        expect(result).toContain("&gt;")
        expect(result).toContain("&quot;")
        expect(result).not.toContain("<")
        expect(result).not.toContain(">")
    })

    it("should escape ampersand", () => {
        const result = escapeHtml("Tom & Jerry")
        expect(result).toBe("Tom &amp; Jerry")
    })

    it("should escape double quotes", () => {
        const result = escapeHtml('He said "Hello"')
        expect(result).toContain("&quot;")
    })

    it("should escape single quotes", () => {
        const result = escapeHtml("It's a test")
        expect(result).toContain("&#39;")
    })

    it("should escape forward slash", () => {
        const result = escapeHtml("path/to/file")
        expect(result).toContain("&#x2F;")
    })

    it("should handle empty input", () => {
        expect(escapeHtml("")).toBe("")
        expect(escapeHtml(null as any)).toBe("")
    })

    it("should preserve normal text", () => {
        const result = escapeHtml("Hello World")
        expect(result).toBe("Hello World")
    })
})

describe("sanitizePassword", () => {
    it("should remove HTML tags", () => {
        const result = sanitizePassword("<script>Pass@word123!</script>")
        expect(result).not.toContain("<")
        expect(result).not.toContain(">")
    })

    it("should preserve special characters", () => {
        const result = sanitizePassword("Pass@word123!")
        expect(result).toBe("Pass@word123!")
    })

    it("should remove null bytes", () => {
        const result = sanitizePassword("Pass\x00word123!")
        expect(result).not.toContain("\x00")
    })

    it("should handle empty input", () => {
        expect(sanitizePassword("")).toBe("")
        expect(sanitizePassword(null as any)).toBe("")
    })
})

describe("sanitizeRegistrationForm", () => {
    it("should sanitize all fields", () => {
        const result = sanitizeRegistrationForm({
            name: "  John Doe  ",
            email: "  John@Example.COM  ",
            password: "Pass@word123!",
            confirmPassword: "Pass@word123!",
        })

        expect(result.name).toBe("John Doe")
        expect(result.email).toBe("john@example.com")
        expect(result.password).toBe("Pass@word123!")
        expect(result.confirmPassword).toBe("Pass@word123!")
    })

    it("should remove HTML tags from all fields", () => {
        const result = sanitizeRegistrationForm({
            name: "<b>John</b> Doe",
            email: "<b>john@example.com</b>",
            password: "<script>Pass@word123!</script>",
            confirmPassword: "<script>Pass@word123!</script>",
        })

        expect(result.name).not.toContain("<")
        expect(result.email).not.toContain("<")
        expect(result.password).not.toContain("<")
        expect(result.confirmPassword).not.toContain("<")
    })
})

describe("sanitizeLoginForm", () => {
    it("should sanitize email and password", () => {
        const result = sanitizeLoginForm({
            email: "  John@Example.COM  ",
            password: "Pass@word123!",
        })

        expect(result.email).toBe("john@example.com")
        expect(result.password).toBe("Pass@word123!")
    })
})

describe("sanitizePasswordResetForm", () => {
    it("should sanitize password fields", () => {
        const result = sanitizePasswordResetForm({
            password: "NewPass123!",
            confirmPassword: "NewPass123!",
        })

        expect(result.password).toBe("NewPass123!")
        expect(result.confirmPassword).toBe("NewPass123!")
    })
})
