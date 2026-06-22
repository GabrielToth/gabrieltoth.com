/**
 * Instagram Posting Adapter
 * Handles posting content to Instagram via the Graph API.
 *
 * Publishing flow (Instagram Graph API):
 * 1. Create media container → POST /{ig-user-id}/media → returns creation_id
 * 2. Publish container → POST /{ig-user-id}/media_publish → returns media_id
 *
 * Supported media types:
 * - Single image (IMAGE)
 * - Single video (VIDEO) — max 60s, 100MB
 * - Carousel (CAROUSEL) — up to 10 items
 */

import { getValidInstagramToken } from "@/lib/instagram/get-valid-token"
import { getInstagramConfig } from "@/lib/instagram/config"
import { getInstagramOAuthService } from "@/lib/instagram/oauth-service"
import { createLogger } from "@/lib/logger"

const logger = createLogger("InstagramPostingAdapter")

const GRAPH_API_BASE = "https://graph.facebook.com"

export interface InstagramPostConfig {
    userId: string
    accountId: string
    caption: string
    imageUrl?: string
    videoUrl?: string
    carouselItems?: Array<{
        type: "image" | "video"
        url: string
    }>
}

export interface InstagramPostResult {
    success: boolean
    postId?: string
    url?: string
    error?: string
}

function getApiVersion(): string {
    try {
        const config = getInstagramConfig()
        return config.oauth.apiVersion
    } catch {
        return "v22.0"
    }
}

async function getAccessToken(userId: string): Promise<string | null> {
    const config = getInstagramConfig()
    const oauthService = getInstagramOAuthService(config)
    await oauthService.initialize()
    return getValidInstagramToken(userId, { oauthService })
}

async function createMediaContainer(
    igUserId: string,
    mediaType: "IMAGE" | "VIDEO" | "CAROUSEL",
    mediaUrl: string | undefined,
    caption: string,
    accessToken: string,
    childrenIds?: string[]
): Promise<string> {
    const params: Record<string, string> = {
        access_token: accessToken,
        caption: caption,
    }

    if (mediaType === "IMAGE" && mediaUrl) {
        params.image_url = mediaUrl
    } else if (mediaType === "VIDEO" && mediaUrl) {
        params.media_type = "VIDEO"
        params.video_url = mediaUrl
    } else if (mediaType === "CAROUSEL") {
        params.media_type = "CAROUSEL"
        if (childrenIds) {
            params.children = childrenIds.join(",")
        }
    }

    const searchParams = new URLSearchParams(params)
    const apiVersion = getApiVersion()
    const url = `${GRAPH_API_BASE}/${apiVersion}/${igUserId}/media?${searchParams.toString()}`

    const response = await fetch(url, { method: "POST" })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            `Failed to create Instagram media container: ${error.error?.message || error.error?.type || "Unknown"}`
        )
    }

    const data = await response.json()
    return data.id
}

async function publishMediaContainer(
    igUserId: string,
    creationId: string,
    accessToken: string
): Promise<string> {
    const params = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
    })

    const apiVersion = getApiVersion()
    const url = `${GRAPH_API_BASE}/${apiVersion}/${igUserId}/media_publish?${params.toString()}`

    const response = await fetch(url, { method: "POST" })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            `Failed to publish Instagram media: ${error.error?.message || error.error?.type || "Unknown"}`
        )
    }

    const data = await response.json()
    return data.id
}

export async function postToInstagram(
    config: InstagramPostConfig
): Promise<InstagramPostResult> {
    try {
        if (!config.userId || !config.accountId || !config.caption) {
            return {
                success: false,
                error: "User ID, Account ID, and caption are required",
            }
        }

        if (!config.imageUrl && !config.videoUrl && !config.carouselItems) {
            return {
                success: false,
                error: "At least one image, video, or carousel item is required",
            }
        }

        const accessToken = await getAccessToken(config.userId)

        if (!accessToken) {
            return {
                success: false,
                error: "No valid Instagram access token. Re-link your Instagram account.",
            }
        }

        let mediaId: string

        if (config.carouselItems && config.carouselItems.length > 0) {
            const childIds: string[] = []

            for (const item of config.carouselItems) {
                const childType = item.type === "video" ? "VIDEO" : "IMAGE"
                const childId = await createMediaContainer(
                    config.accountId,
                    childType,
                    item.url,
                    "",
                    accessToken
                )
                childIds.push(childId)
            }

            mediaId = await createMediaContainer(
                config.accountId,
                "CAROUSEL",
                undefined,
                config.caption,
                accessToken,
                childIds
            )
        } else if (config.imageUrl) {
            mediaId = await createMediaContainer(
                config.accountId,
                "IMAGE",
                config.imageUrl,
                config.caption,
                accessToken
            )
        } else if (config.videoUrl) {
            mediaId = await createMediaContainer(
                config.accountId,
                "VIDEO",
                config.videoUrl,
                config.caption,
                accessToken
            )
        } else {
            return {
                success: false,
                error: "Unsupported media configuration",
            }
        }

        const publishedId = await publishMediaContainer(
            config.accountId,
            mediaId,
            accessToken
        )

        logger.info("Instagram post published successfully", {
            accountId: config.accountId,
            mediaId: publishedId,
        })

        return {
            success: true,
            postId: publishedId,
            url: `https://www.instagram.com/p/${publishedId}/`,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        logger.error("Failed to post to Instagram", {
            accountId: config.accountId,
            error: message,
        })
        return {
            success: false,
            error: message,
        }
    }
}

export default { postToInstagram }
