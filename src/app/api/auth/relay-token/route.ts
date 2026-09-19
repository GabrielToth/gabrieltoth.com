import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"
import { getFreshPlatformToken } from "@/lib/auth/token-refresh"

const logger = createLogger("RelayTokenEndpoint")

export async function GET(request: NextRequest): Promise<Response> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return new Response(
                JSON.stringify({ success: false, error: "UNAUTHORIZED" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            )
        }

        const secret = process.env.JWT_SECRET || process.env.OAUTH_STATE_SECRET
        if (!secret) {
            logger.error("Relay: JWT_SECRET not configured")
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "SERVER_CONFIG_ERROR",
                }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            )
        }

        const userId = session.user.id
        const relayToken = jwt.sign({ sub: userId }, secret, {
            algorithm: "HS256",
            expiresIn: "5m",
        })

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: networks } = await supabase
            .from("social_networks")
            .select("platform, platform_username, platform_user_id")
            .eq("user_id", userId)
            .eq("status", "connected")
            .in("platform", ["youtube", "twitch", "kick"])

        const platforms: Record<
            string,
            { channelName: string; accessToken?: string; channelId?: string }
        > = {}

        for (const network of networks || []) {
            const plat = network.platform
            const info: {
                channelName: string
                accessToken?: string
                channelId?: string
            } = {
                channelName: network.platform_username || plat,
            }

            // Pass the platform channel ID (YouTube UC... channelId)
            if (network.platform_user_id) {
                info.channelId = network.platform_user_id
            }

            try {
                const stored = await getFreshPlatformToken(
                    userId,
                    plat as "youtube" | "twitch" | "kick"
                )

                if (stored?.accessToken) {
                    info.accessToken = stored.accessToken
                }
            } catch (tokenErr) {
                logger.warn(`Failed to retrieve ${plat} token`, {
                    userId,
                    error: String(tokenErr),
                })
            }

            platforms[plat] = info
        }

        return new Response(
            JSON.stringify({ success: true, token: relayToken, platforms }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Relay token endpoint error", err)
        return new Response(
            JSON.stringify({ success: false, error: "INTERNAL_ERROR" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}
