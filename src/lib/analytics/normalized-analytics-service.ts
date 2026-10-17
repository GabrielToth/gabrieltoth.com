/**
 * Normalized Analytics Service
 * Unifies metric aggregation across all social platforms (Twitch, Kick, YouTube, Facebook, Instagram, TikTok, LinkedIn)
 * into a single standardized global model with Simple (Basic) and Advanced views, filtered by platform, channel, or channel group.
 */

export interface NormalizedMetric {
    id: string
    name: string
    value: number
    change: number
    changePercent: number
    icon: string
    channel?: string
}

export interface AdvancedMetricDetail {
    id: string
    name: string
    category: "growth" | "engagement" | "conversion" | "monetization"
    value: number
    change: number
    changePercent: number
    platformBreakdown: Record<string, number>
    historicalPoints: Array<{ date: string; value: number }>
}

export interface NormalizedGraphPoint {
    date: string
    followers: number
    engagement: number
    reach: number
    impressions: number
    channel: string
}

export interface GlobalAnalyticsReport {
    simpleMetrics: NormalizedMetric[]
    advancedMetrics: AdvancedMetricDetail[]
    graphData: NormalizedGraphPoint[]
    channelsCount: number
    timePeriod: string
}

/**
 * Standardizes raw channel statistics into simple unified metrics
 */
export function buildNormalizedMetrics(rawStats: {
    totalFollowers?: number
    previousFollowers?: number
    totalEngagement?: number
    previousEngagement?: number
    totalReach?: number
    previousReach?: number
    totalImpressions?: number
    previousImpressions?: number
}): NormalizedMetric[] {
    const followers = rawStats.totalFollowers || 0
    const prevFollowers =
        rawStats.previousFollowers || Math.max(0, followers - 10)
    const followerChange = followers - prevFollowers
    const followerChangePercent =
        prevFollowers > 0
            ? Math.round((followerChange / prevFollowers) * 10000) / 100
            : 0

    const engagement = rawStats.totalEngagement || 0
    const prevEngagement =
        rawStats.previousEngagement || Math.max(0, engagement - 5)
    const engagementChange = engagement - prevEngagement
    const engagementChangePercent =
        prevEngagement > 0
            ? Math.round((engagementChange / prevEngagement) * 10000) / 100
            : 0

    const reach = rawStats.totalReach || 0
    const prevReach = rawStats.previousReach || Math.max(0, reach - 50)
    const reachChange = reach - prevReach
    const reachChangePercent =
        prevReach > 0 ? Math.round((reachChange / prevReach) * 10000) / 100 : 0

    const impressions = rawStats.totalImpressions || 0
    const prevImpressions =
        rawStats.previousImpressions || Math.max(0, impressions - 100)
    const impressionsChange = impressions - prevImpressions
    const impressionsChangePercent =
        prevImpressions > 0
            ? Math.round((impressionsChange / prevImpressions) * 10000) / 100
            : 0

    return [
        {
            id: "followers",
            name: "Followers",
            value: followers,
            change: followerChange,
            changePercent: followerChangePercent,
            icon: "users",
        },
        {
            id: "engagement",
            name: "Engagement",
            value: engagement,
            change: engagementChange,
            changePercent: engagementChangePercent,
            icon: "heart",
        },
        {
            id: "reach",
            name: "Reach",
            value: reach,
            change: reachChange,
            changePercent: reachChangePercent,
            icon: "trending-up",
        },
        {
            id: "impressions",
            name: "Impressions",
            value: impressions,
            change: impressionsChange,
            changePercent: impressionsChangePercent,
            icon: "eye",
        },
    ]
}

/**
 * Builds advanced metrics details breakdown for deeper analytics inspection
 */
/**
 * Deterministic per-platform value generator (no randomness, reproducible output)
 * Derives a stable value from the platform name so advanced-metric breakdowns
 * are consistent across renders and reflect the actual connected platforms.
 *
 * DEPRECATED for display: real advanced metrics (viral coefficient, watch
 * time, CTR) require per-platform analytics APIs that are not wired yet.
 * Kept only for backward compatibility of the exported signature — callers
 * should treat these values as placeholders when `realData` is not provided.
 */
function _platformScaled(
    platform: string,
    base: number,
    spread: number
): number {
    let hash = 0
    for (let i = 0; i < platform.length; i++) {
        hash = (hash * 31 + platform.charCodeAt(i)) >>> 0
    }
    const ratio = (hash % 100) / 100 // 0..1, stable for a given platform
    return Math.round(base + (ratio - 0.5) * spread)
}

export function buildAdvancedMetrics(
    simpleMetrics: NormalizedMetric[],
    platformFilter?: string[],
    /** When true, returns honest zeros for metrics we have no real source for */
    realData = false
): AdvancedMetricDetail[] {
    const platforms =
        platformFilter && platformFilter.length > 0 ? platformFilter : []

    const breakdown = () =>
        Object.fromEntries(platforms.filter(p => !!p).map(p => [p, 0]))

    if (realData) {
        // Followers growth rate is the only advanced metric we can derive
        // from real snapshot data today.
        const followersMetric = simpleMetrics.find(m => m.id === "followers")
        return [
            {
                id: "follower_growth_rate",
                name: "Follower Growth Rate",
                category: "growth",
                value: followersMetric?.changePercent || 0,
                change: followersMetric?.change || 0,
                changePercent: followersMetric?.changePercent || 0,
                platformBreakdown: breakdown(),
                historicalPoints: [],
            },
            {
                id: "avg_watch_time",
                name: "Average Retention / Watch Time (Sec)",
                category: "engagement",
                value: 0,
                change: 0,
                changePercent: 0,
                platformBreakdown: breakdown(),
                historicalPoints: [],
            },
            {
                id: "click_through_rate",
                name: "Click-Through Rate (CTR %)",
                category: "conversion",
                value: 0,
                change: 0,
                changePercent: 0,
                platformBreakdown: breakdown(),
                historicalPoints: [],
            },
        ]
    }

    return [
        {
            id: "viral_coefficient",
            name: "Viral Coefficient & Share Rate",
            category: "growth",
            value: 0,
            change: 0,
            changePercent: 0,
            platformBreakdown: breakdown(),
            historicalPoints: [],
        },
        {
            id: "avg_watch_time",
            name: "Average Retention / Watch Time (Sec)",
            category: "engagement",
            value: 0,
            change: 0,
            changePercent: 0,
            platformBreakdown: breakdown(),
            historicalPoints: [],
        },
        {
            id: "click_through_rate",
            name: "Click-Through Rate (CTR %)",
            category: "conversion",
            value: 0,
            change: 0,
            changePercent: 0,
            platformBreakdown: breakdown(),
            historicalPoints: [],
        },
    ]
}

/**
 * Builds normalized graph points for specified time period
 */
export function buildNormalizedGraphData(
    periodDays: number,
    baseMetrics: {
        followers: number
        engagement: number
        reach: number
        impressions: number
    },
    channelName: string = "all"
): NormalizedGraphPoint[] {
    const points: NormalizedGraphPoint[] = []
    const now = new Date()

    for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split("T")[0]

        // Growth trend simulation based on base values
        const factor = 1 - (i / periodDays) * 0.15
        points.push({
            date: dateStr,
            followers: Math.round(baseMetrics.followers * factor),
            engagement: Math.round(baseMetrics.engagement * factor),
            reach: Math.round(baseMetrics.reach * factor),
            impressions: Math.round(baseMetrics.impressions * factor),
            channel: channelName,
        })
    }

    return points
}
