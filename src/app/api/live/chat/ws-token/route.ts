import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getTokenStore } from "@/lib/token-store"
import jwt from "jsonwebtoken"

const logger = createLogger("ChatWSTokenEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
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

        const { data: networks } = await supabase
            .from("social_networks")
            .select("*")
            .in("platform", ["twitch", "kick"])
            .eq("user_id", userId)
            .eq("status", "connected")

        const payload: Record<string, unknown> = {
            sub: userId,
            iat: Math.floor(Date.now() / 1000),
        }

        for (const network of networks || []) {
            const plat = network.platform as "twitch" | "kick"
            if (plat !== "twitch" && plat !== "kick") continue

            try {
                const tokenStore = getTokenStore()
                const stored = await tokenStore.getToken(userId, plat)
                if (stored?.accessToken) {
                    payload[plat] = {
                        accessToken: stored.accessToken,
                        refreshToken: stored.refreshToken || undefined,
                        username: network.platform_username || plat,
                    }
                }
            } catch (tokenErr) {
                logger.warn(`Failed to retrieve ${plat} token`, {
                    userId,
                    error: String(tokenErr),
                })
            }
        }

        const secret = process.env.OAUTH_STATE_SECRET || process.env.TOKEN_ENCRYPTION_KEY
        if (!secret) {
            logger.error("No signing secret configured")
            return NextResponse.json(
                { success: false, error: "CONFIG_ERROR" },
                { status: 500 }
            )
        }

        const token = jwt.sign(payload, secret, {
            algorithm: "HS256",
            expiresIn: "5m",
        })

        return NextResponse.json({ success: true, token })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("WS token generation failed", err)
        return NextResponse.json(
            { success: false, error: "TOKEN_FAILED", message: err.message },
            { status: 500 }
        )
    }
}
