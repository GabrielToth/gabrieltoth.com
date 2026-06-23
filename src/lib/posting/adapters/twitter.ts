/**
 * Twitter Posting Adapter
 * Handles posting content to Twitter/X
 */

import { createLogger } from "@/lib/logger"

const logger = createLogger("TwitterAdapter")

export interface TwitterPostConfig {
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
 * Post content to Twitter
 */
export async function postToTwitter(
    config: TwitterPostConfig
): Promise<TwitterPostResult> {
    try {
        // Validate required fields
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

        const response = await fetch("https://api.twitter.com/2/tweets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN || ""}`,
            },
            body: JSON.stringify({ text: config.text }),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error("Twitter API error", {
                status: response.status,
                body: errorBody,
            })
            return {
                success: false,
                error: `Twitter API returned ${response.status}`,
            }
        }

        const data = await response.json()
        return {
            success: true,
            tweetId: data.data?.id,
            url: `https://twitter.com/user/status/${data.data?.id}`,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export default { postToTwitter }
