/**
 * Twitter/X Posting Adapter
 * Posting to X API v2 using OAuth 1.0a (HMAC-SHA1 signed requests)
 *
 * OAuth 2.0 PKCE is not available for apps created in the new
 * X Developer Console. OAuth 1.0a is used instead.
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
    oauthTokenSecret: string = "",
    extraParams: Record<string, string> = {},
    /** Parameters that should be in the signature but NOT in the Authorization header (e.g. body params for v1.1) */
    bodyParams: Record<string, string> = {}
): string {
    const oauthParams: Record<string, string> = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: crypto.randomBytes(16).toString("hex"),
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_version: "1.0",
        ...extraParams,
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

    // Signature includes OAuth params + URL query params + body params
    const sigParams = { ...oauthParams, ...queryParams, ...bodyParams }

    const signature = generateSignature(
        method,
        urlObj.origin + urlObj.pathname,
        sigParams,
        consumerSecret,
        oauthTokenSecret
    )

    oauthParams.oauth_signature = signature

    // The Authorization header should ONLY contain OAuth-specific params,
    // NOT body params or other protocol params
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

        // Try API v1.1 first (legacy endpoint, works without Project enrollment),
        // then fall back to v2 if v1.1 fails
        const apiUrlV1 = "https://api.twitter.com/1.1/statuses/update.json"
        const apiUrlV2 = "https://api.twitter.com/2/tweets"

        // Try v1.1 first (legacy endpoint, works without Project enrollment)
        // For v1.1, the body param (status) must be in the signature
        // but NOT in the Authorization header
        const authHeaderV1 = generateAuthHeader(
            "POST",
            apiUrlV1,
            consumerKey,
            consumerSecret,
            oauthToken,
            oauthTokenSecret,
            {}, // extraParams for header
            { status: config.text } // bodyParams for signature only
        )

        const v1Body = new URLSearchParams({ status: config.text }).toString()

        const responseV1 = await fetch(apiUrlV1, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: authHeaderV1,
            },
            body: v1Body,
        })

        if (responseV1.ok) {
            const dataV1 = await responseV1.json()
            const tweetId = dataV1.id_str

            logger.info("Tweet posted successfully (v1.1)", {
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
        }

        const v1Error = await responseV1.text()
        logger.warn("Twitter v1.1 API failed, trying v2", {
            status: responseV1.status,
            error: v1Error,
        })

        // Fall back to v2
        const authHeaderV2 = generateAuthHeader(
            "POST",
            apiUrlV2,
            consumerKey,
            consumerSecret,
            oauthToken,
            oauthTokenSecret
        )

        const responseV2 = await fetch(apiUrlV2, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeaderV2,
            },
            body: JSON.stringify(body),
        })

        if (!responseV2.ok) {
            const errorBody = await responseV2.text()
            logger.error("Twitter API error (both v1.1 and v2 failed)", {
                status: responseV2.status,
                v1Error: v1Error.substring(0, 200),
                v2Error: errorBody.substring(0, 200),
            })
            return {
                success: false,
                error: `Twitter API returned ${responseV2.status}: ${errorBody}`,
            }
        }

        const dataV2 = await responseV2.json()
        const tweetIdV2 = dataV2.data?.id

        logger.info("Tweet posted successfully (v2)", {
            tweetId: tweetIdV2,
            userId: config.userId,
        })

        return {
            success: true,
            tweetId: tweetIdV2,
            url: tweetIdV2
                ? `https://twitter.com/user/status/${tweetIdV2}`
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
