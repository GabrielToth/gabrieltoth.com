/**
 * Instagram OAuth Service
 * Handles OAuth 2.0 authorization URL generation, token exchange, and token management
 * for the Instagram Graph API (Business/Creator accounts via Facebook Login).
 */

import crypto from "crypto"
import { BaseService, ServiceError } from "../youtube/base-service"
import { InstagramConfig } from "./config"

export interface OAuthTokenResponse {
    accessToken: string
    refreshToken?: string
    expiresIn: number
    tokenType: string
}

export interface AuthorizationUrlResponse {
    authorizationUrl: string
    state: string
}

export interface InstagramBusinessAccount {
    id: string
    username: string
    name: string
    profilePictureUrl?: string
    followerCount?: number
}

export class InstagramOAuthService extends BaseService {
    private readonly graphApiBase = "https://graph.facebook.com"

    constructor(private config: InstagramConfig) {
        super()
    }

    generateAuthorizationUrl(userId: string): AuthorizationUrlResponse {
        this.assertReady()

        try {
            const state = this.generateState()

            const params = new URLSearchParams({
                client_id: this.config.oauth.appId,
                redirect_uri: this.config.oauth.redirectUri,
                response_type: "code",
                scope: this.config.oauth.scopes.join(","),
                state: state,
            })

            const authorizationUrl = `https://www.facebook.com/${this.config.oauth.apiVersion}/dialog/oauth?${params.toString()}`

            this.logger.info("Instagram authorization URL generated", {
                userId,
                state: state.substring(0, 8) + "...",
            })

            return {
                authorizationUrl,
                state,
            }
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to generate Instagram authorization URL",
                { userId }
            )
        }
    }

    private generateState(): string {
        return crypto.randomBytes(32).toString("hex")
    }

    validateState(state: string, storedState: string): boolean {
        try {
            return crypto.timingSafeEqual(
                Buffer.from(state),
                Buffer.from(storedState)
            )
        } catch {
            this.logger.warn("Instagram state validation failed")
            return false
        }
    }

    async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                client_id: this.config.oauth.appId,
                client_secret: this.config.oauth.appSecret,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: this.config.oauth.redirectUri,
            })

            const response = await fetch(
                `${this.graphApiBase}/${this.config.oauth.apiVersion}/oauth/access_token`,
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
                    `Failed to exchange code for token: ${error.error?.message || error.error?.type || "Unknown"}`,
                    400,
                    { error }
                )
            }

            const data = await response.json()

            this.logger.info(
                "Instagram authorization code exchanged for short-lived token"
            )

            const longLivedToken = await this.exchangeForLongLivedToken(
                data.access_token
            )

            return longLivedToken
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to exchange Instagram authorization code for token"
            )
        }
    }

    private async exchangeForLongLivedToken(
        shortLivedToken: string
    ): Promise<OAuthTokenResponse> {
        try {
            const params = new URLSearchParams({
                grant_type: "fb_exchange_token",
                client_id: this.config.oauth.appId,
                client_secret: this.config.oauth.appSecret,
                fb_exchange_token: shortLivedToken,
            })

            const response = await fetch(
                `${this.graphApiBase}/${this.config.oauth.apiVersion}/oauth/access_token?${params.toString()}`
            )

            if (!response.ok) {
                const error = await response.json()
                throw new ServiceError(
                    "LONG_LIVED_TOKEN_FAILED",
                    `Failed to exchange for long-lived token: ${error.error?.message || error.error?.type || "Unknown"}`,
                    400,
                    { error }
                )
            }

            const data = await response.json()

            this.logger.info("Instagram long-lived token obtained")

            return {
                accessToken: data.access_token,
                refreshToken: data.access_token,
                expiresIn: data.expires_in || 5184000,
                tokenType: "bearer",
            }
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to exchange for long-lived token"
            )
        }
    }

    async refreshAccessToken(
        currentToken: string
    ): Promise<OAuthTokenResponse> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                grant_type: "fb_exchange_token",
                client_id: this.config.oauth.appId,
                client_secret: this.config.oauth.appSecret,
                fb_exchange_token: currentToken,
            })

            const response = await fetch(
                `${this.graphApiBase}/${this.config.oauth.apiVersion}/oauth/access_token?${params.toString()}`
            )

            if (!response.ok) {
                const error = await response.json()
                throw new ServiceError(
                    "TOKEN_REFRESH_FAILED",
                    `Failed to refresh Instagram token: ${error.error?.message || error.error?.type || "Unknown"}`,
                    400,
                    { error }
                )
            }

            const data = await response.json()

            this.logger.info("Instagram long-lived token refreshed")

            return {
                accessToken: data.access_token,
                refreshToken: data.access_token,
                expiresIn: data.expires_in || 5184000,
                tokenType: "bearer",
            }
        } catch (error) {
            throw this.handleError(error, "Failed to refresh Instagram token")
        }
    }

    async getBusinessAccount(
        accessToken: string
    ): Promise<InstagramBusinessAccount | null> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                fields: "instagram_business_account{id,username,name,profile_picture_url,followers_count}",
                access_token: accessToken,
            })

            const response = await fetch(
                `${this.graphApiBase}/${this.config.oauth.apiVersion}/me/accounts?${params.toString()}`
            )

            if (!response.ok) {
                const error = await response.json()
                this.logger.warn("Failed to get Facebook Pages", {
                    error: error.error?.message,
                })
                return null
            }

            const data = await response.json()

            const pageWithIg = data.data?.find(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (page: any) => page.instagram_business_account
            )

            if (!pageWithIg?.instagram_business_account) {
                this.logger.warn(
                    "No Facebook Page with linked Instagram Business Account found"
                )
                return null
            }

            const igAccount = pageWithIg.instagram_business_account

            this.logger.info("Instagram Business Account retrieved", {
                igUserId: igAccount.id,
                username: igAccount.username,
            })

            return {
                id: igAccount.id,
                username: igAccount.username,
                name: igAccount.name,
                profilePictureUrl: igAccount.profile_picture_url,
                followerCount: igAccount.followers_count,
            }
        } catch (error) {
            this.logger.error(
                "Failed to get Instagram Business Account",
                error instanceof Error ? error : new Error(String(error))
            )
            return null
        }
    }

    async revokeToken(userId: string, accessToken: string): Promise<boolean> {
        this.assertReady()

        try {
            const response = await fetch(
                `${this.graphApiBase}/${this.config.oauth.apiVersion}/${userId}/permissions?access_token=${accessToken}`,
                { method: "DELETE" }
            )

            if (!response.ok) {
                this.logger.warn("Instagram token revocation failed", {
                    status: response.status,
                })
                return false
            }

            this.logger.info("Instagram access token revoked")
            return true
        } catch (error) {
            this.logger.error(
                "Error revoking Instagram token",
                error instanceof Error ? error : new Error(String(error))
            )
            return false
        }
    }
}

let oauthServiceInstance: InstagramOAuthService | null = null

export function getInstagramOAuthService(
    config: InstagramConfig
): InstagramOAuthService {
    if (!oauthServiceInstance) {
        oauthServiceInstance = new InstagramOAuthService(config)
    }
    return oauthServiceInstance
}

export function resetInstagramOAuthService(): void {
    oauthServiceInstance = null
}
