/**
 * Lazy Instagram token refresh — refreshes expired long-lived tokens on demand.
 *
 * Instagram long-lived tokens last ~60 days.  When a token is within
 * the 60-day refresh window, this silently exchanges it for a new one
 * via the Facebook Graph API and persists the result.
 *
 * Usage:
 *   const token = await getValidInstagramToken(userId)
 *   if (!token) { /* user has not linked Instagram *\/ }
 *   // use `token` to call Instagram Graph API
 */

import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { InstagramOAuthService } from "./oauth-service"

const logger = createLogger("GetValidInstagramToken")

export async function getValidInstagramToken(
    userId: string,
    options?: {
        tokenStore?: ReturnType<typeof getTokenStore>
        oauthService?: InstagramOAuthService
    }
): Promise<string | null> {
    const envToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN
    if (envToken) {
        return envToken
    }

    const tokenStore = options?.tokenStore ?? getTokenStore()

    const stored = await tokenStore.getToken(userId, "instagram")

    if (!stored) {
        logger.info("No Instagram token found for user", { userId })
        return null
    }

    if (!stored.expiresAt || stored.expiresAt > Date.now()) {
        return stored.accessToken
    }

    if (!stored.refreshToken) {
        logger.warn("Instagram token expired and has no refresh token", {
            userId,
        })
        return null
    }

    logger.info("Instagram token expired or close to expiry, refreshing", {
        userId,
    })

    const oauthService = options?.oauthService

    if (!oauthService) {
        logger.error("OAuth service not provided for token refresh", { userId })
        return null
    }

    await oauthService.initialize()

    try {
        const refreshed = await oauthService.refreshAccessToken(
            stored.refreshToken
        )

        const newExpiresAt = refreshed.expiresIn
            ? Date.now() + refreshed.expiresIn * 1000
            : undefined

        await tokenStore.refreshToken(userId, "instagram", {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt: newExpiresAt,
            platform: "instagram",
            userId,
        })

        logger.info("Instagram token refreshed successfully", { userId })

        return refreshed.accessToken
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("Failed to refresh Instagram token", {
            userId,
            error: message,
        })
        return null
    }
}
