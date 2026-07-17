/**
 * Lazy YouTube token refresh — refreshes expired tokens on demand.
 *
 * Instead of a cron keeping tokens alive, this fetches a valid access
 * token right when it is needed.  If the stored token is expired it
 * silently refreshes it via Google's OAuth endpoint and persists the
 * result before returning.
 *
 * Usage:
 *   const token = await getValidYouTubeToken(userId)
 *   if (!token) { /* user has not linked YouTube *\/ }
 *   // use `token` to call YouTube Data API
 */

import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { validateEnv } from "@/lib/config/env"
import { getYouTubeChannelLinkingConfig } from "./config"
import {
    getYouTubeOAuthService,
    type YouTubeOAuthService,
} from "./oauth-service"
import { type TokenStore } from "@/lib/token-store"

const logger = createLogger("GetValidYouTubeToken")

/**
 * Return a valid YouTube access token for the given user.
 *
 * - If the token is still fresh, returns it immediately.
 * - If the token is expired but has a refresh_token, refreshes automatically
 *   and returns the new access token.
 * - If no token exists or the refresh fails / has no refresh_token, returns null.
 *
 * @param userId - UUID of the user
 * @param options.tokenStore   - injectable store (for testing)
 * @param options.oauthService - injectable OAuth service (for testing)
 */
export async function getValidYouTubeToken(
    userId: string,
    options?: {
        tokenStore?: TokenStore
        oauthService?: YouTubeOAuthService
    }
): Promise<string | null> {
    const tokenStore = options?.tokenStore ?? getTokenStore()
    const oauthService =
        options?.oauthService ??
        (() => {
            const env = validateEnv()
            const config = getYouTubeChannelLinkingConfig(env)
            return getYouTubeOAuthService(config)
        })()

    // 1. Retrieve stored token
    const stored = await tokenStore.getToken(userId, "youtube")

    if (!stored) {
        logger.info("No YouTube token found for user", { userId })
        return null
    }

    // 2. If still valid (or no expiry info), return as-is
    if (!stored.expiresAt || stored.expiresAt > Date.now()) {
        return stored.accessToken
    }

    // 3. Expired — try to refresh
    if (!stored.refreshToken) {
        logger.warn("YouTube token expired and has no refresh token", {
            userId,
        })
        return null
    }

    logger.info("YouTube token expired, refreshing", { userId })

    await oauthService.initialize()

    try {
        const refreshed = await oauthService.refreshAccessToken(
            stored.refreshToken
        )

        const newExpiresAt = refreshed.expiresIn
            ? Date.now() + refreshed.expiresIn * 1000
            : undefined

        await tokenStore.refreshToken(userId, "youtube", {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt: newExpiresAt,
            platform: "youtube",
            userId,
        })

        logger.info("YouTube token refreshed successfully", { userId })

        return refreshed.accessToken
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("Failed to refresh YouTube token", {
            userId,
            error: message,
        })
        return null
    }
}
