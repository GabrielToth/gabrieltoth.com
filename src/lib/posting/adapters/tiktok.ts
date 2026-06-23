import { getValidTikTokToken } from "@/lib/tiktok/get-valid-token"
import { getTikTokConfig } from "@/lib/tiktok/config"
import { getTikTokOAuthService } from "@/lib/tiktok/oauth-service"
import { getTokenStore } from "@/lib/token-store"

export interface TikTokPostConfig {
    userId: string
    title: string
    source: "FILE_UPLOAD" | "PULL_FROM_URL"
    videoUrl?: string
    videoBuffer?: ArrayBuffer
    privacyLevel?: string
    disableDuet?: boolean
    disableStitch?: boolean
    disableComment?: boolean
}

export interface TikTokPostResult {
    success: boolean
    publishId?: string
    postUrl?: string
    uploadUrl?: string
    error?: string
}

export async function postToTikTok(
    config: TikTokPostConfig
): Promise<TikTokPostResult> {
    try {
        if (!config.title || !config.source) {
            return {
                success: false,
                error: "Title and source are required",
            }
        }

        if (config.source === "PULL_FROM_URL" && !config.videoUrl) {
            return {
                success: false,
                error: "Video URL is required when source is PULL_FROM_URL",
            }
        }

        const ttConfig = getTikTokConfig()
        const oauthService = getTikTokOAuthService(ttConfig)
        await oauthService.initialize()

        const userToken = await getValidTikTokToken(config.userId, {
            oauthService,
        })

        if (!userToken) {
            return {
                success: false,
                error: "TikTok account is not linked",
            }
        }

        const initResult = await oauthService.initVideoPublish(userToken, {
            source: config.source,
            videoUrl: config.videoUrl,
            title: config.title,
            privacyLevel: config.privacyLevel || "SELF_ONLY",
            disableDuet: config.disableDuet,
            disableStitch: config.disableStitch,
            disableComment: config.disableComment,
        })

        if (config.source === "FILE_UPLOAD" && config.videoBuffer) {
            if (!initResult.uploadUrl) {
                return {
                    success: false,
                    error: "No upload URL returned from TikTok init",
                    publishId: initResult.publishId,
                }
            }

            const uploaded = await oauthService.uploadVideoFile(
                initResult.uploadUrl,
                config.videoBuffer
            )

            if (!uploaded) {
                return {
                    success: false,
                    error: "Video file upload failed",
                    publishId: initResult.publishId,
                    uploadUrl: initResult.uploadUrl,
                }
            }
        }

        return {
            success: true,
            publishId: initResult.publishId,
            uploadUrl: initResult.uploadUrl,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export default { postToTikTok }
