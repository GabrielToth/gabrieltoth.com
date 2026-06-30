/**
 * Date Validation Functions
 * Validates: Requirements 4.8-4.9, 18.1-18.2, 4.10-4.11, 6.10-6.11, 18.3
 */

/**
 * Validates birth date format (DD/MM/YYYY)
 * Requirements: 4.8-4.9, 18.1-18.2
 *
 * Validates that:
 * - Date is in DD/MM/YYYY format
 * - Date is a valid calendar date (no 32/13/2000)
 * - Date is not in the future
 * - Date is not more than 120 years in the past
 *
 * @param birthDate - The birth date string in DD/MM/YYYY format
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validateBirthDateFormat('01/01/1990') // { isValid: true }
 * validateBirthDateFormat('32/13/2000') // { isValid: false, error: 'Please enter a valid date (DD/MM/YYYY)' }
 * validateBirthDateFormat('01/01/2025') // { isValid: false, error: 'Please enter a valid date (DD/MM/YYYY)' }
 * validateBirthDateFormat('invalid') // { isValid: false, error: 'Please enter a valid date (DD/MM/YYYY)' }
 */
export function validateBirthDateFormat(birthDate: string): {
    isValid: boolean
    error?: string
} {
    if (!birthDate || typeof birthDate !== "string") {
        return { isValid: false, error: "Birth date is required" }
    }

    const trimmedDate = birthDate.trim()

    // Check format: DD/MM/YYYY
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = trimmedDate.match(dateRegex)

    if (!match) {
        return {
            isValid: false,
            error: "Please enter a valid date (DD/MM/YYYY)",
        }
    }

    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)

    // Validate month (1-12)
    if (month < 1 || month > 12) {
        return {
            isValid: false,
            error: "Please enter a valid date (DD/MM/YYYY)",
        }
    }

    // Validate day based on month
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    // Check for leap year
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    if (isLeapYear) {
        daysInMonth[1] = 29
    }

    if (day < 1 || day > daysInMonth[month - 1]) {
        return {
            isValid: false,
            error: "Please enter a valid date (DD/MM/YYYY)",
        }
    }

    // Create date object from parsed values
    const birthDateObj = new Date(year, month - 1, day)

    // Check if date is in the future
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (birthDateObj > today) {
        return {
            isValid: false,
            error: "Please enter a valid date (DD/MM/YYYY)",
        }
    }

    // Check if date is more than 120 years in the past
    // Calculate the age in years to avoid timezone and time-based issues
    let age = today.getFullYear() - year

    // Adjust if birthday hasn't occurred this year
    const monthDiff = today.getMonth() - (month - 1)
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
        age--
    }

    // Allow ages up to 120 years
    if (age > 120) {
        return {
            isValid: false,
            error: "Please enter a valid date (DD/MM/YYYY)",
        }
    }

    return { isValid: true }
}

/**
 * Validates that user is at least 13 years old
 * Requirements: 4.10-4.11, 6.10-6.11, 18.3
 *
 * Calculates age from birth date and ensures user is at least 13 years old.
 * This is required for COPPA compliance (Children's Online Privacy Protection Act).
 *
 * @param birthDate - The birth date string in DD/MM/YYYY format
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validateMinimumAge('01/01/2010') // { isValid: false, error: 'You must be at least 13 years old to register' }
 * validateMinimumAge('01/01/2005') // { isValid: true }
 * validateMinimumAge('01/01/1990') // { isValid: true }
 */
export function validateMinimumAge(birthDate: string): {
    isValid: boolean
    error?: string
} {
    if (!birthDate || typeof birthDate !== "string") {
        return { isValid: false, error: "Birth date is required" }
    }

    const trimmedDate = birthDate.trim()

    // First validate the format
    const formatValidation = validateBirthDateFormat(trimmedDate)
    if (!formatValidation.isValid) {
        return formatValidation
    }

    // Parse the date
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = trimmedDate.match(dateRegex)

    if (!match) {
        return {
            isValid: false,
            error: "You must be at least 13 years old to register",
        }
    }

    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)

    // Create birth date object
    const birthDateObj = new Date(year, month - 1, day)

    // Calculate age
    const today = new Date()
    let age = today.getFullYear() - birthDateObj.getFullYear()

    // Adjust age if birthday hasn't occurred this year
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
    ) {
        age--
    }

    // Check if user is at least 13 years old
    if (age < 13) {
        return {
            isValid: false,
            error: "You must be at least 13 years old to register",
        }
    }

    return { isValid: true }
}
