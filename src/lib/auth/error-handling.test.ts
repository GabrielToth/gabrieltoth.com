/**
 * Unit Tests for Error Handling Utilities
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 */

import { logger } from "@/lib/logger"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    ApiErrorResponse,
    ApiSuccessResponse,
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
    isAuthError,
    logAuthError,
    logValidationError,
} from "./error-handling"

// Mock logger
vi.mock("@/lib/logger", () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}))

// Mock security headers
vi.mock("@/lib/middleware/security-headers", () => ({
    getSecurityHeaders: () => ({
        "Content-Security-Policy": "default-src 'self'",
        "X-Frame-Options": "DENY",
    }),
}))

describe("Error Handling Utilities", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("createErrorResponse", () => {
        it("should create validation error response with 400 status", async () => {
            // Requirement 15.5
            const response = createErrorResponse(
                AuthErrorType.INVALID_EMAIL,
                "email"
            )

            expect(response.status).toBe(400)

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
            expect(json.error).toBe("Invalid email format")
            expect(json.field).toBe("email")
        })

        it("should create authentication error response with 401 status", async () => {
            // Requirement 15.2
            const response = createErrorResponse(
                AuthErrorType.INVALID_CREDENTIALS
            )

            expect(response.status).toBe(401)

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
            expect(json.error).toBe("Invalid email or password")
            expect(json.field).toBeUndefined()
        })

        it("should create rate limiting error response with 429 status", async () => {
            // Requirement 15.3
            const response = createErrorResponse(
                AuthErrorType.TOO_MANY_ATTEMPTS
            )

            expect(response.status).toBe(429)

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
            expect(json.error).toBe(
                "Too many login attempts. Please try again later"
            )
        })

        it("should create conflict error response with 409 status", async () => {
            const response = createErrorResponse(
                AuthErrorType.EMAIL_ALREADY_REGISTERED
            )

            expect(response.status).toBe(409)

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
            expect(json.error).toBe("Email already registered")
        })

        it("should create server error response with 500 status", async () => {
            // Requirement 15.1
            const response = createErrorResponse(AuthErrorType.INTERNAL_ERROR)

            expect(response.status).toBe(500)

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
            expect(json.error).toBe("An error occurred. Please try again later")
        })

        it("should use custom message when provided", async () => {
            const customMessage = "Custom error message"
            const response = createErrorResponse(
                AuthErrorType.INVALID_EMAIL,
                "email",
                customMessage
            )

            const json = (await response.json()) as ApiErrorResponse
            expect(json.error).toBe(customMessage)
        })

        it("should include security headers in response", () => {
            const response = createErrorResponse(AuthErrorType.INVALID_EMAIL)

            expect(response.headers.get("Content-Security-Policy")).toBe(
                "default-src 'self'"
            )
            expect(response.headers.get("X-Frame-Options")).toBe("DENY")
        })

        it("should handle expired token error with 400 status", async () => {
            // Requirement 15.4
            const response = createErrorResponse(AuthErrorType.EXPIRED_TOKEN)

            expect(response.status).toBe(400)

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
            expect(json.error).toBe("Verification link has expired")
        })

        it("should handle password mismatch error", async () => {
            const response = createErrorResponse(
                AuthErrorType.PASSWORDS_MISMATCH,
                "confirmPassword"
            )

            expect(response.status).toBe(400)

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
            expect(json.error).toBe("Passwords do not match")
            expect(json.field).toBe("confirmPassword")
        })

        it("should handle account locked error", async () => {
            const response = createErrorResponse(AuthErrorType.ACCOUNT_LOCKED)

            expect(response.status).toBe(429)

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
            expect(json.error).toBe(
                "Too many login attempts. Please try again in 15 minutes"
            )
        })
    })

    describe("createSuccessResponse", () => {
        it("should create success response with data", async () => {
            const data = { userId: "123", email: "test@example.com" }
            const response = createSuccessResponse(data, "Success")

            expect(response.status).toBe(200)

            const json = (await response.json()) as ApiSuccessResponse<
                typeof data
            >
            expect(json.success).toBe(true)
            expect(json.message).toBe("Success")
            expect(json.data).toEqual(data)
        })

        it("should create success response without data", async () => {
            const response = createSuccessResponse(undefined, "Success")

            const json = (await response.json()) as ApiSuccessResponse
            expect(json.success).toBe(true)
            expect(json.message).toBe("Success")
            expect(json.data).toBeUndefined()
        })

        it("should create success response without message", async () => {
            const data = { userId: "123" }
            const response = createSuccessResponse(data)

            const json = (await response.json()) as ApiSuccessResponse<
                typeof data
            >
            expect(json.success).toBe(true)
            expect(json.message).toBeUndefined()
            expect(json.data).toEqual(data)
        })

        it("should include security headers in response", () => {
            const response = createSuccessResponse({ test: "data" })

            expect(response.headers.get("Content-Security-Policy")).toBe(
                "default-src 'self'"
            )
            expect(response.headers.get("X-Frame-Options")).toBe("DENY")
        })
    })

    describe("handleUnexpectedError", () => {
        it("should log error with full details", async () => {
            // Requirement 15.6
            const error = new Error("Database connection failed")
            const context = "Auth"
            const endpoint = "/api/auth/login"

            const response = handleUnexpectedError(error, context, endpoint)

            expect(logger.error).toHaveBeenCalledWith(
                `Unexpected error in ${endpoint}`,
                expect.objectContaining({
                    context,
                    error,
                    data: expect.objectContaining({
                        endpoint,
                        timestamp: expect.any(String),
                    }),
                })
            )

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
            expect(json.error).toBe("An error occurred. Please try again later")
        })

        it("should return generic error message without exposing technical details", async () => {
            // Requirement 15.1
            const error = new Error("SQL syntax error at line 42")
            const response = handleUnexpectedError(error, "Auth", "/api/test")

            const json = (await response.json()) as ApiErrorResponse
            expect(json.error).not.toContain("SQL")
            expect(json.error).not.toContain("line 42")
            expect(json.error).toBe("An error occurred. Please try again later")
        })

        it("should handle non-Error objects", async () => {
            const error = "String error"
            const response = handleUnexpectedError(
                error,
                "Auth",
                "/api/auth/register"
            )

            expect(logger.error).toHaveBeenCalled()

            const json = (await response.json()) as ApiErrorResponse
            expect(json.success).toBe(false)
        })
    })

    describe("logValidationError", () => {
        it("should log validation error with field details", () => {
            // Requirement 15.6
            const field = "email"
            const value = "invalid-email"
            const reason = "Invalid email format"
            const context = "Auth"

            logValidationError(field, value, reason, context)

            expect(logger.warn).toHaveBeenCalledWith(
                `Validation error: ${field}`,
                expect.objectContaining({
                    context,
                    data: expect.objectContaining({
                        field,
                        reason,
                        valueLength: value.length,
                        timestamp: expect.any(String),
                    }),
                })
            )
        })

        it("should not log actual value for security", () => {
            const field = "password"
            const value = "secret123"
            const reason = "Password too weak"

            logValidationError(field, value, reason, "Auth")

            const logCall = vi.mocked(logger.warn).mock.calls[0]
            const logData = logCall[1] as { data: { value?: string } }

            expect(logData.data.value).toBeUndefined()
        })
    })

    describe("logAuthError", () => {
        it("should log authentication error with details", () => {
            // Requirement 15.6
            const errorType = AuthErrorType.INVALID_CREDENTIALS
            const email = "test@example.com"
            const ip = "192.168.1.1"
            const context = "Auth"

            logAuthError(errorType, email, ip, context)

            expect(logger.warn).toHaveBeenCalledWith(
                `Authentication error: ${errorType}`,
                expect.objectContaining({
                    context,
                    data: expect.objectContaining({
                        errorType,
                        email,
                        ip,
                        timestamp: expect.any(String),
                    }),
                })
            )
        })

        it("should handle undefined email", () => {
            const errorType = AuthErrorType.SESSION_EXPIRED
            const ip = "192.168.1.1"

            logAuthError(errorType, undefined, ip, "Auth")

            expect(logger.warn).toHaveBeenCalledWith(
                `Authentication error: ${errorType}`,
                expect.objectContaining({
                    data: expect.objectContaining({
                        email: undefined,
                        ip,
                    }),
                })
            )
        })
    })

    describe("isAuthError", () => {
        it("should return true for valid auth error types", () => {
            expect(isAuthError(AuthErrorType.INVALID_EMAIL)).toBe(true)
            expect(isAuthError(AuthErrorType.INVALID_CREDENTIALS)).toBe(true)
            expect(isAuthError(AuthErrorType.TOO_MANY_ATTEMPTS)).toBe(true)
            expect(isAuthError(AuthErrorType.EXPIRED_TOKEN)).toBe(true)
        })

        it("should return false for invalid error types", () => {
            expect(isAuthError("INVALID_ERROR_TYPE")).toBe(false)
            expect(isAuthError(123)).toBe(false)
            expect(isAuthError(null)).toBe(false)
            expect(isAuthError(undefined)).toBe(false)
            expect(isAuthError({})).toBe(false)
        })
    })

    describe("Error Messages", () => {
        it("should not expose technical details in validation errors", async () => {
            // Requirement 15.1
            const response = createErrorResponse(AuthErrorType.INVALID_PASSWORD)
            const json = (await response.json()) as ApiErrorResponse

            expect(json.error).not.toContain("bcrypt")
            expect(json.error).not.toContain("hash")
            expect(json.error).not.toContain("database")
        })

        it("should not reveal which field is incorrect for authentication errors", async () => {
            // Requirement 15.2
            const response = createErrorResponse(
                AuthErrorType.INVALID_CREDENTIALS
            )
            const json = (await response.json()) as ApiErrorResponse

            expect(json.error).toBe("Invalid email or password")
            expect(json.error).not.toContain("email is incorrect")
            expect(json.error).not.toContain("password is incorrect")
        })

        it("should provide specific error messages for validation errors", async () => {
            // Requirement 15.5
            const emailResponse = createErrorResponse(
                AuthErrorType.INVALID_EMAIL,
                "email"
            )
            const emailJson = (await emailResponse.json()) as ApiErrorResponse

            expect(emailJson.error).toBe("Invalid email format")
            expect(emailJson.field).toBe("email")

            const passwordResponse = createErrorResponse(
                AuthErrorType.PASSWORDS_MISMATCH,
                "confirmPassword"
            )
            const passwordJson =
                (await passwordResponse.json()) as ApiErrorResponse

            expect(passwordJson.error).toBe("Passwords do not match")
            expect(passwordJson.field).toBe("confirmPassword")
        })
    })

    describe("HTTP Status Codes", () => {
        it("should return 400 for validation errors", () => {
            // Requirement 15.5
            expect(
                createErrorResponse(AuthErrorType.INVALID_EMAIL).status
            ).toBe(400)
            expect(
                createErrorResponse(AuthErrorType.INVALID_PASSWORD).status
            ).toBe(400)
            expect(
                createErrorResponse(AuthErrorType.PASSWORDS_MISMATCH).status
            ).toBe(400)
            expect(createErrorResponse(AuthErrorType.INVALID_NAME).status).toBe(
                400
            )
            expect(
                createErrorResponse(AuthErrorType.FIELD_TOO_LONG).status
            ).toBe(400)
        })

        it("should return 401 for authentication errors", () => {
            // Requirement 15.2
            expect(
                createErrorResponse(AuthErrorType.INVALID_CREDENTIALS).status
            ).toBe(401)
            expect(
                createErrorResponse(AuthErrorType.EMAIL_NOT_VERIFIED).status
            ).toBe(401)
            expect(
                createErrorResponse(AuthErrorType.SESSION_EXPIRED).status
            ).toBe(401)
            expect(createErrorResponse(AuthErrorType.UNAUTHORIZED).status).toBe(
                401
            )
        })

        it("should return 429 for rate limiting errors", () => {
            // Requirement 15.3
            expect(
                createErrorResponse(AuthErrorType.TOO_MANY_ATTEMPTS).status
            ).toBe(429)
            expect(
                createErrorResponse(AuthErrorType.ACCOUNT_LOCKED).status
            ).toBe(429)
        })

        it("should return 409 for conflict errors", () => {
            expect(
                createErrorResponse(AuthErrorType.EMAIL_ALREADY_REGISTERED)
                    .status
            ).toBe(409)
            expect(
                createErrorResponse(AuthErrorType.USER_ALREADY_EXISTS).status
            ).toBe(409)
        })

        it("should return 500 for server errors", () => {
            // Requirement 15.1
            expect(
                createErrorResponse(AuthErrorType.DATABASE_ERROR).status
            ).toBe(500)
            expect(
                createErrorResponse(AuthErrorType.EMAIL_SERVICE_ERROR).status
            ).toBe(500)
            expect(
                createErrorResponse(AuthErrorType.INTERNAL_ERROR).status
            ).toBe(500)
        })
    })
})
