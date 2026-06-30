/**
 * Password Validation Functions
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 10.2, 10.3, 10.4, 1.7, 8.5
 */

import { isNotCommonPassword } from "../auth/common-passwords"

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
