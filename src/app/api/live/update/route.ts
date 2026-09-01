/**
 * POST /api/live/update
 * Updates stream title and game/category for a connected platform
 * Delegates platform updates to @/lib/live/stream-updater (shared with
 * server-side chat commands like !titleall / !categoryall).
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import {
    forceRefreshAccessToken,
    getValidAccessToken,
    resolveKickGameId,
    resolveTwitchGameId,
    updateKickStream,
    updateTwitchStream,
    updateYouTubeStream,
} from "@/lib/live/stream-updater"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LiveUpdateEndpoint")

interface UpdateRequest {
    platform: string
    title?: string
    game_id?: string
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

        if (!["twitch", "kick", "youtube"].includes(platform)) {
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

        const { accessToken, error: tokenError } = await getValidAccessToken(
            session.user.id,
            platform
        )

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        tokenError === "TOKEN_REFRESH_FAILED"
                            ? "TOKEN_REFRESH_FAILED"
                            : tokenError === "EXPIRED_NO_REFRESH"
                              ? "TOKEN_EXPIRED"
                              : "PLATFORM_NOT_CONNECTED",
                },
                { status: 401 }
            )
        }

        let resolvedGameId: string | undefined = game_id
        if (game_id && !/^\d+$/.test(game_id)) {
            if (platform === "twitch") {
                resolvedGameId =
                    (await resolveTwitchGameId(
                        game_id,
                        process.env.TWITCH_CLIENT_ID || "",
                        accessToken
                    )) ?? undefined
            } else {
                const resolved = await resolveKickGameId(game_id, accessToken)
                resolvedGameId = resolved.id ?? undefined
            }
            if (!resolvedGameId) {
                logger.warn(
                    "Could not resolve game name to ID, skipping game_id",
                    {
                        input: game_id,
                        platform,
                    }
                )
            }
        }

        let result: { success: boolean; error?: string }

        if (platform === "twitch") {
            result = await updateTwitchStream(
                accessToken,
                networks.provider_user_id || networks.platform_user_id,
                title,
                resolvedGameId
            )
        } else if (platform === "kick") {
            result = await updateKickStream(accessToken, title, resolvedGameId)
        } else {
            result = await updateYouTubeStream(
                accessToken,
                title,
                resolvedGameId
            )
        }

        if (!result.success && result.error?.includes("(401)")) {
            logger.info(
                "API returned 401, attempting token refresh and retry",
                {
                    platform,
                    userId: session.user.id,
                }
            )

            const refreshed = await forceRefreshAccessToken(
                session.user.id,
                platform
            )

            if (refreshed) {
                if (platform === "twitch") {
                    result = await updateTwitchStream(
                        refreshed,
                        networks.provider_user_id || networks.platform_user_id,
                        title,
                        game_id
                    )
                } else if (platform === "kick") {
                    result = await updateKickStream(
                        refreshed,
                        title,
                        resolvedGameId
                    )
                } else {
                    result = await updateYouTubeStream(
                        refreshed,
                        title,
                        resolvedGameId
                    )
                }

                logger.info("Retry after token refresh completed", {
                    platform,
                    success: result.success,
                })
            }
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
