import { describe, expect, it } from "vitest"
import {
    detectSqlInjection,
    validateAgainstSqlInjection,
    validateLoginFormAgainstSqlInjection,
    validateRegistrationFormAgainstSqlInjection,
} from "./sql-injection-prevention"

describe("SQL Injection Prevention", () => {
    describe("detectSqlInjection", () => {
        it("returns false for benign input", () => {
            expect(detectSqlInjection("test@example.com")).toEqual({
                detected: false,
            })
        })

        it("returns false for empty / non-string input", () => {
            expect(detectSqlInjection("")).toEqual({ detected: false })
            expect(detectSqlInjection(null as unknown as string)).toEqual({
                detected: false,
            })
        })

        it("detects classic union-based injection", () => {
            const result = detectSqlInjection(
                "1 UNION SELECT password FROM users"
            )
            expect(result.detected).toBe(true)
            expect(result.pattern).toBe("SQL keyword")
        })

        it("detects comment-out injection", () => {
            const result = detectSqlInjection("admin'--")
            expect(result.detected).toBe(true)
        })

        it("detects DROP TABLE statement", () => {
            const result = detectSqlInjection("test'; DROP TABLE users; --")
            expect(result.detected).toBe(true)
        })

        it("detects OR 1=1 tautology", () => {
            const result = detectSqlInjection("' OR 1=1 --")
            expect(result.detected).toBe(true)
        })

        it("detects stacked statements", () => {
            const result = detectSqlInjection("x; DELETE FROM users")
            expect(result.detected).toBe(true)
        })
    })

    describe("validateAgainstSqlInjection", () => {
        it("passes benign field values", () => {
            const result = validateAgainstSqlInjection("John Doe", "name")
            expect(result.isValid).toBe(true)
        })

        it("rejects suspicious SQL patterns with field context", () => {
            const result = validateAgainstSqlInjection("' OR 1=1--", "email")
            expect(result.isValid).toBe(false)
            expect(result.error).toContain("email")
        })

        it("accepts missing input as valid", () => {
            const result = validateAgainstSqlInjection("", "name")
            expect(result.isValid).toBe(true)
        })
    })

    describe("validateRegistrationFormAgainstSqlInjection", () => {
        it("passes a clean registration payload", () => {
            const result = validateRegistrationFormAgainstSqlInjection({
                name: "John Doe",
                email: "john@example.com",
                password: "StrongPass123!",
                confirmPassword: "StrongPass123!",
            })
            expect(result.isValid).toBe(true)
            expect(result.errors).toEqual({})
        })

        it("flags SQL injection in payload fields", () => {
            const result = validateRegistrationFormAgainstSqlInjection({
                name: "admin' OR 1=1--",
                email: "john@example.com",
                password: "StrongPass123!",
                confirmPassword: "StrongPass123!",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.name).toBeDefined()
        })
    })

    describe("validateLoginFormAgainstSqlInjection", () => {
        it("passes a clean login payload", () => {
            const result = validateLoginFormAgainstSqlInjection({
                email: "john@example.com",
                password: "StrongPass123!",
            })
            expect(result.isValid).toBe(true)
        })

        it("rejects injection attempts in login fields", () => {
            const result = validateLoginFormAgainstSqlInjection({
                email: "john'; DROP TABLE users; --",
                password: "StrongPass123!",
            })
            expect(result.isValid).toBe(false)
            expect(result.errors.email).toBeDefined()
        })
    })
})
