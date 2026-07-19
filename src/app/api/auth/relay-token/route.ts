import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"
import { getTokenStore } from "@/lib/token-store"
import { isTerminalTokenError, markAccountDisconnected } from "@/lib/auth/token-health"

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
                JSON.stringify({ success: false, error: "SERVER_CONFIG_ERROR" }),
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
            .select("platform, platform_username")
            .eq("user_id", userId)
            .eq("status", "connected")
            .in("platform", ["youtube", "twitch", "kick"])

        const platforms: Record<string, { channelName: string; accessToken?: string }> = {}

        for (const network of networks || []) {
            const plat = network.platform
            const info: { channelName: string; accessToken?: string } = {
                channelName: network.platform_username || plat,
            }

            try {
                const tokenStore = getTokenStore()
                let stored = await tokenStore.getToken(userId, plat)

                if (plat === "youtube" && stored?.refreshToken && stored.expiresAt && stored.expiresAt < Date.now()) {
                    try {
                        const { getYouTubeOAuthService } = await import("@/lib/youtube/oauth-service")
                        const { getYouTubeChannelLinkingConfig } = await import("@/lib/youtube/config")
                        const { validateEnv } = await import("@/lib/config/env")
                        const config = getYouTubeChannelLinkingConfig(validateEnv())
                        const oauth = getYouTubeOAuthService(config)
                        await oauth.initialize()
                        const refreshed = await oauth.refreshAccessToken(stored.refreshToken)
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
                        const msg = err instanceof Error ? err.message : String(err)
                        logger.error("YouTube token refresh failed", { userId, error: msg })
                        if (isTerminalTokenError(msg)) {
                            await markAccountDisconnected(userId, "youtube").catch(() => {})
                        }
                    }
                }

                if (stored?.accessToken) {
                    info.accessToken = stored.accessToken
                }
            } catch (tokenErr) {
                logger.warn(`Failed to retrieve ${plat} token`, { userId, error: String(tokenErr) })
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
