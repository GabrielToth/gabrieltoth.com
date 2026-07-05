import { getServerSession } from "@/lib/auth/get-server-session"
import { isScopeOutdated, getScopeVersion } from "@/lib/oauth/scope-versions"
import { getOAuthManager } from "@/lib/oauth"
import { getTokenStore } from "@/lib/token-store"
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
                .select("platform, expires_at, refresh_token")
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

        const oauthManager = getOAuthManager()
        const tokenStore = getTokenStore()

        const channels: SocialChannel[] = []

        for (const sn of socialNetworks) {
            const token = tokens.find(t => t.platform === sn.platform)
            const isExpired = token?.expires_at
                ? new Date(token.expires_at) < new Date()
                : false
            const metadata = sn.metadata as Record<string, unknown> | null
            const storedScopeVersion = metadata?.scopeVersion as
                | number
                | undefined

            const profileImageUrl = metadata?.profileImageUrl as
                | string
                | undefined

            let isConnected = sn.status === "connected" && !isExpired
            let needsReconnect = false

            // If the token is expired BUT we have a refresh token, try to refresh
            if (
                sn.status === "connected" &&
                isExpired &&
                token?.refresh_token
            ) {
                try {
                    const refreshed = await oauthManager.refreshAccessToken(
                        sn.platform as any,
                        token.refresh_token as string,
                        userId
                    )

                    // Persist the new token
                    await tokenStore.refreshToken(userId, sn.platform, {
                        accessToken: refreshed.accessToken,
                        refreshToken: refreshed.refreshToken,
                        expiresAt: Date.now() + refreshed.expiresIn * 1000,
                        platform: sn.platform,
                        userId,
                    })

                    isConnected = true
                    logger.info("Auto-refreshed token for platform", {
                        platform: sn.platform,
                        userId,
                    })
                } catch (refreshError) {
                    logger.warn("Failed to auto-refresh token", {
                        platform: sn.platform,
                        userId,
                        error:
                            refreshError instanceof Error
                                ? refreshError.message
                                : String(refreshError),
                    })
                    isConnected = false
                }
            }

            // Determine needsReconnect
            if (isConnected) {
                needsReconnect = isScopeOutdated(
                    storedScopeVersion,
                    sn.platform
                )
            } else if (sn.status === "connected" && isExpired) {
                // Token expired and no refresh token or refresh failed
                needsReconnect = true
            }

            channels.push({
                id: sn.id,
                platform: sn.platform,
                accountId: sn.platform_user_id,
                accountName: sn.platform_username || sn.platform,
                isConnected,
                thumbnailUrl: profileImageUrl,
                connectedAt: sn.linked_at,
                needsReconnect,
                currentScopeVersion: getScopeVersion(sn.platform),
            })
        }

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
