/**
 * POST /api/live/update
 * Updates stream title and game/category for a connected platform
 * Authenticated: requires valid session
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LiveUpdateEndpoint")

interface UpdateRequest {
    platform: string
    title: string
    game_id?: string
}

async function updateTwitchStream(
    accessToken: string,
    userId: string,
    title: string,
    gameId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const clientId = process.env.TWITCH_CLIENT_ID || ""

        const body: Record<string, unknown> = {
            broadcaster_id: userId,
            title,
        }
        if (gameId) {
            body.game_id = gameId
        }

        const response = await fetch("https://api.twitch.tv/helix/channels", {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Client-Id": clientId,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error("Twitch stream update failed", {
                status: response.status,
                body: errorBody,
            })
            return {
                success: false,
                error: `Twitch API error (${response.status}): ${errorBody}`,
            }
        }

        return { success: true }
    } catch (error) {
        logger.error("Twitch stream update exception", { error })
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

async function updateKickStream(
    accessToken: string,
    title: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(
            "https://api.kick.com/api/v2/channels/me",
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                }),
            }
        )

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error("Kick stream update failed", {
                status: response.status,
                body: errorBody,
            })
            return {
                success: false,
                error: `Kick API error (${response.status}): ${errorBody}`,
            }
        }

        return { success: true }
    } catch (error) {
        logger.error("Kick stream update exception", { error })
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const body: UpdateRequest = await request.json()
        const { platform, title, game_id } = body

        if (!platform || !title) {
            return NextResponse.json(
                { success: false, error: "MISSING_FIELDS" },
                { status: 400 }
            )
        }

        if (!["twitch", "kick"].includes(platform)) {
            return NextResponse.json(
                { success: false, error: "INVALID_PLATFORM" },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: networks, error: fetchError } = await supabase
            .from("social_networks")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("platform", platform)
            .eq("status", "connected")
            .single()

        if (fetchError || !networks) {
            logger.error("Platform not connected", {
                userId: session.user.id,
                platform,
                error: fetchError?.message,
            })
            return NextResponse.json(
                { success: false, error: "PLATFORM_NOT_CONNECTED" },
                { status: 404 }
            )
        }

        const accessToken = networks.access_token
        let result: { success: boolean; error?: string }

        if (platform === "twitch") {
            result = await updateTwitchStream(
                accessToken,
                networks.provider_user_id || networks.platform_user_id,
                title,
                game_id
            )
        } else {
            result = await updateKickStream(accessToken, title)
        }

        return NextResponse.json(result, {
            status: result.success ? 200 : 500,
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Live update failed", err)
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}
