/**
 * LinkedIn OAuth Service
 * Handles OAuth 2.0 Authorization Code flow for LinkedIn API v2.
 *
 * LinkedIn uses standard OAuth 2.0 (no PKCE required).
 * Token endpoint: https://www.linkedin.com/oauth/v2/accessToken
 * Profile API: https://api.linkedin.com/v2/me
 * Post API (new): https://api.linkedin.com/v2/rest/posts
 * Post API (legacy): https://api.linkedin.com/v2/ugcPosts
 */

import { BaseService, ServiceError } from "../youtube/base-service"
import { LinkedInConfig } from "./config"

export interface OAuthTokenResponse {
    accessToken: string
    refreshToken: string
    expiresIn: number
    tokenType: string
}

export interface AuthorizationUrlResponse {
    authorizationUrl: string
    state: string
}

export interface LinkedInUser {
    sub: string
    name: string
    givenName: string
    familyName: string
    picture?: string
    email?: string
    emailVerified?: boolean
    locale?: string
}

export class LinkedInOAuthService extends BaseService {
    private readonly apiBase = "https://api.linkedin.com/v2"
    private readonly authBase =
        "https://www.linkedin.com/oauth/v2/authorization"
    private readonly tokenBase = "https://www.linkedin.com/oauth/v2/accessToken"

    constructor(private config: LinkedInConfig) {
        super()
    }

    /**
     * Generate LinkedIn authorization URL with state parameter.
     */
    generateAuthorizationUrl(userId: string): AuthorizationUrlResponse {
        this.assertReady()

        const state = crypto.randomUUID()

        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.config.oauth.clientId,
            redirect_uri: this.config.oauth.redirectUri,
            scope: this.config.oauth.scopes.join(" "),
            state,
        })

        const authorizationUrl = `${this.authBase}?${params.toString()}`

        this.logger.info("LinkedIn authorization URL generated", { userId })

        return { authorizationUrl, state }
    }

    /**
     * Exchange authorization code for access token.
     * LinkedIn uses standard form-encoded POST with client credentials.
     */
    async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
        this.assertReady()

        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            client_id: this.config.oauth.clientId,
            client_secret: this.config.oauth.clientSecret,
            redirect_uri: this.config.oauth.redirectUri,
        })

        const response = await fetch(this.tokenBase, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
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
                `Invalid JSON response from LinkedIn: ${text.slice(0, 500)}`,
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

        this.logger.info("LinkedIn authorization code exchanged for token", {
            hasAccessToken: "access_token" in data,
            expiresIn: data.expires_in,
        })

        return {
            accessToken: data.access_token as string,
            refreshToken: (data.refresh_token as string) || "",
            expiresIn: (data.expires_in as number) || 7200,
            tokenType: (data.token_type as string) || "bearer",
        }
    }

    /**
     * Refresh an expired access token using the refresh token.
     */
    async refreshAccessToken(
        refreshToken: string
    ): Promise<OAuthTokenResponse> {
        this.assertReady()

        const params = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: this.config.oauth.clientId,
            client_secret: this.config.oauth.clientSecret,
        })

        const response = await fetch(this.tokenBase, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new ServiceError(
                "TOKEN_REFRESH_FAILED",
                `Failed to refresh LinkedIn token: ${data.error_description || data.error || "Unknown"}`,
                400,
                { error: data }
            )
        }

        this.logger.info("LinkedIn access token refreshed")

        return {
            accessToken: data.access_token as string,
            refreshToken: (data.refresh_token as string) || refreshToken,
            expiresIn: (data.expires_in as number) || 7200,
            tokenType: (data.token_type as string) || "bearer",
        }
    }

    /**
     * Revoke a LinkedIn access token.
     */
    async revokeToken(accessToken: string): Promise<boolean> {
        this.assertReady()

        const params = new URLSearchParams({
            token: accessToken,
        })

        const response = await fetch(
            "https://www.linkedin.com/oauth/v2/revoke",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            }
        )

        if (!response.ok) {
            this.logger.warn("LinkedIn token revocation failed", {
                status: response.status,
            })
            return false
        }

        this.logger.info("LinkedIn access token revoked")
        return true
    }

    /**
     * Get the authenticated user's LinkedIn profile info.
     * Uses OpenID Connect /userinfo endpoint for standardized profile data.
     */
    async getUserInfo(accessToken: string): Promise<LinkedInUser | null> {
        this.assertReady()

        if (!accessToken) {
            this.logger.error(
                "Cannot get LinkedIn user info: no access token provided"
            )
            return null
        }

        try {
            // Use OpenID Connect userinfo endpoint for standardized profile
            const response = await fetch(
                "https://api.linkedin.com/v2/userinfo",
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )

            if (response.ok) {
                const data = await response.json()
                return {
                    sub: data.sub,
                    name: data.name || "",
                    givenName: data.given_name || "",
                    familyName: data.family_name || "",
                    picture: data.picture,
                    email: data.email,
                    emailVerified: data.email_verified,
                    locale: data.locale,
                }
            }

            // Fallback to legacy /me endpoint
            const meResponse = await fetch(`${this.apiBase}/me`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (meResponse.ok) {
                const data = await meResponse.json()
                return {
                    sub: data.id,
                    name: `${data.localizedFirstName || ""} ${data.localizedLastName || ""}`.trim(),
                    givenName: data.localizedFirstName || "",
                    familyName: data.localizedLastName || "",
                    picture:
                        data.profilePicture?.["displayImage~"]?.elements?.[0]
                            ?.identifiers?.[0]?.identifier,
                }
            }

            this.logger.warn("Failed to get LinkedIn user info")
            return null
        } catch (error) {
            this.logger.error(
                "Error getting LinkedIn user info",
                error instanceof Error ? error : new Error(String(error))
            )
            return null
        }
    }
}

let oauthServiceInstance: LinkedInOAuthService | null = null

export function getLinkedInOAuthService(
    config: LinkedInConfig
): LinkedInOAuthService {
    if (!oauthServiceInstance) {
        oauthServiceInstance = new LinkedInOAuthService(config)
    }
    return oauthServiceInstance
}

export function resetLinkedInOAuthService(): void {
    oauthServiceInstance = null
}
