/**
 * OAuth Manager Service
 * Orchestrates OAuth authentication for multiple social media platforms
 * Supports: YouTube, Facebook, Instagram, Twitter, LinkedIn
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

import crypto from "crypto"
import { CACHE_KEYS, CacheManager } from "../cache"
import { createLogger } from "../logger"

const logger = createLogger("OAuthManager")

/**
 * Supported OAuth platforms
 */
export type OAuthPlatform =
    | "youtube"
    | "facebook"
    | "instagram"
    | "twitter"
    | "linkedin"

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

/**
 * OAuth Manager
 * Handles OAuth flow for multiple platforms
 */
export class OAuthManager {
    private configs: Map<OAuthPlatform, OAuthConfig> = new Map()

    constructor() {
        this.initializeConfigs()
    }

    /**
     * Initialize OAuth configurations for all platforms
     */
    private initializeConfigs(): void {
        // YouTube
        if (
            process.env.YOUTUBE_CLIENT_ID &&
            process.env.YOUTUBE_CLIENT_SECRET
        ) {
            this.configs.set("youtube", {
                clientId: process.env.YOUTUBE_CLIENT_ID,
                clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
                redirectUri:
                    process.env.YOUTUBE_REDIRECT_URI ||
                    "http://localhost:3000/api/oauth/callback/youtube",
                scopes: [
                    "https://www.googleapis.com/auth/youtube.upload",
                    "https://www.googleapis.com/auth/youtube",
                    "https://www.googleapis.com/auth/userinfo.email",
                    "https://www.googleapis.com/auth/userinfo.profile",
                ],
                authorizationUrl:
                    "https://accounts.google.com/o/oauth2/v2/auth",
                tokenUrl: "https://oauth2.googleapis.com/token",
                revokeUrl: "https://oauth2.googleapis.com/revoke",
            })
        }

        // Facebook
        if (
            process.env.FACEBOOK_CLIENT_ID &&
            process.env.FACEBOOK_CLIENT_SECRET
        ) {
            this.configs.set("facebook", {
                clientId: process.env.FACEBOOK_CLIENT_ID,
                clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
                redirectUri:
                    process.env.FACEBOOK_REDIRECT_URI ||
                    "http://localhost:3000/api/oauth/callback/facebook",
                scopes: [
                    "pages_manage_posts",
                    "pages_read_engagement",
                    "pages_manage_metadata",
                ],
                authorizationUrl: "https://www.facebook.com/v18.0/dialog/oauth",
                tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
            })
        }

        // Instagram
        if (
            process.env.INSTAGRAM_CLIENT_ID &&
            process.env.INSTAGRAM_CLIENT_SECRET
        ) {
            this.configs.set("instagram", {
                clientId: process.env.INSTAGRAM_CLIENT_ID,
                clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
                redirectUri:
                    process.env.INSTAGRAM_REDIRECT_URI ||
                    "http://localhost:3000/api/oauth/callback/instagram",
                scopes: [
                    "instagram_business_basic",
                    "instagram_business_content_publish",
                    "instagram_business_manage_messages",
                ],
                authorizationUrl: "https://api.instagram.com/oauth/authorize",
                tokenUrl:
                    "https://graph.instagram.com/v18.0/oauth/access_token",
            })
        }

        // Twitter
        if (
            process.env.TWITTER_CLIENT_ID &&
            process.env.TWITTER_CLIENT_SECRET
        ) {
            this.configs.set("twitter", {
                clientId: process.env.TWITTER_CLIENT_ID,
                clientSecret: process.env.TWITTER_CLIENT_SECRET,
                redirectUri:
                    process.env.TWITTER_REDIRECT_URI ||
                    "http://localhost:3000/api/oauth/callback/twitter",
                scopes: ["tweet.write", "tweet.read", "users.read"],
                authorizationUrl: "https://twitter.com/i/oauth2/authorize",
                tokenUrl: "https://api.twitter.com/2/oauth2/token",
                revokeUrl: "https://api.twitter.com/2/oauth2/revoke",
            })
        }

        // LinkedIn
        if (
            process.env.LINKEDIN_CLIENT_ID &&
            process.env.LINKEDIN_CLIENT_SECRET
        ) {
            this.configs.set("linkedin", {
                clientId: process.env.LINKEDIN_CLIENT_ID,
                clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
                redirectUri:
                    process.env.LINKEDIN_REDIRECT_URI ||
                    "http://localhost:3000/api/oauth/callback/linkedin",
                scopes: ["w_member_social", "r_liteprofile", "r_emailaddress"],
                authorizationUrl:
                    "https://www.linkedin.com/oauth/v2/authorization",
                tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
                revokeUrl: "https://www.linkedin.com/oauth/v2/revoke",
            })
        }

        logger.info("OAuth configurations initialized", {
            platforms: Array.from(this.configs.keys()),
        })
    }

    /**
     * Get supported platforms
     */
    getSupportedPlatforms(): OAuthPlatform[] {
        return Array.from(this.configs.keys())
    }

    /**
     * Check if platform is configured
     */
    isPlatformConfigured(platform: OAuthPlatform): boolean {
        return this.configs.has(platform)
    }

    /**
     * Generate OAuth authorization URL
     * Requirement 10.1: Generate OAuth authorization URL
     * Requirement 10.2: Store state parameter in Redis with expiration
     */
    async generateAuthorizationUrl(
        platform: OAuthPlatform,
        userId: string
    ): Promise<AuthorizationUrlResponse> {
        const config = this.configs.get(platform)
        if (!config) {
            throw new Error(`Platform ${platform} is not configured`)
        }

        try {
            // Generate cryptographically secure state parameter
            const state = this.generateState()

            // Store state in cache with 10-minute expiration
            const stateKey = `oauth:state:${platform}:${userId}`
            await CacheManager.set(stateKey, state, 10 * 60)

            // Build authorization URL
            const params = new URLSearchParams({
                client_id: config.clientId,
                redirect_uri: config.redirectUri,
                response_type: "code",
                scope: config.scopes.join(" "),
                state: state,
            })

            // Platform-specific parameters
            if (platform === "youtube") {
                params.append("access_type", "offline")
                params.append("prompt", "consent")
            } else if (platform === "facebook") {
                params.append("display", "popup")
            } else if (platform === "twitter") {
                params.append("code_challenge_method", "plain")
                params.append("code_challenge", state)
            }

            const authorizationUrl = `${config.authorizationUrl}?${params.toString()}`

            logger.info("Authorization URL generated", {
                platform,
                userId,
                state: state.substring(0, 8) + "...",
            })

            return {
                authorizationUrl,
                state,
                platform,
            }
        } catch (error) {
            logger.error("Failed to generate authorization URL", {
                platform,
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Validate state parameter
     * Requirement 10.3: Validate state parameter
     */
    async validateState(
        platform: OAuthPlatform,
        userId: string,
        state: string
    ): Promise<boolean> {
        try {
            const stateKey = `oauth:state:${platform}:${userId}`
            const storedState = await CacheManager.get<string>(stateKey)

            if (!storedState) {
                logger.warn("State not found in cache", { platform, userId })
                return false
            }

            // Use constant-time comparison to prevent timing attacks
            const isValid = crypto.timingSafeEqual(
                Buffer.from(state),
                Buffer.from(storedState)
            )

            if (isValid) {
                // Delete state from cache after validation
                await CacheManager.delete(stateKey)
            }

            return isValid
        } catch (error) {
            logger.error("State validation failed", {
                platform,
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Exchange authorization code for access token
     * Requirement 10.3: Exchange authorization code for token
     */
    async exchangeCodeForToken(
        platform: OAuthPlatform,
        code: string,
        userId: string
    ): Promise<OAuthTokenResponse> {
        const config = this.configs.get(platform)
        if (!config) {
            throw new Error(`Platform ${platform} is not configured`)
        }

        try {
            const params = new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: config.redirectUri,
            })

            const response = await fetch(config.tokenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(
                    `Token exchange failed: ${error.error_description || error.error}`
                )
            }

            const data = await response.json()

            const tokenResponse: OAuthTokenResponse = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
                tokenType: data.token_type,
                scope: data.scope,
                platform,
                userId,
                linkedAt: Date.now(),
            }

            logger.info("Authorization code exchanged for token", {
                platform,
                userId,
            })

            return tokenResponse
        } catch (error) {
            logger.error("Failed to exchange authorization code for token", {
                platform,
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Refresh access token
     * Requirement 10.4: Handle OAuth token refresh
     */
    async refreshAccessToken(
        platform: OAuthPlatform,
        refreshToken: string,
        userId: string
    ): Promise<OAuthTokenResponse> {
        const config = this.configs.get(platform)
        if (!config) {
            throw new Error(`Platform ${platform} is not configured`)
        }

        try {
            const params = new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            })

            const response = await fetch(config.tokenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(
                    `Token refresh failed: ${error.error_description || error.error}`
                )
            }

            const data = await response.json()

            const tokenResponse: OAuthTokenResponse = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || refreshToken,
                expiresIn: data.expires_in,
                tokenType: data.token_type,
                scope: data.scope,
                platform,
                userId,
                linkedAt: Date.now(),
            }

            logger.info("Access token refreshed", { platform, userId })

            return tokenResponse
        } catch (error) {
            logger.error("Failed to refresh access token", {
                platform,
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Revoke access token
     * Requirement 10.6: Allow users to disconnect networks
     */
    async revokeToken(
        platform: OAuthPlatform,
        accessToken: string,
        userId: string
    ): Promise<boolean> {
        const config = this.configs.get(platform)
        if (!config || !config.revokeUrl) {
            logger.warn("Revoke URL not configured for platform", { platform })
            return false
        }

        try {
            const params = new URLSearchParams({
                token: accessToken,
            })

            const response = await fetch(config.revokeUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            })

            if (!response.ok) {
                logger.warn("Token revocation failed", {
                    platform,
                    userId,
                    status: response.status,
                })
                return false
            }

            logger.info("Access token revoked", { platform, userId })
            return true
        } catch (error) {
            logger.error("Error revoking token", {
                platform,
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Generate cryptographically secure state parameter
     */
    private generateState(): string {
        return crypto.randomBytes(32).toString("hex")
    }

    /**
     * Get OAuth status for all platforms
     * Requirement 10.7: Display connection status
     */
    async getOAuthStatus(userId: string): Promise<OAuthStatus[]> {
        const statuses: OAuthStatus[] = []

        for (const platform of this.getSupportedPlatforms()) {
            const statusKey = CACHE_KEYS.OAUTH_STATUS(userId)
            const cachedStatus = await CacheManager.get<OAuthStatus>(statusKey)

            if (cachedStatus) {
                statuses.push(cachedStatus)
            } else {
                // Default status for uncached platforms
                statuses.push({
                    platform,
                    connected: false,
                    expired: false,
                })
            }
        }

        return statuses
    }
}

/**
 * Create a singleton OAuth Manager instance
 */
let oauthManagerInstance: OAuthManager | null = null

/**
 * Get or create the OAuth Manager
 */
export function getOAuthManager(): OAuthManager {
    if (!oauthManagerInstance) {
        oauthManagerInstance = new OAuthManager()
    }
    return oauthManagerInstance
}

/**
 * Reset the OAuth Manager (useful for testing)
 */
export function resetOAuthManager(): void {
    oauthManagerInstance = null
}
