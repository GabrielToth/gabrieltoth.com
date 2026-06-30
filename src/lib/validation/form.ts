/**
 * Multi-Field Form Validators
 * Combines individual field validators for comprehensive form validation
 */

import { validateEmail } from "./email"
import { validateName, validateNameNotOnlyNumbersOrSpecialChars } from "./name"
import { validatePassword, validatePasswordMatch } from "./password"
import { validatePhoneNumber } from "./phone"
import { validateFieldLength } from "./utils"

/**
 * Comprehensive registration form validation
 * Validates all fields together for registration
 *
 * @param data - Object containing name, email, password, confirmPassword, phone (optional)
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
    phone?: string
}): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    // Validate name
    const nameValidation = validateName(data.name)
    if (!nameValidation.isValid) {
        errors.name = nameValidation.error || "Invalid name"
    } else {
        // Additional check: name should not be only numbers/special chars
        const nameCharValidation = validateNameNotOnlyNumbersOrSpecialChars(
            data.name
        )
        if (!nameCharValidation.isValid) {
            errors.name = nameCharValidation.error || "Invalid name"
        }
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

    // Validate phone if provided
    if (data.phone) {
        const phoneValidation = validatePhoneNumber(data.phone)
        if (!phoneValidation.isValid) {
            errors.phone = phoneValidation.error || "Invalid phone number"
        }
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
