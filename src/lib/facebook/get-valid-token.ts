import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { FacebookOAuthService } from "./oauth-service"

const logger = createLogger("GetValidFacebookToken")

export async function getValidFacebookToken(
    userId: string,
    options?: {
        tokenStore?: ReturnType<typeof getTokenStore>
        oauthService?: FacebookOAuthService
    },
): Promise<string | null> {
    const tokenStore = options?.tokenStore ?? getTokenStore()

    const stored = await tokenStore.getToken(userId, "facebook")

    if (!stored) {
        logger.info("No Facebook token found for user", { userId })
        return null
    }

    if (!stored.expiresAt || stored.expiresAt > Date.now()) {
        return stored.accessToken
    }

    if (!stored.refreshToken) {
        logger.warn("Facebook token expired and has no refresh token", {
            userId,
        })
        return null
    }

    logger.info("Facebook token expired or close to expiry, refreshing", {
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

        await tokenStore.refreshToken(userId, "facebook", {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt: newExpiresAt,
            platform: "facebook",
            userId,
        })

        logger.info("Facebook token refreshed successfully", { userId })

        return refreshed.accessToken
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("Failed to refresh Facebook token", {
            userId,
            error: message,
        })
        return null
    }
}
