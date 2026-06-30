import { createLogger } from "@/lib/logger"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getTokenStore } from "@/lib/token-store"
import { getValidFacebookToken } from "@/lib/facebook/get-valid-token"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { createLiveVideo, getLiveVideos } from "@/lib/facebook/live"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("FacebookLiveEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            logger.warn("Missing user ID in Facebook live request")
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
            "title",
            "description",
            "status",
            "plannedStartTime",
            "contentType",
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

        if (body.title && typeof body.title !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "title must be a string",
                },
                { status: 400 }
            )
        }

        if (
            body.status &&
            !["LIVE_NOW", "SCHEDULED_UNPUBLISHED"].includes(
                body.status as string
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "status must be LIVE_NOW or SCHEDULED_UNPUBLISHED",
                },
                { status: 400 }
            )
        }

        logger.info("Facebook live video creation requested", {
            userId,
            pageId,
        })

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

        const liveVideo = await createLiveVideo(pageAccessToken, pageId, {
            title: body.title as string | undefined,
            description: body.description as string | undefined,
            status: body.status as
                | "LIVE_NOW"
                | "SCHEDULED_UNPUBLISHED"
                | undefined,
            plannedStartTime: body.plannedStartTime as number | undefined,
            contentType: body.contentType as "VIDEO" | "GAME" | undefined,
        })

        logger.info("Facebook live video created", {
            userId,
            pageId,
            videoId: liveVideo.id,
        })

        return NextResponse.json(
            {
                success: true,
                liveVideo: {
                    id: liveVideo.id,
                    streamUrl: liveVideo.streamUrl,
                    secureStreamUrl: liveVideo.secureStreamUrl,
                    status: liveVideo.status,
                    title: liveVideo.title,
                    permalinkUrl: liveVideo.permalinkUrl,
                    embedHtml: liveVideo.embedHtml,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to create Facebook live video", err)

        return NextResponse.json(
            {
                success: false,
                error: "LIVE_FAILED",
                message: err.message,
            },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            logger.warn("Missing user ID in Facebook live list request")
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

        const result = await getLiveVideos(pageAccessToken, pageId, {
            limit: limit ? parseInt(limit, 10) : undefined,
            after: after || undefined,
            before: before || undefined,
        })

        return NextResponse.json(
            {
                success: true,
                data: result.data,
                paging: result.paging,
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to list Facebook live videos", err)

        return NextResponse.json(
            {
                success: false,
                error: "FETCH_FAILED",
                message: err.message,
            },
            { status: 500 }
        )
    }
}
