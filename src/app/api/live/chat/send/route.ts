import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getTokenStore } from "@/lib/token-store"
import { MessageAggregator } from "@/lib/realtime/message-aggregator"

const logger = createLogger("ChatSendEndpoint")

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
        const body = await request.json()
        const { platform, message } = body

        if (!platform || !message) {
            return NextResponse.json(
                { success: false, error: "MISSING_FIELDS" },
                { status: 400 }
            )
        }

        if (platform !== "twitch") {
            return NextResponse.json(
                { success: false, error: "UNSUPPORTED_PLATFORM" },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: network } = await supabase
            .from("social_networks")
            .select("platform_username")
            .eq("user_id", userId)
            .eq("platform", "twitch")
            .eq("status", "connected")
            .single()

        if (!network?.platform_username) {
            return NextResponse.json(
                { success: false, error: "TWITCH_NOT_CONNECTED" },
                { status: 400 }
            )
        }

        const tokenStore = getTokenStore()
        const stored = await tokenStore.getToken(userId, "twitch")
        if (!stored?.accessToken) {
            return NextResponse.json(
                { success: false, error: "NO_TOKEN" },
                { status: 400 }
            )
        }

        await MessageAggregator.sendMessage(
            userId,
            "twitch",
            network.platform_username,
            message,
            stored.accessToken
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Chat send failed", err)
        return NextResponse.json(
            { success: false, error: "SEND_FAILED", message: err.message },
            { status: 500 }
        )
    }
}
