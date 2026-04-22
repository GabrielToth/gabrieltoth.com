/**
 * Account Completion Validation Module
 *
 * Provides validation functions for account completion flow fields:
 * - Password validation (strength requirements)
 * - Phone number validation (international format)
 * - Birth date validation (age and format)
 * - Email validation (format and uniqueness)
 * - Complete account data validation
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 6.1
 */

/**
 * Validate password strength requirements
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*)
 *
 * Validates: Requirement 5.1
 *
 * @param password - The password to validate
 * @returns Object with valid flag and array of error messages
 *
 * @example
 * validatePassword('weak') // { valid: false, errors: ['Password must be at least 8 characters', ...] }
 * validatePassword('SecurePass123!') // { valid: true, errors: [] }
 */
export function validatePassword(password: string): {
    valid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (!password) {
        errors.push("Password is required")
        return { valid: false, errors }
    }

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters")
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter")
    }

    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter")
    }

    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number")
    }

    if (!/[!@#$%^&*]/.test(password)) {
        errors.push(
            "Password must contain at least one special character (!@#$%^&*)"
        )
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Validate phone number format
 *
 * Accepts international format: +[country code][number]
 * Example: +1234567890, +551199999999
 *
 * Validates: Requirement 5.2
 *
 * @param phone - The phone number to validate
 * @returns Boolean indicating if phone number is valid
 *
 * @example
 * validatePhoneNumber('+1234567890') // true
 * validatePhoneNumber('1234567890') // false (missing +)
 * validatePhoneNumber('+123') // false (too short)
 */
export function validatePhoneNumber(phone: string): boolean {
    if (!phone) {
        return false
    }

    // International format: +1234567890
    // Must start with +, followed by 1-3 digit country code, then 6-13 digits (total 7-15 digits after +)
    const phoneRegex = /^\+\d{1,3}\d{6,13}$/

    return phoneRegex.test(phone)
}

/**
 * Validate birth date
 *
 * Requirements:
 * - ISO 8601 format (YYYY-MM-DD)
 * - User must be at least 13 years old
 * - Date cannot be in the future
 *
 * Validates: Requirement 5.3
 *
 * @param birthDate - The birth date to validate (ISO 8601 format)
 * @returns Object with valid flag and optional error message
 *
 * @example
 * validateBirthDate('1990-01-01') // { valid: true }
 * validateBirthDate('2020-01-01') // { valid: false, error: 'You must be at least 13 years old' }
 * validateBirthDate('2025-01-01') // { valid: false, error: 'Birth date cannot be in the future' }
 */
export function validateBirthDate(birthDate: string): {
    valid: boolean
    error?: string
} {
    if (!birthDate) {
        return { valid: false, error: "Birth date is required" }
    }

    // ISO 8601 format: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/

    if (!dateRegex.test(birthDate)) {
        return {
            valid: false,
            error: "Birth date must be in YYYY-MM-DD format",
        }
    }

    const date = new Date(birthDate)
    const today = new Date()

    // Check if date is valid
    if (isNaN(date.getTime())) {
        return { valid: false, error: "Invalid birth date" }
    }

    // Check if date is in the future
    if (date > today) {
        return { valid: false, error: "Birth date cannot be in the future" }
    }

    // Calculate age
    let age = today.getFullYear() - date.getFullYear()
    const monthDiff = today.getMonth() - date.getMonth()

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
        age--
    }

    // Check if user is at least 13 years old
    if (age < 13) {
        return {
            valid: false,
            error: "You must be at least 13 years old",
        }
    }

    return { valid: true }
}

/**
 * Validate email format
 *
 * Validates: Requirement 5.4
 *
 * @param email - The email to validate
 * @returns Boolean indicating if email format is valid
 *
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid-email') // false
 */
export function validateEmail(email: string): boolean {
    if (!email) {
        return false
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    return emailRegex.test(email)
}

/**
 * Validate name field
 *
 * Requirements:
 * - 2-100 characters
 * - Not empty
 *
 * @param name - The name to validate
 * @returns Object with valid flag and optional error message
 *
 * @example
 * validateName('John Doe') // { valid: true }
 * validateName('J') // { valid: false, error: 'Name must be at least 2 characters' }
 */
export function validateName(name: string): {
    valid: boolean
    error?: string
} {
    if (!name) {
        return { valid: false, error: "Name is required" }
    }

    if (name.length < 2) {
        return { valid: false, error: "Name must be at least 2 characters" }
    }

    if (name.length > 100) {
        return { valid: false, error: "Name must be at most 100 characters" }
    }

    return { valid: true }
}

/**
 * Validate complete account completion data
 *
 * Validates all fields required for account completion:
 * - Email (format and presence)
 * - Name (length requirements)
 * - Password (strength requirements)
 * - Phone (international format)
 * - Birth date (age and format)
 *
 * Validates: Requirement 6.1
 *
 * @param data - The account completion data to validate
 * @returns Object with valid flag and field-level errors
 *
 * @example
 * validateAccountCompletionData({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   password: 'SecurePass123!',
 *   phone: '+1234567890',
 *   birthDate: '1990-01-01'
 * }) // { valid: true, errors: {} }
 */
export function validateAccountCompletionData(data: {
    email?: string
    name?: string
    password?: string
    phone?: string
    birthDate?: string
}): {
    valid: boolean
    errors: Record<string, string>
} {
    const errors: Record<string, string> = {}

    // Validate email
    if (!data.email) {
        errors.email = "Email is required"
    } else if (!validateEmail(data.email)) {
        errors.email = "Please enter a valid email address"
    }

    // Validate name
    if (!data.name) {
        errors.name = "Name is required"
    } else {
        const nameValidation = validateName(data.name)
        if (!nameValidation.valid && nameValidation.error) {
            errors.name = nameValidation.error
        }
    }

    // Validate password
    if (!data.password) {
        errors.password = "Password is required"
    } else {
        const passwordValidation = validatePassword(data.password)
        if (!passwordValidation.valid) {
            errors.password = passwordValidation.errors.join("; ")
        }
    }

    // Validate phone
    if (!data.phone) {
        errors.phone = "Phone number is required"
    } else if (!validatePhoneNumber(data.phone)) {
        errors.phone = "Please enter a valid international phone number"
    }

    // Validate birth date
    if (!data.birthDate) {
        errors.birthDate = "Birth date is required"
    } else {
        const birthDateValidation = validateBirthDate(data.birthDate)
        if (!birthDateValidation.valid && birthDateValidation.error) {
            errors.birthDate = birthDateValidation.error
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    }
}
