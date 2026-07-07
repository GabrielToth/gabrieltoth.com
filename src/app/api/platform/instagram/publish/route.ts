/**
 * POST /api/platform/instagram/publish
 * Publish content to the authenticated user's Instagram Business Account.
 *
 * Request body:
 * {
 *   "caption": "string",
 *   "imageUrl": "string (optional)",
 *   "videoUrl": "string (optional)",
 *   "carouselItems": [{ "type": "image|video", "url": "string" }] (optional)
 * }
 *
 * Response (201):
 * {
 *   "success": true,
 *   "postId": "instagram-media-id",
 *   "url": "https://www.instagram.com/p/instagram-media-id/"
 * }
 *
 * Error codes:
 *   MISSING_USER_ID         - x-user-id header not present
 *   INSTAGRAM_NOT_LINKED    - User has no Instagram linked
 *   MISSING_PARAMS          - No imageUrl, videoUrl, or carouselItems provided
 *   PUBLISH_FAILED          - Instagram API returned an error
 *   INVALID_INPUT           - Invalid request body structure
 *   VALIDATION_ERROR        - Missing or invalid caption
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { postToInstagram } from "@/lib/posting/adapters/instagram"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("InstagramPublishEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            logger.warn("Missing user ID in Instagram publish request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        const tokenStore = getTokenStore()
        const storedToken = await tokenStore.getToken(userId, "instagram")

        if (!storedToken) {
            logger.warn("Instagram not linked for user", { userId })
            return NextResponse.json(
                {
                    success: false,
                    error: "INSTAGRAM_NOT_LINKED",
                    message: "Instagram account is not linked",
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

        if (!body.caption || typeof body.caption !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Caption is required and must be a string",
                },
                { status: 400 }
            )
        }

        const allowedKeys = new Set([
            "caption",
            "imageUrl",
            "videoUrl",
            "carouselItems",
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

        const caption = body.caption as string
        const imageUrl = body.imageUrl as string | undefined
        const videoUrl = body.videoUrl as string | undefined
        const carouselItems = body.carouselItems as
            Array<{ type: "image" | "video"; url: string }> | undefined

        if (!imageUrl && !videoUrl && !carouselItems) {
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_PARAMS",
                    message:
                        "At least one of imageUrl, videoUrl, or carouselItems is required",
                },
                { status: 400 }
            )
        }

        if (caption.length > 2200) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Caption exceeds Instagram's 2200 character limit",
                },
                { status: 400 }
            )
        }

        logger.info("Instagram publish requested", { userId })

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
            logger.warn(
                "No Instagram social_networks record found for publish",
                { userId }
            )
            return NextResponse.json(
                {
                    success: false,
                    error: "INSTAGRAM_NOT_LINKED",
                    message:
                        "Instagram account is not linked or social record missing",
                },
                { status: 404 }
            )
        }

        const result = await postToInstagram({
            userId,
            accountId: network.platform_user_id,
            caption,
            imageUrl,
            videoUrl,
            carouselItems,
        })

        if (!result.success) {
            logger.error("Instagram publish failed", {
                userId,
                error: result.error,
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "PUBLISH_FAILED",
                    message: result.error || "Failed to publish to Instagram",
                },
                { status: 500 }
            )
        }

        logger.info("Instagram publish succeeded", {
            userId,
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
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to publish to Instagram", err)

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
