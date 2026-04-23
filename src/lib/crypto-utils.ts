/**
 * Cryptographic Utilities
 * Provides functions that work in both Node.js and Edge Runtime
 * Uses crypto.getRandomValues() which is available in both environments
 */

/**
 * Generate a cryptographically secure random hex string
 * Works in both Node.js and Edge Runtime
 *
 * @param length - Number of bytes to generate
 * @returns Hex string of length * 2 characters
 *
 * @example
 * const randomHex = generateRandomHex(32)
 * // randomHex will be a 64-character hex string
 */
export function generateRandomHex(length: number): string {
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
}

/**
 * Generate a UUID v4 that works in Edge Runtime
 * Uses crypto.getRandomValues() which is available in Edge Runtime
 *
 * @returns A UUID v4 string
 *
 * @example
 * const uuid = generateUUID()
 * // uuid will be like: 550e8400-e29b-41d4-a716-446655440000
 */
export function generateUUID(): string {
    // Generate 16 random bytes
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)

    // Set version to 4 (random)
    bytes[6] = (bytes[6] & 0x0f) | 0x40

    // Set variant to RFC 4122
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    // Convert to hex string with dashes
    const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
