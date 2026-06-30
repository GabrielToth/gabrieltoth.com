/**
 * Shared Validation Utilities
 * Validates: Requirements 7.4, 8.4
 */

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
