const GRAPH_API_BASE = "https://graph.facebook.com"
const API_VERSION = "v22.0"

export interface FacebookComment {
    id: string
    message: string
    createdTime?: string
    from?: {
        name: string
        id: string
    }
    likeCount?: number
    attachment?: {
        type: string
        url?: string
    }
    replies?: { data: FacebookComment[] }
}

export interface FacebookCommentsResponse {
    data: FacebookComment[]
    paging?: {
        cursors: { before: string; after: string }
        next?: string
    }
}

export async function getComments(
    pageAccessToken: string,
    postId: string,
    options?: {
        limit?: number
        after?: string
        before?: string
    }
): Promise<FacebookCommentsResponse> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: "id,message,created_time,from,like_count,attachment,replies.limit(2){id,message,created_time,from}",
    })

    if (options?.limit) params.set("limit", String(options.limit))
    if (options?.after) params.set("after", options.after)
    if (options?.before) params.set("before", options.before)

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${postId}/comments?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to fetch Facebook comments"
        )
    }

    return response.json()
}

export async function replyToComment(
    pageAccessToken: string,
    commentId: string,
    message: string
): Promise<{ id: string }> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        message,
    })

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${commentId}/comments`

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to reply to Facebook comment"
        )
    }

    return response.json()
}

export async function deleteComment(
    pageAccessToken: string,
    commentId: string
): Promise<void> {
    const url = `${GRAPH_API_BASE}/${API_VERSION}/${commentId}?access_token=${pageAccessToken}`

    const response = await fetch(url, { method: "DELETE" })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to delete Facebook comment"
        )
    }
}

export async function hideComment(
    pageAccessToken: string,
    commentId: string,
    hide: boolean = true
): Promise<void> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        is_hidden: hide ? "true" : "false",
    })

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${commentId}`

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to hide/unhide Facebook comment"
        )
    }
}
