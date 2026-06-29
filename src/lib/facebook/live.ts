const GRAPH_API_BASE = "https://graph.facebook.com"
const API_VERSION = "v22.0"

export interface FacebookLiveVideo {
    id: string
    streamUrl?: string
    secureStreamUrl?: string
    status: string
    title?: string
    description?: string
    creationTime?: string
    plannedStartTime?: string
    permalinkUrl?: string
    embedHtml?: string
    liveViews?: number
    comments?: { data: Array<{ id: string; message: string }> }
}

export interface CreateLiveVideoOptions {
    title?: string
    description?: string
    status?: "LIVE_NOW" | "SCHEDULED_UNPUBLISHED"
    plannedStartTime?: number
    published?: boolean
    contentType?: "VIDEO" | "GAME"
}

export async function createLiveVideo(
    pageAccessToken: string,
    pageId: string,
    options: CreateLiveVideoOptions
): Promise<FacebookLiveVideo> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        status: options.status || "LIVE_NOW",
    })

    if (options.title) params.set("title", options.title)
    if (options.description) params.set("description", options.description)
    if (options.plannedStartTime) {
        params.set("planned_start_time", String(options.plannedStartTime))
    }
    if (options.published === false) params.set("published", "false")
    if (options.contentType) params.set("content_type", options.contentType)

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${pageId}/live_videos`

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to create Facebook Live video"
        )
    }

    return response.json()
}

export async function getLiveVideos(
    pageAccessToken: string,
    pageId: string,
    options?: {
        limit?: number
        before?: string
        after?: string
    }
): Promise<{ data: FacebookLiveVideo[]; paging?: unknown }> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: "id,stream_url,secure_stream_url,status,title,description,creation_time,planned_start_time,permalink_url,embed_html,live_views",
    })

    if (options?.limit) params.set("limit", String(options.limit))
    if (options?.before) params.set("before", options.before)
    if (options?.after) params.set("after", options.after)

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${pageId}/live_videos?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to fetch Facebook Live videos"
        )
    }

    return response.json()
}

export async function getLiveVideoStatus(
    pageAccessToken: string,
    liveVideoId: string
): Promise<FacebookLiveVideo> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: "id,status,stream_url,secure_stream_url,title,live_views,permalink_url",
    })

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${liveVideoId}?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to fetch Facebook Live video status"
        )
    }

    return response.json()
}

export async function endLiveVideo(
    pageAccessToken: string,
    liveVideoId: string
): Promise<void> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        status: "VOD",
    })

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${liveVideoId}`

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to end Facebook Live video"
        )
    }
}

export async function getLiveComments(
    pageAccessToken: string,
    liveVideoId: string,
    options?: {
        limit?: number
        after?: string
    }
): Promise<{
    data: Array<{
        id: string
        message: string
        from?: { name: string; id: string }
        created_time?: string
    }>
    paging?: unknown
}> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: "id,message,from,created_time",
    })

    if (options?.limit) params.set("limit", String(options.limit))
    if (options?.after) params.set("after", options.after)

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${liveVideoId}/comments?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to fetch Facebook Live comments"
        )
    }

    return response.json()
}
