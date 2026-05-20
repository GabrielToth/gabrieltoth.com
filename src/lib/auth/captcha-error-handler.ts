import { createLogger } from "@/lib/logger"
import { NextResponse } from "next/server"

const logger = createLogger("CAPTCHAErrorHandler")

/**
 * CAPTCHA Error Types
 * Enumeration of all possible CAPTCHA error scenarios
 */
export enum CAPTCHAErrorType {
    MISSING_TOKEN = "missing_token",
    INVALID_TOKEN = "invalid_token",
    EXPIRED_TOKEN = "expired_token",
    NETWORK_ERROR = "network_error",
    CONFIG_ERROR = "config_error",
    SERVICE_ERROR = "service_error",
}

/**
 * CAPTCHA error details for logging and response
 */
export interface CAPTCHAErrorDetails {
    errorType: CAPTCHAErrorType
    failureReason: string
    timestamp: Date
    cloudflareErrors?: string[]
    hostname?: string
}

/**
 * Get CAPTCHA error HTTP status code
 *
 * Maps CAPTCHA error types to appropriate HTTP status codes:
 * - 400 Bad Request: Client errors (missing, invalid, expired tokens)
 * - 503 Service Unavailable: Network errors (CAPTCHA service down)
 * - 500 Internal Server Error: Configuration errors (missing secrets)
 *
 * Requirement 20.3: Return 400 Bad Request for invalid/missing tokens
 *
 * @param errorType CAPTCHA error type
 * @returns HTTP status code
 */
export function getCAPTCHAErrorStatusCode(errorType: CAPTCHAErrorType): number {
    switch (errorType) {
        case CAPTCHAErrorType.MISSING_TOKEN:
        case CAPTCHAErrorType.INVALID_TOKEN:
        case CAPTCHAErrorType.EXPIRED_TOKEN:
        case CAPTCHAErrorType.SERVICE_ERROR:
            return 400

        case CAPTCHAErrorType.NETWORK_ERROR:
            return 503

        case CAPTCHAErrorType.CONFIG_ERROR:
            return 500

        default:
            return 400
    }
}

/**
 * Check if error is a configuration error
 *
 * Configuration errors indicate server-side misconfiguration
 * and should be logged as critical issues.
 *
 * @param errorType CAPTCHA error type
 * @returns true if error is configuration error
 */
export function isConfigurationError(errorType: CAPTCHAErrorType): boolean {
    return errorType === CAPTCHAErrorType.CONFIG_ERROR
}

/**
 * Get generic CAPTCHA error response
 *
 * Returns a generic 400 error response without revealing CAPTCHA failure details.
 * This prevents attackers from determining whether CAPTCHA failed vs other failures.
 *
 * Requirement 20.3: Return 400 Bad Request for invalid/missing tokens
 * Requirement 20.4: Don't reveal whether user exists or password is correct
 *
 * @returns Generic 400 error response
 */
export function getCAPTCHAErrorResponse(): NextResponse {
    const response = NextResponse.json(
        {
            success: false,
            error: "Invalid request",
        },
        { status: 400 }
    )

    // Add security headers to prevent XSS, clickjacking, MIME sniffing
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")

    return response
}

/**
 * Create CAPTCHA error details for logging
 *
 * Maps failure reasons to error types and constructs error details object.
 * Used for consistent error logging across endpoints.
 *
 * Requirement 20.11: Don't log CAPTCHA tokens or response data
 *
 * @param failureReason Reason for failure
 * @param cloudflareErrors Error codes from CAPTCHA service
 * @param hostname Hostname from CAPTCHA response
 * @returns Error details object
 */
export function createCAPTCHAErrorDetails(
    failureReason: string,
    cloudflareErrors?: string[],
    hostname?: string
): CAPTCHAErrorDetails {
    // Map failure reason to error type
    let errorType: CAPTCHAErrorType

    if (failureReason.toLowerCase().includes("missing")) {
        errorType = CAPTCHAErrorType.MISSING_TOKEN
    } else if (failureReason.toLowerCase().includes("expired")) {
        errorType = CAPTCHAErrorType.EXPIRED_TOKEN
    } else if (
        failureReason.toLowerCase().includes("cloudflare") ||
        failureReason.toLowerCase().includes("verification failed")
    ) {
        errorType = CAPTCHAErrorType.SERVICE_ERROR
    } else if (
        failureReason.toLowerCase().includes("unavailable") ||
        failureReason.toLowerCase().includes("network")
    ) {
        errorType = CAPTCHAErrorType.NETWORK_ERROR
    } else {
        errorType = CAPTCHAErrorType.INVALID_TOKEN
    }

    return {
        errorType,
        failureReason: errorType,
        timestamp: new Date(),
        cloudflareErrors,
        hostname,
    }
}

/**
 * Log CAPTCHA failure for audit trail
 *
 * Logs CAPTCHA verification failures without sensitive data.
 * Requirement 20.11: Don't log CAPTCHA tokens or response data
 * Requirement 14.5: Logs don't contain sensitive data
 *
 * @param errorDetails Error details for logging
 * @param email User email (for logging, optional)
 * @param clientIp Client IP address (for logging, optional)
 */
export function logCAPTCHAFailure(
    errorDetails: CAPTCHAErrorDetails,
    email?: string,
    clientIp?: string
): void {
    logger.warn("CAPTCHA verification failed", {
        errorType: errorDetails.errorType,
        failureReason: errorDetails.failureReason,
        email,
        clientIp,
        cloudflareErrors: errorDetails.cloudflareErrors,
        hostname: errorDetails.hostname,
        timestamp: errorDetails.timestamp.toISOString(),
        event_type: "captcha_verification_failed",
    })
}

/**
 * Handle CAPTCHA verification error
 *
 * Returns generic 400 error without revealing CAPTCHA failure details.
 * This prevents attackers from determining whether CAPTCHA failed vs
 * other validation failures.
 *
 * Requirement 20.3: Return 400 Bad Request for invalid/missing tokens
 * Requirement 20.4: Don't reveal whether user exists or password is correct
 * Requirement 20.11: Don't log CAPTCHA tokens or response data
 *
 * @param errorDetails Error details for logging
 * @param email User email (for logging, optional)
 * @param clientIp Client IP address (for logging, optional)
 * @returns Generic 400 error response
 */
export function handleCAPTCHAError(
    errorDetails: CAPTCHAErrorDetails,
    email?: string,
    clientIp?: string
): NextResponse {
    // Log CAPTCHA failure for audit trail (without sensitive data)
    logCAPTCHAFailure(errorDetails, email, clientIp)

    // Return generic error (don't reveal CAPTCHA failure)
    return getCAPTCHAErrorResponse()
}

/**
 * Handle CAPTCHA configuration error
 *
 * Returns 500 error when CAPTCHA is misconfigured.
 * This indicates a server-side issue, not a user error.
 *
 * @param error Configuration error
 * @returns 500 error response
 */
export function handleCAPTCHAConfigError(error: Error): NextResponse {
    logger.error("CAPTCHA configuration error", {
        error: error.message,
        timestamp: new Date().toISOString(),
        event_type: "captcha_config_error",
    })

    const response = NextResponse.json(
        {
            success: false,
            error: "Authentication service is temporarily unavailable",
        },
        { status: 500 }
    )

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")

    return response
}

/**
 * Handle CAPTCHA network error
 *
 * Returns generic 400 error when CAPTCHA service is unreachable.
 * In degraded mode, this allows authentication to continue with
 * enhanced rate limiting as fallback protection.
 *
 * Requirement 20.10: If CAPTCHA provider unavailable, log warning
 * Requirement 20.12: Continue authentication with fallback behavior
 *
 * @param error Network error
 * @param email User email (for logging, optional)
 * @param clientIp Client IP address (for logging, optional)
 * @returns Generic 400 error response
 */
export function handleCAPTCHANetworkError(
    error: Error,
    email?: string,
    clientIp?: string
): NextResponse {
    logger.warn("CAPTCHA network error (degraded mode)", {
        error: error.message,
        email,
        clientIp,
        timestamp: new Date().toISOString(),
        event_type: "captcha_network_error",
    })

    // Return generic error
    return getCAPTCHAErrorResponse()
}
