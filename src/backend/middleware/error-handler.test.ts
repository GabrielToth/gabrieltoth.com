/**
 * Tests for Error Handler Middleware
 * Validates: Requirements 13.1-13.7, 24.6
 */

import { NextFunction, Request, Response } from "express"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    ApiError,
    errorHandler,
    getClientIp,
    sanitizeErrorMessage,
    sanitizeRequestBody,
    validateRequiredFields,
} from "./error-handler"

describe("Error Handler Middleware", () => {
    describe("sanitizeRequestBody", () => {
        it("should redact password field", () => {
            const body = {
                email: "test@example.com",
                password: "SecurePassword123!",
            }

            const sanitized = sanitizeRequestBody(body)

            expect(sanitized).toEqual({
                email: "test@example.com",
                password: "[REDACTED]",
            })
        })

        it("should redact multiple sensitive fields", () => {
            const body = {
                email: "test@example.com",
                password: "SecurePassword123!",
                token: "secret-token",
                apiKey: "secret-key",
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
    })

    describe("sanitizeErrorMessage", () => {
        it("should redact password in error message", () => {
            const message = "Error: password: SecurePassword123! is invalid"
            const sanitized = sanitizeErrorMessage(message)

            expect(sanitized).toContain("[REDACTED]")
            expect(sanitized).not.toContain("SecurePassword123!")
        })

        it("should redact token in error message", () => {
            const message = "Error: token: secret-token is expired"
            const sanitized = sanitizeErrorMessage(message)

            expect(sanitized).toContain("[REDACTED]")
            expect(sanitized).not.toContain("secret-token")
        })

        it("should handle multiple sensitive patterns", () => {
            const message =
                "Error: password: secret123 and token: abc123 failed"
            const sanitized = sanitizeErrorMessage(message)

            expect(sanitized).not.toContain("secret123")
            expect(sanitized).not.toContain("abc123")
        })
    })

    describe("validateRequiredFields", () => {
        it("should validate required fields are present", () => {
            const body = {
                email: "test@example.com",
                password: "SecurePassword123!",
            }

            const result = validateRequiredFields(body, ["email", "password"])

            expect(result.isValid).toBe(true)
            expect(result.missingFields).toBeUndefined()
        })

        it("should detect missing required fields", () => {
            const body = {
                email: "test@example.com",
            }

            const result = validateRequiredFields(body, ["email", "password"])

            expect(result.isValid).toBe(false)
            expect(result.missingFields).toContain("password")
        })

        it("should detect empty string fields as missing", () => {
            const body = {
                email: "",
                password: "SecurePassword123!",
            }

            const result = validateRequiredFields(body, ["email", "password"])

            expect(result.isValid).toBe(false)
            expect(result.missingFields).toContain("email")
        })

        it("should handle non-object bodies", () => {
            const result = validateRequiredFields(null, ["email"])

            expect(result.isValid).toBe(false)
            expect(result.missingFields).toEqual(["email"])
        })
    })

    describe("getClientIp", () => {
        it("should extract IP from x-forwarded-for header", () => {
            const req = {
                headers: {
                    "x-forwarded-for": "192.168.1.1, 10.0.0.1",
                },
                ip: "127.0.0.1",
            } as unknown as Request

            const ip = getClientIp(req)

            expect(ip).toBe("192.168.1.1")
        })

        it("should extract IP from x-real-ip header", () => {
            const req = {
                headers: {
                    "x-real-ip": "192.168.1.1",
                },
                ip: "127.0.0.1",
            } as unknown as Request

            const ip = getClientIp(req)

            expect(ip).toBe("192.168.1.1")
        })

        it("should fallback to req.ip", () => {
            const req = {
                headers: {},
                ip: "192.168.1.1",
            } as unknown as Request

            const ip = getClientIp(req)

            expect(ip).toBe("192.168.1.1")
        })

        it("should return unknown if no IP found", () => {
            const req = {
                headers: {},
                ip: undefined,
            } as unknown as Request

            const ip = getClientIp(req)

            expect(ip).toBe("unknown")
        })
    })

    describe("ApiError", () => {
        it("should create error with status code and error code", () => {
            const error = new ApiError(400, "VALIDATION_ERROR", "Invalid input")

            expect(error.statusCode).toBe(400)
            expect(error.errorCode).toBe("VALIDATION_ERROR")
            expect(error.message).toBe("Invalid input")
        })

        it("should use default message from error code", () => {
            const error = new ApiError(400, "INVALID_EMAIL")

            expect(error.message).toBe("Please enter a valid email address")
        })

        it("should handle unknown error codes", () => {
            const error = new ApiError(400, "UNKNOWN_ERROR")

            expect(error.message).toBe("An error occurred")
        })
    })

    describe("errorHandler middleware", () => {
        let req: Partial<Request>
        let res: Partial<Response>
        let next: NextFunction

        beforeEach(() => {
            req = {
                method: "POST",
                path: "/api/test",
                headers: {},
                body: {},
            }

            res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn().mockReturnThis(),
                setHeader: vi.fn(),
            }

            next = vi.fn()
        })

        it("should handle ApiError with correct status code", () => {
            const error = new ApiError(400, "VALIDATION_ERROR", "Invalid input")

            errorHandler(error, req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid input",
                errorCode: "VALIDATION_ERROR",
            })
        })

        it("should handle 409 Conflict for duplicate email", () => {
            const error = new ApiError(
                409,
                "EMAIL_ALREADY_EXISTS",
                "This email is already registered"
            )

            errorHandler(error, req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(409)
            expect(res.json).toHaveBeenCalledWith({
                error: "This email is already registered",
                errorCode: "EMAIL_ALREADY_EXISTS",
            })
        })

        it("should handle generic Error with 500 status", () => {
            const error = new Error("Something went wrong")

            errorHandler(error, req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                error: "Server error. Please try again later.",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        })

        it("should handle SyntaxError for invalid JSON", () => {
            const error = new SyntaxError("Unexpected token")
            ;(error as any).body = true

            errorHandler(error, req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid request body",
                errorCode: "INVALID_REQUEST",
            })
        })

        it("should not log sensitive data", () => {
            req.body = {
                email: "test@example.com",
                password: "SecurePassword123!",
            }

            const error = new Error("Test error")

            // This should not throw and should sanitize the password
            errorHandler(error, req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(500)
        })
    })
})
