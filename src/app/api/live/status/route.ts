/**
 * GET /api/live/status
 * Returns live stream status for all connected platforms (Twitch + Kick)
 * Fetches real-time data from platform APIs when tokens are available
 * Authenticated: requires valid session
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LiveStatusEndpoint")

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
    accessToken: string,
    userId: string
): Promise<Partial<PlatformStreamInfo>> {
    try {
        const tokenResponse = await fetch(
            "https://id.twitch.tv/oauth2/token",
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: process.env.TWITCH_CLIENT_ID || "",
                    client_secret: process.env.TWITCH_CLIENT_SECRET || "",
                    grant_type: "client_credentials",
                }),
            }
        )

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
        // Kick API v2: get channel info
        const channelResponse = await fetch(
            `https://api.kick.com/api/v2/channels/${username}`,
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
        const channel = channelData.data || channelData.channel

        if (!channel) return {}

        const isLive =
            channel.livestream?.is_live === true ||
            channel.is_live === true

        return {
            isLive,
            viewerCount: channel.livestream?.viewer_count || 0,
            title: channel.livestream?.session_title || "",
            gameName: channel.livestream?.category?.name || "",
            startedAt: channel.livestream?.started_at || null,
            displayName: channel.user?.name || channel.name || username,
            profileImageUrl: channel.user?.profile_picture || null,
        }
    } catch (error) {
        logger.error("Kick stream fetch failed", { error })
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

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: networks, error } = await supabase
            .from("social_networks")
            .select("*")
            .in("platform", ["twitch", "kick"])
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
                profileImageUrl:
                    network.metadata?.profileImageUrl || null,
                isLive: false,
                viewerCount: 0,
                title: "",
                gameName: "",
                startedAt: null,
            }

            const accessToken = network.access_token

            if (network.platform === "twitch" && accessToken) {
                const twitchData = await fetchTwitchStream(
                    accessToken,
                    network.provider_user_id || network.platform_user_id
                )
                platforms.push({ ...baseInfo, ...twitchData })
            } else if (network.platform === "kick" && accessToken) {
                const kickData = await fetchKickStream(
                    accessToken,
                    network.platform_username || ""
                )
                platforms.push({ ...baseInfo, ...kickData })
            } else {
                platforms.push(baseInfo)
            }
        }

        return NextResponse.json({
            success: true,
            data: platforms,
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Live status fetch failed", err)
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}
