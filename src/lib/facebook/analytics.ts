const GRAPH_API_BASE = "https://graph.facebook.com"
const API_VERSION = "v22.0"

export interface FacebookPageInsight {
    name: string
    period: string
    values: Array<{
        value: number | Record<string, number>
        endTime: string
    }>
    title?: string
    description?: string
}

export interface FacebookPageInsightsResponse {
    data: FacebookPageInsight[]
    paging?: any
}

export type PageInsightMetric =
    | "page_impressions"
    | "page_impressions_unique"
    | "page_impressions_paid"
    | "page_impressions_organic"
    | "page_engaged_users"
    | "page_actions_post_reactions_total"
    | "page_actions_post_reactions_like_total"
    | "page_actions_post_reactions_love_total"
    | "page_actions_post_reactions_wow_total"
    | "page_actions_post_reactions_haha_total"
    | "page_actions_post_reactions_sorry_total"
    | "page_actions_post_reactions_anger_total"
    | "page_fans"
    | "page_fans_new"
    | "page_fan_adds"
    | "page_fan_removes"
    | "page_views_total"
    | "page_views_logged_in_total"
    | "page_views_logged_out_total"
    | "page_post_engagements"
    | "page_consumptions"
    | "page_consumptions_unique"
    | "page_video_views"
    | "page_video_views_paid"
    | "page_video_views_organic"
    | "page_video_views_unique"
    | "page_video_complete_views_30s"
    | "page_follows"
    | "page_daily_follows_unique"

export interface FacebookPostInsight {
    name: string
    period: string
    values: Array<{
        value: number | Record<string, number>
        endTime: string
    }>
}

export interface FacebookPostInsightsResponse {
    data: FacebookPostInsight[]
    paging?: any
}

export async function getPageInsights(
    pageAccessToken: string,
    pageId: string,
    metrics: PageInsightMetric[],
    options?: {
        since?: string
        until?: string
        period?: "day" | "week" | "days_28" | "month" | "lifetime"
    }
): Promise<FacebookPageInsightsResponse> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        metric: metrics.join(","),
    })

    if (options?.since) params.set("since", options.since)
    if (options?.until) params.set("until", options.until)
    if (options?.period) params.set("period", options.period)

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${pageId}/insights?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to fetch Facebook Page insights"
        )
    }

    return response.json()
}

export async function getPostInsights(
    pageAccessToken: string,
    postId: string,
    metrics: string[]
): Promise<FacebookPostInsightsResponse> {
    const params = new URLSearchParams({
        access_token: pageAccessToken,
        metric: metrics.join(","),
    })

    const url = `${GRAPH_API_BASE}/${API_VERSION}/${postId}/insights?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        throw new Error(
            error.error?.message || "Failed to fetch Facebook Post insights"
        )
    }

    return response.json()
}

export const COMMON_PAGE_METRICS: PageInsightMetric[] = [
    "page_impressions",
    "page_impressions_unique",
    "page_engaged_users",
    "page_fans",
    "page_fan_adds",
    "page_post_engagements",
    "page_consumptions",
    "page_video_views",
    "page_follows",
]

export const REACTION_METRICS: PageInsightMetric[] = [
    "page_actions_post_reactions_total",
    "page_actions_post_reactions_like_total",
    "page_actions_post_reactions_love_total",
    "page_actions_post_reactions_wow_total",
    "page_actions_post_reactions_haha_total",
    "page_actions_post_reactions_sorry_total",
    "page_actions_post_reactions_anger_total",
]
