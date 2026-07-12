/**
 * OAuth Types
 * Shared type definitions for OAuth authentication across platforms
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

/**
 * Supported OAuth platforms
 */
export type OAuthPlatform =
    "youtube" | "facebook" | "instagram" | "twitter" | "linkedin" | "tiktok" | "twitch" | "kick"

/**
 * OAuth configuration for a platform
 */
export interface OAuthConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
    scopes: string[]
    authorizationUrl: string
    tokenUrl: string
    revokeUrl?: string
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
    accessToken: string
    refreshToken?: string
    expiresIn: number
    tokenType: string
    scope: string
    platform: OAuthPlatform
    userId: string
    linkedAt: number
}

/**
 * OAuth authorization URL response
 */
export interface AuthorizationUrlResponse {
    authorizationUrl: string
    state: string
    platform: OAuthPlatform
}

/**
 * OAuth status for a platform
 */
export interface OAuthStatus {
    platform: OAuthPlatform
    connected: boolean
    linkedAt?: number
    expiresAt?: number
    expired: boolean
    email?: string
    displayName?: string
}
