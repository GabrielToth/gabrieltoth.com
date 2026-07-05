import { getServerSession } from "@/lib/auth/get-server-session"
import { isScopeOutdated, getScopeVersion } from "@/lib/oauth/scope-versions"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("UserChannelsEndpoint")

export interface SocialChannel {
    id: string
    platform: string
    accountId: string
    accountName: string
    isConnected: boolean
    thumbnailUrl?: string
    connectedAt?: string
    needsReconnect?: boolean
    currentScopeVersion?: number
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const [socialResult, tokensResult] = await Promise.all([
            supabase
                .from("social_networks")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),
            supabase
                .from("oauth_tokens")
                .select("platform, expires_at")
                .eq("user_id", userId),
        ])

        if (socialResult.error) {
            logger.error("Failed to fetch social networks", {
                error: socialResult.error.message,
            })
            return NextResponse.json({ channels: [] })
        }

        const socialNetworks = socialResult.data || []
        const tokens = tokensResult.data || []

        const tokenMap = new Map(tokens.map(t => [t.platform, t]))

        const channels: SocialChannel[] = socialNetworks.map(sn => {
            const token = tokenMap.get(sn.platform)
            const isExpired = token?.expires_at
                ? new Date(token.expires_at) < new Date()
                : false
            const isConnected = sn.status === "connected" && !isExpired
            const metadata = sn.metadata as Record<string, unknown> | null
            const storedScopeVersion = metadata?.scopeVersion as
                | number
                | undefined

            const profileImageUrl = metadata?.profileImageUrl as
                | string
                | undefined

            return {
                id: sn.id,
                platform: sn.platform,
                accountId: sn.platform_user_id,
                accountName: sn.platform_username || sn.platform,
                isConnected,
                thumbnailUrl: profileImageUrl,
                connectedAt: sn.linked_at,
                needsReconnect: isConnected
                    ? isScopeOutdated(storedScopeVersion, sn.platform)
                    : false,
                currentScopeVersion: getScopeVersion(sn.platform),
            }
        })

        return NextResponse.json({ channels })
    } catch (error) {
        logger.error("Failed to fetch user channels", {
            error: error instanceof Error ? error.message : String(error),
        })
        return NextResponse.json(
            { error: "Failed to fetch channels" },
            { status: 500 }
        )
    }
}
