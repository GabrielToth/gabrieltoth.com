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
