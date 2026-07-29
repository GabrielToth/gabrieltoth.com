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
import { getTokenStore } from "@/lib/token-store"
import { getYouTubeOAuthService } from "@/lib/youtube/oauth-service"
import { getYouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import { validateEnv } from "@/lib/config/env"
import {
    isTerminalTokenError,
    markAccountDisconnected,
} from "@/lib/auth/token-health"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LiveStatusEndpoint")

const STATUS_CACHE_TTL_MS = 60_000
const statusCache = new Map<string, { data: any; expiresAt: number }>()

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
            const ytConfig = getYouTubeChannelLinkingConfig(validateEnv())
            const ytOAuthService = getYouTubeOAuthService(ytConfig)
            await ytOAuthService.initialize()
            refreshed = await ytOAuthService.refreshAccessToken(
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

async function fetchYouTubeStream(
    accessToken: string
): Promise<Partial<PlatformStreamInfo>> {
    try {
        const broadcastRes = await fetch(
            "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&mine=true",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json",
                },
            }
        )

        if (!broadcastRes.ok) {
            logger.warn("YouTube broadcast fetch failed", {
                status: broadcastRes.status,
            })
            return {}
        }

        const broadcastData = await broadcastRes.json()
        const items = broadcastData.items || []
        const liveBroadcast = items.find(
            (item: any) => item.status?.lifeCycleStatus === "live"
        )

        if (!liveBroadcast) {
            return { isLive: false }
        }

        const videoId = liveBroadcast.id
        const snippet = liveBroadcast.snippet || {}

        const videoRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,statistics&id=${videoId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json",
                },
            }
        )

        let viewerCount = 0
        if (videoRes.ok) {
            const videoData = await videoRes.json()
            const video = videoData.items?.[0]
            if (video?.liveStreamingDetails) {
                viewerCount = parseInt(
                    video.liveStreamingDetails.concurrentViewers || "0",
                    10
                )
            }
        }

        return {
            isLive: true,
            viewerCount,
            title: snippet.title || "",
            gameName: "",
            startedAt: snippet.actualStartTime || null,
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
                "facebook",
                "instagram",
                "twitch",
                "kick",
                "tiktok",
                "twitter",
            ])
            .eq("user_id", userId)
            .eq("status", "connected")

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
            const baseInfo = {
                platform: network.platform,
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

            switch (network.platform) {
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
                    if (ytToken) {
                        const ytData = await fetchYouTubeStream(ytToken)
                        platforms.push({ ...baseInfo, ...ytData })
                    } else {
                        platforms.push(baseInfo)
                    }
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
        statusCache.set(userId, { data: response, expiresAt: Date.now() + STATUS_CACHE_TTL_MS })

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
