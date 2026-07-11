/**
 * Twitter/X Posting Adapter
 * Posting to X API v2 using OAuth 1.0a (HMAC-SHA1 signed requests)
 *
 * OAuth 2.0 PKCE is not available for apps created in the new
 * X Developer Console. OAuth 1.0a is used instead.
 *
 * NOTE: X API v1.1 (statuses/update.json) has been fully sunset and
 * returns 404 for all requests. Only v2 endpoints (/2/tweets) are
 * available. The v2 endpoint requires the app to be attached to a
 * Project in the X Developer Console.
 *
 * Token storage:
 *   - accessToken (stored) = oauth_token (permanent, doesn't expire)
 *   - refreshToken (stored) = oauth_token_secret (needed for signing)
 *   - consumerKey + consumerSecret = from config (TWITTER_CLIENT_ID/SECRET env vars)
 */

import crypto from "crypto"
import { createLogger } from "@/lib/logger"
import { getTwitterConfig } from "@/lib/twitter/config"
import { getTokenStore } from "@/lib/token-store"

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
 * Percent-encode per RFC 3986 (required by OAuth 1.0a).
 */
function percentEncode(str: string): string {
    return encodeURIComponent(str)
        .replace(/[!'()*]/g, c =>
            "%" + c.charCodeAt(0).toString(16).toUpperCase()
        )
}

/**
 * Generate OAuth 1.0a HMAC-SHA1 signature.
 */
function generateSignature(
    method: string,
    baseUrl: string,
    params: Record<string, string>,
    consumerSecret: string,
    tokenSecret: string = ""
): string {
    const paramEntries = Object.entries(params)
        .map(([k, v]) => [percentEncode(k), percentEncode(v)])
        .sort((a, b) =>
            a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
        )

    const paramString = paramEntries.map(([k, v]) => `${k}=${v}`).join("&")

    const signatureBase = [
        method.toUpperCase(),
        percentEncode(baseUrl),
        percentEncode(paramString),
    ].join("&")

    const signingKey =
        `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`

    const hmac = crypto.createHmac("sha1", signingKey)
    hmac.update(signatureBase)
    return hmac.digest("base64")
}

/**
 * Generate OAuth 1.0a Authorization header for an API request.
 */
function generateAuthHeader(
    method: string,
    url: string,
    consumerKey: string,
    consumerSecret: string,
    oauthToken: string = "",
    oauthTokenSecret: string = ""
): string {
    const oauthParams: Record<string, string> = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: crypto.randomBytes(16).toString("hex"),
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_version: "1.0",
    }

    if (oauthToken) {
        oauthParams.oauth_token = oauthToken
    }

    // Collect query params from URL for signature
    const urlObj = new URL(url)
    const queryParams: Record<string, string> = {}
    urlObj.searchParams.forEach((v, k) => {
        queryParams[k] = v
    })

    const sigParams = { ...oauthParams, ...queryParams }

    const signature = generateSignature(
        method,
        urlObj.origin + urlObj.pathname,
        sigParams,
        consumerSecret,
        oauthTokenSecret
    )

    oauthParams.oauth_signature = signature

    const headerParts = Object.entries(oauthParams)
        .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)

    return `OAuth ${headerParts.join(", ")}`
}

/**
 * Post content to Twitter/X using OAuth 1.0a signed requests.
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

        // Get stored OAuth 1.0a tokens
        const tokenStore = getTokenStore()
        const stored = await tokenStore.getToken(config.userId, "twitter")

        if (!stored) {
            return {
                success: false,
                error:
                    "Twitter account is not linked. Please connect your Twitter account first.",
            }
        }

        // OAuth 1.0a tokens:
        //   accessToken = oauth_token
        //   refreshToken = oauth_token_secret
        const oauthToken = stored.accessToken
        const oauthTokenSecret = stored.refreshToken || ""

        if (!oauthToken || !oauthTokenSecret) {
            return {
                success: false,
                error: "Twitter token is incomplete. Please reconnect your Twitter account.",
            }
        }

        // Get consumer credentials from config
        const ttConfig = getTwitterConfig()
        const consumerKey = ttConfig.oauth.clientId
        const consumerSecret = ttConfig.oauth.clientSecret

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

        // Use X API v2 (v1.1 has been fully sunset)
        const apiUrl = "https://api.twitter.com/2/tweets"

        const authHeader = generateAuthHeader(
            "POST",
            apiUrl,
            consumerKey,
            consumerSecret,
            oauthToken,
            oauthTokenSecret
        )

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
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
