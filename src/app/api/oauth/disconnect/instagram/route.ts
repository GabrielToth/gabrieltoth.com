/**
 * POST /api/oauth/disconnect/instagram
 * Revokes Instagram Business Account linking — revokes Facebook/Instagram OAuth token
 * and removes stored credentials
 *
 * Request body: {} (empty — userId from auth header)
 *
 * Response (success):
 * {
 *   "success": true,
 *   "message": "Instagram account unlinked successfully"
 * }
 *
 * Response (error):
 * {
 *   "success": false,
 *   "error": "ERROR_CODE",
 *   "message": "Error description"
 * }
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { getInstagramConfig } from "@/lib/instagram/config"
import { getInstagramOAuthService } from "@/lib/instagram/oauth-service"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("InstagramDisconnectEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            logger.warn("Missing user ID in Instagram disconnect request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        logger.info("Instagram unlink requested", { userId })

        const tokenStore = getTokenStore()
        const storedToken = await tokenStore.getToken(userId, "instagram")

        if (!storedToken) {
            logger.warn("Instagram not linked for user", { userId })
            return NextResponse.json(
                {
                    success: false,
                    error: "NOT_LINKED",
                    message: "Instagram account is not linked",
                },
                { status: 404 }
            )
        }

        const config = getInstagramConfig()
        const oauthService = getInstagramOAuthService(config)
        await oauthService.initialize()

        const revoked = await oauthService.revokeToken(
            userId,
            storedToken.accessToken
        )

        if (!revoked) {
            logger.warn("Instagram token revocation returned false", {
                userId,
            })
        }

        await tokenStore.deleteToken(userId, "instagram")

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error: socialError } = await supabase
            .from("social_networks")
            .update({
                status: "disconnected",
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("platform", "instagram")

        if (socialError) {
            logger.error("Failed to update Instagram social_networks status", {
                userId,
                error: socialError.message,
            })
        }

        logger.info("Instagram account unlinked successfully", { userId })

        return NextResponse.json(
            {
                success: true,
                message: "Instagram account unlinked successfully",
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to revoke Instagram linking", err)

        return NextResponse.json(
            {
                success: false,
                error: "REVOCATION_FAILED",
                message: err.message,
            },
            { status: 500 }
        )
    }
}
