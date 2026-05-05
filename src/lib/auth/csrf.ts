/**
 * CSRF Protection Module
 * Implements Cross-Site Request Forgery protection with secure token generation,
 * validation, and secure cookie storage
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import { generateRandomHex } from "@/lib/crypto-utils"
import { logger } from "@/lib/logger"
import { cookies } from "next/headers"

/**
 * CSRF token configuration
 */
const CSRF_TOKEN_LENGTH = 32 // 32 bytes = 256 bits
const CSRF_TOKEN_EXPIRATION_MINUTES = 60 // 1 hour
const CSRF_COOKIE_NAME = "csrf_token"

/**
 * Generate a cryptographically secure CSRF token
 * Requirement 4.1
 *
 * Uses crypto.getRandomValues() to generate 32 bytes of random data,
 * then converts to a 64-character hex string.
 *
 * @returns A random CSRF token as a hex string (64 characters)
 *
 * @example
 * const token = generateCSRFToken()
 * // token will be a 64-character hex string like "a1b2c3d4e5f6..."
 */
export function generateCSRFToken(): string {
    try {
        const token = generateRandomHex(CSRF_TOKEN_LENGTH)

        logger.debug("CSRF token generated", {
            context: "CSRF",
            data: { tokenLength: token.length },
        })

        return token
    } catch (error) {
        logger.error("Failed to generate CSRF token", {
            context: "CSRF",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Validate a CSRF token
 * Requirement 4.2
 *
 * Validates that:
 * 1. Token is a non-empty string
 * 2. Token is exactly 64 characters (32 bytes in hex)
 * 3. Token contains only valid hex characters
 *
 * @param token - The CSRF token to validate
 * @returns true if token format is valid, false otherwise
 *
 * @example
 * const isValid = validateCSRFToken(token)
 */
export function validateCSRFToken(token: unknown): boolean {
    try {
        // Check if token is a string
        if (typeof token !== "string") {
            logger.warn("CSRF token is not a string", {
                context: "CSRF",
                data: { tokenType: typeof token },
            })
            return false
        }

        // Check if token is not empty
        if (!token || token.length === 0) {
            logger.warn("CSRF token is empty", {
                context: "CSRF",
            })
            return false
        }

        // Check if token is exactly 64 characters (32 bytes in hex)
        if (token.length !== 64) {
            logger.warn("CSRF token has invalid length", {
                context: "CSRF",
                data: { tokenLength: token.length, expectedLength: 64 },
            })
            return false
        }

        // Check if token contains only valid hex characters
        if (!/^[a-f0-9]{64}$/i.test(token)) {
            logger.warn("CSRF token contains invalid characters", {
                context: "CSRF",
            })
            return false
        }

        logger.debug("CSRF token validated successfully", {
            context: "CSRF",
        })

        return true
    } catch (error) {
        logger.error("Failed to validate CSRF token", {
            context: "CSRF",
            error: error as Error,
        })
        return false
    }
}

/**
 * Store a CSRF token in a secure cookie
 * Requirement 4.3
 *
 * Sets a secure cookie with:
 * - HttpOnly flag (prevents JavaScript access)
 * - Secure flag (HTTPS only in production)
 * - SameSite=Strict (prevents CSRF attacks)
 * - Expiration: 1 hour
 *
 * @param token - The CSRF token to store
 * @throws Error if token is invalid or cookie setting fails
 *
 * @example
 * const token = generateCSRFToken()
 * await storeCSRFToken(token)
 */
export async function storeCSRFToken(token: string): Promise<void> {
    try {
        // Validate token before storing
        if (!validateCSRFToken(token)) {
            throw new Error("Invalid CSRF token format")
        }

        // Get cookies instance
        const cookieStore = await cookies()

        // Calculate expiration time
        const expiresAt = new Date(
            Date.now() + CSRF_TOKEN_EXPIRATION_MINUTES * 60 * 1000
        )

        // Set secure cookie with HttpOnly, Secure, and SameSite flags
        cookieStore.set(CSRF_COOKIE_NAME, token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === "production", // HTTPS only in production
            sameSite: "strict", // Prevents CSRF attacks
            maxAge: CSRF_TOKEN_EXPIRATION_MINUTES * 60, // 1 hour in seconds
            path: "/", // Available on all paths
        })

        logger.debug("CSRF token stored in secure cookie", {
            context: "CSRF",
            data: {
                expiresAt: expiresAt.toISOString(),
                secure: process.env.NODE_ENV === "production",
            },
        })
    } catch (error) {
        logger.error("Failed to store CSRF token", {
            context: "CSRF",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Retrieve a CSRF token from a cookie
 * Requirement 4.4
 *
 * Retrieves the CSRF token from the secure cookie and validates it.
 *
 * @returns The CSRF token from the cookie, or null if not found or invalid
 *
 * @example
 * const token = await retrieveCSRFToken()
 * if (token) {
 *   // Token is valid and can be used
 * }
 */
export async function retrieveCSRFToken(): Promise<string | null> {
    try {
        // Get cookies instance
        const cookieStore = await cookies()

        // Get CSRF token from cookie
        const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)

        if (!csrfCookie || !csrfCookie.value) {
            logger.debug("CSRF token not found in cookie", {
                context: "CSRF",
            })
            return null
        }

        const token = csrfCookie.value

        // Validate token format
        if (!validateCSRFToken(token)) {
            logger.warn("CSRF token from cookie has invalid format", {
                context: "CSRF",
            })
            return null
        }

        logger.debug("CSRF token retrieved from cookie", {
            context: "CSRF",
        })

        return token
    } catch (error) {
        logger.error("Failed to retrieve CSRF token from cookie", {
            context: "CSRF",
            error: error as Error,
        })
        return null
    }
}

/**
 * Clear a CSRF token from cookies
 * Used when logging out or invalidating a session
 *
 * @example
 * await clearCSRFToken()
 */
export async function clearCSRFToken(): Promise<void> {
    try {
        const cookieStore = await cookies()
        cookieStore.delete(CSRF_COOKIE_NAME)

        logger.debug("CSRF token cleared from cookie", {
            context: "CSRF",
        })
    } catch (error) {
        logger.error("Failed to clear CSRF token", {
            context: "CSRF",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Verify that a provided CSRF token matches the stored token
 * Used during login form submission
 *
 * @param providedToken - The CSRF token provided in the request
 * @returns true if tokens match, false otherwise
 *
 * @example
 * const isValid = await verifyCSRFTokenMatch(requestToken)
 */
export async function verifyCSRFTokenMatch(
    providedToken: string
): Promise<boolean> {
    try {
        // Validate provided token format
        if (!validateCSRFToken(providedToken)) {
            logger.warn("Provided CSRF token has invalid format", {
                context: "CSRF",
            })
            return false
        }

        // Retrieve stored token from cookie
        const storedToken = await retrieveCSRFToken()

        if (!storedToken) {
            logger.warn("No CSRF token found in cookie for verification", {
                context: "CSRF",
            })
            return false
        }

        // Use constant-time comparison to prevent timing attacks
        const match = constantTimeCompare(providedToken, storedToken)

        if (!match) {
            logger.warn("CSRF token mismatch", {
                context: "CSRF",
            })
            return false
        }

        logger.debug("CSRF token verified successfully", {
            context: "CSRF",
        })

        return true
    } catch (error) {
        logger.error("Failed to verify CSRF token", {
            context: "CSRF",
            error: error as Error,
        })
        return false
    }
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Compares two strings in constant time regardless of where they differ
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
function constantTimeCompare(a: string, b: string): boolean {
    // If lengths differ, they're not equal
    if (a.length !== b.length) {
        return false
    }

    let result = 0

    // Compare each character without short-circuiting
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
}
