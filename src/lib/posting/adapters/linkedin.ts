/**
 * LinkedIn Posting Adapter
 * Handles posting content to LinkedIn using user-level OAuth tokens
 * Uses the LinkedIn REST API /rest/posts endpoint (new API).
 */

import { createLogger } from "@/lib/logger"
import { getLinkedInConfig } from "@/lib/linkedin/config"
import { getLinkedInOAuthService } from "@/lib/linkedin/oauth-service"
import { getValidLinkedInToken } from "@/lib/linkedin/get-valid-token"

const logger = createLogger("LinkedInAdapter")

export interface LinkedInPostConfig {
    userId: string
    text: string
    mediaUrl?: string
    mediaType?: "image" | "video" | "document"
    visibility?: "PUBLIC" | "CONNECTIONS" | "LOGGED_IN"
}

export interface LinkedInPostResult {
    success: boolean
    postId?: string
    url?: string
    error?: string
}

/**
 * Post content to LinkedIn using the user's OAuth token.
 *
 * Uses the LinkedIn REST API (/rest/posts) with the author URN
 * determined from the stored social_networks metadata.
 */
export async function postToLinkedIn(
    config: LinkedInPostConfig
): Promise<LinkedInPostResult> {
    try {
        // Validate required fields
        if (!config.userId) {
            return {
                success: false,
                error: "User ID is required",
            }
        }

        if (!config.text) {
            return {
                success: false,
                error: "Post text is required",
            }
        }

        // Get valid OAuth token for this user
        const liConfig = getLinkedInConfig()
        const oauthService = getLinkedInOAuthService(liConfig)
        await oauthService.initialize()

        const accessToken = await getValidLinkedInToken(config.userId, {
            oauthService,
        })

        if (!accessToken) {
            return {
                success: false,
                error: "LinkedIn account is not linked. Please connect your LinkedIn account first.",
            }
        }

        // Get the user's LinkedIn profile to determine the author URN
        const linkedInUser = await oauthService.getUserInfo(accessToken)

        if (!linkedInUser || !linkedInUser.sub) {
            return {
                success: false,
                error: "Failed to retrieve LinkedIn user profile",
            }
        }

        const authorUrn = `urn:li:person:${linkedInUser.sub}`

        // Build the post payload using the modern LinkedIn REST API (v2)
        const body = {
            author: authorUrn,
            commentary: config.text,
            visibility: config.visibility || "PUBLIC",
            distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabled: false,
        }

        const response = await fetch("https://api.linkedin.com/v2/rest/posts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "LinkedIn-Version": "202501",
                "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error("LinkedIn API error", {
                status: response.status,
                body: errorBody,
            })

            // Fallback to legacy UGC API if new API fails
            if (response.status === 404 || response.status === 400) {
                return await postToLinkedInLegacy(
                    accessToken,
                    authorUrn,
                    config
                )
            }

            return {
                success: false,
                error: `LinkedIn API returned ${response.status}: ${errorBody}`,
            }
        }

        // LinkedIn REST API returns the post ID in the x-restli-id header
        const postId =
            response.headers.get("x-restli-id") ||
            response.headers.get("id") ||
            ""

        logger.info("LinkedIn post published successfully (REST API)", {
            postId,
            userId: config.userId,
        })

        return {
            success: true,
            postId,
            url: postId
                ? `https://www.linkedin.com/feed/update/${postId}`
                : undefined,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        logger.error("Failed to post to LinkedIn", {
            userId: config.userId,
            error: message,
        })
        return {
            success: false,
            error: message,
        }
    }
}

/**
 * Fallback: Post using the legacy UGC API.
 */
async function postToLinkedInLegacy(
    accessToken: string,
    authorUrn: string,
    config: LinkedInPostConfig
): Promise<LinkedInPostResult> {
    try {
        const body = {
            author: authorUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: config.text,
                    },
                    shareMediaCategory: "NONE",
                },
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility":
                    config.visibility || "PUBLIC",
            },
        }

        const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            return {
                success: false,
                error: `LinkedIn UGC API returned ${response.status}: ${errorBody}`,
            }
        }

        const data = await response.json()
        const postId = data.id

        logger.info("LinkedIn post published successfully (UGC API)", {
            postId,
        })

        return {
            success: true,
            postId,
            url: postId
                ? `https://www.linkedin.com/feed/update/${postId}`
                : undefined,
        }
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error in UGC fallback",
        }
    }
}

export default { postToLinkedIn }
