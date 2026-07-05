/**
 * GET & POST /api/platform/instagram/comments
 *
 * GET  — List comments on a media post
 * POST — Reply to an existing comment
 *
 * GET query params:
 *   media_id (required) — Instagram media ID
 *   limit    (optional) — results per page (1-100, default 25)
 *   after    (optional) — pagination cursor
 *
 * POST body:
 *   {
 *     "comment_id": "string (required)",
 *     "message": "string (required, max 1000 chars)"
 *   }
 *
 * Response (GET 200):
 *   { "success": true, "data": { "comments": [...], "paging": {...} } }
 *
 * Response (POST 201):
 *   { "success": true, "replyId": "instagram-comment-id" }
 *
 * Error codes:
 *   MISSING_USER_ID       - x-user-id header not present
 *   INSTAGRAM_NOT_LINKED  - User has no Instagram linked
 *   TOKEN_EXPIRED         - Token expired / not refreshable
 *   VALIDATION_ERROR      - Missing/invalid params
 *   API_ERROR             - Instagram Graph API error
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { getValidInstagramToken } from "@/lib/instagram/get-valid-token"
import { getInstagramConfig } from "@/lib/instagram/config"
import { getInstagramOAuthService } from "@/lib/instagram/oauth-service"
import { getComments, replyToComment } from "@/lib/instagram/comments"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("InstagramCommentsEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        const { searchParams } = new URL(request.url)
        const mediaId = searchParams.get("media_id")

        if (!mediaId || typeof mediaId !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "media_id query parameter is required",
                },
                { status: 400 }
            )
        }

        const limit = searchParams.get("limit")
        const after = searchParams.get("after")
        const before = searchParams.get("before")

        const tokenStore = getTokenStore()
        const storedToken = await tokenStore.getToken(userId, "instagram")

        if (!storedToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "INSTAGRAM_NOT_LINKED",
                    message: "Instagram account is not linked",
                },
                { status: 404 }
            )
        }

        const config = getInstagramConfig()
        const oauthService = getInstagramOAuthService(config)
        await oauthService.initialize()

        const accessToken = await getValidInstagramToken(userId, {
            tokenStore,
            oauthService,
        })

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "TOKEN_EXPIRED",
                    message: "Instagram token has expired",
                },
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
                {
                    success: false,
                    error: "INSTAGRAM_NOT_LINKED",
                    message: "Instagram account is not linked",
                },
                { status: 404 }
            )
        }

        const comments = await getComments(
            accessToken,
            network.platform_user_id,
            mediaId,
            {
                apiVersion: config.oauth.apiVersion,
                limit: limit ? parseInt(limit, 10) : undefined,
                after: after ?? undefined,
                before: before ?? undefined,
            }
        )

        return NextResponse.json(
            { success: true, data: comments },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to fetch Instagram comments", err)
        return NextResponse.json(
            { success: false, error: "API_ERROR", message: err.message },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        let body: Record<string, unknown>
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: "INVALID_INPUT",
                    message: "Invalid JSON body",
                },
                { status: 400 }
            )
        }

        const allowedKeys = new Set(["comment_id", "message"])
        for (const key of Object.keys(body)) {
            if (!allowedKeys.has(key)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "VALIDATION_ERROR",
                        message: `Unexpected field: ${key}`,
                    },
                    { status: 400 }
                )
            }
        }

        const commentId = body.comment_id
        const message = body.message

        if (!commentId || typeof commentId !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "comment_id is required and must be a string",
                },
                { status: 400 }
            )
        }

        if (!message || typeof message !== "string" || !message.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message:
                        "message is required and must be a non-empty string",
                },
                { status: 400 }
            )
        }

        if (message.length > 1000) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Message exceeds 1000 character limit",
                },
                { status: 400 }
            )
        }

        const tokenStore = getTokenStore()
        const storedToken = await tokenStore.getToken(userId, "instagram")

        if (!storedToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "INSTAGRAM_NOT_LINKED",
                    message: "Instagram account is not linked",
                },
                { status: 404 }
            )
        }

        const config = getInstagramConfig()
        const oauthService = getInstagramOAuthService(config)
        await oauthService.initialize()

        const accessToken = await getValidInstagramToken(userId, {
            tokenStore,
            oauthService,
        })

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "TOKEN_EXPIRED",
                    message: "Instagram token has expired",
                },
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
                {
                    success: false,
                    error: "INSTAGRAM_NOT_LINKED",
                    message: "Instagram account is not linked",
                },
                { status: 404 }
            )
        }

        const result = await replyToComment(
            accessToken,
            network.platform_user_id,
            commentId,
            message
        )

        logger.info("Instagram comment reply sent", {
            userId,
            commentId,
            replyId: result.id,
        })

        return NextResponse.json(
            { success: true, replyId: result.id },
            { status: 201 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to reply to Instagram comment", err)
        return NextResponse.json(
            { success: false, error: "API_ERROR", message: err.message },
            { status: 500 }
        )
    }
}
