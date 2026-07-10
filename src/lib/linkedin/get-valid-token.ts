/**
 * Lazy LinkedIn token refresh — refreshes expired tokens on demand.
 *
 * LinkedIn access tokens last 2 hours by default. Refresh tokens are
 * long-lived. This helper checks expiry and refreshes if needed.
 *
 * Usage:
 *   const token = await getValidLinkedInToken(userId)
 *   if (!token) { /* user has not linked LinkedIn *\/ }
 *   // use `token` to call LinkedIn API v2
 */

import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { LinkedInOAuthService } from "./oauth-service"

const logger = createLogger("GetValidLinkedInToken")

export async function getValidLinkedInToken(
    userId: string,
    options?: {
        tokenStore?: ReturnType<typeof getTokenStore>
        oauthService?: LinkedInOAuthService
    }
): Promise<string | null> {
    const tokenStore = options?.tokenStore ?? getTokenStore()

    const stored = await tokenStore.getToken(userId, "linkedin")

    if (!stored) {
        logger.info("No LinkedIn token found for user", { userId })
        return null
    }

    // If no expiry or still valid, return as-is
    if (!stored.expiresAt || stored.expiresAt > Date.now()) {
        return stored.accessToken
    }

    if (!stored.refreshToken) {
        logger.warn("LinkedIn token expired and has no refresh token", {
            userId,
        })
        return null
    }

    logger.info("LinkedIn token expired, refreshing", { userId })

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

        await tokenStore.refreshToken(userId, "linkedin", {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt: newExpiresAt,
            platform: "linkedin",
            userId,
        })

        logger.info("LinkedIn token refreshed successfully", { userId })

        return refreshed.accessToken
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("Failed to refresh LinkedIn token", {
            userId,
            error: message,
        })
        return null
    }
}
