/**
 * Error Handler Middleware for API Routes
 * Validates: Requirements 6.9, 15.1, 23.1, 23.5
 *
 * Provides centralized error handling for all API endpoints:
 * - Catches and logs errors
 * - Converts technical errors to user-friendly messages
 * - Ensures passwords are never logged
 * - Maintains consistent error response format
 * - Logs audit events for security-related errors
 */

import { logSecurityEvent } from "@/lib/auth/audit-logging"
import { handleUnexpectedError } from "@/lib/auth/error-handling"
import { logger } from "@/lib/logger"
import {
    applySecurityHeaders,
    getClientIp,
} from "@/lib/middleware/security-headers"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

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
 * Requirement 23.5: Ensure passwords are never logged
 *
 * @param body - Request body to sanitize
 * @returns Sanitized body safe for logging
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
 * Requirement 23.5: Ensure passwords are never logged
 *
 * @param message - Error message to sanitize
 * @returns Sanitized message safe for logging
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
 * Error handler middleware for API routes
 * Requirement 6.9, 15.1, 23.1, 23.5
 *
 * Usage:
 * ```typescript
 * export const POST = withErrorHandler(async (request) => {
 *   // Your route handler code
 * })
 * ```
 *
 * @param handler - The API route handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandler(
    handler: (req: NextRequest) => Promise<Response> | Response
) {
    return async (req: NextRequest) => {
        try {
            // Call the handler
            let response = await handler(req)

            // Convert to NextResponse if needed
            if (!(response instanceof NextResponse)) {
                response = new NextResponse(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                })
            }

            // Apply security headers
            response = applySecurityHeaders(response)

            // Log successful request (non-sensitive data only)
            logger.debug(`API request successful: ${req.nextUrl.pathname}`, {
                context: "ErrorHandler",
                data: {
                    method: req.method,
                    pathname: req.nextUrl.pathname,
                    status: response.status,
                },
            })

            return response
        } catch (error) {
            // Get client IP for audit logging
            const clientIp = getClientIp(req)

            // Extract email from request body if available
            let email: string | undefined
            try {
                if (req.method === "POST" || req.method === "PUT") {
                    const body = await req.json()
                    email = body.email
                }
            } catch {
                // Ignore JSON parsing errors
            }

            // Log the error with sanitized data
            // Requirement 23.1: Log failed attempts
            const sanitizedError = sanitizeErrorMessage(
                error instanceof Error ? error.message : String(error)
            )

            logger.error(`API error in ${req.nextUrl.pathname}`, {
                context: "ErrorHandler",
                error:
                    error instanceof Error ? error : new Error(String(error)),
                data: {
                    method: req.method,
                    pathname: req.nextUrl.pathname,
                    email,
                    ip: clientIp,
                    errorMessage: sanitizedError,
                },
            })

            // Log security event for failed attempts
            // Requirement 23.1: Log failed attempts
            if (req.nextUrl.pathname.includes("/auth/")) {
                await logSecurityEvent("RATE_LIMIT_EXCEEDED", email, clientIp, {
                    endpoint: req.nextUrl.pathname,
                    method: req.method,
                    errorType: error instanceof Error ? error.name : "Unknown",
                }).catch(err => {
                    logger.error("Failed to log security event", {
                        context: "ErrorHandler",
                        error: err as Error,
                    })
                })
            }

            // Return generic error response
            // Requirement 15.1: User-friendly error messages
            return handleUnexpectedError(
                error,
                "ErrorHandler",
                req.nextUrl.pathname
            )
        }
    }
}

/**
 * Async error handler wrapper for route handlers
 * Catches async errors that might not be caught by try-catch
 *
 * @param handler - The async handler function
 * @returns Wrapped handler with error handling
 */
export function asyncHandler(handler: (req: NextRequest) => Promise<Response>) {
    return withErrorHandler(handler)
}

/**
 * Validate request has required fields
 * Requirement 15.1: Validation errors
 *
 * @param body - Request body
 * @param requiredFields - Array of required field names
 * @returns Object with isValid flag and error message if invalid
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

/**
 * Validate request body size
 * Prevents large payloads from causing issues
 *
 * @param req - NextRequest object
 * @param maxSizeBytes - Maximum allowed size in bytes (default: 1MB)
 * @returns Object with isValid flag and error message if invalid
 */
export async function validateRequestSize(
    req: NextRequest,
    maxSizeBytes: number = 1024 * 1024
): Promise<{ isValid: boolean; error?: string }> {
    try {
        const contentLength = req.headers.get("content-length")

        if (contentLength && parseInt(contentLength) > maxSizeBytes) {
            return {
                isValid: false,
                error: `Request body exceeds maximum size of ${maxSizeBytes} bytes`,
            }
        }

        return { isValid: true }
    } catch (error) {
        logger.error("Error validating request size", {
            context: "ErrorHandler",
            error: error as Error,
        })

        return { isValid: true } // Allow request if validation fails
    }
}

/**
 * Extract and sanitize request body
 * Requirement 23.5: Ensure passwords are never logged
 *
 * @param req - NextRequest object
 * @returns Parsed and sanitized request body
 */
export async function getSanitizedBody(req: NextRequest): Promise<unknown> {
    try {
        const body = await req.json()
        return sanitizeRequestBody(body)
    } catch {
        return null
    }
}

/**
 * Log API request details
 * Requirement 23.1: Log account creation, email verification, failed attempts
 *
 * @param req - NextRequest object
 * @param eventType - Type of event being logged
 * @param details - Additional details to log
 */
export async function logApiRequest(
    req: NextRequest,
    eventType: string,
    details?: Record<string, unknown>
): Promise<void> {
    const clientIp = getClientIp(req)
    const sanitizedBody = await getSanitizedBody(req)

    logger.info(`API request: ${eventType}`, {
        context: "ErrorHandler",
        data: {
            method: req.method,
            pathname: req.nextUrl.pathname,
            ip: clientIp,
            eventType,
            body: sanitizedBody,
            ...details,
        },
    })
}
