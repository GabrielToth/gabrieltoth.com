import { createLogger } from "@/lib/logger"
import { getValidFacebookToken } from "@/lib/facebook/get-valid-token"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { postToPageFeed, postVideoToPageFeed } from "@/lib/facebook/posts"

const logger = createLogger("FacebookPostingAdapter")

export interface FacebookPostConfig {
    userId: string
    pageId: string
    message: string
    link?: string
    picture?: string
    caption?: string
    description?: string
}

export interface FacebookVideoPostConfig {
    userId: string
    pageId: string
    videoUrl: string
    description: string
    title?: string
    thumb?: string
    scheduledPublishTime?: number
}

export interface FacebookPostResult {
    success: boolean
    postId?: string
    url?: string
    error?: string
}

export async function postToFacebook(
    config: FacebookPostConfig
): Promise<FacebookPostResult> {
    try {
        if (!config.pageId || !config.message) {
            return {
                success: false,
                error: "Page ID and message are required",
            }
        }

        const fbConfig = getFacebookConfig()
        const oauthService = getFacebookOAuthService(fbConfig)
        await oauthService.initialize()

        const userToken = await getValidFacebookToken(config.userId, {
            oauthService,
        })

        if (!userToken) {
            return {
                success: false,
                error: "Facebook account is not linked",
            }
        }

        const pageAccessToken = await oauthService.getPageAccessToken(
            config.pageId,
            userToken
        )

        if (!pageAccessToken) {
            return {
                success: false,
                error: "Failed to obtain page access token",
            }
        }

        const result = await postToPageFeed(pageAccessToken, config.pageId, {
            message: config.message,
            link: config.link,
            picture: config.picture,
            caption: config.caption,
            description: config.description,
        })

        return {
            success: true,
            postId: result.id,
            url: `https://www.facebook.com/${config.pageId}/posts/${result.id}`,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

/**
 * Post a video to a Facebook Page.
 *
 * Facebook Graph API: POST /{page-id}/videos
 * Uses file_url to pull video from a URL (similar to Instagram's video flow).
 *
 * @param config - Video post configuration
 * @returns Result with post ID and URL
 */
export async function postVideoToFacebook(
    config: FacebookVideoPostConfig
): Promise<FacebookPostResult> {
    try {
        if (!config.pageId || !config.videoUrl || !config.description) {
            return {
                success: false,
                error: "Page ID, videoUrl, and description are required",
            }
        }

        const fbConfig = getFacebookConfig()
        const oauthService = getFacebookOAuthService(fbConfig)
        await oauthService.initialize()

        const userToken = await getValidFacebookToken(config.userId, {
            oauthService,
        })

        if (!userToken) {
            return {
                success: false,
                error: "Facebook account is not linked",
            }
        }

        const pageAccessToken = await oauthService.getPageAccessToken(
            config.pageId,
            userToken
        )

        if (!pageAccessToken) {
            return {
                success: false,
                error: "Failed to obtain page access token",
            }
        }

        const result = await postVideoToPageFeed(
            pageAccessToken,
            config.pageId,
            {
                fileUrl: config.videoUrl,
                description: config.description,
                title: config.title,
                thumb: config.thumb,
                published: !config.scheduledPublishTime,
                scheduledPublishTime: config.scheduledPublishTime,
            }
        )

        const postId = result.postId || result.id

        logger.info("Facebook video post published successfully", {
            pageId: config.pageId,
            videoId: result.id,
            postId,
        })

        return {
            success: true,
            postId,
            url: `https://www.facebook.com/${config.pageId}/posts/${postId}`,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        logger.error("Failed to post video to Facebook", {
            pageId: config.pageId,
            error: message,
        })
        return {
            success: false,
            error: message,
        }
    }
}

export default { postToFacebook, postVideoToFacebook }
