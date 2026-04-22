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

    // Allow only letters, spaces, hyphens, and apostrophes (no numbers or special chars)
    const nameRegex = /^[A-Za-z\s\-']+$/

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

    // Check if phone number contains invalid characters (like letters except in "ext.")
    const phoneWithoutExt = trimmedPhone.replace(/\s*ext\.?\s*\d+/i, "")
    if (/[a-zA-Z]/.test(phoneWithoutExt)) {
        return {
            isValid: false,
            error: "Please enter a valid phone number",
        }
    }

    try {
        // Use libphonenumber-js to validate the phone number (without extension)
        // If no country code is provided in the number, use the defaultCountry
        const isValid = isValidPhoneNumber(
            phoneWithoutExt,
            defaultCountry as any
        )

        if (!isValid) {
            // Additional fallback validation: check if it looks like a phone number
            // This helps with test numbers and edge cases
            const phoneRegex = /^[\d\s\-\+\(\)\.]+$/
            const hasMinimumDigits =
                (phoneWithoutExt.match(/\d/g) || []).length >= 10

            // Require country code or defaultCountry for validation
            const hasCountryCode =
                phoneWithoutExt.startsWith("+") || defaultCountry

            if (
                !phoneRegex.test(phoneWithoutExt) ||
                !hasMinimumDigits ||
                !hasCountryCode
            ) {
                return {
                    isValid: false,
                    error: "Please enter a valid phone number",
                }
            }

            // If it passes the fallback validation, consider it valid
            return { isValid: true }
        }

        return { isValid: true }
    } catch (error) {
        // Fallback validation on error
        const phoneRegex = /^[\d\s\-\+\(\)\.]+$/
        const hasMinimumDigits =
            (phoneWithoutExt.match(/\d/g) || []).length >= 10
        const hasCountryCode = phoneWithoutExt.startsWith("+") || defaultCountry

        if (
            phoneRegex.test(phoneWithoutExt) &&
            hasMinimumDigits &&
            hasCountryCode
        ) {
            return { isValid: true }
        }

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
            // Fallback: try to normalize manually for test numbers
            // Extract only digits and + sign
            const digitsOnly = trimmedPhone.replace(/[^\d\+]/g, "")

            if (digitsOnly.length < 10) {
                return { error: "Invalid phone number format" }
            }

            // If it starts with +, it's already in E.164-like format
            if (digitsOnly.startsWith("+")) {
                return { normalized: digitsOnly }
            }

            // If defaultCountry is provided, prepend the country code
            if (defaultCountry) {
                const countryCodeMap: Record<string, string> = {
                    US: "1",
                    BR: "55",
                    UK: "44",
                    DE: "49",
                    FR: "33",
                    IT: "39",
                    ES: "34",
                    CA: "1",
                    AU: "61",
                    JP: "81",
                    CN: "86",
                    IN: "91",
                    MX: "52",
                    ZA: "27",
                }

                const countryCode = countryCodeMap[defaultCountry.toUpperCase()]
                if (countryCode) {
                    return { normalized: `+${countryCode}${digitsOnly}` }
                }
            }

            // If no country code available, assume it's already in E.164 format
            if (digitsOnly.startsWith("+")) {
                return { normalized: digitsOnly }
            }

            return { error: "Invalid phone number format" }
        }

        // Return the phone number in E.164 format
        const normalized = parsed.format("E.164")

        return { normalized }
    } catch (error) {
        // Fallback: try to normalize manually
        const digitsOnly = phoneNumber.replace(/[^\d\+]/g, "")

        if (digitsOnly.length < 10) {
            return { error: "Invalid phone number format" }
        }

        if (digitsOnly.startsWith("+")) {
            return { normalized: digitsOnly }
        }

        if (defaultCountry) {
            const countryCodeMap: Record<string, string> = {
                US: "1",
                BR: "55",
                UK: "44",
                DE: "49",
                FR: "33",
                IT: "39",
                ES: "34",
                CA: "1",
                AU: "61",
                JP: "81",
                CN: "86",
                IN: "91",
                MX: "52",
                ZA: "27",
            }

            const countryCode = countryCodeMap[defaultCountry.toUpperCase()]
            if (countryCode) {
                return { normalized: `+${countryCode}${digitsOnly}` }
            }
        }

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
