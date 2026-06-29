import { createLogger } from "@/lib/logger"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getTokenStore } from "@/lib/token-store"
import { getValidFacebookToken } from "@/lib/facebook/get-valid-token"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { getComments, replyToComment } from "@/lib/facebook/comments"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("FacebookCommentsEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

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
        const postId = searchParams.get("post_id")

        if (!postId || typeof postId !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "post_id query parameter is required",
                },
                { status: 400 }
            )
        }

        const pageId = searchParams.get("pageId")
        if (!pageId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "pageId query parameter is required",
                },
                { status: 400 }
            )
        }

        const config = getFacebookConfig()
        const oauthService = getFacebookOAuthService(config)
        await oauthService.initialize()

        const accessToken = await getValidFacebookToken(userId, {
            oauthService,
        })

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "FACEBOOK_NOT_LINKED",
                    message: "Facebook account is not linked",
                },
                { status: 404 }
            )
        }

        const pageAccessToken = await oauthService.getPageAccessToken(
            pageId,
            accessToken
        )

        if (!pageAccessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "PAGE_TOKEN_FAILED",
                    message:
                        "Failed to obtain access token for the specified page",
                },
                { status: 500 }
            )
        }

        const limit = searchParams.get("limit")
        const after = searchParams.get("after")
        const before = searchParams.get("before")

        const result = await getComments(pageAccessToken, postId, {
            limit: limit ? parseInt(limit, 10) : undefined,
            after: after || undefined,
            before: before || undefined,
        })

        return NextResponse.json(
            {
                success: true,
                data: {
                    comments: result.data,
                    paging: result.paging,
                },
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to fetch Facebook comments", err)

        return NextResponse.json(
            {
                success: false,
                error: "API_ERROR",
                message: err.message,
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

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

        const config = getFacebookConfig()
        const oauthService = getFacebookOAuthService(config)
        await oauthService.initialize()

        const accessToken = await getValidFacebookToken(userId, {
            oauthService,
        })

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "FACEBOOK_NOT_LINKED",
                    message: "Facebook account is not linked",
                },
                { status: 404 }
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

        const allowedKeys = new Set(["pageId", "comment_id", "message"])
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

        const commentId = body.comment_id as string | undefined
        const message = body.message as string | undefined
        const pageId = body.pageId as string | undefined

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

        if (!pageId || typeof pageId !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "pageId is required and must be a string",
                },
                { status: 400 }
            )
        }

        const pageAccessToken = await oauthService.getPageAccessToken(
            pageId,
            accessToken
        )

        if (!pageAccessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "PAGE_TOKEN_FAILED",
                    message:
                        "Failed to obtain access token for the specified page",
                },
                { status: 500 }
            )
        }

        const result = await replyToComment(pageAccessToken, commentId, message)

        logger.info("Facebook comment reply posted", {
            userId,
            commentId,
            replyId: result.id,
        })

        return NextResponse.json(
            {
                success: true,
                replyId: result.id,
            },
            { status: 201 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to reply to Facebook comment", err)

        return NextResponse.json(
            {
                success: false,
                error: "API_ERROR",
                message: err.message,
            },
            { status: 500 }
        )
    }
}
