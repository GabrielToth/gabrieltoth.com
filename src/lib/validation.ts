/**
 * Barrel Re-export - All functions have been moved to src/lib/validation/ domain modules
 * This file maintains backward compatibility for the 22 existing import sites
 *
 * All 14 validation functions are now organized into focused domain modules:
 * - email.ts: Email validation
 * - password.ts: Password validation (with isNotCommonPassword check)
 * - name.ts: Name validation
 * - phone.ts: Phone number validation and normalization
 * - date.ts: Birth date validation and age checks
 * - form.ts: Multi-field form validators
 * - utils.ts: Shared validation utilities
 * - index.ts: Central barrel for re-exports
 */

export { validateEmail } from "./validation/email"
export { validatePassword, validatePasswordMatch } from "./validation/password"
export { validateName, validateNameNotOnlyNumbersOrSpecialChars } from "./validation/name"
export { validateFieldLength } from "./validation/utils"
export { validatePhoneNumber, normalizePhoneNumber, validateAndNormalizePhoneNumber } from "./validation/phone"
export { validateBirthDateFormat, validateMinimumAge } from "./validation/date"
export { validateRegistrationForm, validateLoginForm, validatePasswordResetForm } from "./validation/form"
