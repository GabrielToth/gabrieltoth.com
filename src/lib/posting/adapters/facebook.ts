import { getValidFacebookToken } from "@/lib/facebook/get-valid-token"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { postToPageFeed } from "@/lib/facebook/posts"
import { getTokenStore } from "@/lib/token-store"

export interface FacebookPostConfig {
    userId: string
    pageId: string
    message: string
    link?: string
    picture?: string
    caption?: string
    description?: string
}

export interface FacebookPostResult {
    success: boolean
    postId?: string
    url?: string
    error?: string
}

export async function postToFacebook(
    config: FacebookPostConfig,
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
            userToken,
        )

        if (!pageAccessToken) {
            return {
                success: false,
                error: "Failed to obtain page access token",
            }
        }

        const result = await postToPageFeed(
            pageAccessToken,
            config.pageId,
            {
                message: config.message,
                link: config.link,
                picture: config.picture,
                caption: config.caption,
                description: config.description,
            },
        )

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

export default { postToFacebook }
