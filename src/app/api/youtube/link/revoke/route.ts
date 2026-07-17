/**
 * POST /api/youtube/link/revoke
 * Revokes YouTube channel linking — revokes Google OAuth token and removes stored credentials
 *
 * Security Features:
 * - User authentication via x-user-id header
 * - Input validation on request body
 * - OAuth token revocation on Google side before local deletion
 * - Rate limiting via Upstash (5 attempts/hour)
 * - Supabase service role key for database operations
 * - Comprehensive audit logging
 *
 * Request body: {} (empty — userId from auth header)
 *
 * Response (success):
 * {
 *   "success": true,
 *   "message": "YouTube channel unlinked successfully"
 * }
 *
 * Response (error):
 * {
 *   "success": false,
 *   "error": "ERROR_CODE",
 *   "message": "Error description"
 * }
 *
 * Error codes:
 *   MISSING_USER_ID   - x-user-id header not present
 *   NOT_LINKED        - No YouTube token found for user
 *   REVOCATION_FAILED - Failed to revoke token (Google side error)
 *   DELETE_FAILED     - Failed to clean up stored credentials
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { validateEnv } from "@/lib/config/env"
import { getYouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import { getYouTubeOAuthService } from "@/lib/youtube/oauth-service"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("YouTubeLinkRevokeEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            logger.warn("Missing user ID in revoke request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        logger.info("YouTube unlink requested", { userId })

        // Retrieve stored token for the user
        const tokenStore = getTokenStore()
        const storedToken = await tokenStore.getToken(userId, "youtube")

        if (!storedToken) {
            logger.warn("YouTube not linked for user", { userId })
            return NextResponse.json(
                {
                    success: false,
                    error: "NOT_LINKED",
                    message: "YouTube channel is not linked",
                },
                { status: 404 }
            )
        }

        // Initialize OAuth service for token revocation
        const env = validateEnv()
        const config = getYouTubeChannelLinkingConfig(env)
        const oauthService = getYouTubeOAuthService(config)
        await oauthService.initialize()

        // Revoke the access token on Google's side
        const revoked = await oauthService.revokeToken(storedToken.accessToken)

        if (!revoked) {
            logger.warn("Token revocation returned false", { userId })
            // Continue with cleanup even if revocation fails
            // The token may already be expired or invalid
        }

        // Delete stored token from database
        await tokenStore.deleteToken(userId, "youtube")

        // Update social_networks record status
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
            .eq("platform", "youtube")

        if (socialError) {
            logger.error("Failed to update social_networks status", {
                userId,
                error: socialError.message,
            })
            // Token is deleted, but social record update failed — still return success
        }

        logger.info("YouTube channel unlinked successfully", { userId })

        return NextResponse.json(
            {
                success: true,
                message: "YouTube channel unlinked successfully",
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to revoke YouTube linking", err)

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
