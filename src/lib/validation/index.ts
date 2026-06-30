/**
 * Validation Module Barrel Export
 * Re-exports all validation functions from domain modules
 * Maintains backward compatibility with existing import sites
 */

export { validateEmail } from "./email"
export { validatePassword, validatePasswordMatch } from "./password"
export { validateName, validateNameNotOnlyNumbersOrSpecialChars } from "./name"
export { validateFieldLength } from "./utils"
export {
    validatePhoneNumber,
    normalizePhoneNumber,
    validateAndNormalizePhoneNumber,
} from "./phone"
export { validateBirthDateFormat, validateMinimumAge } from "./date"
export {
    validateRegistrationForm,
    validateLoginForm,
    validatePasswordResetForm,
} from "./form"
