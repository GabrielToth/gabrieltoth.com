import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { getValidFacebookToken } from "@/lib/facebook/get-valid-token"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { deleteComment, hideComment } from "@/lib/facebook/comments"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("FacebookCommentIdEndpoint")

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

        const { id: commentId } = await params
        const { searchParams } = new URL(request.url)
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

        await deleteComment(pageAccessToken, commentId)

        logger.info("Facebook comment deleted", { userId, commentId })

        return NextResponse.json(
            {
                success: true,
                message: "Comment deleted successfully",
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to delete Facebook comment", err)

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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

        const { id: commentId } = await params
        const { searchParams } = new URL(request.url)
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

        const allowedKeys = new Set(["hide"])
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

        if (typeof body.hide !== "boolean") {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "hide field must be a boolean",
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

        await hideComment(pageAccessToken, commentId, body.hide as boolean)

        logger.info("Facebook comment visibility changed", {
            userId,
            commentId,
            hide: body.hide,
        })

        return NextResponse.json(
            {
                success: true,
                message: body.hide
                    ? "Comment hidden successfully"
                    : "Comment unhidden successfully",
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to update Facebook comment visibility", err)

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
