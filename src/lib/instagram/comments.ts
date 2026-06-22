/**
 * Instagram Comments & Moderation API
 *
 * Manages comments on the authenticated Instagram Business Account's media.
 * Requires the `instagram_business_manage_comments` scope.
 *
 * Graph API endpoints:
 *   GET    /{ig-media-id}/comments            — list comments
 *   POST   /{ig-comment-id}/replies           — reply to a comment
 *   DELETE /{ig-comment-id}                   — hide/delete a comment
 *   POST   /{ig-comment-id}?is_hidden=true   — hide a comment (alternative)
 */

export interface InstagramComment {
    id: string
    text: string
    timestamp?: string
    username?: string
    like_count?: number
    replies?: { data: InstagramComment[] }
}

export interface InstagramCommentsResponse {
    data: InstagramComment[]
    paging?: {
        cursors: { before: string; after: string }
        next?: string
    }
}

const GRAPH_API_BASE = "https://graph.facebook.com"

export async function getComments(
    accessToken: string,
    igUserId: string,
    mediaId: string,
    options?: {
        apiVersion?: string
        limit?: number
        after?: string
        before?: string
    }
): Promise<InstagramCommentsResponse> {
    const apiVersion = options?.apiVersion ?? "v22.0"

    const params = new URLSearchParams({
        access_token: accessToken,
        fields: "id,text,timestamp,username,like_count,replies.limit(2){id,text,timestamp,username}",
    })

    if (options?.limit) params.set("limit", String(options.limit))
    if (options?.after) params.set("after", options.after)
    if (options?.before) params.set("before", options.before)

    const url = `${GRAPH_API_BASE}/${apiVersion}/${mediaId}/comments?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to fetch Instagram comments"
        )
    }

    return response.json()
}

export async function replyToComment(
    accessToken: string,
    igUserId: string,
    commentId: string,
    message: string
): Promise<{ id: string }> {
    const apiVersion = "v22.0"

    const params = new URLSearchParams({
        access_token: accessToken,
        message,
    })

    const url = `${GRAPH_API_BASE}/${apiVersion}/${commentId}/replies`

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to reply to Instagram comment"
        )
    }

    return response.json()
}

export async function hideComment(
    accessToken: string,
    igUserId: string,
    commentId: string
): Promise<void> {
    const apiVersion = "v22.0"

    const params = new URLSearchParams({
        access_token: accessToken,
        is_hidden: "true",
    })

    const url = `${GRAPH_API_BASE}/${apiVersion}/${commentId}`

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to hide Instagram comment"
        )
    }
}

export async function deleteComment(
    accessToken: string,
    igUserId: string,
    commentId: string
): Promise<void> {
    const apiVersion = "v22.0"

    const url = `${GRAPH_API_BASE}/${apiVersion}/${commentId}?access_token=${accessToken}`

    const response = await fetch(url, { method: "DELETE" })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to delete Instagram comment"
        )
    }
}
