/**
 * DELETE /api/platform/instagram/comments/{id}
 *
 * Hide or delete a comment on the authenticated Instagram Business Account's media.
 * Requires the `instagram_business_manage_comments` scope.
 *
 * Response (200):
 *   { "success": true }
 *
 * Error codes:
 *   MISSING_USER_ID       - x-user-id header not present
 *   INSTAGRAM_NOT_LINKED  - User has no Instagram linked
 *   TOKEN_EXPIRED         - Token expired / not refreshable
 *   API_ERROR             - Instagram Graph API error
 */

import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { getValidInstagramToken } from "@/lib/instagram/get-valid-token"
import { getInstagramConfig } from "@/lib/instagram/config"
import { getInstagramOAuthService } from "@/lib/instagram/oauth-service"
import { deleteComment } from "@/lib/instagram/comments"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("InstagramCommentDeleteEndpoint")

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "MISSING_USER_ID", message: "User ID is required" },
                { status: 400 }
            )
        }

        const { id: commentId } = await params

        if (!commentId) {
            return NextResponse.json(
                { success: false, error: "VALIDATION_ERROR", message: "Comment ID is required" },
                { status: 400 }
            )
        }

        const tokenStore = getTokenStore()
        const storedToken = await tokenStore.getToken(userId, "instagram")

        if (!storedToken) {
            return NextResponse.json(
                { success: false, error: "INSTAGRAM_NOT_LINKED", message: "Instagram account is not linked" },
                { status: 404 }
            )
        }

        const config = getInstagramConfig()
        const oauthService = getInstagramOAuthService(config)
        await oauthService.initialize()

        const accessToken = await getValidInstagramToken(userId, { tokenStore, oauthService })

        if (!accessToken) {
            return NextResponse.json(
                { success: false, error: "TOKEN_EXPIRED", message: "Instagram token has expired" },
                { status: 401 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: network } = await supabase
            .from("social_networks")
            .select("platform_user_id")
            .eq("user_id", userId)
            .eq("platform", "instagram")
            .single()

        if (!network) {
            return NextResponse.json(
                { success: false, error: "INSTAGRAM_NOT_LINKED", message: "Instagram account is not linked" },
                { status: 404 }
            )
        }

        await deleteComment(accessToken, network.platform_user_id, commentId)

        logger.info("Instagram comment deleted", { userId, commentId })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to delete Instagram comment", err)
        return NextResponse.json(
            { success: false, error: "API_ERROR", message: err.message },
            { status: 500 }
        )
    }
}
