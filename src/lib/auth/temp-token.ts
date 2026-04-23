/**
 * Temporary Token Manager
 *
 * Generates and validates temporary JWT tokens for multi-step OAuth registration.
 * These tokens are used to securely pass OAuth user data between the callback
 * and completion endpoints during the registration flow.
 *
 * Features:
 * - JWT-based token generation with 30-minute expiration
 * - Token hashing for secure storage in database
 * - OAuth data preservation (email, oauth_provider, oauth_id, name, picture)
 * - Comprehensive validation and error handling
 *
 * Requirements:
 * - 1.1, 1.2, 1.3, 1.4: Account completion flow with temporary tokens
 * - 2.1, 2.2, 2.3, 2.4: Middleware and token validation
 *
 * @module temp-token
 */

import crypto from "crypto"
import jwt from "jsonwebtoken"

/**
 * Temporary token payload structure
 *
 * Contains OAuth user data that needs to be preserved between
 * the OAuth callback and account completion steps.
 */
export interface TempTokenPayload {
    email: string
    oauth_provider: string
    oauth_id: string
    name: string
    picture?: string
    exp: number // Expiration timestamp (seconds since epoch)
}

/**
 * Get JWT secret from environment variables
 *
 * @throws Error if JWT_SECRET is not configured
 * @returns JWT secret string
 */
function getJWTSecret(): string {
    const secret = process.env.JWT_SECRET

    if (!secret) {
        throw new Error(
            "JWT_SECRET environment variable is not configured. " +
                "Please set JWT_SECRET in your .env file."
        )
    }

    return secret
}

/**
 * Hash a token for secure storage
 *
 * Uses SHA-256 to hash the token before storing in database.
 * This prevents token exposure if database is compromised.
 *
 * @param token - Plain text JWT token
 * @returns Hashed token (hex string)
 */
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex")
}

/**
 * Verify a token hash matches the original token
 *
 * Compares a token against its stored hash using constant-time comparison
 * to prevent timing attacks.
 *
 * @param token - Plain text JWT token
 * @param hash - Stored token hash
 * @returns True if token matches hash, false otherwise
 */
export function verifyTokenHash(token: string, hash: string): boolean {
    const tokenHash = hashToken(token)
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash))
}

/**
 * Generate a temporary JWT token for OAuth account completion
 *
 * Creates a signed JWT token containing OAuth user data with a 30-minute expiration.
 * The token is used to securely pass user information from the OAuth callback
 * to the account completion endpoint.
 *
 * Requirements:
 * - 1.3: Generate temporary token with 30-minute expiration
 * - 1.4: Include OAuth data in token payload
 *
 * @param payload - OAuth user data (without exp field)
 * @returns Signed JWT token string
 * @throws Error if JWT_SECRET is not configured
 *
 * @example
 * ```typescript
 * const token = generateTempToken({
 *   email: 'user@example.com',
 *   oauth_provider: 'google',
 *   oauth_id: 'google-123',
 *   name: 'John Doe',
 *   picture: 'https://example.com/photo.jpg'
 * })
 *
 * // For secure storage, hash the token:
 * const tokenHash = hashToken(token)
 * ```
 */
export function generateTempToken(
    payload: Omit<TempTokenPayload, "exp">
): string {
    const secret = getJWTSecret()

    // Set expiration to 30 minutes from now
    const expiresIn = "30m"

    // Sign the token with HS256 algorithm
    const token = jwt.sign(payload, secret, {
        algorithm: "HS256",
        expiresIn,
    })

    return token
}

/**
 * Validate and decode a temporary JWT token
 *
 * Verifies the token signature, checks expiration, and returns the decoded payload.
 * Throws descriptive errors for invalid, expired, or malformed tokens.
 *
 * Requirements:
 * - 1.4: Verify temporary token validity
 * - 2.3, 2.4: Token validation for middleware
 *
 * @param token - JWT token string to validate
 * @returns Decoded token payload
 * @throws Error if token is invalid, expired, or malformed
 *
 * @example
 * ```typescript
 * try {
 *   const payload = verifyTempToken(token)
 *   console.log('User email:', payload.email)
 * } catch (error) {
 *   console.error('Invalid token:', error.message)
 * }
 * ```
 */
export function verifyTempToken(token: string): TempTokenPayload {
    const secret = getJWTSecret()

    try {
        // Verify token signature and expiration
        const decoded = jwt.verify(token, secret, {
            algorithms: ["HS256"],
        }) as TempTokenPayload

        // Validate required fields are present
        if (
            !decoded.email ||
            !decoded.oauth_provider ||
            !decoded.oauth_id ||
            !decoded.name
        ) {
            throw new Error(
                "Invalid token payload: missing required fields (email, oauth_provider, oauth_id, name)"
            )
        }

        return decoded
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error(
                "Account completion session expired. Please start the OAuth flow again."
            )
        }

        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error(
                `Invalid token: ${error.message}. Please start the OAuth flow again.`
            )
        }

        // Re-throw validation errors from above
        if (error instanceof Error) {
            throw error
        }

        throw new Error("Failed to validate token: Unknown error")
    }
}

/**
 * Backward compatibility: alias for verifyTempToken
 *
 * @deprecated Use verifyTempToken instead
 */
export function validateTempToken(token: string): TempTokenPayload {
    return verifyTempToken(token)
}
