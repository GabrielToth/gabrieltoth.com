import { getValidYouTubeToken } from "@/lib/youtube/get-valid-token"
import { createLogger } from "@/lib/logger"
import { google } from "googleapis"

const logger = createLogger("YouTubeAdapter")

export interface YouTubePostConfig {
    title: string
    description: string
    tags?: string[]
    privacyStatus: "public" | "unlisted" | "private"
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
                    privacyStatus: config.privacyStatus,
                    madeForKids: config.madeForKids ?? false,
                    selfDeclaredMadeForKids: config.madeForKids ?? false,
                },
            },
            media: {
                body: videoBuffer,
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

export default { postToYouTube, uploadVideo }
