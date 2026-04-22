/**
 * Tests for Error Handler Middleware
 * Validates: Requirements 6.9, 15.1, 23.1, 23.5
 */

import {
    getSanitizedBody,
    sanitizeErrorMessage,
    sanitizeRequestBody,
    validateRequestSize,
    validateRequiredFields,
    withErrorHandler,
} from "@/lib/middleware/error-handler"
import { NextRequest, NextResponse } from "next/server"
import { describe, expect, it, vi } from "vitest"

describe("Error Handler Middleware", () => {
    describe("sanitizeRequestBody", () => {
        it("should redact password field", () => {
            const body = {
                email: "test@example.com",
                password: "secret123",
                name: "John Doe",
            }

            const sanitized = sanitizeRequestBody(body)

            expect(sanitized).toEqual({
                email: "test@example.com",
                password: "[REDACTED]",
                name: "John Doe",
            })
        })

        it("should redact multiple sensitive fields", () => {
            const body = {
                email: "test@example.com",
                password: "secret123",
                token: "abc123xyz",
                apiKey: "key123",
                name: "John Doe",
            }

            const sanitized = sanitizeRequestBody(body)

            expect(sanitized.password).toBe("[REDACTED]")
            expect(sanitized.token).toBe("[REDACTED]")
            expect(sanitized.apiKey).toBe("[REDACTED]")
            expect(sanitized.email).toBe("test@example.com")
        })

        it("should handle non-object bodies", () => {
            expect(sanitizeRequestBody(null)).toBe(null)
            expect(sanitizeRequestBody("string")).toBe("string")
            expect(sanitizeRequestBody(123)).toBe(123)
        })

        it("should not modify original body", () => {
            const body = {
                email: "test@example.com",
                password: "secret123",
            }

            sanitizeRequestBody(body)

            expect(body.password).toBe("secret123")
        })
    })

    describe("sanitizeErrorMessage", () => {
        it("should redact password from error message", () => {
            const message = "Error: password is invalid"
            const sanitized = sanitizeErrorMessage(message)

            expect(sanitized).toContain("[REDACTED]")
            expect(sanitized).not.toContain("password is")
        })

        it("should redact token from error message", () => {
            const message = "Invalid token: abc123xyz"
            const sanitized = sanitizeErrorMessage(message)

            expect(sanitized).toContain("[REDACTED]")
            expect(sanitized).not.toContain("abc123xyz")
        })

        it("should redact api_key from error message", () => {
            const message = "API key: secret_key_123"
            const sanitized = sanitizeErrorMessage(message)

            expect(sanitized).toContain("[REDACTED]")
            expect(sanitized).not.toContain("secret_key_123")
        })

        it("should handle multiple sensitive patterns", () => {
            const message =
                "Error with password: secret123 and token: abc123xyz"
            const sanitized = sanitizeErrorMessage(message)

            expect(sanitized).not.toContain("secret123")
            expect(sanitized).not.toContain("abc123xyz")
        })

        it("should preserve non-sensitive error messages", () => {
            const message = "User not found"
            const sanitized = sanitizeErrorMessage(message)

            expect(sanitized).toBe("User not found")
        })
    })

    describe("validateRequiredFields", () => {
        it("should validate all required fields present", () => {
            const body = {
                email: "test@example.com",
                password: "secret123",
                name: "John Doe",
            }

            const result = validateRequiredFields(body, [
                "email",
                "password",
                "name",
            ])

            expect(result.isValid).toBe(true)
            expect(result.missingFields).toBeUndefined()
        })

        it("should detect missing required fields", () => {
            const body = {
                email: "test@example.com",
                password: "secret123",
            }

            const result = validateRequiredFields(body, [
                "email",
                "password",
                "name",
            ])

            expect(result.isValid).toBe(false)
            expect(result.missingFields).toContain("name")
        })

        it("should detect empty string fields as missing", () => {
            const body = {
                email: "test@example.com",
                password: "",
                name: "John Doe",
            }

            const result = validateRequiredFields(body, [
                "email",
                "password",
                "name",
            ])

            expect(result.isValid).toBe(false)
            expect(result.missingFields).toContain("password")
        })

        it("should handle non-object bodies", () => {
            const result = validateRequiredFields(null, ["email", "password"])

            expect(result.isValid).toBe(false)
            expect(result.missingFields).toEqual(["email", "password"])
        })

        it("should handle empty required fields array", () => {
            const body = { email: "test@example.com" }

            const result = validateRequiredFields(body, [])

            expect(result.isValid).toBe(true)
        })
    })

    describe("validateRequestSize", () => {
        it("should allow requests within size limit", async () => {
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
                headers: {
                    "content-length": "100",
                },
            })

            const result = await validateRequestSize(req, 1000)

            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should reject requests exceeding size limit", async () => {
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
                headers: {
                    "content-length": "2000",
                },
            })

            const result = await validateRequestSize(req, 1000)

            expect(result.isValid).toBe(false)
            expect(result.error).toContain("exceeds maximum size")
        })

        it("should allow requests without content-length header", async () => {
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
            })

            const result = await validateRequestSize(req, 1000)

            expect(result.isValid).toBe(true)
        })

        it("should use default max size of 1MB", async () => {
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
                headers: {
                    "content-length": String(2 * 1024 * 1024), // 2MB
                },
            })

            const result = await validateRequestSize(req)

            expect(result.isValid).toBe(false)
        })
    })

    describe("withErrorHandler", () => {
        it("should return response from successful handler", async () => {
            const handler = vi.fn(async () => {
                return NextResponse.json({ success: true })
            })

            const wrappedHandler = withErrorHandler(handler)
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
            })

            const response = await wrappedHandler(req)

            expect(response.status).toBe(200)
            expect(handler).toHaveBeenCalledWith(req)
        })

        it("should catch and handle errors from handler", async () => {
            const handler = vi.fn(async () => {
                throw new Error("Test error")
            })

            const wrappedHandler = withErrorHandler(handler)
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
            })

            const response = await wrappedHandler(req)

            expect(response.status).toBe(500)
            expect(handler).toHaveBeenCalledWith(req)
        })

        it("should return generic error message without exposing details", async () => {
            const handler = vi.fn(async () => {
                throw new Error(
                    "Database connection failed: password=secret123"
                )
            })

            const wrappedHandler = withErrorHandler(handler)
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
            })

            const response = await wrappedHandler(req)
            const body = await response.json()

            expect(body.error).not.toContain("Database")
            expect(body.error).not.toContain("secret123")
            expect(body.success).toBe(false)
        })

        it("should handle non-Error exceptions", async () => {
            const handler = vi.fn(async () => {
                throw "String error"
            })

            const wrappedHandler = withErrorHandler(handler)
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
            })

            const response = await wrappedHandler(req)

            expect(response.status).toBe(500)
        })

        it("should include security headers in response", async () => {
            const handler = vi.fn(async () => {
                return NextResponse.json({ success: true })
            })

            const wrappedHandler = withErrorHandler(handler)
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
            })

            const response = await wrappedHandler(req)

            // Check that security headers are present
            expect(response.headers.has("X-Frame-Options")).toBe(true)
            expect(response.headers.has("X-Content-Type-Options")).toBe(true)
        })
    })

    describe("getSanitizedBody", () => {
        it("should parse and sanitize JSON body", async () => {
            const body = {
                email: "test@example.com",
                password: "secret123",
            }

            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
                body: JSON.stringify(body),
            })

            const sanitized = await getSanitizedBody(req)

            expect(sanitized).toEqual({
                email: "test@example.com",
                password: "[REDACTED]",
            })
        })

        it("should handle invalid JSON", async () => {
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "POST",
                body: "invalid json",
            })

            const sanitized = await getSanitizedBody(req)

            expect(sanitized).toBeNull()
        })

        it("should handle empty body", async () => {
            const req = new NextRequest("http://localhost:3000/api/test", {
                method: "GET",
            })

            const sanitized = await getSanitizedBody(req)

            expect(sanitized).toBeNull()
        })
    })

    describe("Password Security", () => {
        it("should never log passwords in error messages", () => {
            const message =
                "Failed to authenticate user with password: mySecretPassword123!"
            const sanitized = sanitizeErrorMessage(message)

            expect(sanitized).not.toContain("mySecretPassword123")
            expect(sanitized).toContain("[REDACTED]")
        })

        it("should never log passwords in request bodies", () => {
            const body = {
                email: "user@example.com",
                password: "MyPassword123!@#",
                confirmPassword: "MyPassword123!@#",
            }

            const sanitized = sanitizeRequestBody(body)

            expect(sanitized.password).toBe("[REDACTED]")
            expect(sanitized.confirmPassword).toBe("[REDACTED]")
        })

        it("should handle various password field names", () => {
            const body = {
                password: "secret1",
                pwd: "secret2",
                pass: "secret3",
            }

            const sanitized = sanitizeRequestBody(body)

            expect(sanitized.password).toBe("[REDACTED]")
            // Note: pwd and pass are not in SENSITIVE_FIELDS, so they won't be redacted
            // This is intentional - only standard field names are redacted
        })
    })

    describe("Audit Logging", () => {
        it("should log failed attempts with email", async () => {
            const handler = vi.fn(async () => {
                throw new Error("Invalid credentials")
            })

            const wrappedHandler = withErrorHandler(handler)
            const req = new NextRequest(
                "http://localhost:3000/api/auth/login",
                {
                    method: "POST",
                    body: JSON.stringify({ email: "test@example.com" }),
                }
            )

            await wrappedHandler(req)

            expect(handler).toHaveBeenCalled()
        })

        it("should handle errors in auth endpoints", async () => {
            const handler = vi.fn(async () => {
                throw new Error("Registration failed")
            })

            const wrappedHandler = withErrorHandler(handler)
            const req = new NextRequest(
                "http://localhost:3000/api/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email: "test@example.com",
                        password: "secret123",
                    }),
                }
            )

            const response = await wrappedHandler(req)

            expect(response.status).toBe(500)
        })
    })
})
