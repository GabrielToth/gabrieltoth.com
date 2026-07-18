import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("NotificationsEndpoint")

interface Notification {
    id: string
    type: "error" | "warning" | "info"
    title: string
    message: string
    actionLabel?: string
    actionHref?: string
    platform?: string
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
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: networks } = await supabase
            .from("social_networks")
            .select("platform, status, metadata, updated_at")
            .eq("user_id", userId)

        const notifications: Notification[] = []

        for (const network of networks || []) {
            const plat = network.platform

            // Check for expired/invalid tokens
            if (network.status === "connected") {
                const tokenStore = getTokenStore()
                const token = await tokenStore.getToken(userId, plat)
                if (token && token.expiresAt && token.expiresAt < Date.now()) {
                    notifications.push({
                        id: `token-expired-${plat}`,
                        type: "warning",
                        title: `${plat.charAt(0).toUpperCase() + plat.slice(1)} token expired`,
                        message: `Your ${plat} access token has expired. Attempting auto-refresh.`,
                        platform: plat,
                    })
                }
            }

            // Check for permanently failed tokens (disconnected after terminal error)
            if (network.status === "disconnected" && network.metadata?.previousStatus === "connected") {
                notifications.push({
                    id: `reconnect-${plat}`,
                    type: "error",
                    title: `${plat.charAt(0).toUpperCase() + plat.slice(1)} needs reconnection`,
                    message: `Your ${plat} account was disconnected due to an authentication error. Please reconnect.`,
                    actionLabel: "Reconnect",
                    actionHref: `/dashboard/settings?reconnect=${plat}`,
                })
            }
        }

        return NextResponse.json({
            success: true,
            data: notifications,
            total: notifications.length,
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to fetch notifications", err)
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}
