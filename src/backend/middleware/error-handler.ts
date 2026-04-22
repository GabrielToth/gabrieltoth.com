/**
 * Error Handler Middleware for Express API Routes
 * Validates: Requirements 13.1-13.7, 24.6
 *
 * Provides centralized error handling for all API endpoints:
 * - Catches and logs errors
 * - Converts technical errors to user-friendly messages
 * - Ensures passwords are never logged
 * - Maintains consistent error response format
 * - Returns appropriate HTTP status codes
 */

import { NextFunction, Request, Response } from "express"
import { createLogger } from "../../lib/logger"

const logger = createLogger("ErrorHandler")

/**
 * Sensitive fields that should never be logged
 */
const SENSITIVE_FIELDS = [
    "password",
    "confirmPassword",
    "token",
    "refreshToken",
    "accessToken",
    "apiKey",
    "secret",
    "creditCard",
    "ssn",
]

/**
 * Sanitize request body to remove sensitive data
 * Requirement 13.1-13.7: Ensure passwords are never logged
 */
export function sanitizeRequestBody(body: unknown): unknown {
    if (!body || typeof body !== "object") {
        return body
    }

    const sanitized = { ...body }

    for (const field of SENSITIVE_FIELDS) {
        if (field in sanitized) {
            ;(sanitized as Record<string, unknown>)[field] = "[REDACTED]"
        }
    }

    return sanitized
}

/**
 * Sanitize error message to remove sensitive data
 */
export function sanitizeErrorMessage(message: string): string {
    let sanitized = message

    // Remove common sensitive patterns
    sanitized = sanitized.replace(
        /password[:\s]*[^\s,;]*/gi,
        "password: [REDACTED]"
    )
    sanitized = sanitized.replace(/token[:\s]*[^\s,;]*/gi, "token: [REDACTED]")
    sanitized = sanitized.replace(
        /secret[:\s]*[^\s,;]*/gi,
        "secret: [REDACTED]"
    )
    sanitized = sanitized.replace(
        /api[_-]?key[:\s]*[^\s,;]*/gi,
        "api_key: [REDACTED]"
    )

    return sanitized
}

/**
 * Get client IP address from request
 * Handles X-Forwarded-For header for proxied requests
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"]
    if (forwarded) {
        const ips = Array.isArray(forwarded)
            ? forwarded[0]
            : forwarded.split(",")[0]
        return ips.trim()
    }

    return req.headers["x-real-ip"] || req.ip || "unknown"
}

/**
 * User-friendly error messages for common errors
 */
const ERROR_MESSAGES: Record<string, string> = {
    INVALID_EMAIL: "Please enter a valid email address",
    EMAIL_ALREADY_EXISTS: "This email is already registered",
    INVALID_PASSWORD:
        "Password must contain at least 8 characters, 1 uppercase letter, 1 number, and 1 special character",
    PASSWORDS_DONT_MATCH: "Passwords do not match",
    INVALID_NAME: "Full name must contain at least 2 characters",
    INVALID_BIRTH_DATE: "Please enter a valid date (DD/MM/YYYY)",
    USER_TOO_YOUNG: "You must be at least 13 years old to register",
    INVALID_PHONE: "Please enter a valid phone number",
    GOOGLE_AUTH_FAILED: "Google authorization failed. Please try again.",
    ACCOUNT_CREATION_FAILED: "Account creation failed. Please try again.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    SERVER_ERROR: "Server error. Please try again later.",
    RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later.",
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public errorCode: string,
        message?: string
    ) {
        super(message || ERROR_MESSAGES[errorCode] || "An error occurred")
        this.name = "ApiError"
    }
}

/**
 * Error handler middleware for Express
 * Requirement 13.1-13.7, 24.6
 *
 * Usage:
 * ```typescript
 * app.use(errorHandler)
 * ```
 */
export function errorHandler(
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Get client IP for audit logging
    const clientIp = getClientIp(req)

    // Extract email from request body if available
    let email: string | undefined
    try {
        if (req.method === "POST" || req.method === "PUT") {
            email = (req.body as Record<string, unknown>)?.email as string
        }
    } catch {
        // Ignore errors
    }

    // Log the error with sanitized data
    const sanitizedError = sanitizeErrorMessage(
        err instanceof Error ? err.message : String(err)
    )

    logger.error(`API error in ${req.path}`, {
        context: "ErrorHandler",
        error: err instanceof Error ? err : new Error(String(err)),
        data: {
            method: req.method,
            pathname: req.path,
            email,
            ip: clientIp,
            errorMessage: sanitizedError,
        },
    })

    // Handle ApiError
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            error: err.message,
            errorCode: err.errorCode,
        })
        return
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
        res.status(400).json({
            error: "Validation failed",
            errorCode: "VALIDATION_ERROR",
            details: err.message,
        })
        return
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({
            error: "Invalid request body",
            errorCode: "INVALID_REQUEST",
        })
        return
    }

    // Handle unexpected errors
    res.status(500).json({
        error: ERROR_MESSAGES.SERVER_ERROR,
        errorCode: "INTERNAL_SERVER_ERROR",
    })
}

/**
 * Async error handler wrapper for route handlers
 * Catches async errors that might not be caught by try-catch
 */
export function asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(handler(req, res, next)).catch(next)
    }
}

/**
 * Validate request has required fields
 * Requirement 13.1-13.7: Validation errors
 */
export function validateRequiredFields(
    body: unknown,
    requiredFields: string[]
): { isValid: boolean; missingFields?: string[] } {
    if (!body || typeof body !== "object") {
        return {
            isValid: false,
            missingFields: requiredFields,
        }
    }

    const bodyObj = body as Record<string, unknown>
    const missingFields = requiredFields.filter(
        field => !bodyObj[field] || bodyObj[field] === ""
    )

    if (missingFields.length > 0) {
        return {
            isValid: false,
            missingFields,
        }
    }

    return { isValid: true }
}
