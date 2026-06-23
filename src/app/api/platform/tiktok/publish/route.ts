import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { getValidTikTokToken } from "@/lib/tiktok/get-valid-token"
import { getTikTokConfig } from "@/lib/tiktok/config"
import { getTikTokOAuthService } from "@/lib/tiktok/oauth-service"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TikTokPublishEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            logger.warn("Missing user ID in TikTok publish request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        const config = getTikTokConfig()
        const oauthService = getTikTokOAuthService(config)
        await oauthService.initialize()

        const accessToken = await getValidTikTokToken(userId, { oauthService })

        if (!accessToken) {
            logger.warn("TikTok not linked for user", { userId })
            return NextResponse.json(
                {
                    success: false,
                    error: "TIKTOK_NOT_LINKED",
                    message: "TikTok account is not linked",
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
            "source",
            "videoUrl",
            "title",
            "privacyLevel",
            "disableDuet",
            "disableStitch",
            "disableComment",
            "brandContentToggle",
            "brandOrganicToggle",
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

        const source = body.source as string | undefined
        const videoUrl = body.videoUrl as string | undefined
        const title = body.title as string | undefined

        if (!source || typeof source !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message:
                        "source is required and must be FILE_UPLOAD or PULL_FROM_URL",
                },
                { status: 400 }
            )
        }

        if (source !== "FILE_UPLOAD" && source !== "PULL_FROM_URL") {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "source must be FILE_UPLOAD or PULL_FROM_URL",
                },
                { status: 400 }
            )
        }

        if (!title || typeof title !== "string" || !title.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "title is required and must be a non-empty string",
                },
                { status: 400 }
            )
        }

        if (title.length > 2200) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Title exceeds 2200 character limit",
                },
                { status: 400 }
            )
        }

        if (
            source === "PULL_FROM_URL" &&
            (!videoUrl || typeof videoUrl !== "string")
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message:
                        "videoUrl is required when source is PULL_FROM_URL",
                },
                { status: 400 }
            )
        }

        logger.info("TikTok publish requested", { userId, source })

        const creatorInfo = await oauthService.queryCreatorInfo(accessToken)

        logger.info("TikTok creator info retrieved", {
            userId,
            maxDuration: creatorInfo?.maxVideoPostDurationSec,
        })

        const initResult = await oauthService.initVideoPublish(accessToken, {
            source: source as "FILE_UPLOAD" | "PULL_FROM_URL",
            videoUrl,
            title,
            privacyLevel: (body.privacyLevel as string) || "SELF_ONLY",
            disableDuet: body.disableDuet as boolean,
            disableStitch: body.disableStitch as boolean,
            disableComment: body.disableComment as boolean,
            brandContentToggle: body.brandContentToggle as boolean,
            brandOrganicToggle: body.brandOrganicToggle as boolean,
        })

        logger.info("TikTok video publish initialized", {
            userId,
            publishId: initResult.publishId,
            uploadMethod: initResult.uploadMethod,
        })

        return NextResponse.json(
            {
                success: true,
                publishId: initResult.publishId,
                uploadUrl: initResult.uploadUrl,
                uploadMethod: initResult.uploadMethod,
                message:
                    source === "FILE_UPLOAD"
                        ? "Upload your video file to the uploadUrl via PUT, then poll /api/platform/tiktok/publish/status"
                        : "TikTok will fetch the video from the provided URL",
            },
            { status: 201 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to publish to TikTok", err)

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
