/**
 * Real per-platform channel statistics for the Insights dashboard.
 *
 * Fetches live numbers directly from each platform's public/OAuth API using
 * the user's stored tokens — no synthetic/placeholder values.
 *
 * Cost notes:
 * - Twitch Helix `users` + `channels/followers` — free, high rate limits.
 * - Kick public API — free, no auth needed for public channel info.
 * - YouTube Data API `channels?part=statistics&mine=true` — 1 unit per call,
 *   cached for 1 hour per user to avoid quota burn.
 *
 * Platforms without tokens or with failing calls return null and the UI
 * shows honest "no data" values instead of fake numbers.
 */

import { getFreshPlatformToken } from "@/lib/auth/token-refresh"
import { createLogger } from "@/lib/logger"
import { getTwitchConfig } from "@/lib/twitch/config"

const logger = createLogger("RealPlatformStats")

export interface PlatformStats {
    platform: string
    /** Channel/platform follower/subscriber count */
    followers: number | null
    /** Lifetime channel views (YouTube) or null when unavailable */
    views: number | null
    /** Platform display name of the channel */
    channelName: string | null
    /** When this data was fetched */
    fetchedAt: number
}

/** In-memory cache: userId -> platform -> stats (1h TTL) */
const CACHE_TTL_MS = 60 * 60 * 1000
const cache = new Map<string, Map<string, PlatformStats>>()

export function getCachedStats(
    userId: string,
    platform: string
): PlatformStats | null {
    const perUser = cache.get(userId)
    if (!perUser) return null
    const entry = perUser.get(platform)
    if (!entry) return null
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null
    return entry
}

function setCachedStats(userId: string, stats: PlatformStats): void {
    let perUser = cache.get(userId)
    if (!perUser) {
        perUser = new Map()
        cache.set(userId, perUser)
    }
    perUser.set(stats.platform, stats)
}

export function clearRealStatsCache(userId?: string): void {
    if (userId) {
        cache.delete(userId)
    } else {
        cache.clear()
    }
}

async function fetchTwitchStats(
    userId: string
): Promise<Omit<PlatformStats, "platform" | "fetchedAt"> | null> {
    const token = await getFreshPlatformToken(userId, "twitch")
    if (!token?.accessToken) return null

    const config = getTwitchConfig()
    const clientId = config.oauth.clientId
    if (!clientId) return null

    const headers = {
        Authorization: `Bearer ${token.accessToken}`,
        "Client-Id": clientId,
    }

    // Resolve the user's Twitch broadcaster id first
    const usersRes = await fetch("https://api.twitch.tv/helix/users", {
        headers,
        signal: AbortSignal.timeout(10_000),
    })
    if (!usersRes.ok) {
        logger.warn("Twitch helix/users failed", { status: usersRes.status })
        return null
    }
    const usersData = await usersRes.json()
    const user = usersData?.data?.[0]
    if (!user?.id) return null

    // Follower count (public endpoint, needs user token)
    let followers: number | null = null
    const followersRes = await fetch(
        `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`,
        { headers, signal: AbortSignal.timeout(10_000) }
    )
    if (followersRes.ok) {
        const followersData = await followersRes.json()
        followers = followersData?.total ?? null
    }

    return {
        followers,
        views: user.view_count ?? null,
        channelName: user.display_name || user.login || null,
    }
}

async function fetchKickStats(
    username: string
): Promise<Omit<PlatformStats, "platform" | "fetchedAt"> | null> {
    if (!username) return null

    const res = await fetch(
        `https://kick.com/api/v2/channels/${encodeURIComponent(username)}`,
        {
            // Public endpoint; browser-like headers avoid the edge bot filter
            headers: {
                Accept: "application/json",
                "User-Agent":
                    "Mozilla/5.0 (compatible; GabrielTothBot/1.0; +https://gabrieltoth.com)",
            },
            signal: AbortSignal.timeout(10_000),
        }
    )
    if (!res.ok) return null

    const data = await res.json()
    return {
        followers: data?.user?.followersCount ?? data?.followersCount ?? null,
        views: data?.user?.livestream?.viewers ?? null,
        channelName: data?.user?.username || username,
    }
}

async function fetchYouTubeStats(
    userId: string
): Promise<Omit<PlatformStats, "platform" | "fetchedAt"> | null> {
    const token = await getFreshPlatformToken(userId, "youtube")
    if (!token?.accessToken) return null

    const url = new URL("https://www.googleapis.com/youtube/v3/channels")
    url.searchParams.set("part", "snippet,statistics")
    url.searchParams.set("mine", "true")

    const res = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${token.accessToken}`,
            Accept: "application/json",
        },
        signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
        logger.warn("YouTube channels fetch failed", { status: res.status })
        return null
    }

    const data = await res.json()
    const item = data?.items?.[0]
    if (!item) return null

    return {
        followers: item?.statistics?.subscriberCount
            ? Number(item.statistics.subscriberCount)
            : null,
        views: item?.statistics?.viewCount
            ? Number(item.statistics.viewCount)
            : null,
        channelName: item?.snippet?.customUrl || item?.snippet?.title || null,
    }
}

/**
 * Fetch real stats for one platform. `username` is only used by platforms
 * with public by-username endpoints (Kick).
 */
export async function getRealPlatformStats(
    userId: string,
    platform: string,
    username?: string
): Promise<PlatformStats | null> {
    const cached = getCachedStats(userId, platform)
    if (cached) return cached

    let result: Omit<PlatformStats, "platform" | "fetchedAt"> | null = null
    try {
        if (platform === "twitch") {
            result = await fetchTwitchStats(userId)
        } else if (platform === "kick") {
            result = await fetchKickStats(username || "")
        } else if (platform === "youtube") {
            result = await fetchYouTubeStats(userId)
        }
    } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err))
        logger.error(`Failed to fetch ${platform} stats`, {
            userId,
            platform,
            error: e.message,
        })
        return null
    }

    if (!result) return null

    const stats: PlatformStats = {
        platform,
        fetchedAt: Date.now(),
        ...result,
    }
    setCachedStats(userId, stats)
    return stats
}
