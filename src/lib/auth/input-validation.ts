/**
 * Input Validation Module
 * Provides comprehensive input validation and sanitization for login and authentication
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { logger } from "@/lib/logger"

/**
 * Validate email format
 * Requirement 2.1
 *
 * @param email - The email to validate
 * @returns Object with isValid flag and error message if invalid
 *
 * @example
 * validateEmail('user@example.com') // { isValid: true }
 * validateEmail('invalid-email') // { isValid: false, error: 'Invalid email format' }
 */
export function validateEmail(email: string): {
    isValid: boolean
    error?: string
} {
    if (!email || typeof email !== "string") {
        return { isValid: false, error: "Email is required" }
    }

    // Check length
    if (email.length > 255) {
        return { isValid: false, error: "Email must not exceed 255 characters" }
    }

    // Basic email validation regex (RFC 5322 simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
        return { isValid: false, error: "Invalid email format" }
    }

    return { isValid: true }
}

/**
 * Validate password format
 * Requirement 2.2
 *
 * @param password - The password to validate
 * @returns Object with isValid flag and error message if invalid
 *
 * @example
 * validatePassword('SecurePass123!') // { isValid: true }
 * validatePassword('') // { isValid: false, error: 'Password is required' }
 */
export function validatePassword(password: string): {
    isValid: boolean
    error?: string
} {
    if (!password || typeof password !== "string") {
        return { isValid: false, error: "Password is required" }
    }

    // Check if password is empty or only whitespace
    if (password.trim().length === 0) {
        return { isValid: false, error: "Password cannot be empty" }
    }

    // Check length (max 1024 characters to prevent buffer overflow)
    if (password.length > 1024) {
        return {
            isValid: false,
            error: "Password must not exceed 1024 characters",
        }
    }

    return { isValid: true }
}

/**
 * Validate CSRF token format
 * Requirement 2.3
 *
 * @param token - The CSRF token to validate
 * @returns Object with isValid flag and error message if invalid
 *
 * @example
 * validateCSRFToken('abc123...') // { isValid: true }
 * validateCSRFToken('invalid') // { isValid: false, error: 'Invalid token format' }
 */
export function validateCSRFToken(token: string): {
    isValid: boolean
    error?: string
} {
    if (!token || typeof token !== "string") {
        return { isValid: false, error: "CSRF token is required" }
    }

    // Token should be 64 characters (32 bytes in hex)
    if (token.length !== 64) {
        return { isValid: false, error: "Invalid token format" }
    }

    // Token should be valid hex
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return { isValid: false, error: "Invalid token format" }
    }

    return { isValid: true }
}

/**
 * Sanitize input to remove potentially malicious characters
 * Requirement 2.4
 *
 * @param input - The input to sanitize
 * @returns Sanitized input string
 *
 * @example
 * sanitizeInput('<script>alert("xss")</script>') // 'scriptalertxssscript'
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== "string") {
        return ""
    }

    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, "")

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, "")

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "")

    // Trim whitespace
    sanitized = sanitized.trim()

    return sanitized
}

/**
 * Validate request body structure
 * Requirement 2.5
 *
 * @param body - The request body to validate
 * @param allowedFields - Set of allowed field names
 * @returns Object with isValid flag and error message if invalid
 *
 * @example
 * validateRequestBody(body, new Set(['email', 'password']))
 */
export function validateRequestBody(
    body: unknown,
    allowedFields: Set<string>
): {
    isValid: boolean
    error?: string
} {
    // Check if body is an object
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return { isValid: false, error: "Request body must be a JSON object" }
    }

    const bodyObj = body as Record<string, unknown>

    // Check for extra fields (prevent injection)
    const providedFields = Object.keys(bodyObj)
    const hasExtraFields = providedFields.some(
        field => !allowedFields.has(field)
    )

    if (hasExtraFields) {
        return { isValid: false, error: "Invalid request fields" }
    }

    return { isValid: true }
}

/**
 * Validate login request body
 * Requirement 2.6
 *
 * @param body - The request body to validate
 * @returns Object with isValid flag and field-level errors
 *
 * @example
 * validateLoginRequest({ email: 'user@example.com', password: 'pass' })
 */
export function validateLoginRequest(body: unknown): {
    isValid: boolean
    errors: Record<string, string>
} {
    const errors: Record<string, string> = {}

    // Validate body structure
    const bodyValidation = validateRequestBody(
        body,
        new Set(["email", "password", "rememberMe", "csrfToken"])
    )

    if (!bodyValidation.isValid) {
        return { isValid: false, errors: { body: bodyValidation.error || "" } }
    }

    const bodyObj = body as Record<string, unknown>

    // Validate email
    if (typeof bodyObj.email !== "string") {
        errors.email = "Email is required"
    } else {
        const emailValidation = validateEmail(bodyObj.email)
        if (!emailValidation.isValid) {
            errors.email = emailValidation.error || "Invalid email"
        }
    }

    // Validate password
    if (typeof bodyObj.password !== "string") {
        errors.password = "Password is required"
    } else {
        const passwordValidation = validatePassword(bodyObj.password)
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.error || "Invalid password"
        }
    }

    // Validate rememberMe (optional, but if present must be boolean)
    if (
        bodyObj.rememberMe !== undefined &&
        typeof bodyObj.rememberMe !== "boolean"
    ) {
        errors.rememberMe = "Remember Me must be a boolean"
    }

    // Validate csrfToken (optional, but if present must be string)
    if (
        bodyObj.csrfToken !== undefined &&
        typeof bodyObj.csrfToken !== "string"
    ) {
        errors.csrfToken = "CSRF token must be a string"
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}

/**
 * Check if input contains SQL injection patterns
 * Requirement 2.4
 *
 * @param input - The input to check
 * @returns true if potential SQL injection detected, false otherwise
 *
 * @example
 * containsSQLInjectionPattern("' OR '1'='1") // true
 */
export function containsSQLInjectionPattern(input: string): boolean {
    if (!input || typeof input !== "string") {
        return false
    }

    // Common SQL injection patterns
    const sqlPatterns = [
        /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b)/i,
        /(-{2}|\/\*|\*\/|;)/,
        /('|")\s*(OR|AND)\s*('|")/i,
        /(xp_|sp_)/i,
    ]

    return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Check if input contains XSS patterns
 * Requirement 2.4
 *
 * @param input - The input to check
 * @returns true if potential XSS detected, false otherwise
 *
 * @example
 * containsXSSPattern('<script>alert("xss")</script>') // true
 */
export function containsXSSPattern(input: string): boolean {
    if (!input || typeof input !== "string") {
        return false
    }

    // Common XSS patterns
    const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /on\w+\s*=/gi,
        /javascript:/gi,
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi,
        /<img[^>]*on/gi,
    ]

    return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Validate request payload size
 * Requirement 2.5
 *
 * @param payload - The request payload
 * @param maxSizeKB - Maximum size in kilobytes (default: 10)
 * @returns true if payload size is acceptable, false otherwise
 *
 * @example
 * validatePayloadSize(payload, 10) // true if payload <= 10KB
 */
export function validatePayloadSize(
    payload: string,
    maxSizeKB: number = 10
): boolean {
    if (!payload || typeof payload !== "string") {
        return true
    }

    const sizeInBytes = Buffer.byteLength(payload, "utf8")
    const sizeInKB = sizeInBytes / 1024

    return sizeInKB <= maxSizeKB
}

/**
 * Log validation failure for security monitoring
 * Requirement 2.6
 *
 * @param fieldName - The field that failed validation
 * @param reason - The reason for validation failure
 * @param ipAddress - The client IP address
 *
 * @example
 * logValidationFailure('email', 'Invalid format', '192.168.1.1')
 */
export function logValidationFailure(
    fieldName: string,
    reason: string,
    ipAddress?: string
): void {
    logger.warn("Input validation failed", {
        context: "InputValidation",
        data: { fieldName, reason, ipAddress },
    })
}
