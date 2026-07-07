/**
 * POST /api/platform/facebook/publish
 * Publish content (text or video) to a Facebook Page.
 *
 * Text post body:
 * {
 *   "pageId": "string",
 *   "message": "string",
 *   "link": "string (optional)",
 *   "picture": "string (optional)",
 *   "caption": "string (optional)",
 *   "description": "string (optional)"
 * }
 *
 * Video post body:
 * {
 *   "pageId": "string",
 *   "videoUrl": "string (required for video)",
 *   "description": "string (required for video)",
 *   "title": "string (optional)",
 *   "thumb": "string (optional)"
 * }
 *
 * Response (201):
 * {
 *   "success": true,
 *   "postId": "facebook-post-id",
 *   "url": "https://www.facebook.com/{pageId}/posts/{postId}"
 * }
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getValidFacebookToken } from "@/lib/facebook/get-valid-token"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { postToPageFeed } from "@/lib/facebook/posts"
import { postVideoToFacebook } from "@/lib/posting/adapters/facebook"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("FacebookPublishEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

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

        // Allowed fields for text posts
        const textPostKeys = new Set([
            "pageId",
            "message",
            "link",
            "picture",
            "caption",
            "description",
        ])
        // Allowed fields for video posts
        const videoPostKeys = new Set([
            "pageId",
            "videoUrl",
            "description",
            "title",
            "thumb",
        ])

        const bodyKeys = new Set(Object.keys(body))
        const isVideoPost =
            typeof body.videoUrl === "string" && body.videoUrl.length > 0

        // Validate allowed keys based on post type
        const allowedKeys = isVideoPost ? videoPostKeys : textPostKeys
        for (const key of bodyKeys) {
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

        if (isVideoPost) {
            return await handleVideoPost(userId, pageId, body)
        }

        return await handleTextPost(userId, pageId, body)
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

/**
 * Handle text/image post to Facebook Page feed
 */
async function handleTextPost(
    userId: string,
    pageId: string,
    body: Record<string, unknown>
): Promise<NextResponse> {
    const message = body.message as string | undefined

    if (!message || typeof message !== "string" || !message.trim()) {
        return NextResponse.json(
            {
                success: false,
                error: "VALIDATION_ERROR",
                message: "message is required and must be a non-empty string",
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

    const config = getFacebookConfig()
    const oauthService = getFacebookOAuthService(config)
    await oauthService.initialize()

    const accessToken = await getValidFacebookToken(userId, { oauthService })

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
                message: "Failed to obtain access token for the specified page",
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

    logger.info("Facebook text publish succeeded", {
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
}

/**
 * Handle video post to Facebook Page
 */
async function handleVideoPost(
    userId: string,
    pageId: string,
    body: Record<string, unknown>
): Promise<NextResponse> {
    const videoUrl = body.videoUrl as string
    const description = (body.description as string) || ""

    if (!videoUrl || typeof videoUrl !== "string") {
        return NextResponse.json(
            {
                success: false,
                error: "VALIDATION_ERROR",
                message: "videoUrl is required and must be a string",
            },
            { status: 400 }
        )
    }

    if (description.length > 5000) {
        return NextResponse.json(
            {
                success: false,
                error: "VALIDATION_ERROR",
                message: "Description exceeds 5000 character limit",
            },
            { status: 400 }
        )
    }

    logger.info("Facebook video publish requested", { userId, pageId })

    const result = await postVideoToFacebook({
        userId,
        pageId,
        videoUrl,
        description,
        title: body.title as string | undefined,
        thumb: body.thumb as string | undefined,
    })

    if (!result.success) {
        logger.error("Facebook video publish failed", {
            userId,
            pageId,
            error: result.error,
        })
        return NextResponse.json(
            {
                success: false,
                error: "PUBLISH_FAILED",
                message: result.error || "Failed to publish video to Facebook",
            },
            { status: 500 }
        )
    }

    logger.info("Facebook video publish succeeded", {
        userId,
        pageId,
        postId: result.postId,
    })

    return NextResponse.json(
        {
            success: true,
            postId: result.postId,
            url: result.url,
        },
        { status: 201 }
    )
}
