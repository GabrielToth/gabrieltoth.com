/**
 * YouTube OAuth Service
 * Handles OAuth 2.0 authorization URL generation, token exchange, and token management
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import crypto from "crypto"
import { createLogger } from "../logger"
import { BaseService, ServiceError } from "./base-service"
import { YouTubeChannelLinkingConfig } from "./config"

/**
 * OAuth token response from YouTube
 */
export interface OAuthTokenResponse {
    accessToken: string
    refreshToken?: string
    expiresIn: number
    tokenType: string
    scope: string
}

/**
 * OAuth authorization URL response
 */
export interface AuthorizationUrlResponse {
    authorizationUrl: string
    state: string
}

/**
 * YouTube OAuth Service
 * Handles OAuth 2.0 flow for YouTube channel linking
 */
export class YouTubeOAuthService extends BaseService {
    private logger = createLogger("YouTubeOAuthService")

    constructor(private config: YouTubeChannelLinkingConfig) {
        super()
    }

    /**
     * Generate OAuth authorization URL with state parameter
     * Requirement 1.1: Generate OAuth authorization URL
     * Requirement 1.2: Store state parameter in Redis with expiration
     *
     * @param userId - User ID for tracking
     * @returns Authorization URL and state parameter
     */
    generateAuthorizationUrl(userId: string): AuthorizationUrlResponse {
        this.assertReady()

        try {
            // Generate cryptographically secure state parameter
            const state = this.generateState()

            // Build authorization URL
            const params = new URLSearchParams({
                client_id: this.config.oauth.clientId,
                redirect_uri: this.config.oauth.redirectUri,
                response_type: "code",
                scope: this.config.oauth.scopes.join(" "),
                state: state,
                access_type: "offline", // Request refresh token
                prompt: "consent", // Force consent screen
            })

            const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

            this.logger.info("Authorization URL generated", {
                userId,
                state: state.substring(0, 8) + "...", // Log partial state for debugging
            })

            return {
                authorizationUrl,
                state,
            }
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to generate authorization URL",
                { userId }
            )
        }
    }

    /**
     * Generate cryptographically secure state parameter
     * Used to prevent CSRF attacks
     *
     * @returns Random state string
     */
    private generateState(): string {
        return crypto.randomBytes(32).toString("hex")
    }

    /**
     * Validate state parameter
     * Ensures state matches what was stored
     *
     * @param state - State parameter from OAuth callback
     * @param storedState - State stored in Redis
     * @returns True if state is valid
     */
    validateState(state: string, storedState: string): boolean {
        try {
            // Use constant-time comparison to prevent timing attacks
            return crypto.timingSafeEqual(
                Buffer.from(state),
                Buffer.from(storedState)
            )
        } catch (error) {
            this.logger.warn("State validation failed", {
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Exchange authorization code for access token
     * Requirement 1.3: Exchange authorization code for token
     *
     * @param code - Authorization code from OAuth callback
     * @returns OAuth token response
     */
    async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                client_id: this.config.oauth.clientId,
                client_secret: this.config.oauth.clientSecret,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: this.config.oauth.redirectUri,
            })

            const response = await fetch(
                "https://oauth2.googleapis.com/token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: params.toString(),
                }
            )

            if (!response.ok) {
                const error = await response.json()
                throw new ServiceError(
                    "TOKEN_EXCHANGE_FAILED",
                    `Failed to exchange code for token: ${error.error_description || error.error}`,
                    400,
                    { error }
                )
            }

            const data = await response.json()

            this.logger.info("Authorization code exchanged for token")

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
                tokenType: data.token_type,
                scope: data.scope,
            }
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to exchange authorization code for token"
            )
        }
    }

    /**
     * Refresh access token using refresh token
     * Requirement 1.3: Refresh tokens when needed
     *
     * @param refreshToken - Refresh token
     * @returns New OAuth token response
     */
    async refreshAccessToken(
        refreshToken: string
    ): Promise<OAuthTokenResponse> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                client_id: this.config.oauth.clientId,
                client_secret: this.config.oauth.clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            })

            const response = await fetch(
                "https://oauth2.googleapis.com/token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: params.toString(),
                }
            )

            if (!response.ok) {
                const error = await response.json()
                throw new ServiceError(
                    "TOKEN_REFRESH_FAILED",
                    `Failed to refresh token: ${error.error_description || error.error}`,
                    400,
                    { error }
                )
            }

            const data = await response.json()

            this.logger.info("Access token refreshed")

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || refreshToken, // Use old refresh token if new one not provided
                expiresIn: data.expires_in,
                tokenType: data.token_type,
                scope: data.scope,
            }
        } catch (error) {
            throw this.handleError(error, "Failed to refresh access token")
        }
    }

    /**
     * Revoke access token
     * Requirement 1.3: Revoke tokens on unlinking
     *
     * @param accessToken - Access token to revoke
     * @returns True if revocation was successful
     */
    async revokeToken(accessToken: string): Promise<boolean> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                token: accessToken,
            })

            const response = await fetch(
                "https://oauth2.googleapis.com/revoke",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: params.toString(),
                }
            )

            if (!response.ok) {
                this.logger.warn("Token revocation failed", {
                    status: response.status,
                })
                return false
            }

            this.logger.info("Access token revoked")
            return true
        } catch (error) {
            this.logger.error(
                "Error revoking token",
                error instanceof Error ? error : new Error(String(error))
            )
            return false
        }
    }
}

/**
 * Create a singleton OAuth service instance
 */
let oauthServiceInstance: YouTubeOAuthService | null = null

/**
 * Get or create the OAuth service
 */
export function getYouTubeOAuthService(
    config: YouTubeChannelLinkingConfig
): YouTubeOAuthService {
    if (!oauthServiceInstance) {
        oauthServiceInstance = new YouTubeOAuthService(config)
    }
    return oauthServiceInstance
}

/**
 * Reset the OAuth service (useful for testing)
 */
export function resetYouTubeOAuthService(): void {
    oauthServiceInstance = null
}
