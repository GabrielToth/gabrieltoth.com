/**
 * Common Password List
 * A curated list of commonly used passwords that should be rejected
 * for security reasons.
 *
 * This list includes:
 * - Top 100 most common passwords from security breaches
 * - Simple patterns (123456, password, etc.)
 * - Keyboard patterns (qwerty, asdfgh, etc.)
 * - Common words (welcome, admin, etc.)
 *
 * Requirement 7.7: Password validation must reject common passwords
 */

export const COMMON_PASSWORDS = new Set([
    // Top common passwords
    "password",
    "password1",
    "password123",
    "password123!",
    "12345678",
    "123456789",
    "1234567890",
    "qwerty",
    "qwerty123",
    "abc123",
    "monkey",
    "1234567",
    "letmein",
    "trustno1",
    "dragon",
    "baseball",
    "111111",
    "iloveyou",
    "master",
    "sunshine",
    "ashley",
    "bailey",
    "passw0rd",
    "shadow",
    "123123",
    "654321",
    "superman",
    "qazwsx",
    "michael",
    "football",
    "welcome",
    "jesus",
    "ninja",
    "mustang",
    "password1234",
    "admin",
    "admin123",
    "root",
    "toor",
    "pass",
    "test",
    "guest",
    "123456",
    "12345",
    "1234",

    // Keyboard patterns
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
    "qweasd",
    "asdzxc",
    "qweasdzxc",

    // Common words
    "welcome123",
    "login",
    "changeme",
    "default",
    "administrator",
    "user",
    "demo",
    "sample",

    // Variations with common substitutions
    "p@ssword",
    "p@ssw0rd",
    "passw0rd123",
    "admin@123",
    "qwerty@123",

    // Simple patterns
    "aaaaaaaa",
    "11111111",
    "00000000",
    "abcdefgh",
    "abcd1234",
    "1q2w3e4r",
    "1qaz2wsx",
])

/**
 * Check if a password is in the common password list
 * Case-insensitive comparison
 *
 * @param password - The password to check
 * @returns true if password is NOT common (safe), false if it IS common (unsafe)
 */
export function isNotCommonPassword(password: string): boolean {
    return !COMMON_PASSWORDS.has(password.toLowerCase())
}
