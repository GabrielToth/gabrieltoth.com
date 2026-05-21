/**
 * Input Sanitization Functions
 * Provides comprehensive sanitization for user input across the authentication system
 * Validates: Requirements 1.5, 7.3, 12.1, 12.2, 12.3, 12.4
 */

/**
 * Sanitizes user input by removing HTML tags and dangerous characters
 * Requirement 1.5, 7.3, 12.1, 12.2
 *
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for database storage and display
 *
 * @example
 * sanitizeInput('<script>alert("XSS")</script>') // 'scriptalertXSSscript'
 * sanitizeInput('John & Jane') // 'John & Jane'
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

    return sanitized.trim()
}

/**
 * Sanitizes name field specifically
 * Requirement 7.3
 *
 * @param name - The name to sanitize
 * @returns Sanitized name
 *
 * @example
 * sanitizeName('John Doe') // 'John Doe'
 * sanitizeName('  John  Doe  ') // 'John Doe'
 */
export function sanitizeName(name: string): string {
    if (!name || typeof name !== "string") {
        return ""
    }

    // Remove HTML tags
    let sanitized = sanitizeInput(name)

    // Normalize whitespace (multiple spaces to single space)
    sanitized = sanitized.replace(/\s+/g, " ")

    return sanitized.trim()
}

/**
 * Sanitizes email field specifically
 * Requirement 7.3
 *
 * @param email - The email to sanitize
 * @returns Sanitized email (lowercase and trimmed)
 *
 * @example
 * sanitizeEmail('  John@Example.COM  ') // 'john@example.com'
 */
export function sanitizeEmail(email: string): string {
    if (!email || typeof email !== "string") {
        return ""
    }

    // Remove HTML tags
    let sanitized = sanitizeInput(email)

    // Convert to lowercase
    sanitized = sanitized.toLowerCase()

    return sanitized.trim()
}

/**
 * Escapes HTML characters for safe display
 * Requirement 12.3, 12.4
 *
 * Converts HTML special characters to their entity equivalents
 * to prevent XSS attacks when displaying user-generated content
 *
 * @param text - The text to escape
 * @returns HTML-escaped text safe for display
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function escapeHtml(text: string): string {
    if (!text || typeof text !== "string") {
        return ""
    }

    const htmlEscapeMap: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
    }

    return text.replace(/[&<>"'\/]/g, char => htmlEscapeMap[char] || char)
}

/**
 * Sanitizes password field
 * Requirement 7.3
 *
 * Removes HTML tags and control characters but preserves special characters
 * needed for password strength
 *
 * @param password - The password to sanitize
 * @returns Sanitized password
 *
 * @example
 * sanitizePassword('Pass@word123!') // 'Pass@word123!'
 * sanitizePassword('<script>Pass@word123!</script>') // 'scriptPass@word123!script'
 */
export function sanitizePassword(password: string): string {
    if (!password || typeof password !== "string") {
        return ""
    }

    // Remove HTML tags
    let sanitized = password.replace(/<[^>]*>/g, "")

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, "")

    // Remove control characters but keep special chars needed for passwords
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")

    return sanitized
}

/**
 * Sanitizes all registration form fields
 * Requirement 1.5, 7.3
 *
 * @param data - Object containing name, email, password, confirmPassword
 * @returns Object with sanitized fields
 *
 * @example
 * sanitizeRegistrationForm({
 *   name: '  John Doe  ',
 *   email: '  John@Example.COM  ',
 *   password: 'Pass@word123!',
 *   confirmPassword: 'Pass@word123!'
 * })
 * // {
 * //   name: 'John Doe',
 * //   email: 'john@example.com',
 * //   password: 'Pass@word123!',
 * //   confirmPassword: 'Pass@word123!'
 * // }
 */
export function sanitizeRegistrationForm(data: {
    name: string
    email: string
    password: string
    confirmPassword: string
}): {
    name: string
    email: string
    password: string
    confirmPassword: string
} {
    return {
        name: sanitizeName(data.name),
        email: sanitizeEmail(data.email),
        password: sanitizePassword(data.password),
        confirmPassword: sanitizePassword(data.confirmPassword),
    }
}

/**
 * Sanitizes all login form fields
 * Requirement 7.3
 *
 * @param data - Object containing email and password
 * @returns Object with sanitized fields
 *
 * @example
 * sanitizeLoginForm({
 *   email: '  John@Example.COM  ',
 *   password: 'Pass@word123!'
 * })
 * // {
 * //   email: 'john@example.com',
 * //   password: 'Pass@word123!'
 * // }
 */
export function sanitizeLoginForm(data: { email: string; password: string }): {
    email: string
    password: string
} {
    return {
        email: sanitizeEmail(data.email),
        password: sanitizePassword(data.password),
    }
}

/**
 * Sanitizes password reset form fields
 * Requirement 7.3
 *
 * @param data - Object containing password and confirmPassword
 * @returns Object with sanitized fields
 *
 * @example
 * sanitizePasswordResetForm({
 *   password: 'NewPass123!',
 *   confirmPassword: 'NewPass123!'
 * })
 * // {
 * //   password: 'NewPass123!',
 * //   confirmPassword: 'NewPass123!'
 * // }
 */
export function sanitizePasswordResetForm(data: {
    password: string
    confirmPassword: string
}): { password: string; confirmPassword: string } {
    return {
        password: sanitizePassword(data.password),
        confirmPassword: sanitizePassword(data.confirmPassword),
    }
}

/**
 * Sanitizes user identifier (email/username) to prevent injection attacks
 * Requirement 8.6
 *
 * Performs comprehensive validation and sanitization:
 * - Validates RFC 5322 compliant email format
 * - Trims whitespace
 * - Converts to lowercase for consistency
 * - Rejects suspicious patterns (SQL injection, XSS, etc.)
 * - Rejects emails with control characters
 * - Returns sanitized email or null if invalid
 *
 * @param identifier - The email or username to sanitize
 * @returns Sanitized identifier or null if invalid
 *
 * @example
 * sanitizeUserIdentifier('  User@Example.COM  ') // 'user@example.com'
 * sanitizeUserIdentifier("' OR '1'='1") // null (SQL injection pattern)
 * sanitizeUserIdentifier('<script>alert("xss")</script>') // null (XSS pattern)
 * sanitizeUserIdentifier('user@example.com\x00') // null (control character)
 */
export function sanitizeUserIdentifier(identifier: string): string | null {
    // Validate input type and basic checks
    if (!identifier || typeof identifier !== "string") {
        return null
    }

    // Trim whitespace
    let sanitized = identifier.trim()

    // Check for empty after trimming
    if (sanitized.length === 0) {
        return null
    }

    // Check length constraints (email max 254 characters per RFC 5321)
    if (sanitized.length > 254) {
        return null
    }

    // Check for control characters (0x00-0x1F, 0x7F)
    if (/[\x00-\x1F\x7F]/.test(sanitized)) {
        return null
    }

    // Check for null bytes explicitly
    if (sanitized.includes("\x00")) {
        return null
    }

    // Reject SQL injection patterns
    const sqlInjectionPatterns = [
        /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b)/i,
        /(-{2}|\/\*|\*\/|;)/,
        /('|")\s*(OR|AND)\s*('|")/i,
        /(xp_|sp_)/i,
        /'\s*OR\s*'/i,
        /"\s*OR\s*"/i,
    ]

    if (sqlInjectionPatterns.some(pattern => pattern.test(sanitized))) {
        return null
    }

    // Reject XSS patterns
    const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /on\w+\s*=/gi,
        /javascript:/gi,
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi,
        /<img[^>]*on/gi,
        /<svg[^>]*on/gi,
        /<body[^>]*on/gi,
        /<input[^>]*on/gi,
        /<form[^>]*on/gi,
        /<a[^>]*on/gi,
        /<div[^>]*on/gi,
        /<span[^>]*on/gi,
        /<button[^>]*on/gi,
    ]

    if (xssPatterns.some(pattern => pattern.test(sanitized))) {
        return null
    }

    // Reject LDAP injection patterns
    const ldapInjectionPatterns = [/[*()\\]/, /\|\s*\(/i, /&\s*\(/i]

    if (ldapInjectionPatterns.some(pattern => pattern.test(sanitized))) {
        return null
    }

    // Reject command injection patterns
    const commandInjectionPatterns = [/[;&|`$()]/, /\$\{/, /\$\(/, /`/]

    if (commandInjectionPatterns.some(pattern => pattern.test(sanitized))) {
        return null
    }

    // Validate email format (RFC 5322 simplified)
    // Local part: alphanumeric, dots, hyphens, underscores, plus signs
    // Domain: alphanumeric, dots, hyphens
    const emailRegex = /^[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

    if (!emailRegex.test(sanitized)) {
        return null
    }

    // Additional email validation checks
    // Check for consecutive dots
    if (sanitized.includes("..")) {
        return null
    }

    // Check for leading/trailing dots in local part
    const [localPart, domain] = sanitized.split("@")
    if (localPart.startsWith(".") || localPart.endsWith(".")) {
        return null
    }

    // Check for leading/trailing dots in domain
    if (domain.startsWith(".") || domain.endsWith(".")) {
        return null
    }

    // Check for leading/trailing hyphens in domain labels
    const domainLabels = domain.split(".")
    if (
        domainLabels.some(label => label.startsWith("-") || label.endsWith("-"))
    ) {
        return null
    }

    // Convert to lowercase for consistency
    sanitized = sanitized.toLowerCase()

    return sanitized
}
