/**
 * Kick OAuth Service
 * Handles OAuth 2.0 authorization URL generation, token exchange, and token refresh
 * for the Kick API.
 */

import { BaseService, ServiceError } from "../youtube/base-service"
import { KickConfig } from "./config"

export interface OAuthTokenResponse {
    accessToken: string
    refreshToken?: string
    expiresIn: number
    tokenType: string
}

export interface KickUser {
    userId: string
    username: string
    email?: string
    profilePictureUrl?: string
}

export interface KickChannel {
    id: string
    name: string
    slug: string
    followersCount: number
    isLive: boolean
    chatroomId?: number
}

export class KickOAuthService extends BaseService {
    constructor(private config: KickConfig) {
        super()
    }

    generateAuthorizationUrl(userId: string): {
        authorizationUrl: string
        state: string
        codeVerifier: string
        codeChallenge: string
    } {
        this.assertReady()

        try {
            const state = crypto.randomBytes(32).toString("hex")

            // Generate PKCE code verifier and challenge (OAuth 2.1 / Kick requirement)
            const codeVerifier = crypto.randomBytes(32).toString("base64url")
            const codeChallenge = crypto
                .createHash("sha256")
                .update(codeVerifier)
                .digest("base64url")

            const params = new URLSearchParams({
                client_id: this.config.oauth.clientId,
                redirect_uri: this.config.oauth.redirectUri,
                response_type: "code",
                scope: this.config.oauth.scopes.join(" "),
                state: state,
                code_challenge: codeChallenge,
                code_challenge_method: "S256",
            })

            const authorizationUrl = `${this.config.oauthAuthorizeUrl}?${params.toString()}`

            this.logger.info("Kick authorization URL generated", {
                userId,
            })

            return {
                authorizationUrl,
                state,
                codeVerifier,
                codeChallenge,
            }
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to generate Kick authorization URL",
                { userId }
            )
        }
    }

    async exchangeCodeForToken(
        code: string,
        codeVerifier?: string
    ): Promise<OAuthTokenResponse> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                client_id: this.config.oauth.clientId,
                client_secret: this.config.oauth.clientSecret,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: this.config.oauth.redirectUri,
            })

            // PKCE: send code_verifier if provided (Kick OAuth 2.1 requirement)
            if (codeVerifier) {
                params.append("code_verifier", codeVerifier)
            }

            const response = await fetch(this.config.oauthTokenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new ServiceError(
                    "TOKEN_EXCHANGE_FAILED",
                    `Failed to exchange code for token: ${error.error_description || error.error || "Unknown"}`,
                    400,
                    { error }
                )
            }

            const data = await response.json()

            this.logger.info("Kick authorization code exchanged for token")

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in || 3600,
                tokenType: data.token_type || "bearer",
            }
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to exchange Kick authorization code for token"
            )
        }
    }

    async refreshAccessToken(
        currentRefreshToken: string
    ): Promise<OAuthTokenResponse> {
        this.assertReady()

        try {
            const params = new URLSearchParams({
                client_id: this.config.oauth.clientId,
                client_secret: this.config.oauth.clientSecret,
                refresh_token: currentRefreshToken,
                grant_type: "refresh_token",
            })

            const response = await fetch(this.config.oauthTokenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new ServiceError(
                    "TOKEN_REFRESH_FAILED",
                    `Failed to refresh Kick token: ${error.error_description || error.error || "Unknown"}`,
                    400,
                    { error }
                )
            }

            const data = await response.json()

            this.logger.info("Kick token refreshed")

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in || 3600,
                tokenType: data.token_type || "bearer",
            }
        } catch (error) {
            throw this.handleError(error, "Failed to refresh Kick token")
        }
    }

    async getUser(accessToken: string): Promise<KickUser | null> {
        this.assertReady()

        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}/public/v1/users`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )

            if (!response.ok) {
                this.logger.warn("Failed to get Kick user", {
                    status: response.status,
                })
                return null
            }

            const data = await response.json()
            const user = data.data?.[0] || data

            return {
                userId: String(user.user_id || user.id),
                username: user.name || user.username,
                email: user.email,
                profilePictureUrl: user.profile_picture || user.avatar,
            }
        } catch (error) {
            this.logger.error(
                "Failed to get Kick user",
                error instanceof Error ? error : new Error(String(error))
            )
            return null
        }
    }

    async getChannel(accessToken: string): Promise<KickChannel | null> {
        this.assertReady()

        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}/public/v1/channels`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )

            if (!response.ok) {
                this.logger.warn("Failed to get Kick channel", {
                    status: response.status,
                })
                return null
            }

            const data = await response.json()
            const channel = data.data?.[0] || data

            const chatroomId = channel.chatroom?.id
                ? parseInt(String(channel.chatroom.id), 10)
                : undefined

            this.logger.debug("Kick channel API raw data", {
                hasChatroom: !!channel.chatroom,
                chatroomId,
                keys: Object.keys(channel).join(","),
            })

            return {
                id: String(channel.broadcaster_user_id || channel.id),
                name: channel.stream_title || channel.name || "",
                slug: channel.slug || "",
                followersCount: 0,
                isLive: channel.stream?.is_live ?? false,
                chatroomId,
            }
        } catch (error) {
            this.logger.error(
                "Failed to get Kick channel",
                error instanceof Error ? error : new Error(String(error))
            )
            return null
        }
    }

    async revokeToken(accessToken: string): Promise<boolean> {
        this.assertReady()

        try {
            const response = await fetch(
                `${this.config.oauthTokenUrl}/revoke`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        client_id: this.config.oauth.clientId,
                        client_secret: this.config.oauth.clientSecret,
                        token: accessToken,
                    }).toString(),
                }
            )

            if (!response.ok) {
                this.logger.warn("Kick token revocation failed", {
                    status: response.status,
                })
                return false
            }

            this.logger.info("Kick access token revoked")
            return true
        } catch (error) {
            this.logger.error(
                "Error revoking Kick token",
                error instanceof Error ? error : new Error(String(error))
            )
            return false
        }
    }
}

import crypto from "crypto"

let oauthServiceInstance: KickOAuthService | null = null

export function getKickOAuthService(config: KickConfig): KickOAuthService {
    if (!oauthServiceInstance) {
        oauthServiceInstance = new KickOAuthService(config)
    }
    return oauthServiceInstance
}

export function resetKickOAuthService(): void {
    oauthServiceInstance = null
}
