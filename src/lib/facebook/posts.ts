const GRAPH_API_BASE = "https://graph.facebook.com"
const API_VERSION = "v25.0"

export interface FacebookPost {
    id: string
    message?: string
    story?: string
    createdTime?: string
    permalinkUrl?: string
    attachments?: {
        data: Array<{
            media?: { image: { src: string } }
            type: string
            url?: string
        }>
    }
}

export interface FacebookPostResult {
    id: string
}

export interface PostToPageFeedOptions {
    message: string
    link?: string
    picture?: string
    caption?: string
    description?: string
    published?: boolean
    scheduledPublishTime?: number
}

export async function postToPageFeed(
    pageAccessToken: string,
    pageId: string,
    options: PostToPageFeedOptions
): Promise<FacebookPostResult> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        message: options.message,
    })

    if (options.link) params.set("link", options.link)
    if (options.picture) params.set("picture", options.picture)
    if (options.caption) params.set("caption", options.caption)
    if (options.description) params.set("description", options.description)
    if (options.published === false) {
        params.set("published", "false")
        if (options.scheduledPublishTime) {
            params.set(
                "scheduled_publish_time",
                String(options.scheduledPublishTime)
            )
        }
    }

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${pageId}/feed`

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to post to Facebook Page feed"
        )
    }

    return response.json()
}

export async function postToGroupFeed(
    pageAccessToken: string,
    groupId: string,
    message: string,
    options?: {
        link?: string
        picture?: string
    }
): Promise<FacebookPostResult> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        message,
    })

    if (options?.link) params.set("link", options.link)
    if (options?.picture) params.set("picture", options.picture)

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${groupId}/feed`

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to post to Facebook Group"
        )
    }

    return response.json()
}

export interface PostVideoToPageFeedOptions {
    title?: string
    description: string
    fileUrl: string
    published?: boolean
    scheduledPublishTime?: number
    thumb?: string
}

export interface FacebookVideoPostResult {
    id: string
    postId?: string
}

/**
 * Post a video to a Facebook Page feed.
 *
 * Facebook Graph API: POST /{page-id}/videos
 * - fileUrl: URL of the video file to publish (Facebook fetches it)
 * - description: Video description/caption
 * - title: Optional video title
 * - published: Whether to publish immediately (default: true)
 * - scheduledPublishTime: Unix timestamp for scheduled publishing
 * - thumb: URL for custom thumbnail
 */
export async function postVideoToPageFeed(
    pageAccessToken: string,
    pageId: string,
    options: PostVideoToPageFeedOptions
): Promise<FacebookVideoPostResult> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        file_url: options.fileUrl,
        description: options.description,
    })

    if (options.title) params.set("title", options.title)
    if (options.thumb) params.set("thumb", options.thumb)
    if (options.published === false) {
        params.set("published", "false")
        if (options.scheduledPublishTime) {
            params.set(
                "scheduled_publish_time",
                String(options.scheduledPublishTime)
            )
        }
    }

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${pageId}/videos`

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to post video to Facebook Page"
        )
    }

    return response.json()
}

export async function getPagePosts(
    pageAccessToken: string,
    pageId: string,
    options?: {
        limit?: number
        before?: string
        after?: string
    }
): Promise<{ data: FacebookPost[]; paging?: unknown }> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: "id,message,story,created_time,permalink_url,attachments",
    })

    if (options?.limit) params.set("limit", String(options.limit))
    if (options?.before) params.set("before", options.before)
    if (options?.after) params.set("after", options.after)

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${pageId}/feed?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to fetch Facebook Page posts"
        )
    }

    return response.json()
}
