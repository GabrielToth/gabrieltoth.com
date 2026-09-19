/**
 * Shared OAuth token refresh logic for chat/platform connections.
 *
 * Ensures the access token handed to adapters (SSE aggregator, relay token
 * endpoint, etc.) is fresh, refreshing via the stored refresh_token when
 * expired. On terminal OAuth failures the account is marked disconnected.
 */

import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import {
    isTerminalTokenError,
    markAccountDisconnected,
} from "@/lib/auth/token-health"
import type { TokenData } from "@/lib/token-store"

const logger = createLogger("TokenRefresh")

export type RefreshablePlatform = "youtube" | "twitch" | "kick"

/**
 * Get a valid access token for the platform, refreshing if expired.
 * Returns null when no token is available or refresh failed.
 */
export async function getFreshPlatformToken(
    userId: string,
    platform: RefreshablePlatform
): Promise<TokenData | null> {
    const tokenStore = getTokenStore()
    let stored = await tokenStore.getToken(userId, platform)

    if (
        stored?.refreshToken &&
        stored.expiresAt &&
        stored.expiresAt < Date.now()
    ) {
        try {
            const refreshed = await doRefresh(platform, stored.refreshToken)
            const expiresAt = Date.now() + refreshed.expiresIn * 1000
            await tokenStore.refreshToken(userId, platform, {
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
                expiresAt,
                platform,
                userId,
            })
            stored = await tokenStore.getToken(userId, platform)
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            logger.error(`${platform} token refresh failed`, {
                userId,
                platform,
                error: msg,
            })
            if (platform === "youtube" && isTerminalTokenError(msg)) {
                await markAccountDisconnected(userId, "youtube").catch(() => {})
            }
        }
    }

    return stored?.accessToken ? stored : null
}

interface RefreshResult {
    accessToken: string
    refreshToken: string | undefined
    expiresIn: number
}

async function doRefresh(
    platform: RefreshablePlatform,
    refreshToken: string
): Promise<RefreshResult> {
    if (platform === "youtube") {
        const { getYouTubeOAuthService } =
            await import("@/lib/youtube/oauth-service")
        const { getYouTubeChannelLinkingConfig } =
            await import("@/lib/youtube/config")
        const { validateEnvScoped, YOUTUBE_ENV_KEYS } =
            await import("@/lib/config/env")
        const config = getYouTubeChannelLinkingConfig(
            validateEnvScoped(YOUTUBE_ENV_KEYS)
        )
        const oauth = getYouTubeOAuthService(config)
        await oauth.initialize()
        const refreshed = await oauth.refreshAccessToken(refreshToken)
        return {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresIn: refreshed.expiresIn,
        }
    }

    if (platform === "twitch") {
        const { getTwitchConfig } = await import("@/lib/twitch/config")
        const { getTwitchOAuthService } =
            await import("@/lib/twitch/oauth-service")
        const oauth = getTwitchOAuthService(getTwitchConfig())
        await oauth.initialize()
        const refreshed = await oauth.refreshAccessToken(refreshToken)
        return {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresIn: refreshed.expiresIn,
        }
    }

    const { getKickConfig } = await import("@/lib/kick/config")
    const { getKickOAuthService } = await import("@/lib/kick/oauth-service")
    const oauth = getKickOAuthService(getKickConfig())
    await oauth.initialize()
    const refreshed = await oauth.refreshAccessToken(refreshToken)
    return {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresIn: refreshed.expiresIn,
    }
}
