/**
 * Twitter Posting Adapter
 * Handles posting content to Twitter/X using user-level OAuth tokens
 */

import { createLogger } from "@/lib/logger"
import { getTwitterConfig } from "@/lib/twitter/config"
import { getTwitterOAuthService } from "@/lib/twitter/oauth-service"
import { getValidTwitterToken } from "@/lib/twitter/get-valid-token"

const logger = createLogger("TwitterAdapter")

export interface TwitterPostConfig {
    userId: string
    text: string
    mediaIds?: string[]
    replySettings?: "everyone" | "following" | "mentioned_users"
    quoteTweetId?: string
    replyToTweetId?: string
}

export interface TwitterPostResult {
    success: boolean
    tweetId?: string
    url?: string
    error?: string
}

/**
 * Post content to Twitter/X using the user's OAuth token
 */
export async function postToTwitter(
    config: TwitterPostConfig
): Promise<TwitterPostResult> {
    try {
        // Validate required fields
        if (!config.userId) {
            return {
                success: false,
                error: "User ID is required",
            }
        }

        if (!config.text) {
            return {
                success: false,
                error: "Tweet text is required",
            }
        }

        if (config.text.length > 280) {
            return {
                success: false,
                error: "Tweet text exceeds 280 characters",
            }
        }

        // Get valid OAuth token for this user
        const ttConfig = getTwitterConfig()
        const oauthService = getTwitterOAuthService(ttConfig)
        await oauthService.initialize()

        const accessToken = await getValidTwitterToken(config.userId, {
            oauthService,
        })

        if (!accessToken) {
            return {
                success: false,
                error: "Twitter account is not linked. Please connect your Twitter account first.",
            }
        }

        // Build tweet body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: Record<string, any> = {
            text: config.text,
        }

        if (config.mediaIds && config.mediaIds.length > 0) {
            body.media = {
                media_ids: config.mediaIds,
            }
        }

        if (config.replyToTweetId) {
            body.reply = {
                in_reply_to_tweet_id: config.replyToTweetId,
            }
        }

        if (config.replySettings) {
            body.reply_settings = config.replySettings
        }

        const response = await fetch("https://api.twitter.com/2/tweets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error("Twitter API error", {
                status: response.status,
                body: errorBody,
            })
            return {
                success: false,
                error: `Twitter API returned ${response.status}: ${errorBody}`,
            }
        }

        const data = await response.json()
        const tweetId = data.data?.id

        logger.info("Tweet posted successfully", {
            tweetId,
            userId: config.userId,
        })

        return {
            success: true,
            tweetId,
            url: tweetId
                ? `https://twitter.com/user/status/${tweetId}`
                : undefined,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export default { postToTwitter }
