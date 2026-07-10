/**
 * Lazy Twitter token refresh — refreshes expired tokens on demand.
 *
 * Twitter access tokens last 2 hours by default. Refresh tokens are
 * long-lived. This helper checks expiry and refreshes if needed.
 *
 * Usage:
 *   const token = await getValidTwitterToken(userId)
 *   if (!token) { /* user has not linked Twitter *\/ }
 *   // use `token` to call Twitter API v2
 */

import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { TwitterOAuthService } from "./oauth-service"

const logger = createLogger("GetValidTwitterToken")

export async function getValidTwitterToken(
    userId: string,
    options?: {
        tokenStore?: ReturnType<typeof getTokenStore>
        oauthService?: TwitterOAuthService
    }
): Promise<string | null> {
    const tokenStore = options?.tokenStore ?? getTokenStore()

    const stored = await tokenStore.getToken(userId, "twitter")

    if (!stored) {
        logger.info("No Twitter token found for user", { userId })
        return null
    }

    // If no expiry or still valid, return as-is
    if (!stored.expiresAt || stored.expiresAt > Date.now()) {
        return stored.accessToken
    }

    if (!stored.refreshToken) {
        logger.warn("Twitter token expired and has no refresh token", {
            userId,
        })
        return null
    }

    logger.info("Twitter token expired, refreshing", { userId })

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

        await tokenStore.refreshToken(userId, "twitter", {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt: newExpiresAt,
            platform: "twitter",
            userId,
        })

        logger.info("Twitter token refreshed successfully", { userId })

        return refreshed.accessToken
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("Failed to refresh Twitter token", {
            userId,
            error: message,
        })
        return null
    }
}
