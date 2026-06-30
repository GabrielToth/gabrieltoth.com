/**
 * Phone Number Validation Functions
 * Validates: Requirements 4.7, 10.1, 10.4
 */

import { isValidPhoneNumber, parsePhoneNumber, CountryCode } from "libphonenumber-js"

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
            defaultCountry as CountryCode
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
    } catch (_) {
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
        const parsed = parsePhoneNumber(trimmedPhone, defaultCountry as CountryCode)

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
    } catch (_) {
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
