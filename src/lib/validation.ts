/**
 * Input Validation Functions
 * Provides comprehensive validation for user input across the authentication system
 * Validates: Requirements 1.2, 1.3, 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 8.4, 4.7, 10.1, 10.4
 */

import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js"
import { isNotCommonPassword } from "./auth/common-passwords"

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

/**
 * Validates password strength requirements with detailed feedback
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 10.2, 10.3, 10.4
 *
 * Password must contain:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*()_+-=[]{};':"\\|,.<>/?)
 * - Must not be a common password
 *
 * @param password - The password to validate
 * @returns Object with detailed validation results including:
 *   - isValid: boolean indicating if password meets all requirements
 *   - error: user-friendly error message for the first unmet requirement
 *   - strength: password strength indicator ('weak', 'medium', 'strong')
 *   - requirements: object showing which requirements are met
 *
 * @example
 * validatePassword('ValidPass123!')
 * // {
 * //   isValid: true,
 * //   strength: 'strong',
 * //   requirements: {
 * //     minLength: true,
 * //     hasUppercase: true,
 * //     hasLowercase: true,
 * //     hasNumber: true,
 * //     hasSpecial: true,
 * //     notCommon: true
 * //   }
 * // }
 *
 * validatePassword('weak')
 * // {
 * //   isValid: false,
 * //   error: 'Password must be at least 8 characters',
 * //   strength: 'weak',
 * //   requirements: {
 * //     minLength: false,
 * //     hasUppercase: false,
 * //     hasLowercase: true,
 * //     hasNumber: false,
 * //     hasSpecial: false,
 * //     notCommon: true
 * //   }
 * // }
 */
export function validatePassword(password: string): {
    isValid: boolean
    error?: string
    strength?: "weak" | "medium" | "strong"
    requirements: {
        minLength: boolean
        hasUppercase: boolean
        hasLowercase: boolean
        hasNumber: boolean
        hasSpecial: boolean
        notCommon: boolean
    }
} {
    // Handle empty or invalid input
    if (!password || typeof password !== "string") {
        return {
            isValid: false,
            error: "Password is required",
            strength: "weak",
            requirements: {
                minLength: false,
                hasUppercase: false,
                hasLowercase: false,
                hasNumber: false,
                hasSpecial: false,
                notCommon: false,
            },
        }
    }

    // Check each requirement
    const requirements = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        notCommon: isNotCommonPassword(password),
    }

    // Determine if all requirements are met
    const isValid = Object.values(requirements).every(req => req === true)

    // Determine first unmet requirement for error message
    let error: string | undefined
    if (!requirements.minLength) {
        error = "Password must be at least 8 characters"
    } else if (!requirements.hasUppercase) {
        error = "Password must contain at least one uppercase letter"
    } else if (!requirements.hasLowercase) {
        error = "Password must contain at least one lowercase letter"
    } else if (!requirements.hasNumber) {
        error = "Password must contain at least one number"
    } else if (!requirements.hasSpecial) {
        error = "Password must contain at least one special character"
    } else if (!requirements.notCommon) {
        error = "Password is too common. Please choose a more unique password"
    }

    // Calculate password strength
    const metRequirements = Object.values(requirements).filter(
        req => req === true
    ).length
    let strength: "weak" | "medium" | "strong"

    if (metRequirements <= 2) {
        strength = "weak"
    } else if (metRequirements <= 4) {
        strength = "medium"
    } else {
        strength = "strong"
    }

    return {
        isValid,
        error,
        strength,
        requirements,
    }
}

/**
 * Validates name field format
 * Requirement 7.1, 8.3
 *
 * Name must contain only:
 * - Alphanumeric characters (A-Z, a-z, 0-9)
 * - Spaces
 * - Hyphens (-)
 * - Apostrophes (')
 *
 * @param name - The name to validate
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validateName('John Doe') // { isValid: true }
 * validateName("O'Brien") // { isValid: true }
 * validateName('John-Paul') // { isValid: true }
 * validateName('John@Doe') // { isValid: false, error: 'Name contains invalid characters' }
 */
export function validateName(name: string): {
    isValid: boolean
    error?: string
} {
    if (!name || typeof name !== "string") {
        return { isValid: false, error: "Name is required" }
    }

    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
        return { isValid: false, error: "Name is required" }
    }

    // Allow only alphanumeric, spaces, hyphens, and apostrophes
    const nameRegex = /^[A-Za-z0-9\s\-']+$/

    if (!nameRegex.test(trimmedName)) {
        return { isValid: false, error: "Name contains invalid characters" }
    }

    return { isValid: true }
}

/**
 * Validates field length constraint
 * Requirement 7.4, 8.4
 *
 * Ensures field does not exceed maximum length of 255 characters
 *
 * @param value - The value to validate
 * @param fieldName - The name of the field (for error message)
 * @param maxLength - Maximum allowed length (default: 255)
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validateFieldLength('John Doe', 'name') // { isValid: true }
 * validateFieldLength('a'.repeat(256), 'email') // { isValid: false, error: 'Email must not exceed 255 characters' }
 */
export function validateFieldLength(
    value: string,
    fieldName: string,
    maxLength: number = 255
): { isValid: boolean; error?: string } {
    if (!value || typeof value !== "string") {
        return { isValid: true } // Empty values are handled by other validators
    }

    if (value.length > maxLength) {
        return {
            isValid: false,
            error: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${maxLength} characters`,
        }
    }

    return { isValid: true }
}

/**
 * Validates that password and confirmPassword match
 * Requirement 1.7, 8.5
 *
 * @param password - The password
 * @param confirmPassword - The password confirmation
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validatePasswordMatch('ValidPass123!', 'ValidPass123!') // { isValid: true }
 * validatePasswordMatch('ValidPass123!', 'DifferentPass123!') // { isValid: false, error: 'Passwords do not match' }
 */
export function validatePasswordMatch(
    password: string,
    confirmPassword: string
): { isValid: boolean; error?: string } {
    if (!password || !confirmPassword) {
        return { isValid: false, error: "Both password fields are required" }
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: "Passwords do not match" }
    }

    return { isValid: true }
}

/**
 * Comprehensive registration form validation
 * Validates all fields together for registration
 *
 * @param data - Object containing name, email, password, confirmPassword
 * @returns Object with isValid boolean and errors object with field-specific errors
 *
 * @example
 * validateRegistrationForm({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'ValidPass123!',
 *   confirmPassword: 'ValidPass123!'
 * }) // { isValid: true, errors: {} }
 */
export function validateRegistrationForm(data: {
    name: string
    email: string
    password: string
    confirmPassword: string
}): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    // Validate name
    const nameValidation = validateName(data.name)
    if (!nameValidation.isValid) {
        errors.name = nameValidation.error || "Invalid name"
    }

    const nameLengthValidation = validateFieldLength(data.name, "name")
    if (!nameLengthValidation.isValid) {
        errors.name = nameLengthValidation.error || "Invalid name"
    }

    // Validate email
    const emailValidation = validateEmail(data.email)
    if (!emailValidation.isValid) {
        errors.email = emailValidation.error || "Invalid email"
    }

    const emailLengthValidation = validateFieldLength(data.email, "email")
    if (!emailLengthValidation.isValid) {
        errors.email = emailLengthValidation.error || "Invalid email"
    }

    // Validate password
    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error || "Invalid password"
    }

    const passwordLengthValidation = validateFieldLength(
        data.password,
        "password"
    )
    if (!passwordLengthValidation.isValid) {
        errors.password = passwordLengthValidation.error || "Invalid password"
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(
        data.password,
        data.confirmPassword
    )
    if (!passwordMatchValidation.isValid) {
        errors.confirmPassword =
            passwordMatchValidation.error || "Passwords do not match"
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}

/**
 * Comprehensive login form validation
 * Validates email and password for login
 *
 * @param data - Object containing email and password
 * @returns Object with isValid boolean and errors object with field-specific errors
 *
 * @example
 * validateLoginForm({
 *   email: 'john@example.com',
 *   password: 'ValidPass123!'
 * }) // { isValid: true, errors: {} }
 */
export function validateLoginForm(data: { email: string; password: string }): {
    isValid: boolean
    errors: Record<string, string>
} {
    const errors: Record<string, string> = {}

    // Validate email
    const emailValidation = validateEmail(data.email)
    if (!emailValidation.isValid) {
        errors.email = emailValidation.error || "Invalid email"
    }

    // Validate password exists
    if (!data.password || typeof data.password !== "string") {
        errors.password = "Password is required"
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}

/**
 * Comprehensive password reset form validation
 * Validates password and confirmPassword for password reset
 *
 * @param data - Object containing password and confirmPassword
 * @returns Object with isValid boolean and errors object with field-specific errors
 *
 * @example
 * validatePasswordResetForm({
 *   password: 'NewPass123!',
 *   confirmPassword: 'NewPass123!'
 * }) // { isValid: true, errors: {} }
 */
export function validatePasswordResetForm(data: {
    password: string
    confirmPassword: string
}): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    // Validate password
    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error || "Invalid password"
    }

    const passwordLengthValidation = validateFieldLength(
        data.password,
        "password"
    )
    if (!passwordLengthValidation.isValid) {
        errors.password = passwordLengthValidation.error || "Invalid password"
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(
        data.password,
        data.confirmPassword
    )
    if (!passwordMatchValidation.isValid) {
        errors.confirmPassword =
            passwordMatchValidation.error || "Passwords do not match"
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}

/**
 * Validates phone number format using international standards
 * Requirement 4.7, 10.1
 *
 * Supports international phone number formats with or without formatting characters
 * (spaces, hyphens, parentheses). Validates using libphonenumber-js library.
 *
 * @param phoneNumber - The phone number to validate
 * @param defaultCountry - Optional default country code (e.g., 'US', 'BR', 'UK')
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validatePhoneNumber('+1 (555) 123-4567') // { isValid: true }
 * validatePhoneNumber('(555) 123-4567', 'US') // { isValid: true }
 * validatePhoneNumber('+55 11 98765-4321') // { isValid: true }
 * validatePhoneNumber('invalid') // { isValid: false, error: 'Please enter a valid phone number' }
 */
export function validatePhoneNumber(
    phoneNumber: string,
    defaultCountry?: string
): {
    isValid: boolean
    error?: string
} {
    if (!phoneNumber || typeof phoneNumber !== "string") {
        return { isValid: false, error: "Phone number is required" }
    }

    const trimmedPhone = phoneNumber.trim()

    if (trimmedPhone.length === 0) {
        return { isValid: false, error: "Phone number is required" }
    }

    try {
        // Use libphonenumber-js to validate the phone number
        // If no country code is provided in the number, use the defaultCountry
        const isValid = isValidPhoneNumber(trimmedPhone, defaultCountry as any)

        if (!isValid) {
            return {
                isValid: false,
                error: "Please enter a valid phone number",
            }
        }

        return { isValid: true }
    } catch (error) {
        return {
            isValid: false,
            error: "Please enter a valid phone number",
        }
    }
}

/**
 * Normalizes phone number to E.164 format
 * Requirement 10.4
 *
 * Converts phone numbers in various formats to the standard E.164 format
 * (e.g., +1234567890). This format is used for storage and API communication.
 *
 * E.164 format: +[country code][number]
 * - Starts with + sign
 * - Followed by country code (1-3 digits)
 * - Followed by subscriber number (up to 12 digits)
 * - Total length: 15 digits maximum
 *
 * @param phoneNumber - The phone number to normalize
 * @param defaultCountry - Optional default country code (e.g., 'US', 'BR', 'UK')
 * @returns Object with normalized phone number in E.164 format or error
 *
 * @example
 * normalizePhoneNumber('+1 (555) 123-4567') // { normalized: '+15551234567' }
 * normalizePhoneNumber('(555) 123-4567', 'US') // { normalized: '+15551234567' }
 * normalizePhoneNumber('+55 11 98765-4321') // { normalized: '+5511987654321' }
 * normalizePhoneNumber('invalid') // { error: 'Invalid phone number format' }
 */
export function normalizePhoneNumber(
    phoneNumber: string,
    defaultCountry?: string
): {
    normalized?: string
    error?: string
} {
    if (!phoneNumber || typeof phoneNumber !== "string") {
        return { error: "Phone number is required" }
    }

    const trimmedPhone = phoneNumber.trim()

    if (trimmedPhone.length === 0) {
        return { error: "Phone number is required" }
    }

    try {
        // Parse the phone number using libphonenumber-js
        const parsed = parsePhoneNumber(trimmedPhone, defaultCountry as any)

        if (!parsed) {
            return { error: "Invalid phone number format" }
        }

        // Return the phone number in E.164 format
        const normalized = parsed.format("E.164")

        return { normalized }
    } catch (error) {
        return { error: "Invalid phone number format" }
    }
}

/**
 * Validates and normalizes phone number in one operation
 * Combines validation and normalization for convenience
 *
 * @param phoneNumber - The phone number to validate and normalize
 * @param defaultCountry - Optional default country code (e.g., 'US', 'BR', 'UK')
 * @returns Object with isValid, normalized phone number, and error message if invalid
 *
 * @example
 * validateAndNormalizePhoneNumber('+1 (555) 123-4567')
 * // { isValid: true, normalized: '+15551234567' }
 *
 * validateAndNormalizePhoneNumber('(555) 123-4567', 'US')
 * // { isValid: true, normalized: '+15551234567' }
 *
 * validateAndNormalizePhoneNumber('invalid')
 * // { isValid: false, error: 'Please enter a valid phone number' }
 */
export function validateAndNormalizePhoneNumber(
    phoneNumber: string,
    defaultCountry?: string
): {
    isValid: boolean
    normalized?: string
    error?: string
} {
    // First validate the phone number
    const validation = validatePhoneNumber(phoneNumber, defaultCountry)

    if (!validation.isValid) {
        return {
            isValid: false,
            error: validation.error,
        }
    }

    // Then normalize it
    const normalization = normalizePhoneNumber(phoneNumber, defaultCountry)

    if (normalization.error) {
        return {
            isValid: false,
            error: normalization.error,
        }
    }

    return {
        isValid: true,
        normalized: normalization.normalized,
    }
}
