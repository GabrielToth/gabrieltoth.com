/**
 * POST /api/oauth/disconnect/kick
 * Revokes Kick account linking — revokes Kick OAuth tokens and removes stored credentials
 *
 * Request body: {} (empty — userId from auth header)
 *
 * Response (success):
 * {
 *   "success": true,
 *   "message": "Kick account unlinked successfully"
 * }
 *
 * Response (error):
 * {
 *   "success": false,
 *   "error": "ERROR_CODE",
 *   "message": "Error description"
 * }
 */

import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { getKickConfig } from "@/lib/kick/config"
import { getKickOAuthService } from "@/lib/kick/oauth-service"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("KickDisconnectEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            logger.warn("Missing user ID in Kick disconnect request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        logger.info("Kick unlink requested", { userId })

        const tokenStore = getTokenStore()
        const storedToken = await tokenStore.getToken(userId, "kick")

        if (!storedToken) {
            logger.warn("Kick not linked for user", { userId })
            return NextResponse.json(
                {
                    success: false,
                    error: "NOT_LINKED",
                    message: "Kick account is not linked",
                },
                { status: 404 }
            )
        }

        const config = getKickConfig()
        const oauthService = getKickOAuthService(config)
        await oauthService.initialize()

        const revoked = await oauthService.revokeToken(storedToken.accessToken)

        if (!revoked) {
            logger.warn("Kick token revocation returned false", {
                userId,
            })
        }

        await tokenStore.deleteToken(userId, "kick")

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
            .eq("platform", "kick")

        if (socialError) {
            logger.error("Failed to update Kick social_networks status", {
                userId,
                error: socialError.message,
            })
        }

        logger.info("Kick account unlinked successfully", { userId })

        return NextResponse.json(
            {
                success: true,
                message: "Kick account unlinked successfully",
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to revoke Kick linking", err)

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
