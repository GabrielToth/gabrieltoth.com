/**
 * Unit Tests for SQL Injection Prevention Functions
 * Tests SQL injection detection and prevention
 * Validates: Requirements 7.5, 11.1, 11.2, 11.3
 */

import {
    detectSqlInjection,
    validateAgainstSqlInjection,
    validateLoginFormAgainstSqlInjection,
    validateRegistrationFormAgainstSqlInjection,
} from "@/lib/auth/sql-injection-prevention"
import { describe, expect, it } from "vitest"

describe("detectSqlInjection", () => {
    describe("SQL keyword detection", () => {
        it("should detect SELECT keyword", () => {
            const result = detectSqlInjection("SELECT * FROM users")
            expect(result.detected).toBe(true)
            expect(result.pattern).toBe("SQL keyword")
        })

        it("should detect DROP keyword", () => {
            const result = detectSqlInjection("DROP TABLE users")
            expect(result.detected).toBe(true)
        })

        it("should detect DELETE keyword", () => {
            const result = detectSqlInjection("DELETE FROM users")
            expect(result.detected).toBe(true)
        })

        it("should detect UPDATE keyword", () => {
            const result = detectSqlInjection("UPDATE users SET")
            expect(result.detected).toBe(true)
        })

        it("should detect INSERT keyword", () => {
            const result = detectSqlInjection("INSERT INTO users")
            expect(result.detected).toBe(true)
        })

        it("should detect UNION keyword", () => {
            const result = detectSqlInjection("UNION SELECT")
            expect(result.detected).toBe(true)
        })
    })

    describe("SQL injection pattern detection", () => {
        it("should detect single quote", () => {
            const result = detectSqlInjection("test' OR '1'='1")
            expect(result.detected).toBe(true)
        })

        it("should detect double quote", () => {
            const result = detectSqlInjection('test" OR "1"="1')
            expect(result.detected).toBe(true)
        })

        it("should detect semicolon", () => {
            const result = detectSqlInjection("test; DROP TABLE users")
            expect(result.detected).toBe(true)
        })

        it("should detect SQL comment --", () => {
            const result = detectSqlInjection("test' --")
            expect(result.detected).toBe(true)
        })

        it("should detect SQL comment /* */", () => {
            const result = detectSqlInjection("test/* comment */")
            expect(result.detected).toBe(true)
        })

        it("should detect OR 1=1 pattern", () => {
            const result = detectSqlInjection("OR 1=1")
            expect(result.detected).toBe(true)
        })

        it("should detect OR '1'='1' pattern", () => {
            const result = detectSqlInjection("OR '1'='1'")
            expect(result.detected).toBe(true)
        })

        it("should detect EXEC pattern", () => {
            const result = detectSqlInjection("EXEC xp_cmdshell")
            expect(result.detected).toBe(true)
        })

        it("should detect EXECUTE pattern", () => {
            const result = detectSqlInjection("EXECUTE sp_executesql")
            expect(result.detected).toBe(true)
        })
    })

    describe("safe input", () => {
        it("should not detect normal email", () => {
            const result = detectSqlInjection("user@example.com")
            expect(result.detected).toBe(false)
        })

        it("should not detect normal name", () => {
            const result = detectSqlInjection("John Doe")
            expect(result.detected).toBe(false)
        })

        it("should not detect normal password", () => {
            const result = detectSqlInjection("ValidPass123!")
            expect(result.detected).toBe(false)
        })

        it("should handle empty input", () => {
            const result = detectSqlInjection("")
            expect(result.detected).toBe(false)
        })

        it("should handle null input", () => {
            const result = detectSqlInjection(null as any)
            expect(result.detected).toBe(false)
        })
    })
})

describe("validateAgainstSqlInjection", () => {
    it("should accept safe input", () => {
        const result = validateAgainstSqlInjection("user@example.com", "email")
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    it("should reject SQL injection attempt", () => {
        const result = validateAgainstSqlInjection(
            "test'; DROP TABLE users; --",
            "email"
        )
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toContain("suspicious SQL patterns")
    })

    it("should include field name in error message", () => {
        const result = validateAgainstSqlInjection(
            "SELECT * FROM users",
            "email"
        )
        expect(result.error).toContain("email")
    })

    it("should handle empty input", () => {
        const result = validateAgainstSqlInjection("", "email")
        expect(result.isValid).toBe(true)
    })
})

describe("validateRegistrationFormAgainstSqlInjection", () => {
    it("should accept valid registration data", () => {
        const result = validateRegistrationFormAgainstSqlInjection({
            name: "John Doe",
            email: "john@example.com",
            password: "ValidPass123!",
            confirmPassword: "ValidPass123!",
        })
        expect(result.isValid).toBe(true)
        expect(Object.keys(result.errors).length).toBe(0)
    })

    it("should reject SQL injection in name field", () => {
        const result = validateRegistrationFormAgainstSqlInjection({
            name: "John'; DROP TABLE users; --",
            email: "john@example.com",
            password: "ValidPass123!",
            confirmPassword: "ValidPass123!",
        })
        expect(result.isValid).toBe(false)
        expect(result.errors.name).toBeDefined()
    })

    it("should reject SQL injection in email field", () => {
        const result = validateRegistrationFormAgainstSqlInjection({
            name: "John Doe",
            email: "john@example.com' OR '1'='1",
            password: "ValidPass123!",
            confirmPassword: "ValidPass123!",
        })
        expect(result.isValid).toBe(false)
        expect(result.errors.email).toBeDefined()
    })

    it("should reject SQL injection in password field", () => {
        const result = validateRegistrationFormAgainstSqlInjection({
            name: "John Doe",
            email: "john@example.com",
            password: "ValidPass123!'; DROP TABLE users; --",
            confirmPassword: "ValidPass123!'; DROP TABLE users; --",
        })
        expect(result.isValid).toBe(false)
        expect(result.errors.password).toBeDefined()
    })

    it("should reject multiple SQL injection attempts", () => {
        const result = validateRegistrationFormAgainstSqlInjection({
            name: "SELECT * FROM users",
            email: "john@example.com' OR '1'='1",
            password: "ValidPass123!",
            confirmPassword: "ValidPass123!",
        })
        expect(result.isValid).toBe(false)
        expect(Object.keys(result.errors).length).toBeGreaterThan(1)
    })
})

describe("validateLoginFormAgainstSqlInjection", () => {
    it("should accept valid login data", () => {
        const result = validateLoginFormAgainstSqlInjection({
            email: "john@example.com",
            password: "ValidPass123!",
        })
        expect(result.isValid).toBe(true)
        expect(Object.keys(result.errors).length).toBe(0)
    })

    it("should reject SQL injection in email field", () => {
        const result = validateLoginFormAgainstSqlInjection({
            email: "john@example.com' OR '1'='1",
            password: "ValidPass123!",
        })
        expect(result.isValid).toBe(false)
        expect(result.errors.email).toBeDefined()
    })

    it("should reject SQL injection in password field", () => {
        const result = validateLoginFormAgainstSqlInjection({
            email: "john@example.com",
            password: "ValidPass123!'; DROP TABLE users; --",
        })
        expect(result.isValid).toBe(false)
        expect(result.errors.password).toBeDefined()
    })

    it("should reject multiple SQL injection attempts", () => {
        const result = validateLoginFormAgainstSqlInjection({
            email: "SELECT * FROM users",
            password: "DELETE FROM users",
        })
        expect(result.isValid).toBe(false)
        expect(Object.keys(result.errors).length).toBe(2)
    })
})
