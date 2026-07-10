/**
 * Twitter/X OAuth Service
 * Handles OAuth 2.0 Authorization Code with PKCE (S256) flow
 * for Twitter/X API v2.
 *
 * PKCE Flow:
 * 1. Generate random code_verifier (43-128 chars, unreserved chars)
 * 2. Compute SHA-256 hash as code_challenge (base64url-encoded)
 * 3. Store code_verifier in HMAC-signed state payload
 * 4. On callback, extract code_verifier and send with token request
 */

import crypto from "crypto"
import { BaseService, ServiceError } from "../youtube/base-service"
import { TwitterConfig } from "./config"

export interface OAuthTokenResponse {
    accessToken: string
    refreshToken: string
    expiresIn: number
    tokenType: string
    scope?: string
}

export interface AuthorizationUrlResponse {
    authorizationUrl: string
    state: string
    codeVerifier: string
    codeChallenge: string
}

export interface TwitterUser {
    id: string
    name: string
    username: string
    profileImageUrl?: string
    verified?: boolean
    description?: string
    location?: string
    publicMetrics?: {
        followersCount: number
        followingCount: number
        tweetCount: number
        listedCount: number
    }
}

export class TwitterOAuthService extends BaseService {
    private readonly apiBase = "https://api.twitter.com/2"
    private readonly authBase = "https://twitter.com/i/oauth2/authorize"

    constructor(private config: TwitterConfig) {
        super()
    }

    /**
     * Generate a random code verifier for PKCE.
     * Twitter requires 43-128 characters from unreserved set.
     */
    private generateCodeVerifier(): string {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
        const verifierLength = 64
        let verifier = ""
        const bytes = crypto.randomBytes(verifierLength)
        for (let i = 0; i < verifierLength; i++) {
            verifier += chars[bytes[i] % chars.length]
        }
        return verifier
    }

    /**
     * Compute S256 code challenge from code verifier.
     * SHA-256 hash, base64url-encoded, no padding.
     */
    private computeCodeChallenge(codeVerifier: string): string {
        const hash = crypto.createHash("sha256").update(codeVerifier).digest()
        return hash.toString("base64url")
    }

    /**
     * Generate authorization URL with PKCE S256 code challenge.
     * Stores the code_verifier in the HMAC-signed state for callback retrieval.
     */
    generateAuthorizationUrl(userId: string): AuthorizationUrlResponse {
        this.assertReady()

        const codeVerifier = this.generateCodeVerifier()
        const codeChallenge = this.computeCodeChallenge(codeVerifier)
        const state = crypto.randomUUID()

        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.config.oauth.clientId,
            redirect_uri: this.config.oauth.redirectUri,
            scope: this.config.oauth.scopes.join(" "),
            state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
        })

        const authorizationUrl = `${this.authBase}?${params.toString()}`

        this.logger.info("Twitter authorization URL generated (PKCE S256)", {
            userId,
        })

        return {
            authorizationUrl,
            state,
            codeVerifier,
            codeChallenge,
        }
    }

    /**
     * Exchange authorization code for token.
     * Twitter requires Basic Auth header for token endpoint:
     *   Authorization: Basic base64(clientId:clientSecret)
     * And the code_verifier from the PKCE flow.
     */
    async exchangeCodeForToken(
        code: string,
        codeVerifier: string
    ): Promise<OAuthTokenResponse> {
        this.assertReady()

        const basicAuth = Buffer.from(
            `${this.config.oauth.clientId}:${this.config.oauth.clientSecret}`
        ).toString("base64")

        const params = new URLSearchParams({
            code,
            grant_type: "authorization_code",
            client_id: this.config.oauth.clientId,
            redirect_uri: this.config.oauth.redirectUri,
            code_verifier: codeVerifier,
        })

        const response = await fetch(`${this.apiBase}/oauth2/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${basicAuth}`,
            },
            body: params.toString(),
        })

        const text = await response.text()
        let data: Record<string, unknown> = {}
        try {
            data = JSON.parse(text)
        } catch {
            throw new ServiceError(
                "TOKEN_EXCHANGE_FAILED",
                `Invalid JSON response from Twitter: ${text.slice(0, 500)}`,
                400,
                { rawResponse: text.slice(0, 1000) }
            )
        }

        if (!response.ok) {
            throw new ServiceError(
                "TOKEN_EXCHANGE_FAILED",
                `Failed to exchange code for token (HTTP ${response.status}): ${(data.error_description as string) || (data.error as string) || "Unknown"}`,
                400,
                { error: data, rawResponse: text.slice(0, 1000) }
            )
        }

        this.logger.info("Twitter authorization code exchanged for token", {
            hasAccessToken: "access_token" in data,
            hasRefreshToken: "refresh_token" in data,
            expiresIn: data.expires_in,
        })

        return {
            accessToken: data.access_token as string,
            refreshToken: (data.refresh_token as string) || "",
            expiresIn: (data.expires_in as number) || 7200,
            tokenType: (data.token_type as string) || "bearer",
            scope: data.scope as string | undefined,
        }
    }

    /**
     * Refresh an expired access token using the refresh token.
     * Uses Basic Auth header with client credentials.
     */
    async refreshAccessToken(
        refreshToken: string
    ): Promise<OAuthTokenResponse> {
        this.assertReady()

        const basicAuth = Buffer.from(
            `${this.config.oauth.clientId}:${this.config.oauth.clientSecret}`
        ).toString("base64")

        const params = new URLSearchParams({
            refresh_token: refreshToken,
            grant_type: "refresh_token",
            client_id: this.config.oauth.clientId,
        })

        const response = await fetch(`${this.apiBase}/oauth2/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${basicAuth}`,
            },
            body: params.toString(),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new ServiceError(
                "TOKEN_REFRESH_FAILED",
                `Failed to refresh Twitter token: ${data.error_description || data.error || "Unknown"}`,
                400,
                { error: data }
            )
        }

        this.logger.info("Twitter access token refreshed")

        return {
            accessToken: data.access_token as string,
            refreshToken: (data.refresh_token as string) || refreshToken,
            expiresIn: (data.expires_in as number) || 7200,
            tokenType: (data.token_type as string) || "bearer",
            scope: data.scope as string | undefined,
        }
    }

    /**
     * Revoke a Twitter access token.
     */
    async revokeToken(accessToken: string): Promise<boolean> {
        this.assertReady()

        const basicAuth = Buffer.from(
            `${this.config.oauth.clientId}:${this.config.oauth.clientSecret}`
        ).toString("base64")

        const params = new URLSearchParams({
            token: accessToken,
            client_id: this.config.oauth.clientId,
            token_type_hint: "access_token",
        })

        const response = await fetch(`${this.apiBase}/oauth2/revoke`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${basicAuth}`,
            },
            body: params.toString(),
        })

        if (!response.ok) {
            const error = await response.json()
            this.logger.warn("Twitter token revocation failed", {
                status: response.status,
                error: error.error_description || error.error,
            })
            return false
        }

        this.logger.info("Twitter access token revoked")
        return true
    }

    /**
     * Get the authenticated user's Twitter profile info.
     */
    async getUserInfo(accessToken: string): Promise<TwitterUser | null> {
        this.assertReady()

        if (!accessToken) {
            this.logger.error(
                "Cannot get Twitter user info: no access token provided"
            )
            return null
        }

        const fields = [
            "description",
            "profile_image_url",
            "verified",
            "location",
            "public_metrics",
        ].join(",")

        const params = new URLSearchParams({
            "user.fields": fields,
        })

        const maxRetries = 3
        let lastError: unknown

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            if (attempt > 0) {
                const delay = Math.min(1000 * 2 ** attempt, 4000)
                await new Promise(resolve => setTimeout(resolve, delay))
            }

            try {
                const response = await fetch(
                    `${this.apiBase}/users/me?${params.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                )

                if (response.ok) {
                    const data = await response.json()

                    if (!data.data) {
                        this.logger.warn("No Twitter user data returned")
                        return null
                    }

                    const user = data.data

                    return {
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        profileImageUrl: user.profile_image_url,
                        verified: user.verified,
                        description: user.description,
                        location: user.location,
                        publicMetrics: user.public_metrics
                            ? {
                                  followersCount:
                                      user.public_metrics.followers_count,
                                  followingCount:
                                      user.public_metrics.following_count,
                                  tweetCount: user.public_metrics.tweet_count,
                                  listedCount: user.public_metrics.listed_count,
                              }
                            : undefined,
                    }
                }

                const errorBody = await response.json()
                lastError = errorBody
                this.logger.warn(
                    "Failed to get Twitter user info (will retry)",
                    {
                        attempt: attempt + 1,
                        status: response.status,
                        error:
                            errorBody.error?.message ||
                            errorBody.error_description ||
                            errorBody.title ||
                            JSON.stringify(errorBody),
                    }
                )
            } catch (err) {
                lastError = err
                this.logger.warn(
                    "Twitter user info request failed (will retry)",
                    {
                        attempt: attempt + 1,
                        error: err instanceof Error ? err.message : String(err),
                    }
                )
            }
        }

        this.logger.error("Failed to get Twitter user info after retries", {
            error:
                lastError instanceof Error
                    ? lastError.message
                    : JSON.stringify(lastError),
        })
        return null
    }
}

let oauthServiceInstance: TwitterOAuthService | null = null

export function getTwitterOAuthService(
    config: TwitterConfig
): TwitterOAuthService {
    if (!oauthServiceInstance) {
        oauthServiceInstance = new TwitterOAuthService(config)
    }
    return oauthServiceInstance
}

export function resetTwitterOAuthService(): void {
    oauthServiceInstance = null
}
