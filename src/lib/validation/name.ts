/**
 * Name Validation Functions
 * Validates: Requirements 4.3, 11.1, 11.2, 11.3, 11.4
 */

/**
 * Validates name field format
 * Requirements: 4.3, 11.1, 11.2, 11.3, 11.4
 *
 * Name must:
 * - Not be empty
 * - Contain at least 2 characters
 * - Contain only letters, spaces, hyphens, and apostrophes
 * - NOT be composed entirely of numbers or special characters
 *
 * @param name - The name to validate
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validateName('John Doe') // { isValid: true }
 * validateName("O'Brien") // { isValid: true }
 * validateName('João Silva') // { isValid: true }
 * validateName('José da Silva') // { isValid: true }
 * validateName('François Müller') // { isValid: true }
 * validateName('John-Paul') // { isValid: true }
 * validateName('J') // { isValid: false, error: 'Full name must be at least 2 characters' }
 * validateName('123') // { isValid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes' }
 * validateName('John@Doe') // { isValid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes' }
 */
export function validateName(name: string): {
    isValid: boolean
    error?: string
} {
    if (!name || typeof name !== "string") {
        return { isValid: false, error: "Full name is required" }
    }

    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
        return { isValid: false, error: "Full name is required" }
    }

    // Check minimum length (at least 2 characters)
    if (trimmedName.length < 2) {
        return {
            isValid: false,
            error: "Full name must be at least 2 characters",
        }
    }

    // Allow letters (including accented characters), spaces, hyphens, and apostrophes
    // Uses Unicode letter categories to support international names (ç, ã, é, etc.)
    const nameRegex = /^[\p{L}\s\-']+$/u

    if (!nameRegex.test(trimmedName)) {
        return {
            isValid: false,
            error: "Full name can only contain letters, spaces, hyphens, and apostrophes",
        }
    }

    return { isValid: true }
}

/**
 * Validates that a name is NOT composed entirely of numbers or special characters
 * Requirements: 11.4
 *
 * This is a stricter validation that ensures names contain at least some letters.
 * Used as an additional check to prevent names like "123" or "!!!" from being accepted.
 *
 * @param name - The name to validate
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validateNameNotOnlyNumbersOrSpecialChars('John Doe') // { isValid: true }
 * validateNameNotOnlyNumbersOrSpecialChars('123') // { isValid: false, error: 'Full name must contain at least some letters' }
 * validateNameNotOnlyNumbersOrSpecialChars('!!!') // { isValid: false, error: 'Full name must contain at least some letters' }
 */
export function validateNameNotOnlyNumbersOrSpecialChars(name: string): {
    isValid: boolean
    error?: string
} {
    if (!name || typeof name !== "string") {
        return { isValid: true } // This check is secondary to validateName
    }

    const trimmedName = name.trim()

    // Check if name contains at least one letter
    const hasLetters = /[A-Za-z]/.test(trimmedName)

    if (!hasLetters) {
        return {
            isValid: false,
            error: "Full name must contain at least some letters",
        }
    }

    return { isValid: true }
}
