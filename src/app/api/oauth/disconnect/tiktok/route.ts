import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { getTikTokConfig } from "@/lib/tiktok/config"
import { getTikTokOAuthService } from "@/lib/tiktok/oauth-service"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TikTokDisconnectEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            logger.warn("Missing user ID in TikTok disconnect request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 },
            )
        }

        logger.info("TikTok unlink requested", { userId })

        const tokenStore = getTokenStore()
        const storedToken = await tokenStore.getToken(userId, "tiktok")

        if (!storedToken) {
            logger.warn("TikTok not linked for user", { userId })
            return NextResponse.json(
                {
                    success: false,
                    error: "NOT_LINKED",
                    message: "TikTok account is not linked",
                },
                { status: 404 },
            )
        }

        const config = getTikTokConfig()
        const oauthService = getTikTokOAuthService(config)
        await oauthService.initialize()

        const revoked = await oauthService.revokeToken(storedToken.accessToken)

        if (!revoked) {
            logger.warn("TikTok token revocation returned false", {
                userId,
            })
        }

        await tokenStore.deleteToken(userId, "tiktok")

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        )

        const { error: socialError } = await supabase
            .from("social_networks")
            .update({
                status: "disconnected",
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("platform", "tiktok")

        if (socialError) {
            logger.error("Failed to update TikTok social_networks status", {
                userId,
                error: socialError.message,
            })
        }

        logger.info("TikTok account unlinked successfully", { userId })

        return NextResponse.json(
            {
                success: true,
                message: "TikTok account unlinked successfully",
            },
            { status: 200 },
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to revoke TikTok linking", err)

        return NextResponse.json(
            {
                success: false,
                error: "REVOCATION_FAILED",
                message: err.message,
            },
            { status: 500 },
        )
    }
}
