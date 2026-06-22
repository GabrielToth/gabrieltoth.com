import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { TikTokOAuthService } from "./oauth-service"

const logger = createLogger("GetValidTikTokToken")

export async function getValidTikTokToken(
    userId: string,
    options?: {
        tokenStore?: ReturnType<typeof getTokenStore>
        oauthService?: TikTokOAuthService
    },
): Promise<string | null> {
    const tokenStore = options?.tokenStore ?? getTokenStore()

    const stored = await tokenStore.getToken(userId, "tiktok")

    if (!stored) {
        logger.info("No TikTok token found for user", { userId })
        return null
    }

    if (!stored.expiresAt || stored.expiresAt > Date.now()) {
        return stored.accessToken
    }

    if (!stored.refreshToken) {
        logger.warn("TikTok token expired and has no refresh token", {
            userId,
        })
        return null
    }

    logger.info("TikTok token expired, refreshing", {
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
            stored.refreshToken,
        )

        const newExpiresAt = refreshed.expiresIn
            ? Date.now() + refreshed.expiresIn * 1000
            : undefined

        await tokenStore.refreshToken(userId, "tiktok", {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt: newExpiresAt,
            platform: "tiktok",
            userId,
        })

        logger.info("TikTok token refreshed successfully", { userId })

        return refreshed.accessToken
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("Failed to refresh TikTok token", {
            userId,
            error: message,
        })
        return null
    }
}
