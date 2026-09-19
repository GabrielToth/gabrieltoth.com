/**
 * GET /api/live/status
 * Returns live stream status for all connected platforms (Twitch + Kick)
 * Fetches real-time data from platform APIs when tokens are available
 * Authenticated: requires valid session
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getKickConfig } from "@/lib/kick/config"
import { getKickOAuthService } from "@/lib/kick/oauth-service"
import { getTwitchConfig } from "@/lib/twitch/config"
import { getTwitchOAuthService } from "@/lib/twitch/oauth-service"
import { getTokenStore } from "@/lib/token-store"
import { getYouTubeOAuthService } from "@/lib/youtube/oauth-service"
import { getYouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import { validateEnvScoped, YOUTUBE_ENV_KEYS } from "@/lib/config/env"
import {
    isTerminalTokenError,
    markAccountDisconnected,
} from "@/lib/auth/token-health"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LiveStatusEndpoint")

const STATUS_CACHE_TTL_MS = 60_000
const statusCache = new Map<
    string,
    { data: Record<string, unknown>; expiresAt: number }
>()

async function getValidAccessToken(
    userId: string,
    platform: string
): Promise<string | null> {
    const tokenStore = getTokenStore()
    const storedToken = await tokenStore.getToken(userId, platform)

    if (!storedToken) {
        return null
    }

    if (!storedToken.expiresAt || storedToken.expiresAt > Date.now()) {
        return storedToken.accessToken
    }

    if (!storedToken.refreshToken) {
        return null
    }

    try {
        let refreshed: {
            accessToken: string
            refreshToken?: string
            expiresIn: number
        }

        if (platform === "youtube") {
            const ytConfig = getYouTubeChannelLinkingConfig(
                validateEnvScoped(YOUTUBE_ENV_KEYS)
            )
            const ytOAuthService = getYouTubeOAuthService(ytConfig)
            await ytOAuthService.initialize()
            refreshed = await ytOAuthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else if (platform === "twitch") {
            const config = getTwitchConfig()
            const oauthService = getTwitchOAuthService(config)
            await oauthService.initialize()
            refreshed = await oauthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else {
            const config = getKickConfig()
            const oauthService = getKickOAuthService(config)
            await oauthService.initialize()
            refreshed = await oauthService.refreshAccessToken(
                storedToken.refreshToken
            )
        }

        const expiresAt = Date.now() + refreshed.expiresIn * 1000
        await tokenStore.refreshToken(userId, platform, {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt,
            platform,
            userId,
        })

        return refreshed.accessToken
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        logger.error("Token refresh failed", {
            userId,
            platform,
            error: errorMsg,
        })
        if (isTerminalTokenError(errorMsg)) {
            await markAccountDisconnected(userId, platform).catch(() => {})
        }
        return null
    }
}

interface PlatformStreamInfo {
    platform: string
    username: string
    displayName: string
    profileImageUrl: string | null
    isLive: boolean
    viewerCount: number
    title: string
    gameName: string
    startedAt: string | null
    liveChatId?: string | null
}

async function fetchTwitchStream(
    userId: string
): Promise<Partial<PlatformStreamInfo>> {
    try {
        const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.TWITCH_CLIENT_ID || "",
                client_secret: process.env.TWITCH_CLIENT_SECRET || "",
                grant_type: "client_credentials",
            }),
        })

        if (!tokenResponse.ok) {
            logger.warn("Twitch app token fetch failed", {
                status: tokenResponse.status,
            })
            return {}
        }

        const tokenData = await tokenResponse.json()
        const appToken = tokenData.access_token
        const clientId = process.env.TWITCH_CLIENT_ID || ""

        // Get user info first
        const userResponse = await fetch(
            `https://api.twitch.tv/helix/users?id=${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${appToken}`,
                    "Client-Id": clientId,
                },
            }
        )

        if (!userResponse.ok) return {}

        const userData = await userResponse.json()
        const user = userData.data?.[0]
        if (!user) return {}

        // Get stream info
        const streamResponse = await fetch(
            `https://api.twitch.tv/helix/streams?user_id=${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${appToken}`,
                    "Client-Id": clientId,
                },
            }
        )

        if (!streamResponse.ok) return {}

        const streamData = await streamResponse.json()
        const stream = streamData.data?.[0]

        if (stream) {
            return {
                isLive: true,
                viewerCount: stream.viewer_count,
                title: stream.title,
                gameName: stream.game_name,
                startedAt: stream.started_at,
                displayName: user.display_name,
                profileImageUrl: user.profile_image_url,
                username: user.login,
            }
        }

        return {
            isLive: false,
            displayName: user.display_name,
            profileImageUrl: user.profile_image_url,
            username: user.login,
        }
    } catch (error) {
        logger.error("Twitch stream fetch failed", { error })
        return {}
    }
}

async function fetchKickStream(
    accessToken: string,
    username: string
): Promise<Partial<PlatformStreamInfo>> {
    try {
        const channelResponse = await fetch(
            `https://api.kick.com/public/v1/channels?slug[]=${username}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json",
                },
            }
        )

        if (!channelResponse.ok) {
            logger.warn("Kick channel fetch failed", {
                status: channelResponse.status,
            })
            return {}
        }

        const channelData = await channelResponse.json()
        const channel = channelData.data?.[0]

        if (!channel) return {}

        const isLive = channel.stream?.is_live === true

        return {
            isLive,
            viewerCount: channel.stream?.viewer_count || 0,
            title: channel.stream_title || "",
            gameName: channel.category?.name || "",
            startedAt: channel.stream?.start_time || null,
            displayName: username,
            profileImageUrl: channel.banner_picture || null,
        }
    } catch (error) {
        logger.error("Kick stream fetch failed", { error })
        return {}
    }
}

async function fetchFacebookLive(
    pageAccessToken: string,
    pageId: string
): Promise<Partial<PlatformStreamInfo>> {
    try {
        // Facebook Graph API: get live videos for a page
        const response = await fetch(
            `https://graph.facebook.com/v25.0/${pageId}/live_videos?fields=id,title,status,creation_time,stream_url,viewer_count&access_token=${pageAccessToken}`
        )

        if (!response.ok) {
            logger.warn("Facebook live fetch failed", {
                status: response.status,
            })
            return {}
        }

        const data = await response.json()
        if (!data.data || data.data.length === 0) {
            return { isLive: false }
        }

        // Find the first LIVE video (not VOD)
        const liveVideo = data.data.find(
            (v: { status: string }) => v.status === "LIVE"
        )
        if (!liveVideo) return { isLive: false }

        return {
            isLive: true,
            viewerCount: liveVideo.viewer_count || 0,
            title: liveVideo.title || "Facebook Live",
            gameName: "Facebook Live",
            startedAt: liveVideo.creation_time || null,
            displayName: "Facebook Page",
        }
    } catch (error) {
        logger.error("Facebook live fetch failed", { error })
        return {}
    }
}

async function fetchInstagramLive(
    pageAccessToken: string,
    businessAccountId: string
): Promise<Partial<PlatformStreamInfo>> {
    try {
        // Instagram Graph API: check for live media
        const response = await fetch(
            `https://graph.facebook.com/v25.0/${businessAccountId}/media?fields=id,media_type,media_url,caption,timestamp,username&access_token=${pageAccessToken}`
        )

        if (!response.ok) {
            logger.warn("Instagram live fetch failed", {
                status: response.status,
            })
            return {}
        }

        const data = await response.json()
        if (!data.data || data.data.length === 0) {
            return { isLive: false }
        }

        // Find LIVE media type
        const liveMedia = data.data.find(
            (m: { media_type: string }) => m.media_type === "LIVE"
        )
        if (!liveMedia) return { isLive: false }

        return {
            isLive: true,
            viewerCount: 0, // Instagram API doesn't expose viewer count for live
            title: liveMedia.caption || "Instagram Live",
            gameName: "Instagram Live",
            startedAt: liveMedia.timestamp || null,
            displayName: liveMedia.username || "Instagram User",
        }
    } catch (error) {
        logger.error("Instagram live fetch failed", { error })
        return {}
    }
}

async function scrapeYouTubeLivePage(channelIdOrUsername: string): Promise<{
    isLive: boolean
    videoId?: string
    title?: string
    gameName?: string
    viewerCount?: number
}> {
    if (!channelIdOrUsername) return { isLive: false }

    const handle = channelIdOrUsername.replace(/^@/, "")
    const targets = [
        handle.startsWith("UC")
            ? `https://www.youtube.com/channel/${handle}/live`
            : `https://www.youtube.com/@${handle}/live`,
        `https://www.youtube.com/@${handle}/live`,
    ]

    for (const targetUrl of targets) {
        try {
            const res = await fetch(targetUrl, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                },
                redirect: "follow",
            })

            const html = await res.text()
            const finalUrl = res.url || ""

            // Check if redirected to watch?v=VIDEO_ID or HTML has videoId
            const videoIdMatch =
                finalUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/) ||
                html.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/) ||
                html.match(
                    /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/
                )

            const isEnded =
                html.includes('"isEnded":true') ||
                html.includes('"isLiveEnded":true')

            const hasLiveMarker =
                html.includes('"isLive":true') ||
                html.includes('"isLiveBroadcast":true') ||
                html.includes('"status":"LIVE"') ||
                html.includes('"style":"LIVE"') ||
                html.includes('badge-shape-wiz__text">LIVE') ||
                html.includes("liveChatRenderer")

            const isLive = hasLiveMarker && !isEnded

            if (isLive && videoIdMatch?.[1]) {
                const videoId = videoIdMatch[1]

                // Title: <title> tag or og:title meta (strip trailing " - YouTube")
                const titleMatch =
                    html.match(
                        /<meta property="og:title" content="([^"]+)">/
                    ) || html.match(/<title>([^<]+)<\/title>/)
                const title = titleMatch
                    ? titleMatch[1].replace(/ - YouTube$/, "")
                    : ""

                // Category (game): "category":"Gaming" in player microformat
                const categoryMatch = html.match(/"category":"([^"]+)"/)
                const gameName = categoryMatch?.[1] || undefined

                // Viewers: multiple formats observed in the wild:
                //   "viewCount":"1","author":...      (live stream player)
                //   "videoViewCountRenderer"..."text":"1 watching now"
                //   "viewCount":{"runs":[{"text":"1"...
                let viewerCount = 0
                const simpleViewers = html.match(/"viewCount":"(\d+)"/)
                const watchingNow = html.match(
                    /"videoViewCountRenderer"[\s\S]{0,400}?"text":"(\d[\d,.]*) watching now"/
                )
                const runsViewers = html.match(
                    /"viewCount"\s*:\s*\{\s*"runs"\s*:\s*\[\{\s*"text"\s*:\s*"([0-9,.]+)"/
                )
                const viewersRaw =
                    watchingNow?.[1] || simpleViewers?.[1] || runsViewers?.[1]
                if (viewersRaw) {
                    viewerCount =
                        parseInt(viewersRaw.replace(/[,.\s]/g, ""), 10) || 0
                }

                return {
                    isLive: true,
                    videoId,
                    title,
                    gameName,
                    viewerCount,
                }
            }
        } catch {
            // Try next target
        }
    }

    return { isLive: false }
}

async function fetchYouTubeStream(
    accessToken: string,
    channelId?: string,
    username?: string
): Promise<Partial<PlatformStreamInfo>> {
    try {
        const handle = channelId || username || ""
        if (!handle && !accessToken) return {}

        let targetVideoId: string | undefined
        let scraped: {
            isLive: boolean
            videoId?: string
            title?: string
            gameName?: string
            viewerCount?: number
        } = { isLive: false }

        // ============================================================
        // STAGE 1 (primary): Public page scrape — free, no API quota.
        // Finds the *actual* live video (e.g. "5pS7npa6zi4") from the
        // channel's /live page, which is what viewers see.
        // ============================================================
        if (handle) {
            scraped = await scrapeYouTubeLivePage(handle)
            if (scraped.isLive && scraped.videoId) {
                targetVideoId = scraped.videoId
            }
        }

        // ============================================================
        // STAGE 2: liveBroadcasts (mine=true) — 1 quota unit.
        // Only trust broadcasts whose lifeCycleStatus is "live" AND
        // that have actually started. A "ready"/"testing" broadcast is
        // scheduled/upcoming, NOT live.
        // ============================================================
        if (!targetVideoId && accessToken) {
            try {
                const broadcastRes = await fetch(
                    "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&broadcastStatus=active&mine=true",
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: "application/json",
                        },
                    }
                )

                const broadcastData = broadcastRes.ok
                    ? await broadcastRes.json()
                    : null
                const items = broadcastData?.items || []

                const liveBroadcast = items.find(
                    (item: {
                        status?: { lifeCycleStatus?: string }
                        snippet?: { actualStartTime?: string }
                    }) =>
                        item.status?.lifeCycleStatus === "live" &&
                        !!item.snippet?.actualStartTime
                )

                if (liveBroadcast?.id) {
                    targetVideoId = liveBroadcast.id
                }
            } catch (broadcastErr) {
                logger.warn("YouTube liveBroadcasts API call failed", {
                    broadcastErr,
                })
            }
        }

        // ============================================================
        // STAGE 3 (last resort): Channels + Search API — 101 quota
        // units. Only when scrape found nothing AND mine=true found
        // nothing. Never queried with an invalid/empty channelId.
        // ============================================================
        if (!targetVideoId && accessToken) {
            try {
                const chanRes = await fetch(
                    "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: "application/json",
                        },
                    }
                )
                if (chanRes.ok) {
                    const chanData = await chanRes.json()
                    const resolvedChannelId = chanData.items?.[0]?.id || ""

                    // Only call Search API with a valid UC channelId — an
                    // empty channelId returns random global streams.
                    if (resolvedChannelId.startsWith("UC")) {
                        const searchRes = await fetch(
                            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
                                resolvedChannelId
                            )}&eventType=live&type=video`,
                            {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    Accept: "application/json",
                                },
                            }
                        )
                        if (searchRes.ok) {
                            const searchData = await searchRes.json()
                            const searchItem = searchData.items?.[0]
                            if (searchItem?.id?.videoId) {
                                targetVideoId = searchItem.id.videoId
                            }
                        }
                    }
                }
            } catch (searchErr) {
                logger.warn("YouTube Search API call failed", { searchErr })
            }
        }

        // ============================================================
        // No live video found anywhere -> definitively offline.
        // ============================================================
        if (!targetVideoId) {
            return {
                isLive: false,
                viewerCount: 0,
                title: "",
                gameName: "",
                startedAt: null,
                liveChatId: null,
            }
        }

        // ============================================================
        // STAGE 4: Enrich via videos endpoint (1 quota unit) — title,
        // viewers, actualStartTime and liveChatId. CRITICAL: only
        // report live if the video is ACTUALLY streaming.
        // ============================================================
        let title = scraped.title || ""
        let viewerCount = scraped.viewerCount || 0
        let startedAt: string | null = null
        let liveChatId: string | null = null
        let gameName = scraped.gameName || "YouTube Live"
        let confirmedLive = scraped.isLive

        // YouTube video category names (snippet.categoryId -> label).
        // "20" = Gaming is what game streams use (e.g. Hay Day).
        const YOUTUBE_CATEGORY_NAMES: Record<string, string> = {
            "1": "Film & Animation",
            "2": "Autos & Vehicles",
            "10": "Music",
            "15": "Pets & Animals",
            "17": "Sports",
            "19": "Travel & Events",
            "20": "Gaming",
            "22": "People & Blogs",
            "23": "Comedy",
            "24": "Entertainment",
            "25": "News & Politics",
            "26": "Howto & Style",
            "27": "Education",
            "28": "Science & Technology",
        }

        if (accessToken) {
            const videoRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics&id=${encodeURIComponent(
                    targetVideoId
                )}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: "application/json",
                    },
                }
            )

            if (videoRes.ok) {
                const videoData = await videoRes.json()
                const video = videoData.items?.[0]
                if (video) {
                    const details = video.liveStreamingDetails || {}
                    const snippet = video.snippet || {}

                    // Live = has started AND has not ended.
                    const isActuallyLive =
                        !!details.actualStartTime && !details.actualEndTime

                    if (isActuallyLive) {
                        confirmedLive = true
                        liveChatId = details.liveChatId || null
                        startedAt = details.actualStartTime || null
                        if (snippet.title) title = snippet.title
                        if (YOUTUBE_CATEGORY_NAMES[snippet.categoryId]) {
                            gameName =
                                YOUTUBE_CATEGORY_NAMES[snippet.categoryId]
                        }
                        viewerCount =
                            parseInt(details.concurrentViewers || "0", 10) ||
                            viewerCount
                    } else {
                        confirmedLive = false
                    }
                }
            }
        }

        if (!confirmedLive) {
            return {
                isLive: false,
                viewerCount: 0,
                title: "",
                gameName: "",
                startedAt: null,
                liveChatId: null,
            }
        }

        return {
            isLive: true,
            viewerCount,
            title,
            gameName,
            startedAt,
            liveChatId,
        }
    } catch (error) {
        logger.error("YouTube live fetch failed", { error })
        return {}
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const userId = session.user.id

        const cached = statusCache.get(userId)
        if (cached && Date.now() < cached.expiresAt) {
            return NextResponse.json(cached.data)
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: networks, error } = await supabase
            .from("social_networks")
            .select("*")
            .in("platform", [
                "youtube",
                "google",
                "facebook",
                "instagram",
                "twitch",
                "kick",
                "tiktok",
                "twitter",
            ])
            .eq("user_id", userId)
            .neq("status", "disconnected")

        if (error) {
            logger.error("Failed to fetch live platforms", {
                userId,
                error: error.message,
            })
            return NextResponse.json(
                { success: false, error: "DATABASE_ERROR" },
                { status: 500 }
            )
        }

        const platforms: PlatformStreamInfo[] = []

        for (const network of networks || []) {
            const rawPlat =
                network.platform === "google" ? "youtube" : network.platform
            const baseInfo = {
                platform: rawPlat,
                username: network.platform_username || "",
                displayName:
                    network.metadata?.displayName ||
                    network.platform_username ||
                    "",
                profileImageUrl: network.metadata?.profileImageUrl || null,
                isLive: false,
                viewerCount: 0,
                title: "",
                gameName: "",
                startedAt: null,
            }

            const accessToken = network.access_token
            const pageAccessToken =
                network.metadata?.page_access_token || accessToken

            switch (rawPlat) {
                case "twitch":
                    const twitchData = await fetchTwitchStream(
                        network.provider_user_id || network.platform_user_id
                    )
                    platforms.push({ ...baseInfo, ...twitchData })
                    break

                case "kick": {
                    const kickToken = await getValidAccessToken(userId, "kick")
                    if (kickToken) {
                        const kickData = await fetchKickStream(
                            kickToken,
                            network.platform_username || ""
                        )
                        platforms.push({ ...baseInfo, ...kickData })
                    } else {
                        platforms.push(baseInfo)
                    }
                    break
                }

                case "youtube": {
                    const ytToken = await getValidAccessToken(userId, "youtube")
                    const ytData = await fetchYouTubeStream(
                        ytToken || "",
                        network.platform_user_id || "",
                        network.platform_username || ""
                    )
                    platforms.push({ ...baseInfo, ...ytData })
                    break
                }

                case "facebook":
                    if (pageAccessToken) {
                        const fbData = await fetchFacebookLive(
                            pageAccessToken,
                            network.metadata?.page_id ||
                                network.platform_user_id ||
                                ""
                        )
                        platforms.push({ ...baseInfo, ...fbData })
                    } else {
                        platforms.push(baseInfo)
                    }
                    break

                case "instagram":
                    if (pageAccessToken) {
                        const igData = await fetchInstagramLive(
                            pageAccessToken,
                            network.metadata?.instagram_business_account_id ||
                                network.platform_user_id ||
                                ""
                        )
                        platforms.push({ ...baseInfo, ...igData })
                    } else {
                        platforms.push(baseInfo)
                    }
                    break

                case "tiktok":
                case "twitter":
                    platforms.push(baseInfo)
                    break

                default:
                    platforms.push(baseInfo)
            }
        }

        const response = { success: true, data: platforms }
        statusCache.set(userId, {
            data: response,
            expiresAt: Date.now() + STATUS_CACHE_TTL_MS,
        })

        return NextResponse.json(response)
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Live status fetch failed", err)
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}
