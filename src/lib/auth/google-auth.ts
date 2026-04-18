/**
 * Google OAuth Authentication Module
 * Handles Google token validation and user data extraction
 *
 * Validates: Requirements 11.1, 11.2, 11.3
 */

import { GoogleTokenPayload } from "@/types/auth"
import { OAuth2Client } from "google-auth-library"

/**
 * Initialize Google OAuth2 Client
 * Uses environment variables for configuration
 */
const getGoogleAuthClient = (): OAuth2Client => {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        throw new Error("Google OAuth credentials not configured")
    }

    return new OAuth2Client(clientId, clientSecret)
}

/**
 * Validate Google token and extract user information
 *
 * This function:
 * 1. Validates the token signature using Google's public keys
 * 2. Verifies token expiration
 * 3. Verifies token audience (aud claim)
 * 4. Verifies token issuer (iss claim)
 * 5. Extracts user information (sub, email, name, picture)
 *
 * @param token - The Google ID token to validate
 * @returns GoogleTokenPayload with extracted user information
 * @throws Error if token is invalid, expired, or verification fails
 *
 * Validates: Requirements 11.1, 11.2, 11.3
 */
export async function validateGoogleToken(
    token: string
): Promise<GoogleTokenPayload> {
    try {
        const client = getGoogleAuthClient()
        const clientId = process.env.GOOGLE_CLIENT_ID

        if (!clientId) {
            throw new Error("Google Client ID not configured")
        }

        // Verify the token with Google's servers
        // This validates:
        // - Token signature (using Google's public keys)
        // - Token expiration (exp claim)
        // - Token audience (aud claim must match our client ID)
        // - Token issuer (iss claim must be Google)
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: clientId,
        })

        const payload = ticket.getPayload()

        if (!payload) {
            throw new Error("Failed to extract token payload")
        }

        // Verify issuer is Google
        const validIssuers = [
            "https://accounts.google.com",
            "accounts.google.com",
        ]
        if (!validIssuers.includes(payload.iss || "")) {
            throw new Error("Invalid token issuer")
        }

        // Verify audience matches our client ID
        if (payload.aud !== clientId) {
            throw new Error("Invalid token audience")
        }

        // Verify token is not expired
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
            throw new Error("Token has expired")
        }

        // Extract required user information
        const googleTokenPayload: GoogleTokenPayload = {
            sub: payload.sub || "",
            email: payload.email || "",
            name: payload.name || "",
            picture: payload.picture,
            aud: payload.aud || "",
            iss: payload.iss || "",
            exp: payload.exp || 0,
            iat: payload.iat || 0,
        }

        // Validate required fields
        if (!googleTokenPayload.sub || !googleTokenPayload.email) {
            throw new Error(
                "Token missing required user information (sub or email)"
            )
        }

        return googleTokenPayload
    } catch (error) {
        // Re-throw with more context
        if (error instanceof Error) {
            throw new Error(`Google token validation failed: ${error.message}`)
        }
        throw new Error("Google token validation failed: Unknown error")
    }
}

/**
 * Exchange authorization code for Google ID token
 *
 * This function exchanges the authorization code received from Google OAuth
 * for an ID token that can be validated.
 *
 * @param code - The authorization code from Google OAuth callback
 * @param redirectUri - The redirect URI used in the OAuth flow
 * @returns The ID token string
 * @throws Error if code exchange fails
 *
 * Validates: Requirements 1.3, 1.4
 */
export async function exchangeCodeForToken(
    code: string,
    redirectUri: string
): Promise<string> {
    try {
        const client = getGoogleAuthClient()

        const { tokens } = await client.getToken({
            code,
            redirect_uri: redirectUri,
        })

        if (!tokens.id_token) {
            throw new Error("No ID token received from Google")
        }

        return tokens.id_token
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(
                `Failed to exchange authorization code: ${error.message}`
            )
        }
        throw new Error("Failed to exchange authorization code: Unknown error")
    }
}
