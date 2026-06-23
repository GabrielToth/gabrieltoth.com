import crypto from "crypto"
import { BaseService, ServiceError } from "../youtube/base-service"
import { FacebookConfig } from "./config"

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

export interface FacebookUser {
    id: string
    name: string
    email?: string
    pictureUrl?: string
}

export interface FacebookPage {
    id: string
    name: string
    category?: string
    accessToken?: string
    tasks?: string[]
    pictureUrl?: string
    followerCount?: number
}

export class FacebookOAuthService extends BaseService {
    private readonly graphApiBase = "https://graph.facebook.com"

    constructor(private config: FacebookConfig) {
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
                state,
            })

            const authorizationUrl = `https://www.facebook.com/${this.config.oauth.apiVersion}/dialog/oauth?${params.toString()}`

            this.logger.info("Facebook authorization URL generated", {
                userId,
            })

            return { authorizationUrl, state }
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to generate Facebook authorization URL",
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
            this.logger.warn("Facebook state validation failed")
            return false
        }
    }

    async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                client_id: this.config.oauth.appId,
                client_secret: this.config.oauth.appSecret,
                code,
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
                "Facebook authorization code exchanged for short-lived token"
            )

            const longLivedToken = await this.exchangeForLongLivedToken(
                data.access_token
            )

            return longLivedToken
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to exchange Facebook authorization code for token"
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

            this.logger.info("Facebook long-lived token obtained")

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
                    `Failed to refresh Facebook token: ${error.error?.message || error.error?.type || "Unknown"}`,
                    400,
                    { error }
                )
            }

            const data = await response.json()

            this.logger.info("Facebook long-lived token refreshed")

            return {
                accessToken: data.access_token,
                refreshToken: data.access_token,
                expiresIn: data.expires_in || 5184000,
                tokenType: "bearer",
            }
        } catch (error) {
            throw this.handleError(error, "Failed to refresh Facebook token")
        }
    }

    async getCurrentUser(accessToken: string): Promise<FacebookUser | null> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                fields: "id,name,email,picture.width(200).height(200)",
                access_token: accessToken,
            })

            const response = await fetch(
                `${this.graphApiBase}/${this.config.oauth.apiVersion}/me?${params.toString()}`
            )

            if (!response.ok) {
                const error = await response.json()
                this.logger.warn("Failed to get Facebook user", {
                    error: error.error?.message,
                })
                return null
            }

            const data = await response.json()

            return {
                id: data.id,
                name: data.name,
                email: data.email,
                pictureUrl: data.picture?.data?.url,
            }
        } catch (error) {
            this.logger.error(
                "Failed to get Facebook user",
                error instanceof Error ? error : new Error(String(error))
            )
            return null
        }
    }

    async getUserPages(accessToken: string): Promise<FacebookPage[]> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                fields: [
                    "id",
                    "name",
                    "category",
                    "access_token",
                    "tasks",
                    "picture.width(200).height(200)",
                    "followers_count",
                ].join(","),
                access_token: accessToken,
                limit: "100",
            })

            const response = await fetch(
                `${this.graphApiBase}/${this.config.oauth.apiVersion}/me/accounts?${params.toString()}`
            )

            if (!response.ok) {
                const error = await response.json()
                throw new ServiceError(
                    "PAGES_FETCH_FAILED",
                    `Failed to get Facebook Pages: ${error.error?.message || "Unknown"}`,
                    400,
                    { error }
                )
            }

            const data = await response.json()

            const pages: FacebookPage[] = (data.data || []).map(
                (page: any) => ({
                    id: page.id,
                    name: page.name,
                    category: page.category,
                    accessToken: page.access_token,
                    tasks: page.tasks,
                    pictureUrl: page.picture?.data?.url,
                    followerCount: page.followers_count,
                })
            )

            this.logger.info("Facebook Pages retrieved", {
                count: pages.length,
            })

            return pages
        } catch (error) {
            throw this.handleError(error, "Failed to get Facebook Pages")
        }
    }

    async getPageAccessToken(
        pageId: string,
        userAccessToken: string
    ): Promise<string | null> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                fields: "access_token",
                access_token: userAccessToken,
            })

            const response = await fetch(
                `${this.graphApiBase}/${this.config.oauth.apiVersion}/${pageId}?${params.toString()}`
            )

            if (!response.ok) {
                const error = await response.json()
                this.logger.warn("Failed to get Page access token", {
                    pageId,
                    error: error.error?.message,
                })
                return null
            }

            const data = await response.json()

            return data.access_token || null
        } catch (error) {
            this.logger.error(
                "Failed to get Page access token",
                error instanceof Error ? error : new Error(String(error))
            )
            return null
        }
    }

    async revokeToken(accessToken: string): Promise<boolean> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                access_token: accessToken,
            })

            const response = await fetch(
                `${this.graphApiBase}/${this.config.oauth.apiVersion}/me/permissions?${params.toString()}`,
                { method: "DELETE" }
            )

            if (!response.ok) {
                this.logger.warn("Facebook token revocation failed", {
                    status: response.status,
                })
                return false
            }

            this.logger.info("Facebook access token revoked")
            return true
        } catch (error) {
            this.logger.error(
                "Error revoking Facebook token",
                error instanceof Error ? error : new Error(String(error))
            )
            return false
        }
    }
}

let oauthServiceInstance: FacebookOAuthService | null = null

export function getFacebookOAuthService(
    config: FacebookConfig
): FacebookOAuthService {
    if (!oauthServiceInstance) {
        oauthServiceInstance = new FacebookOAuthService(config)
    }
    return oauthServiceInstance
}

export function resetFacebookOAuthService(): void {
    oauthServiceInstance = null
}
