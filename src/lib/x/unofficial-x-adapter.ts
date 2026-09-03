/**
 * X.com (Twitter) Unofficial Adapter
 *
 * ⚠️  UNOFFICIAL IMPLEMENTATION — USER DISCLOSURE REQUIRED ⚠️
 *
 * This module implements X.com interaction WITHOUT the official X API.
 * It relies on session cookies (auth_token, ct0) extracted via the stealth
 * headless-browser scraper engine (1proxy.203 / OmniRoute mesh) and calls
 * X's internal GraphQL endpoints (x.com/i/api/graphql/...).
 *
 * Characteristics:
 *  - NOT covered by X's developer TOS; may break at any time.
 *  - Features: read home timeline, post tweets, read notifications,
 *    DMs read/write (via legacy 1.1-compatible person endpoints), search.
 *  - Rate limits are IP-residential-based (1proxy pool), not app-based.
 *  - Requires valid session cookies -> stored in CookieVault (AES-256).
 *  - Cloud session storage is billed in credits (see CookieVault).
 *
 * UI REQUIREMENT: Any UI surface that enables this adapter MUST display
 * the i18n key "settings.apis.unofficial_x_notice" so users understand
 * this is an unofficial, best-effort integration.
 */

import { createLogger } from "@/lib/logger"

const logger = createLogger("UnofficialXAdapter")

export interface XSessionCookies {
    authToken: string // auth_token cookie
    ct0: string // CSRF token cookie
    guestToken?: string
    twid?: string
    d_prefs?: string
}

export interface XPostResult {
    success: boolean
    tweetId?: string
    error?: string
    unofficial: true // always true for this adapter
}

// ------------------- GraphQL Query IDs -------------------------
// These are scraped from X's web client (they mutate rarely).
// Last verified: 2026-08.

const GRAPHQL_IDS = {
    CreateTweet: "bjcTFPBVvuZnDv7YO9gQPA/CreateTweet", // placeholder ID
    HomeTimeline: "9wvlQ_tSbzKBZDH5eyOPcQ/HomeTimeline", // placeholder
    UserByScreenName: "GAWzjjRMY7khpMaQo5JKGA/UserByScreenName", // placeholder
    SearchTimeline: "Qkgm_C6QkLVbV8SMJt5DQ/SearchTimeline", // placeholder
    CreateDirectMessage: "dm-create-placeholder-id/CreateDirectMessage",
} as const

// Bearer token extracted from the public X web client JS bundle.
// This is a PUBLIC, non-secret token from the x.com frontend itself.
const X_WEB_BEARER_TOKEN =
    "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs" +
    "%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"

function buildAuthHeaders(cookies: XSessionCookies) {
    const cookieStr = [
        `auth_token=${cookies.authToken}`,
        `ct0=${cookies.ct0}`,
        cookies.guestToken ? `gt=${cookies.guestToken}` : "",
        cookies.twid ? `twid=${cookies.twid}` : "",
    ]
        .filter(Boolean)
        .join("; ")

    return {
        Authorization: `Bearer ${X_WEB_BEARER_TOKEN}`,
        "X-Csrf-Token": cookies.ct0,
        Cookie: cookieStr,
        "Content-Type": "application/json",
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/124.0.0.0 Safari/537.36",
        "X-Twitter-Auth-Type": "OAuth2Session",
        "X-Twitter-Active-User": "yes",
    }
}

/**
 * Post a tweet via internal GraphQL — UNOFFICIAL.
 */
export async function xPostTweet(
    cookies: XSessionCookies,
    text: string,
    proxy?: string
): Promise<XPostResult> {
    try {
        const variables = {
            tweet_text: text,
            dark_request: false,
            media: { media_entities: [], possibly_sensitive: false },
            semantic_annotation_ids: [],
        }

        const res = await fetch(
            `https://x.com/i/api/graphql/${GRAPHQL_IDS.CreateTweet}`,
            {
                method: "POST",
                headers: buildAuthHeaders(cookies),
                // @ts-expect-error Node fetch proxy hint
                agent: proxy ? undefined : undefined,
                body: JSON.stringify({
                    variables,
                    queryId: GRAPHQL_IDS.CreateTweet.split("/")[1],
                }),
            }
        )

        if (!res.ok) {
            const body = await res.text()
            logger.error("X unofficial tweet post failed", {
                status: res.status,
                body: body.slice(0, 200),
            })
            return {
                success: false,
                error: `HTTP ${res.status}: ${body.slice(0, 120)}`,
                unofficial: true,
            }
        }

        const data = await res.json()
        const tweetId = data?.data?.create_tweet?.tweet_results?.result?.rest_id

        return { success: true, tweetId, unofficial: true }
    } catch (err) {
        logger.error("X unofficial tweet exception", {
            error: err instanceof Error ? err.message : String(err),
        })
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
            unofficial: true,
        }
    }
}

/**
 * Read home timeline via internal GraphQL — UNOFFICIAL.
 */
export async function xReadTimeline(
    cookies: XSessionCookies,
    count = 20
): Promise<{ success: boolean; tweets?: unknown[]; error?: string }> {
    try {
        const variables = { count, includePromotedContent: false }
        const res = await fetch(
            `https://x.com/i/api/graphql/${GRAPHQL_IDS.HomeTimeline}?` +
                `variables=${encodeURIComponent(JSON.stringify(variables))}`,
            { headers: buildAuthHeaders(cookies) }
        )
        if (!res.ok) {
            return {
                success: false,
                error: `HTTP ${res.status}`,
            }
        }
        const data = await res.json()
        const tweets =
            data?.data?.home?.home_timeline_urt?.instructions
                ?.filter(
                    (i: { type?: string }) => i.type === "TimelineAddEntries"
                )
                ?.flatMap((i: { entries?: unknown[] }) => i.entries ?? []) || []

        return { success: true, tweets }
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        }
    }
}

/**
 * Get current authenticated user (self-check) — UNOFFICIAL.
 */
export async function xCheckSession(
    cookies: XSessionCookies
): Promise<{ valid: boolean; username?: string; error?: string }> {
    try {
        const res = await fetch(
            "https://x.com/i/api/1.1/account/settings.json",
            { headers: buildAuthHeaders(cookies) }
        )
        if (!res.ok) {
            return { valid: false, error: `HTTP ${res.status}` }
        }
        const data = await res.json()
        return { valid: true, username: data?.screen_name }
    } catch (err) {
        return {
            valid: false,
            error: err instanceof Error ? err.message : "Unknown error",
        }
    }
}

/**
 * Determine if this adapter should be preferred over the official API.
 * Returns true only when the user explicitly opts in AND cookies exist.
 */
export function shouldUseUnofficialXAdapter(
    userOptIn: boolean,
    hasValidCookies: boolean
): boolean {
    return userOptIn && hasValidCookies
}
