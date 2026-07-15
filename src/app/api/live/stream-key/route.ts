/**
 * GET /api/live/stream-key
 * Returns stream key for the specified platform (twitch or kick)
 * For Twitch: fetches via Helix API (requires channel:read:stream_key scope)
 * For Kick: manual entry only (no API available)
 * Authenticated: requires valid session
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTwitchConfig } from "@/lib/twitch/config"
import { getTwitchOAuthService } from "@/lib/twitch/oauth-service"
import { getTokenStore } from "@/lib/token-store"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("StreamKeyEndpoint")

interface StreamKeyResponse {
    success: boolean
    key: string | null
    note?: string
    error?: string
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
        const { searchParams } = new URL(request.url)
        const platform = searchParams.get("platform") || "twitch"

        if (platform !== "twitch" && platform !== "kick") {
            return NextResponse.json(
                { success: false, error: "INVALID_PLATFORM" },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: network, error: networkError } = await supabase
            .from("social_networks")
            .select("*")
            .eq("user_id", userId)
            .eq("platform", platform)
            .eq("status", "connected")
            .single()

        if (networkError || !network) {
            logger.warn("No connected platform found", { userId, platform })
            return NextResponse.json(
                { success: false, error: "PLATFORM_NOT_CONNECTED" },
                { status: 404 }
            )
        }

        if (platform === "twitch") {
            const tokenStore = getTokenStore()
            const tokenData = await tokenStore.getToken(userId, "twitch")

            if (!tokenData?.accessToken) {
                logger.warn("No Twitch access token found", { userId })
                return NextResponse.json(
                    { success: false, error: "TOKEN_NOT_FOUND" },
                    { status: 500 }
                )
            }

            const broadcasterId =
                network.metadata?.userId || network.platform_user_id

            if (!broadcasterId) {
                logger.warn("No Twitch broadcaster ID found", { userId })
                return NextResponse.json(
                    { success: false, error: "BROADCASTER_ID_NOT_FOUND" },
                    { status: 500 }
                )
            }

            const config = getTwitchConfig()
            const oauthService = getTwitchOAuthService(config)
            await oauthService.initialize()

            const streamKey = await oauthService.getStreamKey(
                tokenData.accessToken,
                broadcasterId
            )

            if (!streamKey) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "STREAM_KEY_UNAVAILABLE",
                    },
                    { status: 500 }
                )
            }

            const response: StreamKeyResponse = {
                success: true,
                key: streamKey.streamKey,
            }

            return NextResponse.json(response)
        }

        // Kick platform — no API for stream keys
        const response: StreamKeyResponse = {
            success: true,
            key: null,
            note: "Kick does not provide stream keys via API. Add manually in settings.",
        }

        return NextResponse.json(response)
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Stream key fetch failed", err)
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}
