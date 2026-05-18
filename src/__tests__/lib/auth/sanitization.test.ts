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
    sanitizeUserIdentifier,
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
        const result = escapeHtml("<script>alert(\"XSS\")</script>")
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
        const result = escapeHtml("He said \"Hello\"")
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

describe("sanitizeUserIdentifier", () => {
    describe("Valid emails", () => {
        it("should sanitize valid email with whitespace", () => {
            const result = sanitizeUserIdentifier("  user@example.com  ")
            expect(result).toBe("user@example.com")
        })

        it("should convert email to lowercase", () => {
            const result = sanitizeUserIdentifier("User@Example.COM")
            expect(result).toBe("user@example.com")
        })

        it("should handle email with plus sign", () => {
            const result = sanitizeUserIdentifier("user+tag@example.com")
            expect(result).toBe("user+tag@example.com")
        })

        it("should handle email with underscores", () => {
            const result = sanitizeUserIdentifier("user_name@example.com")
            expect(result).toBe("user_name@example.com")
        })

        it("should handle email with hyphens", () => {
            const result = sanitizeUserIdentifier("user-name@example.com")
            expect(result).toBe("user-name@example.com")
        })

        it("should handle email with dots in local part", () => {
            const result = sanitizeUserIdentifier("user.name@example.com")
            expect(result).toBe("user.name@example.com")
        })

        it("should handle email with subdomain", () => {
            const result = sanitizeUserIdentifier("user@mail.example.com")
            expect(result).toBe("user@mail.example.com")
        })

        it("should handle email with multiple subdomains", () => {
            const result = sanitizeUserIdentifier("user@mail.sub.example.com")
            expect(result).toBe("user@mail.sub.example.com")
        })

        it("should handle email with numbers", () => {
            const result = sanitizeUserIdentifier("user123@example456.com")
            expect(result).toBe("user123@example456.com")
        })
    })

    describe("Invalid emails - format", () => {
        it("should reject email without @", () => {
            expect(sanitizeUserIdentifier("userexample.com")).toBeNull()
        })

        it("should reject email without domain", () => {
            expect(sanitizeUserIdentifier("user@")).toBeNull()
        })

        it("should reject email without local part", () => {
            expect(sanitizeUserIdentifier("@example.com")).toBeNull()
        })

        it("should reject email without TLD", () => {
            expect(sanitizeUserIdentifier("user@example")).toBeNull()
        })

        it("should reject email with multiple @", () => {
            expect(sanitizeUserIdentifier("user@example@com")).toBeNull()
        })

        it("should reject email with spaces", () => {
            expect(sanitizeUserIdentifier("user name@example.com")).toBeNull()
        })

        it("should reject email with consecutive dots", () => {
            expect(sanitizeUserIdentifier("user..name@example.com")).toBeNull()
        })

        it("should reject email with leading dot in local part", () => {
            expect(sanitizeUserIdentifier(".user@example.com")).toBeNull()
        })

        it("should reject email with trailing dot in local part", () => {
            expect(sanitizeUserIdentifier("user.@example.com")).toBeNull()
        })

        it("should reject email with leading dot in domain", () => {
            expect(sanitizeUserIdentifier("user@.example.com")).toBeNull()
        })

        it("should reject email with trailing dot in domain", () => {
            expect(sanitizeUserIdentifier("user@example.com.")).toBeNull()
        })

        it("should reject email with leading hyphen in domain label", () => {
            expect(sanitizeUserIdentifier("user@-example.com")).toBeNull()
        })

        it("should reject email with trailing hyphen in domain label", () => {
            expect(sanitizeUserIdentifier("user@example-.com")).toBeNull()
        })

        it("should reject email exceeding 254 characters", () => {
            const longEmail = "a".repeat(250) + "@example.com"
            expect(sanitizeUserIdentifier(longEmail)).toBeNull()
        })
    })

    describe("SQL Injection patterns", () => {
        it("should reject SQL injection with OR", () => {
            expect(sanitizeUserIdentifier("' OR '1'='1")).toBeNull()
        })

        it("should reject SQL injection with UNION", () => {
            expect(
                sanitizeUserIdentifier("user' UNION SELECT * FROM users--")
            ).toBeNull()
        })

        it("should reject SQL injection with SELECT", () => {
            expect(
                sanitizeUserIdentifier("user'; SELECT * FROM users;--")
            ).toBeNull()
        })

        it("should reject SQL injection with INSERT", () => {
            expect(
                sanitizeUserIdentifier("user'; INSERT INTO users VALUES--")
            ).toBeNull()
        })

        it("should reject SQL injection with DELETE", () => {
            expect(
                sanitizeUserIdentifier("user'; DELETE FROM users;--")
            ).toBeNull()
        })

        it("should reject SQL injection with DROP", () => {
            expect(
                sanitizeUserIdentifier("user'; DROP TABLE users;--")
            ).toBeNull()
        })

        it("should reject SQL injection with UPDATE", () => {
            expect(
                sanitizeUserIdentifier("user'; UPDATE users SET--")
            ).toBeNull()
        })

        it("should reject SQL injection with comment", () => {
            expect(sanitizeUserIdentifier("user'--")).toBeNull()
        })

        it("should reject SQL injection with block comment", () => {
            expect(sanitizeUserIdentifier("user'/* comment */")).toBeNull()
        })

        it("should reject SQL injection with semicolon", () => {
            expect(
                sanitizeUserIdentifier("user@example.com;DROP TABLE users")
            ).toBeNull()
        })

        it("should reject SQL injection with xp_ stored procedure", () => {
            expect(sanitizeUserIdentifier("user'; xp_cmdshell")).toBeNull()
        })

        it("should reject SQL injection with sp_ stored procedure", () => {
            expect(sanitizeUserIdentifier("user'; sp_executesql")).toBeNull()
        })
    })

    describe("XSS patterns", () => {
        it("should reject script tag", () => {
            expect(
                sanitizeUserIdentifier("<script>alert('xss')</script>")
            ).toBeNull()
        })

        it("should reject img tag with onerror", () => {
            expect(
                sanitizeUserIdentifier("<img src=x onerror=alert('xss')>")
            ).toBeNull()
        })

        it("should reject iframe tag", () => {
            expect(
                sanitizeUserIdentifier("<iframe src='evil.com'></iframe>")
            ).toBeNull()
        })

        it("should reject object tag", () => {
            expect(
                sanitizeUserIdentifier("<object data='evil.swf'></object>")
            ).toBeNull()
        })

        it("should reject embed tag", () => {
            expect(sanitizeUserIdentifier("<embed src='evil.swf'>")).toBeNull()
        })

        it("should reject svg tag with onload", () => {
            expect(
                sanitizeUserIdentifier("<svg onload=alert('xss')>")
            ).toBeNull()
        })

        it("should reject body tag with onload", () => {
            expect(
                sanitizeUserIdentifier("<body onload=alert('xss')>")
            ).toBeNull()
        })

        it("should reject input tag with onfocus", () => {
            expect(
                sanitizeUserIdentifier("<input onfocus=alert('xss')>")
            ).toBeNull()
        })

        it("should reject form tag with onsubmit", () => {
            expect(
                sanitizeUserIdentifier("<form onsubmit=alert('xss')>")
            ).toBeNull()
        })

        it("should reject a tag with onclick", () => {
            expect(
                sanitizeUserIdentifier("<a onclick=alert('xss')>")
            ).toBeNull()
        })

        it("should reject div tag with onmouseover", () => {
            expect(
                sanitizeUserIdentifier("<div onmouseover=alert('xss')>")
            ).toBeNull()
        })

        it("should reject span tag with onmouseenter", () => {
            expect(
                sanitizeUserIdentifier("<span onmouseenter=alert('xss')>")
            ).toBeNull()
        })

        it("should reject button tag with onclick", () => {
            expect(
                sanitizeUserIdentifier("<button onclick=alert('xss')>")
            ).toBeNull()
        })

        it("should reject javascript protocol", () => {
            expect(sanitizeUserIdentifier("javascript:alert('xss')")).toBeNull()
        })
    })

    describe("LDAP Injection patterns", () => {
        it("should reject LDAP injection with asterisk", () => {
            expect(sanitizeUserIdentifier("*")).toBeNull()
        })

        it("should reject LDAP injection with parentheses", () => {
            expect(sanitizeUserIdentifier("(uid=*)")).toBeNull()
        })

        it("should reject LDAP injection with pipe", () => {
            expect(sanitizeUserIdentifier("*)(|(uid=*")).toBeNull()
        })

        it("should reject LDAP injection with ampersand", () => {
            expect(sanitizeUserIdentifier("*&(uid=*)")).toBeNull()
        })

        it("should reject LDAP injection with backslash", () => {
            expect(sanitizeUserIdentifier("user\\admin")).toBeNull()
        })
    })

    describe("Command Injection patterns", () => {
        it("should reject command injection with semicolon", () => {
            expect(sanitizeUserIdentifier("user;rm -rf /")).toBeNull()
        })

        it("should reject command injection with pipe", () => {
            expect(sanitizeUserIdentifier("user|cat /etc/passwd")).toBeNull()
        })

        it("should reject command injection with ampersand", () => {
            expect(sanitizeUserIdentifier("user&whoami")).toBeNull()
        })

        it("should reject command injection with backtick", () => {
            expect(sanitizeUserIdentifier("user`whoami`")).toBeNull()
        })

        it("should reject command injection with dollar sign", () => {
            expect(sanitizeUserIdentifier("user$(whoami)")).toBeNull()
        })

        it("should reject command injection with dollar brace", () => {
            expect(sanitizeUserIdentifier("user${whoami}")).toBeNull()
        })
    })

    describe("Control characters", () => {
        it("should reject null byte", () => {
            expect(sanitizeUserIdentifier("user@example.com\x00")).toBeNull()
        })

        it("should reject control character 0x01", () => {
            expect(sanitizeUserIdentifier("user@example.com\x01")).toBeNull()
        })

        it("should reject control character 0x1F", () => {
            expect(sanitizeUserIdentifier("user@example.com\x1F")).toBeNull()
        })

        it("should reject DEL character 0x7F", () => {
            expect(sanitizeUserIdentifier("user@example.com\x7F")).toBeNull()
        })

        it("should trim and accept newline at end", () => {
            // Newline is trimmed, so this becomes valid
            const result = sanitizeUserIdentifier("user@example.com\n")
            expect(result).toBe("user@example.com")
        })

        it("should trim and accept carriage return at end", () => {
            // Carriage return is trimmed, so this becomes valid
            const result = sanitizeUserIdentifier("user@example.com\r")
            expect(result).toBe("user@example.com")
        })

        it("should trim and accept tab at end", () => {
            // Tab is trimmed, so this becomes valid
            const result = sanitizeUserIdentifier("user@example.com\t")
            expect(result).toBe("user@example.com")
        })

        it("should reject control character in middle of email", () => {
            expect(sanitizeUserIdentifier("user\x01@example.com")).toBeNull()
        })
    })

    describe("Edge cases", () => {
        it("should reject empty string", () => {
            expect(sanitizeUserIdentifier("")).toBeNull()
        })

        it("should reject whitespace only", () => {
            expect(sanitizeUserIdentifier("   ")).toBeNull()
        })

        it("should reject null", () => {
            expect(sanitizeUserIdentifier(null as any)).toBeNull()
        })

        it("should reject undefined", () => {
            expect(sanitizeUserIdentifier(undefined as any)).toBeNull()
        })

        it("should reject non-string", () => {
            expect(sanitizeUserIdentifier(123 as any)).toBeNull()
        })

        it("should reject object", () => {
            expect(sanitizeUserIdentifier({} as any)).toBeNull()
        })

        it("should reject array", () => {
            expect(sanitizeUserIdentifier([] as any)).toBeNull()
        })
    })

    describe("Case sensitivity", () => {
        it("should normalize mixed case email", () => {
            const result = sanitizeUserIdentifier("UsEr@ExAmPlE.CoM")
            expect(result).toBe("user@example.com")
        })

        it("should normalize uppercase email", () => {
            const result = sanitizeUserIdentifier("USER@EXAMPLE.COM")
            expect(result).toBe("user@example.com")
        })
    })

    describe("Real-world examples", () => {
        it("should handle Gmail address", () => {
            const result = sanitizeUserIdentifier("john.doe+tag@gmail.com")
            expect(result).toBe("john.doe+tag@gmail.com")
        })

        it("should handle corporate email", () => {
            const result = sanitizeUserIdentifier("john.doe@company.co.uk")
            expect(result).toBe("john.doe@company.co.uk")
        })

        it("should handle numeric domain", () => {
            const result = sanitizeUserIdentifier("user@123.456.789.com")
            expect(result).toBe("user@123.456.789.com")
        })

        it("should handle hyphenated domain", () => {
            const result = sanitizeUserIdentifier("user@my-company.com")
            expect(result).toBe("user@my-company.com")
        })

        it("should handle international TLD", () => {
            const result = sanitizeUserIdentifier("user@example.io")
            expect(result).toBe("user@example.io")
        })
    })
})
