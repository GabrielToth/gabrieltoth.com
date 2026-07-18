/**
 * GET /api/live/chat/stream
 * Server-Sent Events endpoint for real-time unified chat.
 * Authenticated: requires valid session.
 * Queries connected platforms (twitch/kick) and streams messages via SSE.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"
import { MessageAggregator } from "@/lib/realtime/message-aggregator"
import { createSSEStream, closeConnections } from "@/lib/realtime/sse-manager"
import { getTokenStore } from "@/lib/token-store"
import { isTerminalTokenError, markAccountDisconnected } from "@/lib/auth/token-health"

const logger = createLogger("ChatStreamEndpoint")

export async function GET(request: NextRequest): Promise<Response> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return new Response(
                JSON.stringify({ success: false, error: "UNAUTHORIZED" }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                }
            )
        }

        const userId = session.user.id

        // Query connected platforms for chat
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: networks, error } = await supabase
            .from("social_networks")
            .select("*")
            .in("platform", ["twitch", "kick", "youtube", "tiktok", "twitter"])
            .eq("user_id", userId)
            .eq("status", "connected")

        if (error) {
            logger.error("Failed to fetch connected platforms", {
                userId,
                error: error.message,
            })
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "DATABASE_ERROR",
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            )
        }

        // Determine which platforms the user has connected and their channel names
        const platformConnect: Partial<
            Record<"twitch" | "kick" | "youtube", { channelName: string; token?: string }>
        > = {}
        for (const network of networks || []) {
            const plat = network.platform as "twitch" | "kick" | "youtube"
            if (plat === "twitch" || plat === "kick" || plat === "youtube") {
                // Skip YouTube channels without chatroomId to avoid API quota waste
                if (plat === "youtube") {
                    const meta = network.metadata as Record<string, unknown> | null
                    if (!meta?.chatroomId) {
                        continue
                    }
                }
                const info: { channelName: string; token?: string } = {
                    channelName: network.platform_username || plat,
                }

                try {
                    const tokenStore = getTokenStore()
                    let stored = await tokenStore.getToken(userId, plat)

                    // Auto-refresh expired YouTube token
                    if (plat === "youtube" && stored?.refreshToken && stored.expiresAt && stored.expiresAt < Date.now()) {
                        try {
                            const { getYouTubeOAuthService } = await import("@/lib/youtube/oauth-service")
                            const { getYouTubeChannelLinkingConfig } = await import("@/lib/youtube/config")
                            const { validateEnv } = await import("@/lib/config/env")
                            const ytConfig = getYouTubeChannelLinkingConfig(validateEnv())
                            const ytOAuth = getYouTubeOAuthService(ytConfig)
                            await ytOAuth.initialize()
                            const refreshed = await ytOAuth.refreshAccessToken(stored.refreshToken)
                            const expiresAt = Date.now() + refreshed.expiresIn * 1000
                            await tokenStore.refreshToken(userId, "youtube", {
                                accessToken: refreshed.accessToken,
                                refreshToken: refreshed.refreshToken,
                                expiresAt,
                                platform: "youtube",
                                userId,
                            })
                            stored = await tokenStore.getToken(userId, "youtube")
                        } catch (err) {
                            const errMsg = err instanceof Error ? err.message : String(err)
                            logger.error("YouTube token auto-refresh failed in stream", { userId, error: errMsg })
                            if (isTerminalTokenError(errMsg)) {
                                await markAccountDisconnected(userId, "youtube").catch(() => {})
                            }
                        }
                    }

                    if (stored?.accessToken) {
                        info.token = stored.accessToken
                        logger.debug(`${plat} OAuth token retrieved for chat`, {
                            userId,
                        })
                    }
                } catch (tokenErr) {
                    logger.warn(`Failed to retrieve ${plat} token for chat`, {
                        userId,
                        error: String(tokenErr),
                    })
                }

                platformConnect[plat] = info
            }
        }

        const platforms = Object.keys(platformConnect)
        if (platforms.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "NO_PLATFORMS",
                    message: "No Twitch, Kick, or YouTube platforms connected",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            )
        }

        // Create SSE stream
        const { response, connectionId } = createSSEStream(request, userId)

        // Start message aggregator
        const aggregator = new MessageAggregator(userId, platformConnect)
        aggregator.start().catch(err => {
            logger.error("Aggregator failed to start", {
                userId,
                connectionId,
                error: String(err),
            })
        })

        // Cleanup on request abort/disconnect
        request.signal.addEventListener("abort", () => {
            aggregator.stop().catch(err => {
                logger.warn("Error stopping aggregator on abort", {
                    userId,
                    error: String(err),
                })
            })
            closeConnections(userId)
            logger.debug("Chat stream aborted", { userId, connectionId })
        })

        logger.info("Chat stream started", {
            userId,
            connectionId,
            platforms,
        })

        return response
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Chat stream endpoint error", err)
        return new Response(
            JSON.stringify({ success: false, error: "INTERNAL_ERROR" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        )
    }
}
