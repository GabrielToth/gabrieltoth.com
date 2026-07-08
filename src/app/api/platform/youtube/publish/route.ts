/**
 * POST /api/platform/youtube/publish
 * Publish content to YouTube.
 *
 * YouTube's Data API v3 only supports video uploads (not text-only posts).
 * This endpoint requires a video file uploaded as multipart/form-data.
 *
 * Accepts multipart/form-data:
 *   - video: File (required) - the video file to upload
 *   - description: string (required) - text description/title of the video
 *   - privacyStatus: "public" | "unlisted" | "private" (default: "unlisted")
 *   - tags?: string (comma-separated)
 *
 * For JSON-only requests (text without video), returns a 400 error
 * explaining that YouTube requires a video file.
 *
 * Response (201):
 *   { success: true, videoId: string, url: string }
 *
 * Error codes:
 *   MISSING_USER_ID        - Not authenticated
 *   YOUTUBE_NOT_LINKED     - YouTube account not linked
 *   VIDEO_REQUIRED         - JSON-only request without video file
 *   VALIDATION_ERROR       - Missing/invalid fields
 *   PUBLISH_FAILED         - YouTube API error
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { uploadVideo } from "@/lib/posting/adapters/youtube"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("YouTubePublishEndpoint")

const VALID_PRIVACY_STATUSES = new Set([
    "public",
    "unlisted",
    "private",
] as const)

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            logger.warn("Missing user ID in YouTube publish request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        // Detect if the request is JSON (text-only) or multipart (with video)
        const contentType = request.headers.get("content-type") || ""

        if (contentType.includes("application/json")) {
            // JSON request - text-only, no video
            let body: Record<string, unknown>
            try {
                body = await request.json()
            } catch {
                return NextResponse.json(
                    {
                        success: false,
                        error: "VALIDATION_ERROR",
                        message: "Invalid JSON body",
                    },
                    { status: 400 }
                )
            }

            const message = body.message || body.description || ""

            logger.warn("Text-only publish attempted to YouTube", {
                userId,
                messageLength: typeof message === "string" ? message.length : 0,
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "VIDEO_REQUIRED",
                    message:
                        "YouTube não aceita postagens de texto puro. Para publicar no YouTube, você precisa enviar um arquivo de vídeo. Use a opção de upload de vídeo na interface de publicação.",
                    youtubeUploadHint:
                        "Select a video file in the upload area when publishing to YouTube.",
                },
                { status: 400 }
            )
        }

        // ── Multipart/form-data with video file ──
        let formData: FormData
        try {
            formData = await request.formData()
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Invalid form data",
                },
                { status: 400 }
            )
        }

        // Extract video file
        const videoFile = formData.get("video")
        if (!(videoFile instanceof File)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VIDEO_REQUIRED",
                    message:
                        "YouTube requires a video file to publish. Please select a video file.",
                },
                { status: 400 }
            )
        }

        if (videoFile.size === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Uploaded video file is empty",
                },
                { status: 400 }
            )
        }

        // Validate mime type
        const mime = videoFile.type?.toLowerCase() || ""
        if (mime && !mime.startsWith("video/")) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "File must be a video",
                },
                { status: 400 }
            )
        }

        // Validate file size (max 500MB)
        const MAX_SIZE = 500 * 1024 * 1024
        if (videoFile.size > MAX_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "Video file exceeds maximum size of 500MB",
                },
                { status: 400 }
            )
        }

        // Extract description/text content
        const description = formData.get("description")?.toString().trim() || ""

        // Extract privacy status
        const privacyRaw =
            formData.get("privacyStatus")?.toString() || "unlisted"
        const privacyStatus = VALID_PRIVACY_STATUSES.has(
            privacyRaw as "public" | "unlisted" | "private"
        )
            ? (privacyRaw as "public" | "unlisted" | "private")
            : "unlisted"

        // Extract membersOnly flag
        const membersOnly = formData.get("membersOnly")?.toString() === "true"

        // Extract publishAt for scheduled publishing
        const publishAt =
            formData.get("publishAt")?.toString().trim() || undefined

        // When membersOnly is true, enforce privacyStatus as "private"
        const effectivePrivacy: "public" | "unlisted" | "private" = membersOnly
            ? "private"
            : privacyStatus

        // When publishAt is provided, enforce privacyStatus as "private" (YouTube requirement)
        const finalPrivacy: "public" | "unlisted" | "private" = publishAt
            ? "private"
            : effectivePrivacy

        // Extract tags
        const tagsRaw = formData.get("tags")?.toString().trim() || ""
        const tags = tagsRaw
            ? tagsRaw
                  .split(",")
                  .map(t => t.trim())
                  .filter(Boolean)
            : undefined

        // Generate title from description (first line, max 100 chars)
        let title = description.split("\n")[0].trim().slice(0, 100)
        if (!title) {
            title = "Video upload"
        }

        logger.info("YouTube publish requested (video upload)", {
            userId,
            title,
            fileSize: videoFile.size,
            mimeType: mime,
        })

        // Upload video
        const buffer = Buffer.from(await videoFile.arrayBuffer())
        const result = await uploadVideo(userId, buffer, {
            title,
            description,
            tags,
            privacyStatus: finalPrivacy,
            membersOnly,
            publishAt,
        })

        if (!result.success) {
            const status = result.error?.toLowerCase().includes("token")
                ? 401
                : 500
            logger.error("YouTube publish failed", {
                userId,
                error: result.error,
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "PUBLISH_FAILED",
                    message: result.error || "Failed to publish to YouTube",
                },
                { status }
            )
        }

        logger.info("YouTube publish succeeded", {
            userId,
            videoId: result.videoId,
        })

        return NextResponse.json(
            {
                success: true,
                videoId: result.videoId,
                url: result.url,
            },
            { status: 201 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to publish to YouTube", err)

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
