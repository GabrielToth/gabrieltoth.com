/**
 * Twitch OAuth Service
 * Handles OAuth flow and API calls for Twitch integration.
 * Uses Twitch Helix API (api.twitch.tv/helix) for data operations.
 */

import { createLogger } from "../logger"
import type { TwitchConfig } from "./config"

const logger = createLogger("TwitchOAuthService")

export interface TwitchUser {
    id: string
    login: string
    displayName: string
    type: string
    broadcasterType: string
    description: string
    profileImageUrl: string
    offlineImageUrl: string
    email?: string
    createdAt: string
}

export interface TwitchChannel {
    broadcasterId: string
    broadcasterLogin: string
    broadcasterName: string
    broadcasterLanguage: string
    gameId: string
    gameName: string
    title: string
    delay: number
    tags: string[]
    contentClassificationLabels: string[]
}

export interface TwitchStreamKey {
    streamKey: string
}

export interface TwitchStream {
    id: string
    userId: string
    userLogin: string
    userName: string
    gameId: string
    gameName: string
    type: string
    title: string
    viewerCount: number
    startedAt: string
    language: string
    thumbnailUrl: string
    tagIds: string[]
    isMature: boolean
}

export interface AuthorizationUrlResponse {
    authorizationUrl: string
    state: string
}

export interface OAuthTokenResponse {
    accessToken: string
    refreshToken?: string
    expiresIn: number
    tokenType: string
    scope: string
}

export class TwitchOAuthService {
    private config: TwitchConfig
    private initialized = false

    constructor(config: TwitchConfig) {
        this.config = config
    }

    async initialize(): Promise<void> {
        if (this.initialized) return
        this.initialized = true
        logger.debug("Twitch OAuth service initialized")
    }

    /**
     * Generate authorization URL for Twitch OAuth flow
     */
    generateAuthorizationUrl(state: string): AuthorizationUrlResponse {
        const params = new URLSearchParams({
            client_id: this.config.oauth.clientId,
            redirect_uri: this.config.oauth.redirectUri,
            response_type: "code",
            scope: this.config.oauth.scopes.join(" "),
            state,
        })

        const authorizationUrl = `${this.config.oauthAuthorizeUrl}?${params.toString()}`

        return { authorizationUrl, state }
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
        const body = new URLSearchParams({
            client_id: this.config.oauth.clientId,
            client_secret: this.config.oauth.clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: this.config.oauth.redirectUri,
        })

        const response = await fetch(this.config.oauthTokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
        })

        if (!response.ok) {
            const errorText = await response.text()
            logger.error("Twitch token exchange failed", {
                status: response.status,
                error: errorText,
            })
            throw new Error(
                `Twitch token exchange failed: ${response.status} ${errorText}`
            )
        }

        const data = await response.json()

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
            scope: data.scope,
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(
        refreshToken: string
    ): Promise<OAuthTokenResponse> {
        const body = new URLSearchParams({
            client_id: this.config.oauth.clientId,
            client_secret: this.config.oauth.clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        })

        const response = await fetch(this.config.oauthTokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
        })

        if (!response.ok) {
            const errorText = await response.text()
            logger.error("Twitch token refresh failed", {
                status: response.status,
                error: errorText,
            })
            throw new Error(
                `Twitch token refresh failed: ${response.status} ${errorText}`
            )
        }

        const data = await response.json()

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
            scope: data.scope,
        }
    }

    /**
     * Get user info from Twitch
     */
    async getUser(accessToken: string): Promise<TwitchUser | null> {
        const response = await fetch(`${this.config.apiBaseUrl}/users`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Client-Id": this.config.oauth.clientId,
            },
        })

        if (!response.ok) {
            logger.error("Failed to get Twitch user", {
                status: response.status,
            })
            return null
        }

        const data = await response.json()
        if (!data.data || data.data.length === 0) return null

        const user = data.data[0]
        return {
            id: user.id,
            login: user.login,
            displayName: user.display_name,
            type: user.type,
            broadcasterType: user.broadcaster_type,
            description: user.description,
            profileImageUrl: user.profile_image_url,
            offlineImageUrl: user.offline_image_url,
            email: user.email,
            createdAt: user.created_at,
        }
    }

    /**
     * Get channel info from Twitch
     */
    async getChannel(
        accessToken: string,
        broadcasterId: string
    ): Promise<TwitchChannel | null> {
        const params = new URLSearchParams({
            broadcaster_id: broadcasterId,
        })

        const response = await fetch(
            `${this.config.apiBaseUrl}/channels?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Client-Id": this.config.oauth.clientId,
                },
            }
        )

        if (!response.ok) {
            logger.error("Failed to get Twitch channel", {
                status: response.status,
            })
            return null
        }

        const data = await response.json()
        if (!data.data || data.data.length === 0) return null

        const channel = data.data[0]
        return {
            broadcasterId: channel.broadcaster_id,
            broadcasterLogin: channel.broadcaster_login,
            broadcasterName: channel.broadcaster_name,
            broadcasterLanguage: channel.broadcaster_language,
            gameId: channel.game_id,
            gameName: channel.game_name,
            title: channel.title,
            delay: channel.delay,
            tags: channel.tags || [],
            contentClassificationLabels:
                channel.content_classification_labels || [],
        }
    }

    /**
     * Get stream info from Twitch
     */
    async getStream(
        accessToken: string,
        broadcasterId: string
    ): Promise<TwitchStream | null> {
        const params = new URLSearchParams({
            broadcaster_id: broadcasterId,
        })

        const response = await fetch(
            `${this.config.apiBaseUrl}/streams?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Client-Id": this.config.oauth.clientId,
                },
            }
        )

        if (!response.ok) {
            logger.error("Failed to get Twitch stream", {
                status: response.status,
            })
            return null
        }

        const data = await response.json()
        if (!data.data || data.data.length === 0) return null

        const stream = data.data[0]
        return {
            id: stream.id,
            userId: stream.user_id,
            userLogin: stream.user_login,
            userName: stream.user_name,
            gameId: stream.game_id,
            gameName: stream.game_name,
            type: stream.type,
            title: stream.title,
            viewerCount: stream.viewer_count,
            startedAt: stream.started_at,
            language: stream.language,
            thumbnailUrl: stream.thumbnail_url,
            tagIds: stream.tag_ids || [],
            isMature: stream.is_mature,
        }
    }

    /**
     * Get stream key from Twitch
     * Requires channel:read:stream_key scope
     */
    async getStreamKey(
        accessToken: string,
        broadcasterId: string
    ): Promise<TwitchStreamKey | null> {
        const params = new URLSearchParams({
            broadcaster_id: broadcasterId,
        })

        const response = await fetch(
            `${this.config.apiBaseUrl}/streams/key?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Client-Id": this.config.oauth.clientId,
                },
            }
        )

        if (response.status === 403) {
            logger.warn("Missing scope: channel:read:stream_key", {
                status: response.status,
                broadcasterId,
            })
            return null
        }

        if (!response.ok) {
            logger.error("Failed to get Twitch stream key", {
                status: response.status,
            })
            return null
        }

        const data = await response.json()
        if (!data.data || data.data.length === 0) return null

        return {
            streamKey: data.data[0].stream_key,
        }
    }

    /**
     * Modify channel info (title, game, tags, etc.)
     */
    async modifyChannel(
        accessToken: string,
        broadcasterId: string,
        data: {
            title?: string
            game_id?: string
            broadcaster_language?: string
            delay?: number
            tags?: string[]
            content_classification_labels?: string[]
        }
    ): Promise<boolean> {
        const body: Record<string, unknown> = {
            ...data,
        }

        const response = await fetch(
            `${this.config.apiBaseUrl}/channels?broadcaster_id=${broadcasterId}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Client-Id": this.config.oauth.clientId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            logger.error("Failed to modify Twitch channel", {
                status: response.status,
                error: errorText,
            })
            return false
        }

        return true
    }

    /**
     * Revoke Twitch OAuth token
     */
    async revokeToken(accessToken: string): Promise<boolean> {
        const body = new URLSearchParams({
            client_id: this.config.oauth.clientId,
            token: accessToken,
        })

        const response = await fetch(this.config.oauthRevokeUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
        })

        if (!response.ok) {
            logger.warn("Twitch token revocation returned non-200", {
                status: response.status,
            })
        }

        return true
    }

    /**
     * Get the top games (categories) from Twitch for stream category selection
     */
    async getTopGames(
        accessToken: string,
        query?: string,
        first: number = 20
    ): Promise<Array<{ id: string; name: string; boxArtUrl: string }>> {
        let url: string

        if (query) {
            const params = new URLSearchParams({
                query,
                first: first.toString(),
            })
            url = `${this.config.apiBaseUrl}/search/categories?${params.toString()}`
        } else {
            const params = new URLSearchParams({
                first: first.toString(),
            })
            url = `${this.config.apiBaseUrl}/games/top?${params.toString()}`
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Client-Id": this.config.oauth.clientId,
            },
        })

        if (!response.ok) {
            logger.error("Failed to get Twitch games", {
                status: response.status,
            })
            return []
        }

        const data = await response.json()
        return (data.data || []).map(
            (game: { id: string; name: string; box_art_url: string }) => ({
                id: game.id,
                name: game.name,
                boxArtUrl: game.box_art_url,
            })
        )
    }
}

let serviceInstance: TwitchOAuthService | null = null

export function getTwitchOAuthService(
    config: TwitchConfig
): TwitchOAuthService {
    if (!serviceInstance) {
        serviceInstance = new TwitchOAuthService(config)
    }
    return serviceInstance
}

export function resetTwitchOAuthService(): void {
    serviceInstance = null
}
