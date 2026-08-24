/**
 * GET /api/live/categories
 * Fetches game/category suggestions from connected platforms (Twitch, Kick, YouTube)
 * Authenticated: requires valid session
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { getTwitchConfig } from "@/lib/twitch/config"
import { getTwitchOAuthService } from "@/lib/twitch/oauth-service"
import { getKickConfig } from "@/lib/kick/config"
import { getKickOAuthService } from "@/lib/kick/oauth-service"
import { getYouTubeOAuthService } from "@/lib/youtube/oauth-service"
import { getYouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import { validateEnv } from "@/lib/config/env"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LiveCategoriesEndpoint")

export interface CategoryResult {
    id: string
    name: string
    platform: string
    boxArtUrl?: string
}

async function getValidAccessToken(
    userId: string,
    platform: string
): Promise<string | null> {
    try {
        const tokenStore = getTokenStore()
        const storedToken = await tokenStore.getToken(userId, platform)

        if (!storedToken) return null

        if (!storedToken.expiresAt || storedToken.expiresAt > Date.now()) {
            return storedToken.accessToken
        }

        if (!storedToken.refreshToken) return null

        let refreshed: {
            accessToken: string
            expiresIn: number
            refreshToken?: string
        }

        if (platform === "twitch") {
            const config = getTwitchConfig()
            const oauthService = getTwitchOAuthService(config)
            await oauthService.initialize()
            refreshed = await oauthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else if (platform === "kick") {
            const config = getKickConfig()
            const oauthService = getKickOAuthService(config)
            await oauthService.initialize()
            refreshed = await oauthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else if (platform === "youtube") {
            const ytConfig = getYouTubeChannelLinkingConfig(validateEnv())
            const ytOAuthService = getYouTubeOAuthService(ytConfig)
            await ytOAuthService.initialize()
            refreshed = await ytOAuthService.refreshAccessToken(
                storedToken.refreshToken
            )
        } else {
            return null
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
    } catch {
        return null
    }
}

async function fetchTwitchCategories(
    query: string,
    accessToken: string
): Promise<CategoryResult[]> {
    try {
        const clientId = process.env.TWITCH_CLIENT_ID || ""
        const url = query
            ? `https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(query)}&first=10`
            : `https://api.twitch.tv/helix/games/top?first=10`

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Client-Id": clientId,
            },
        })

        if (!res.ok) return []
        const data = await res.json()
        return (data.data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            platform: "twitch",
            boxArtUrl: item.box_art_url
                ?.replace("{width}", "144")
                .replace("{height}", "192"),
        }))
    } catch {
        return []
    }
}

async function fetchKickCategories(
    query: string,
    accessToken: string
): Promise<CategoryResult[]> {
    try {
        const url = query
            ? `https://api.kick.com/public/v1/categories?query=${encodeURIComponent(query)}&limit=10`
            : `https://api.kick.com/public/v1/categories?limit=10`

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!res.ok) return []
        const data = await res.json()
        return (data.data || []).map((item: any) => ({
            id: String(item.id),
            name: item.name,
            platform: "kick",
            boxArtUrl: item.banner?.url || item.responsive_banner?.url,
        }))
    } catch {
        return []
    }
}

async function fetchYouTubeCategories(
    query: string,
    accessToken: string
): Promise<CategoryResult[]> {
    try {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        )

        if (!res.ok) return []
        const data = await res.json()
        const items = (data.items || []).map((item: any) => ({
            id: item.id,
            name: item.snippet?.title || "Gaming",
            platform: "youtube",
        }))

        if (!query) return items
        return items.filter((cat: CategoryResult) =>
            cat.name.toLowerCase().includes(query.toLowerCase())
        )
    } catch {
        return []
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

        const { searchParams } = new URL(request.url)
        const query = searchParams.get("query") || ""
        const requestedPlatform = searchParams.get("platform")

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: networks } = await supabase
            .from("social_networks")
            .select("platform")
            .eq("user_id", session.user.id)
            .eq("status", "connected")

        const connectedPlatforms = (networks || []).map(n => n.platform)

        let targetPlatforms = connectedPlatforms
        if (requestedPlatform) {
            targetPlatforms = connectedPlatforms.filter(
                p => p === requestedPlatform
            )
        }

        const results: CategoryResult[] = []

        for (const platform of targetPlatforms) {
            const token = await getValidAccessToken(session.user.id, platform)
            if (!token) {
                // Fallback default list if token fetching fails but platform is connected
                if (query.toLowerCase().includes("game") || !query) {
                    results.push({
                        id: "21779",
                        name: "League of Legends",
                        platform,
                    })
                    results.push({ id: "27471", name: "Minecraft", platform })
                    results.push({ id: "33214", name: "VALORANT", platform })
                    results.push({
                        id: "509658",
                        name: "Just Chatting",
                        platform,
                    })
                }
                continue
            }

            if (platform === "twitch") {
                const cats = await fetchTwitchCategories(query, token)
                results.push(...cats)
            } else if (platform === "kick") {
                const cats = await fetchKickCategories(query, token)
                results.push(...cats)
            } else if (platform === "youtube") {
                const cats = await fetchYouTubeCategories(query, token)
                results.push(...cats)
            }
        }

        return NextResponse.json({
            success: true,
            connectedPlatforms,
            categories: results,
        })
    } catch (error) {
        logger.error(
            "Category search failed",
            error instanceof Error ? error : new Error(String(error))
        )
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}
