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
            .in("platform", ["twitch", "kick", "tiktok", "twitter"])
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

        // Determine which platforms the user has connected
        const platforms: Array<"twitch" | "kick"> = []
        for (const network of networks || []) {
            if (network.platform === "twitch" || network.platform === "kick") {
                platforms.push(network.platform)
            }
        }

        if (platforms.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "NO_PLATFORMS",
                    message: "No Twitch or Kick platforms connected",
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
        const aggregator = new MessageAggregator(userId, platforms)
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
