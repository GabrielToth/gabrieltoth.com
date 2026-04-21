/**
 * Temporary Token Manager
 *
 * Generates and validates temporary JWT tokens for multi-step OAuth registration.
 * These tokens are used to securely pass OAuth user data between the callback
 * and completion endpoints during the registration flow.
 *
 * Requirements:
 * - 2.2: Temporary tokens for OAuth registration flow
 *
 * @module temp-token
 */

import jwt from "jsonwebtoken"

/**
 * Temporary token payload structure
 *
 * Contains OAuth user data that needs to be preserved between
 * the OAuth callback and registration completion steps.
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
 * Generate a temporary JWT token for OAuth registration
 *
 * Creates a signed JWT token containing OAuth user data with a 15-minute expiration.
 * The token is used to securely pass user information from the OAuth callback
 * to the registration completion endpoint.
 *
 * Requirements:
 * - 2.2: Generate temporary token with OAuth user data
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
 * ```
 */
export function generateTempToken(
    payload: Omit<TempTokenPayload, "exp">
): string {
    const secret = getJWTSecret()

    // Set expiration to 15 minutes from now
    const expiresIn = "15m"

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
 * - 2.2: Validate temporary token (signature, expiration)
 *
 * @param token - JWT token string to validate
 * @returns Decoded token payload
 * @throws Error if token is invalid, expired, or malformed
 *
 * @example
 * ```typescript
 * try {
 *   const payload = validateTempToken(token)
 *   console.log('User email:', payload.email)
 * } catch (error) {
 *   console.error('Invalid token:', error.message)
 * }
 * ```
 */
export function validateTempToken(token: string): TempTokenPayload {
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
                "Registration session expired. Please start the OAuth flow again."
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
