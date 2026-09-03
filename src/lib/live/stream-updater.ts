/**
 * Stream Updater
 * Platform-agnostic helpers to update stream title/category on Twitch, Kick, YouTube.
 * Extracted from /api/live/update route so both the API route and server-side
 * chat commands (!titleall / !categoryall) share the same implementation.
 */

/**
 * POST /api/live/update
 * Updates stream title and game/category for a connected platform
 * Authenticated: requires valid session
 */

import { createLogger } from "@/lib/logger"
import { getKickConfig } from "@/lib/kick/config"
import { getKickOAuthService } from "@/lib/kick/oauth-service"
import { getTokenStore } from "@/lib/token-store"
import { getTwitchConfig } from "@/lib/twitch/config"
import { getTwitchOAuthService } from "@/lib/twitch/oauth-service"
import { getYouTubeOAuthService } from "@/lib/youtube/oauth-service"
import { getYouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import { validateEnv } from "@/lib/config/env"
import {
    isTerminalTokenError,
    markAccountDisconnected,
} from "@/lib/auth/token-health"
import { createClient } from "@supabase/supabase-js"

const logger = createLogger("LiveUpdateEndpoint")

export async function getValidAccessToken(
    userId: string,
    platform: string
): Promise<{ accessToken: string; error?: string }> {
    const tokenStore = getTokenStore()
    const storedToken = await tokenStore.getToken(userId, platform)

    if (!storedToken) {
        return { accessToken: "", error: "NO_TOKEN" }
    }

    if (!storedToken.expiresAt || storedToken.expiresAt > Date.now()) {
        return { accessToken: storedToken.accessToken }
    }

    if (!storedToken.refreshToken) {
        return { accessToken: "", error: "EXPIRED_NO_REFRESH" }
    }

    try {
        let refreshed: {
            accessToken: string
            refreshToken?: string
            expiresIn: number
        }

        if (platform === "twitch") {
            const config = getTwitchConfig()
            const oauthService = getTwitchOAuthService(config)
            await oauthService.initialize()
            refreshed = await oauthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else if (platform === "kick") {
            const config = getKickConfig()
            const oauthService = getKickOAuthService(config)
            await oauthService.initialize()
            refreshed = await oauthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else if (platform === "youtube") {
            const ytConfig = getYouTubeChannelLinkingConfig(validateEnv())
            const ytOAuthService = getYouTubeOAuthService(ytConfig)
            await ytOAuthService.initialize()
            refreshed = await ytOAuthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else {
            return {
                accessToken: storedToken.accessToken,
                error: "UNSUPPORTED_PLATFORM",
            }
        }

        const expiresAt = Date.now() + refreshed.expiresIn * 1000
        await tokenStore.refreshToken(userId, platform, {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt,
            platform,
            userId,
        })

        logger.info("Token refreshed for platform", { userId, platform })
        return { accessToken: refreshed.accessToken }
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        logger.error("Token refresh failed", {
            userId,
            platform,
            error: errMsg,
        })
        if (platform === "youtube" && isTerminalTokenError(errMsg)) {
            await markAccountDisconnected(userId, "youtube").catch(() => {})
        }
        return { accessToken: "", error: "TOKEN_REFRESH_FAILED" }
    }
}

export async function resolveTwitchGameId(
    gameInput: string,
    clientId: string,
    accessToken: string
): Promise<string | null> {
    const params = new URLSearchParams({ query: gameInput, first: "1" })
    try {
        const response = await fetch(
            `https://api.twitch.tv/helix/search/categories?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Client-Id": clientId,
                },
            }
        )
        if (!response.ok) return null
        const data = await response.json()
        return data.data?.[0]?.id || null
    } catch {
        return null
    }
}

export async function resolveKickGameId(
    gameInput: string,
    accessToken: string
): Promise<{ id: string | null; numericId: number | null }> {
    if (!gameInput) return { id: null, numericId: null }
    if (!isNaN(Number(gameInput))) {
        return { id: gameInput, numericId: Number(gameInput) }
    }

    try {
        const params = new URLSearchParams({
            query: gameInput,
            limit: "5",
        })
        const headers = { Authorization: `Bearer ${accessToken}` }

        // 1. Try public v1 categories
        let response = await fetch(
            `https://api.kick.com/public/v1/categories?${params.toString()}`,
            { headers }
        )
        if (response.ok) {
            const data = await response.json()
            const match =
                data.data?.find(
                    (c: { name?: string; id?: number | string }) =>
                        c.name?.toLowerCase() === gameInput.toLowerCase()
                ) || data.data?.[0]
            if (match?.id) {
                const num = Number(match.id)
                return {
                    id: String(match.id),
                    numericId: isNaN(num) ? null : num,
                }
            }
        }

        // 2. Try public v1 subcategories
        response = await fetch(
            `https://api.kick.com/public/v1/subcategories?${params.toString()}`,
            { headers }
        )
        if (response.ok) {
            const data = await response.json()
            const match =
                data.data?.find(
                    (c: { name?: string; id?: number | string }) =>
                        c.name?.toLowerCase() === gameInput.toLowerCase()
                ) || data.data?.[0]
            if (match?.id) {
                const num = Number(match.id)
                return {
                    id: String(match.id),
                    numericId: isNaN(num) ? null : num,
                }
            }
        }

        return { id: null, numericId: null }
    } catch {
        return { id: null, numericId: null }
    }
}

export async function forceRefreshAccessToken(
    userId: string,
    platform: string
): Promise<string | null> {
    const tokenStore = getTokenStore()
    const storedToken = await tokenStore.getToken(userId, platform)

    if (!storedToken?.refreshToken) {
        return null
    }

    try {
        let refreshed: {
            accessToken: string
            refreshToken?: string
            expiresIn: number
        }

        if (platform === "twitch") {
            const config = getTwitchConfig()
            const oauthService = getTwitchOAuthService(config)
            await oauthService.initialize()
            refreshed = await oauthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else if (platform === "kick") {
            const config = getKickConfig()
            const oauthService = getKickOAuthService(config)
            await oauthService.initialize()
            refreshed = await oauthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else if (platform === "youtube") {
            const ytConfig = getYouTubeChannelLinkingConfig(validateEnv())
            const ytOAuthService = getYouTubeOAuthService(ytConfig)
            await ytOAuthService.initialize()
            refreshed = await ytOAuthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else {
            return null
        }

        const expiresAt = Date.now() + refreshed.expiresIn * 1000
        await tokenStore.refreshToken(userId, platform, {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt,
            platform,
            userId,
        })

        return refreshed.accessToken
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        logger.error("Forced token refresh failed", {
            userId,
            platform,
            error: errMsg,
        })
        if (platform === "youtube" && isTerminalTokenError(errMsg)) {
            await markAccountDisconnected(userId, "youtube").catch(() => {})
        }
        return null
    }
}

export async function updateTwitchStream(
    accessToken: string,
    userId: string,
    title: string | undefined,
    gameId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const clientId = process.env.TWITCH_CLIENT_ID || ""

        const body: Record<string, unknown> = {
            broadcaster_id: userId,
        }
        if (title) {
            body.title = title
        }
        if (gameId) {
            body.game_id = gameId
        }

        const response = await fetch("https://api.twitch.tv/helix/channels", {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Client-Id": clientId,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error("Twitch stream update failed", {
                status: response.status,
                body: errorBody,
            })
            return {
                success: false,
                error: `Twitch API error (${response.status}): ${errorBody}`,
            }
        }

        return { success: true }
    } catch (error) {
        logger.error("Twitch stream update exception", { error })
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export async function updateKickStream(
    accessToken: string,
    title: string,
    gameInput?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        let { numericId } = await resolveKickGameId(
            gameInput || "",
            accessToken
        )

        // Kick's public v1 PATCH /channels REQUIRES a category_id.
        // If the user didn't change the category, preserve the current one.
        let currentTitle = title
        if (numericId === null) {
            try {
                const chanRes = await fetch(
                    "https://api.kick.com/public/v1/channels",
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                )
                if (chanRes.ok) {
                    const chanData = await chanRes.json()
                    const chan = chanData.data?.[0] || chanData
                    const catId =
                        chan.category_id ??
                        chan.subcategory?.id ??
                        chan.category?.id ??
                        chan.subcategory_id
                    if (catId !== undefined && catId !== null) {
                        numericId = Number(catId)
                    }
                    if (!currentTitle && chan?.stream_title) {
                        currentTitle = chan.stream_title
                    }
                }
            } catch {
                // Best effort — title-only update still attempted below
            }
        }

        const body: Record<string, unknown> = {}
        if (currentTitle) {
            body.stream_title = currentTitle
        }
        if (numericId !== null && !isNaN(numericId)) {
            body.category_id = numericId
        }

        const attempts: {
            method: string
            url: string
        }[] = [
            { method: "PATCH", url: "https://api.kick.com/public/v1/channels" },
            { method: "PUT", url: "https://api.kick.com/public/v1/channels" },
            { method: "PUT", url: "https://kick.com/api/v2/channels/me" },
        ]

        let lastStatus = 0
        let lastBody = ""
        for (const attempt of attempts) {
            try {
                const response = await fetch(attempt.url, {
                    method: attempt.method,
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                })
                if (response.ok) {
                    return { success: true }
                }
                lastStatus = response.status
                lastBody = await response.text()
            } catch {
                // Try next endpoint
            }
        }

        logger.error("Kick stream update failed", {
            status: lastStatus,
            body: lastBody,
        })
        return {
            success: false,
            error: `Kick API error (${lastStatus}): ${lastBody}`,
        }
    } catch (error) {
        logger.error("Kick stream update exception", { error })
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export async function updateYouTubeStream(
    accessToken: string,
    title: string,
    _gameId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Find active broadcast
        const broadcastResponse = await fetch(
            "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&mine=true",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        )

        if (!broadcastResponse.ok) {
            return {
                success: false,
                error: `YouTube API error (${broadcastResponse.status})`,
            }
        }

        const broadcastData = await broadcastResponse.json()
        const broadcast = broadcastData.items?.[0]
        if (!broadcast) {
            return { success: false, error: "No active broadcast found" }
        }

        const updateBody: Record<string, unknown> = {
            id: broadcast.id,
            snippet: {
                title,
            },
        }

        const response = await fetch(
            "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status",
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateBody),
            }
        )

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error("YouTube stream update failed", {
                status: response.status,
                body: errorBody,
            })
            return {
                success: false,
                error: `YouTube API error (${response.status}): ${errorBody}`,
            }
        }

        return { success: true }
    } catch (error) {
        logger.error("YouTube stream update exception", { error })
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}
export interface StreamPlatformResult {
    platform: string
    success: boolean
    error?: string
}

/**
 * Update title and/or category across all connected platforms for a user.
 * YouTube ignores category changes (no game-category concept in liveBroadcasts).
 */
export async function updateUserStreams(
    userId: string,
    update: { title?: string; category?: string }
): Promise<StreamPlatformResult[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    const { data: networks, error: fetchError } = await supabase
        .from("social_networks")
        .select("platform, platform_user_id")
        .eq("user_id", userId)
        .eq("status", "connected")

    if (fetchError || !networks || networks.length === 0) {
        logger.warn("No connected platforms for user", {
            userId,
            error: fetchError?.message,
        })
        return []
    }

    const results: StreamPlatformResult[] = []

    for (const network of networks) {
        const platform = network.platform as string
        if (!["twitch", "kick", "youtube"].includes(platform)) continue

        const { accessToken, error: tokenError } = await getValidAccessToken(
            userId,
            platform
        )
        if (!accessToken) {
            results.push({
                platform,
                success: false,
                error: tokenError || "TOKEN_ERROR",
            })
            continue
        }

        let result: { success: boolean; error?: string }
        if (platform === "twitch") {
            const gameId = update.category
                ? ((await resolveTwitchGameId(
                      update.category,
                      process.env.TWITCH_CLIENT_ID || "",
                      accessToken
                  )) ?? undefined)
                : undefined
            const broadcasterId =
                (network as { platform_user_id?: string }).platform_user_id ||
                userId
            result = await updateTwitchStream(
                accessToken,
                broadcasterId,
                update.title ?? "",
                gameId
            )
        } else if (platform === "kick") {
            result = await updateKickStream(
                accessToken,
                update.title ?? "",
                update.category
            )
        } else {
            if (update.category && !update.title) {
                results.push({
                    platform,
                    success: false,
                    error: "YOUTUBE_NO_CATEGORY_SUPPORT",
                })
                continue
            }
            result = await updateYouTubeStream(
                accessToken,
                update.title ?? "",
                undefined
            )
        }
        results.push({ platform, ...result })
    }

    return results
}
