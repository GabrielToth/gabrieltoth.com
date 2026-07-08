import { getValidYouTubeToken } from "@/lib/youtube/get-valid-token"
import { createLogger } from "@/lib/logger"
import { google } from "googleapis"
import { Readable } from "stream"

const logger = createLogger("YouTubeAdapter")

export interface YouTubePostConfig {
    title: string
    description: string
    tags?: string[]
    privacyStatus: "public" | "unlisted" | "private"
    membersOnly?: boolean
    publishAt?: string // ISO 8601 date for scheduled publishing
    categoryId?: string
    madeForKids?: boolean
}

export interface YouTubePostResult {
    success: boolean
    videoId?: string
    url?: string
    error?: string
}

/**
 * Upload a video directly from a Buffer using resumable upload.
 * Requires a valid YouTube OAuth token (refreshed on-demand).
 */
export async function uploadVideo(
    userId: string,
    videoBuffer: Buffer,
    config: YouTubePostConfig,
    mimeType = "video/mp4"
): Promise<YouTubePostResult> {
    try {
        const token = await getValidYouTubeToken(userId)
        if (!token) {
            return {
                success: false,
                error: "YouTube not linked or token expired. Re-link your YouTube account.",
            }
        }

        const auth = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET
        )
        auth.setCredentials({ access_token: token })

        const youtube = google.youtube({ version: "v3", auth })

        // Determine effective privacy status
        // When membersOnly is true or publishAt is set, YouTube requires "private"
        let effectivePrivacy = config.privacyStatus
        if (config.membersOnly) {
            effectivePrivacy = "private"
        }
        if (config.publishAt) {
            effectivePrivacy = "private"
        }

        const res = await youtube.videos.insert({
            part: ["snippet", "status"],
            notifySubscribers: false,
            requestBody: {
                snippet: {
                    title: config.title,
                    description: config.description,
                    tags: config.tags,
                    categoryId: config.categoryId || "22",
                },
                status: {
                    privacyStatus: effectivePrivacy,
                    publishAt: config.publishAt,
                    madeForKids: config.madeForKids ?? false,
                    selfDeclaredMadeForKids: config.madeForKids ?? false,
                },
            },
            media: {
                body: Readable.from(videoBuffer),
                mimeType,
            },
        })

        const videoId = res.data.id
        if (!videoId) {
            return { success: false, error: "YouTube returned no video ID" }
        }

        logger.info("Video uploaded to YouTube", { videoId })

        return {
            success: true,
            videoId,
            url: `https://youtube.com/watch?v=${videoId}`,
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error"
        logger.error("YouTube upload failed", { error: message, userId })
        return { success: false, error: message }
    }
}

/**
 * Post content to YouTube (text-only posts/titles not supported directly).
 * Use uploadVideo for video uploads; this returns an error for text posts.
 */
export async function postToYouTube(
    _config: YouTubePostConfig
): Promise<YouTubePostResult> {
    return {
        success: false,
        error: "YouTube only supports video uploads. Use the upload endpoint with a video file.",
    }
}

/**
 * Queue-compatible publish method.
 * Matches the interface expected by PublicationQueue.
 * YouTube only supports video uploads - use uploadVideo for actual publishing.
 * This function is kept for interface compatibility and provides guidance.
 */
export async function publish(config: {
    content: string
    images?: string[]
    metadata?: Record<string, unknown>
    token?: string
}): Promise<{ id?: string; url?: string; success: boolean; error?: string }> {
    return {
        success: false,
        error: "YouTube only supports video uploads via the video upload wizard. Please use the upload endpoint with a video file to publish to YouTube.",
    }
}

export default { postToYouTube, uploadVideo, publish }
