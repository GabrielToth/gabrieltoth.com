/**
 * Email Validation Functions
 * Validates: Requirements 1.2, 7.2, 8.1
 */

/**
 * Validates email format according to RFC 5322 standard
 * Requirement 1.2, 7.2, 8.1
 *
 * @param email - The email address to validate
 * @returns Object with isValid boolean and error message if invalid
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

    const trimmedEmail = email.trim()

    // RFC 5322 simplified regex pattern
    // Matches: local-part@domain.extension
    // Local part: alphanumeric, dots, hyphens, underscores, plus signs
    // Domain: alphanumeric, dots, hyphens (but not starting or ending with hyphen)
    // Requires at least one dot in domain (TLD required)
    const emailRegex =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$/

    if (!emailRegex.test(trimmedEmail)) {
        return { isValid: false, error: "Invalid email format" }
    }

    // Additional validation: no consecutive dots, no leading/trailing dots in local part
    const [localPart, domain] = trimmedEmail.split("@")

    if (!localPart || !domain) {
        return { isValid: false, error: "Invalid email format" }
    }

    if (localPart.startsWith(".") || localPart.endsWith(".")) {
        return { isValid: false, error: "Invalid email format" }
    }

    if (localPart.includes("..")) {
        return { isValid: false, error: "Invalid email format" }
    }

    return { isValid: true }
}
