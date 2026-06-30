import { createLogger } from "@/lib/logger"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getTokenStore } from "@/lib/token-store"
import { getValidFacebookToken } from "@/lib/facebook/get-valid-token"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { postToPageFeed } from "@/lib/facebook/posts"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("FacebookPublishEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            logger.warn("Missing user ID in Facebook publish request")
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
            logger.warn("Facebook not linked for user", { userId })
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

        const allowedKeys = new Set([
            "pageId",
            "message",
            "link",
            "picture",
            "caption",
            "description",
        ])
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

        const pageId = body.pageId as string | undefined
        const message = body.message as string | undefined

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

        if (message.length > 5000) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Message exceeds 5000 character limit",
                },
                { status: 400 }
            )
        }

        logger.info("Facebook publish requested", { userId, pageId })

        const pageAccessToken = await oauthService.getPageAccessToken(
            pageId,
            accessToken
        )

        if (!pageAccessToken) {
            logger.warn("Failed to get page access token", { userId, pageId })
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

        const result = await postToPageFeed(pageAccessToken, pageId, {
            message,
            link: body.link as string | undefined,
            picture: body.picture as string | undefined,
            caption: body.caption as string | undefined,
            description: body.description as string | undefined,
        })

        logger.info("Facebook publish succeeded", {
            userId,
            pageId,
            postId: result.id,
        })

        return NextResponse.json(
            {
                success: true,
                postId: result.id,
                url: `https://www.facebook.com/${pageId}/posts/${result.id}`,
            },
            { status: 201 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to publish to Facebook", err)

        return NextResponse.json(
            {
                success: false,
                error: "PUBLISH_FAILED",
                message: err.message,
            },
            { status: 500 }
        )
    }
}
