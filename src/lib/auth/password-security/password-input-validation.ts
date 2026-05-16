/**
 * Module: Password Input Validation
 * Purpose: Validate password input before hashing or validation operations
 *
 * This module provides strict input validation for passwords to ensure:
 * - Input is a string type
 * - Length is between 8 and 128 characters
 * - No null bytes or control characters present
 * - Generic error messages (no information leakage)
 *
 * Requirements covered:
 * - Requirement 8.1: Validate input is string type
 * - Requirement 8.2: Validate length between 8 and 128 characters
 * - Requirement 8.3: Reject null bytes and control characters
 * - Requirement 8.7: Return validation errors with generic messages
 */

/**
 * Password validation result
 * Contains validation status and generic error message if invalid
 */
export interface PasswordValidationResult {
    /** Whether the password passed validation */
    valid: boolean

    /** Generic error message if validation failed (no specific details) */
    error?: string
}

/**
 * Validate password input before hashing or validation
 *
 * Performs comprehensive validation:
 * 1. Checks input is a string type
 * 2. Validates length is between 8 and 128 characters
 * 3. Rejects null bytes (\0)
 * 4. Rejects control characters (\x00-\x1F, \x7F)
 *
 * Returns generic error messages to prevent information leakage.
 * Does not reveal specific validation failure reason.
 *
 * Requirements:
 * - Requirement 8.1: Validate input is string type
 * - Requirement 8.2: Validate length between 8 and 128 characters
 * - Requirement 8.3: Reject null bytes and control characters
 * - Requirement 8.7: Return validation errors with generic messages
 *
 * @param password - The password input to validate
 * @returns Validation result with generic error message if invalid
 *
 * @example
 * // Valid password
 * validatePasswordInput('MySecurePassword123!')
 * // Returns: { valid: true }
 *
 * @example
 * // Too short
 * validatePasswordInput('short')
 * // Returns: { valid: false, error: 'Invalid password' }
 *
 * @example
 * // Contains null byte
 * validatePasswordInput('Password\x00Injection')
 * // Returns: { valid: false, error: 'Invalid password' }
 *
 * @example
 * // Not a string
 * validatePasswordInput(12345)
 * // Returns: { valid: false, error: 'Invalid password' }
 */
export function validatePasswordInput(
    password: unknown
): PasswordValidationResult {
    // Requirement 8.1: Validate input is string type
    if (typeof password !== "string") {
        return {
            valid: false,
            error: "Invalid password",
        }
    }

    // Requirement 8.2: Validate length between 8 and 128 characters
    if (password.length < 8 || password.length > 128) {
        return {
            valid: false,
            error: "Invalid password",
        }
    }

    // Requirement 8.3: Reject null bytes
    if (password.includes("\0")) {
        return {
            valid: false,
            error: "Invalid password",
        }
    }

    // Requirement 8.3: Reject control characters
    // Control characters: \x00-\x1F (0-31) and \x7F (127)
    // Using regex to detect any control character
    if (/[\x00-\x1F\x7F]/.test(password)) {
        return {
            valid: false,
            error: "Invalid password",
        }
    }

    // All validations passed
    return {
        valid: true,
    }
}

/**
 * Assert that password input is valid
 *
 * Throws an error if password validation fails.
 * Useful for early validation in functions that require valid input.
 *
 * @param password - The password to validate
 * @throws Error with generic message if validation fails
 *
 * @example
 * try {
 *   assertPasswordInputValid('MyPassword123!')
 *   // Password is valid, continue
 * } catch (error) {
 *   // Handle validation error
 * }
 */
export function assertPasswordInputValid(
    password: unknown
): asserts password is string {
    const result = validatePasswordInput(password)
    if (!result.valid) {
        throw new Error(result.error || "Invalid password")
    }
}
