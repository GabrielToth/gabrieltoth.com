/**
 * Google OAuth Configuration Module
 * Centralizes Google OAuth configuration and validation
 *
 * Validates: Requirements 5.1-5.3, 26.1-26.3
 */

/**
 * Google OAuth Configuration
 * Requirement 5.1-5.3, 26.1-26.3
 */
export interface GoogleOAuthConfig {
    // Server-side configuration (never exposed to client)
    clientId: string
    clientSecret: string

    // Client-side configuration (safe to expose)
    publicClientId: string
    redirectUri: string

    // OAuth scopes
    scopes: string[]

    // Configuration metadata
    isConfigured: boolean
}

/**
 * Get Google OAuth configuration
 * Validates: Requirements 5.1-5.3, 26.1-26.3
 *
 * This function:
 * 1. Reads Google OAuth credentials from environment variables
 * 2. Validates that all required variables are configured
 * 3. Returns configuration object with server and client-side settings
 * 4. Throws error if configuration is incomplete
 *
 * Environment variables required:
 * - GOOGLE_CLIENT_ID (server-side, used for token validation)
 * - GOOGLE_CLIENT_SECRET (server-side, used for code exchange)
 * - NEXT_PUBLIC_GOOGLE_CLIENT_ID (client-side, exposed to browser)
 * - NEXT_PUBLIC_GOOGLE_REDIRECT_URI (client-side, OAuth redirect URI)
 *
 * @returns GoogleOAuthConfig object with all configuration
 * @throws Error if required environment variables are missing
 *
 * Validates: Requirements 5.1-5.3, 26.1-26.3
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const publicClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI

    // Validate server-side configuration
    if (!clientId) {
        throw new Error(
            "Google OAuth not configured: GOOGLE_CLIENT_ID environment variable is missing"
        )
    }

    if (!clientSecret) {
        throw new Error(
            "Google OAuth not configured: GOOGLE_CLIENT_SECRET environment variable is missing"
        )
    }

    // Validate client-side configuration
    if (!publicClientId) {
        throw new Error(
            "Google OAuth not configured: NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is missing"
        )
    }

    if (!redirectUri) {
        throw new Error(
            "Google OAuth not configured: NEXT_PUBLIC_GOOGLE_REDIRECT_URI environment variable is missing"
        )
    }

    // Validate that client IDs match
    if (clientId !== publicClientId) {
        throw new Error(
            "Google OAuth configuration mismatch: GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_CLIENT_ID must be the same"
        )
    }

    // Validate redirect URI format
    if (
        !redirectUri.startsWith("http://") &&
        !redirectUri.startsWith("https://")
    ) {
        throw new Error(
            "Google OAuth configuration invalid: NEXT_PUBLIC_GOOGLE_REDIRECT_URI must start with http:// or https://"
        )
    }

    return {
        clientId,
        clientSecret,
        publicClientId,
        redirectUri,
        scopes: ["email", "profile"],
        isConfigured: true,
    }
}

/**
 * Check if Google OAuth is configured
 * Requirement 5.1-5.3, 26.1-26.3
 *
 * This function:
 * 1. Checks if all required environment variables are set
 * 2. Returns true if configured, false otherwise
 * 3. Does not throw errors (safe to use for conditional logic)
 *
 * @returns true if Google OAuth is configured, false otherwise
 */
export function isGoogleOAuthConfigured(): boolean {
    return !!(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    )
}

/**
 * Get Google OAuth authorization URL
 * Requirement 5.1-5.3, 26.1-26.3
 *
 * This function:
 * 1. Constructs the Google OAuth authorization URL
 * 2. Includes client ID, redirect URI, scopes, and state
 * 3. Returns the full URL for redirecting user to Google
 *
 * @param state - CSRF protection state token
 * @returns Google OAuth authorization URL
 * @throws Error if Google OAuth is not configured
 */
export function getGoogleOAuthAuthorizationUrl(state: string): string {
    const config = getGoogleOAuthConfig()

    const params = new URLSearchParams({
        client_id: config.publicClientId,
        redirect_uri: config.redirectUri,
        response_type: "code",
        scope: config.scopes.join(" "),
        state,
        access_type: "offline",
        prompt: "consent",
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Get Google OAuth token endpoint
 * Requirement 5.1-5.3, 26.1-26.3
 *
 * @returns Google OAuth token endpoint URL
 */
export function getGoogleOAuthTokenEndpoint(): string {
    return "https://oauth2.googleapis.com/token"
}

/**
 * Get Google OAuth user info endpoint
 * Requirement 5.1-5.3, 26.1-26.3
 *
 * @returns Google OAuth user info endpoint URL
 */
export function getGoogleOAuthUserInfoEndpoint(): string {
    return "https://www.googleapis.com/oauth2/v2/userinfo"
}

/**
 * Validate Google OAuth redirect URI
 * Requirement 5.1-5.3, 26.1-26.3
 *
 * This function:
 * 1. Validates that the redirect URI matches the configured URI
 * 2. Prevents open redirect attacks
 * 3. Returns true if valid, false otherwise
 *
 * @param redirectUri - Redirect URI to validate
 * @returns true if redirect URI is valid, false otherwise
 */
export function validateGoogleOAuthRedirectUri(redirectUri: string): boolean {
    try {
        const config = getGoogleOAuthConfig()
        return redirectUri === config.redirectUri
    } catch {
        return false
    }
}

/**
 * Get Google OAuth scopes
 * Requirement 5.1-5.3, 26.1-26.3
 *
 * @returns Array of OAuth scopes
 */
export function getGoogleOAuthScopes(): string[] {
    return ["email", "profile"]
}
