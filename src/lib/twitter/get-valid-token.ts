/**
 * Get valid Twitter OAuth 1.0a token.
 *
 * OAuth 1.0a tokens don't expire (they're long-lived).
 * This helper simply retrieves the stored token and returns it.
 * No refresh flow is needed.
 *
 * Usage:
 *   const token = await getValidTwitterToken(userId)
 *   if (!token) { /* user has not linked Twitter *\/ }
 *   // use `token` to call Twitter adapter (which handles OAuth 1.0a signing)
 *
 * NOTE: For OAuth 1.0a, the returned string is the oauth_token.
 * The oauth_token_secret (needed for signing) is stored as refreshToken
 * and must be retrieved separately by the adapter.
 */

import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"

const logger = createLogger("GetValidTwitterToken")

export async function getValidTwitterToken(
    userId: string
): Promise<{ oauthToken: string; oauthTokenSecret: string } | null> {
    const tokenStore = getTokenStore()

    const stored = await tokenStore.getToken(userId, "twitter")

    if (!stored) {
        logger.info("No Twitter token found for user", { userId })
        return null
    }

    // OAuth 1.0a tokens:
    //   stored.accessToken = oauth_token
    //   stored.refreshToken = oauth_token_secret
    const oauthToken = stored.accessToken
    const oauthTokenSecret = stored.refreshToken || ""

    if (!oauthToken || !oauthTokenSecret) {
        logger.warn("Incomplete Twitter OAuth 1.0a token", { userId })
        return null
    }

    return { oauthToken, oauthTokenSecret }
}
