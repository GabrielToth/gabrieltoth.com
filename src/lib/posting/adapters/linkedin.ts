/**
 * LinkedIn Posting Adapter
 * Handles posting content to LinkedIn
 */

import { createLogger } from "@/lib/logger"

const logger = createLogger("LinkedInAdapter")

export interface LinkedInPostConfig {
    personId?: string
    organizationId?: string
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
 * Post content to LinkedIn
 */
export async function postToLinkedIn(
    config: LinkedInPostConfig
): Promise<LinkedInPostResult> {
    try {
        // Validate required fields
        if (!config.text) {
            return {
                success: false,
                error: "Post text is required",
            }
        }

        if (!config.personId && !config.organizationId) {
            return {
                success: false,
                error: "Either person ID or organization ID is required",
            }
        }

        const authorUrn = config.personId
            ? `urn:li:person:${config.personId}`
            : `urn:li:organization:${config.organizationId}`

        const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN || ""}`,
                "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify({
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
            }),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error("LinkedIn API error", {
                status: response.status,
                body: errorBody,
            })
            return {
                success: false,
                error: `LinkedIn API returned ${response.status}`,
            }
        }

        const data = await response.json()
        return {
            success: true,
            postId: data.id,
            url: `https://linkedin.com/feed/update/${data.id}`,
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export default { postToLinkedIn }
