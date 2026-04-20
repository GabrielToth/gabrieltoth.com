/**
 * Error Handling Utilities for Authentication System
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 *
 * Provides centralized error handling for all API endpoints:
 * - Generic error messages that don't expose technical details
 * - Appropriate HTTP status codes
 * - Server-side error logging
 * - Consistent error response format
 */

import { logger } from "@/lib/logger"
import { getSecurityHeaders } from "@/lib/middleware/security-headers"
import { NextResponse } from "next/server"

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
    success: false
    error: string
    field?: string
}

/**
 * Standard API success response format
 */
export interface ApiSuccessResponse<T = unknown> {
    success: true
    message?: string
    data?: T
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Error types for authentication system
 */
export enum AuthErrorType {
    // Validation errors (400)
    INVALID_EMAIL = "INVALID_EMAIL",
    INVALID_PASSWORD = "INVALID_PASSWORD",
    PASSWORDS_MISMATCH = "PASSWORDS_MISMATCH",
    INVALID_NAME = "INVALID_NAME",
    FIELD_TOO_LONG = "FIELD_TOO_LONG",
    REQUIRED_FIELD_EMPTY = "REQUIRED_FIELD_EMPTY",
    INVALID_INPUT = "INVALID_INPUT",

    // Authentication errors (401)
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    INVALID_SESSION = "INVALID_SESSION",
    UNAUTHORIZED = "UNAUTHORIZED",

    // Rate limiting errors (429)
    TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",

    // Conflict errors (409)
    EMAIL_ALREADY_REGISTERED = "EMAIL_ALREADY_REGISTERED",
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",

    // Token errors (400)
    INVALID_TOKEN = "INVALID_TOKEN",
    EXPIRED_TOKEN = "EXPIRED_TOKEN",
    MISSING_TOKEN = "MISSING_TOKEN",

    // Server errors (500)
    DATABASE_ERROR = "DATABASE_ERROR",
    EMAIL_SERVICE_ERROR = "EMAIL_SERVICE_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * User-friendly error messages
 * Requirement 15.1, 15.2, 15.3, 15.4, 15.5
 */
const ERROR_MESSAGES: Record<AuthErrorType, string> = {
    // Validation errors
    [AuthErrorType.INVALID_EMAIL]: "Invalid email format",
    [AuthErrorType.INVALID_PASSWORD]:
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
    [AuthErrorType.PASSWORDS_MISMATCH]: "Passwords do not match",
    [AuthErrorType.INVALID_NAME]:
        "Name can only contain letters, spaces, hyphens, and apostrophes",
    [AuthErrorType.FIELD_TOO_LONG]:
        "Field exceeds maximum length of 255 characters",
    [AuthErrorType.REQUIRED_FIELD_EMPTY]: "This field is required",
    [AuthErrorType.INVALID_INPUT]: "Invalid input provided",

    // Authentication errors
    [AuthErrorType.INVALID_CREDENTIALS]: "Invalid email or password",
    [AuthErrorType.EMAIL_NOT_VERIFIED]:
        "Please verify your email before logging in",
    [AuthErrorType.SESSION_EXPIRED]:
        "Your session has expired. Please log in again",
    [AuthErrorType.INVALID_SESSION]: "Invalid session",
    [AuthErrorType.UNAUTHORIZED]: "Unauthorized",

    // Rate limiting errors
    [AuthErrorType.TOO_MANY_ATTEMPTS]:
        "Too many login attempts. Please try again later",
    [AuthErrorType.ACCOUNT_LOCKED]:
        "Too many login attempts. Please try again in 15 minutes",

    // Conflict errors
    [AuthErrorType.EMAIL_ALREADY_REGISTERED]: "Email already registered",
    [AuthErrorType.USER_ALREADY_EXISTS]: "User already exists",

    // Token errors
    [AuthErrorType.INVALID_TOKEN]: "Invalid verification token",
    [AuthErrorType.EXPIRED_TOKEN]: "Verification link has expired",
    [AuthErrorType.MISSING_TOKEN]: "Verification token is missing",

    // Server errors
    [AuthErrorType.DATABASE_ERROR]: "An error occurred. Please try again later",
    [AuthErrorType.EMAIL_SERVICE_ERROR]:
        "An error occurred. Please try again later",
    [AuthErrorType.INTERNAL_ERROR]: "An error occurred. Please try again later",
}

/**
 * HTTP status codes for error types
 */
const ERROR_STATUS_CODES: Record<AuthErrorType, number> = {
    // Validation errors (400)
    [AuthErrorType.INVALID_EMAIL]: 400,
    [AuthErrorType.INVALID_PASSWORD]: 400,
    [AuthErrorType.PASSWORDS_MISMATCH]: 400,
    [AuthErrorType.INVALID_NAME]: 400,
    [AuthErrorType.FIELD_TOO_LONG]: 400,
    [AuthErrorType.REQUIRED_FIELD_EMPTY]: 400,
    [AuthErrorType.INVALID_INPUT]: 400,
    [AuthErrorType.INVALID_TOKEN]: 400,
    [AuthErrorType.EXPIRED_TOKEN]: 400,
    [AuthErrorType.MISSING_TOKEN]: 400,

    // Authentication errors (401)
    [AuthErrorType.INVALID_CREDENTIALS]: 401,
    [AuthErrorType.EMAIL_NOT_VERIFIED]: 401,
    [AuthErrorType.SESSION_EXPIRED]: 401,
    [AuthErrorType.INVALID_SESSION]: 401,
    [AuthErrorType.UNAUTHORIZED]: 401,

    // Conflict errors (409)
    [AuthErrorType.EMAIL_ALREADY_REGISTERED]: 409,
    [AuthErrorType.USER_ALREADY_EXISTS]: 409,

    // Rate limiting errors (429)
    [AuthErrorType.TOO_MANY_ATTEMPTS]: 429,
    [AuthErrorType.ACCOUNT_LOCKED]: 429,

    // Server errors (500)
    [AuthErrorType.DATABASE_ERROR]: 500,
    [AuthErrorType.EMAIL_SERVICE_ERROR]: 500,
    [AuthErrorType.INTERNAL_ERROR]: 500,
}

/**
 * Create an error response with appropriate status code and message
 * Requirement 15.1, 15.2, 15.3, 15.4, 15.5
 *
 * @param errorType - The type of error
 * @param field - Optional field name that caused the error (for validation errors)
 * @param customMessage - Optional custom message to override default
 * @returns NextResponse with error details
 */
export function createErrorResponse(
    errorType: AuthErrorType,
    field?: string,
    customMessage?: string
): NextResponse<ApiErrorResponse> {
    const message = customMessage || ERROR_MESSAGES[errorType]
    const statusCode = ERROR_STATUS_CODES[errorType]

    const response: ApiErrorResponse = {
        success: false,
        error: message,
    }

    if (field) {
        response.field = field
    }

    return NextResponse.json(response, {
        status: statusCode,
        headers: getSecurityHeaders(),
    })
}

/**
 * Create a success response
 *
 * @param data - Optional data to include in response
 * @param message - Optional success message
 * @returns NextResponse with success details
 */
export function createSuccessResponse<T = unknown>(
    data?: T,
    message?: string
): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
        success: true,
    }

    if (message) {
        response.message = message
    }

    if (data !== undefined) {
        response.data = data
    }

    return NextResponse.json(response, {
        status: 200,
        headers: getSecurityHeaders(),
    })
}

/**
 * Handle unexpected errors with logging
 * Requirement 15.6
 *
 * @param error - The error that occurred
 * @param context - Context information for logging
 * @param endpoint - The API endpoint where error occurred
 * @returns NextResponse with generic error message
 */
export function handleUnexpectedError(
    error: unknown,
    context: string,
    endpoint: string
): NextResponse<ApiErrorResponse> {
    // Log error with full details for debugging
    // Requirement 15.6
    logger.error(`Unexpected error in ${endpoint}`, {
        context,
        error: error as Error,
        data: {
            endpoint,
            timestamp: new Date().toISOString(),
        },
    })

    // Return generic error message to client
    // Never expose technical details
    // Requirement 15.1
    return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
}

/**
 * Log validation error
 * Requirement 15.6
 *
 * @param field - Field that failed validation
 * @param value - Value that failed (sanitized for logging)
 * @param reason - Reason for validation failure
 * @param context - Context information
 */
export function logValidationError(
    field: string,
    value: string,
    reason: string,
    context: string
): void {
    logger.warn(`Validation error: ${field}`, {
        context,
        data: {
            field,
            reason,
            valueLength: value.length,
            timestamp: new Date().toISOString(),
        },
    })
}

/**
 * Log authentication error
 * Requirement 15.6
 *
 * @param errorType - Type of authentication error
 * @param email - User email (if available)
 * @param ip - Client IP address
 * @param context - Context information
 */
export function logAuthError(
    errorType: AuthErrorType,
    email: string | undefined,
    ip: string,
    context: string
): void {
    logger.warn(`Authentication error: ${errorType}`, {
        context,
        data: {
            errorType,
            email,
            ip,
            timestamp: new Date().toISOString(),
        },
    })
}

/**
 * Check if error is a known authentication error type
 *
 * @param error - Error to check
 * @returns True if error is a known auth error type
 */
export function isAuthError(error: unknown): error is AuthErrorType {
    return (
        typeof error === "string" &&
        Object.values(AuthErrorType).includes(error as AuthErrorType)
    )
}
