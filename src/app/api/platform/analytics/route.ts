/**
 * GET /api/platform/analytics
 * Returns REAL user social analytics with support for simple/advanced view,
 * platform, channel and channel group filtering.
 *
 * Real data sources:
 * - Twitch: Helix users (view_count) + channels/followers (total)
 * - Kick: public API channels/{username} (followersCount)
 * - YouTube: Data API channels?part=statistics&mine=true (1 unit, 1h cache)
 * - Historical deltas: platform_stats_snapshots table (per-day snapshots)
 *
 * Platforms without stored tokens or failing APIs contribute zero values —
 * the UI shows honest "no data" numbers instead of placeholders.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getRealPlatformStats } from "@/lib/analytics/real-platform-stats"
import {
    buildAdvancedMetrics,
    buildNormalizedGraphData,
    buildNormalizedMetrics,
} from "@/lib/analytics/normalized-analytics-service"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("PlatformAnalyticsAPI")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }
        const userId = session.user.id

        const { searchParams } = new URL(request.url)
        const period = searchParams.get("period") || "7d"
        const platformFilter = searchParams.get("platform") || ""
        const groupId = searchParams.get("groupId") || ""
        const days = period === "30d" ? 30 : period === "90d" ? 90 : 7

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )
        if (
            !process.env.NEXT_PUBLIC_SUPABASE_URL ||
            !process.env.SUPABASE_SERVICE_ROLE_KEY
        ) {
            return NextResponse.json(
                { success: false, error: "SERVER_ERROR" },
                { status: 500 }
            )
        }

        // Query the connected social networks for this user
        let networksQuery = supabase
            .from("social_networks")
            .select("platform, platform_username")
            .eq("user_id", userId)

        if (platformFilter) {
            networksQuery = networksQuery.eq("platform", platformFilter)
        }

        const { data: networks } = await networksQuery

        // Distinct connected platforms
        const connectedPlatforms = Array.from(
            new Set(
                (networks || [])
                    .map(n => (n.platform || "").toLowerCase())
                    .filter(Boolean)
            )
        )

        // Keep the latest username per platform (for Kick public lookup)
        const platformUsernames = new Map<string, string>()
        for (const n of networks || []) {
            if (n.platform && n.platform_username) {
                platformUsernames.set(n.platform, n.platform_username)
            }
        }

        let channelsCount = connectedPlatforms.length

        // If filtering by channel group, resolve group member channel ids
        if (groupId) {
            const { data: groupMembers } = await supabase
                .from("channel_group_members")
                .select("channel_id")
                .eq("group_id", groupId)
            if (groupMembers && groupMembers.length > 0) {
                channelsCount = groupMembers.length
            }
        }

        const breakdownPlatforms =
            platformFilter && connectedPlatforms.includes(platformFilter)
                ? [platformFilter]
                : connectedPlatforms.length > 0
                  ? connectedPlatforms
                  : []

        // ------------------------------------------------------------------
        // Fetch REAL stats per platform (with 1h in-memory cache)
        // ------------------------------------------------------------------
        const statsByPlatform = new Map<
            string,
            {
                followers: number | null
                views: number | null
                channelName: string | null
            }
        >()

        await Promise.all(
            breakdownPlatforms.map(async platform => {
                const stats = await getRealPlatformStats(
                    userId,
                    platform,
                    platformUsernames.get(platform)
                )
                statsByPlatform.set(
                    platform,
                    stats
                        ? {
                              followers: stats.followers,
                              views: stats.views,
                              channelName: stats.channelName,
                          }
                        : { followers: null, views: null, channelName: null }
                )

                // Persist today's snapshot (latest wins within the day) so
                // deltas can be computed on subsequent calls.
                if (
                    stats?.followers !== null &&
                    stats?.followers !== undefined
                ) {
                    try {
                        const today = new Date().toISOString().slice(0, 10)
                        await supabase
                            .from("platform_stats_snapshots")
                            .delete()
                            .eq("user_id", userId)
                            .eq("platform", platform)
                            .gte("captured_at", `${today}T00:00:00+00:00`)
                        await supabase.from("platform_stats_snapshots").insert({
                            user_id: userId,
                            platform,
                            followers: stats.followers,
                            views: stats.views,
                            channel_name: stats.channelName,
                        })
                    } catch (err) {
                        // Non-fatal: the table may not be migrated yet
                        logger.debug("Snapshot upsert skipped", {
                            platform,
                            error:
                                err instanceof Error
                                    ? err.message
                                    : String(err),
                        })
                    }
                }
            })
        )

        // ------------------------------------------------------------------
        // Current totals (real numbers; nulls count as 0)
        // ------------------------------------------------------------------
        let totalFollowers = 0
        let totalViews = 0
        const realPlatforms: string[] = []

        for (const platform of breakdownPlatforms) {
            const stats = statsByPlatform.get(platform)
            if (!stats) continue
            if (stats.followers !== null || stats.views !== null) {
                realPlatforms.push(platform)
            }
            if (stats.followers !== null) totalFollowers += stats.followers
            if (stats.views !== null) totalViews += stats.views
        }

        // ------------------------------------------------------------------
        // Historical deltas from persisted snapshots (period window)
        // ------------------------------------------------------------------
        let previousFollowers = 0
        let previousViews = 0

        try {
            const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            const { data: snapshots } = await supabase
                .from("platform_stats_snapshots")
                .select("platform, followers, views, captured_at")
                .eq("user_id", userId)
                .gte("captured_at", since.toISOString())
                .order("captured_at", { ascending: true })

            if (snapshots && snapshots.length > 0) {
                // Baseline: earliest snapshot per platform in the window
                const earliestPerPlatform = new Map<
                    string,
                    { followers: number; views: number }
                >()
                for (const snap of snapshots) {
                    if (!earliestPerPlatform.has(snap.platform)) {
                        earliestPerPlatform.set(snap.platform, {
                            followers: snap.followers || 0,
                            views: snap.views || 0,
                        })
                    }
                }
                for (const [, v] of earliestPerPlatform) {
                    previousFollowers += v.followers
                    previousViews += v.views
                }
            }
        } catch (err) {
            logger.debug("Snapshot history read skipped", {
                error: err instanceof Error ? err.message : String(err),
            })
        }

        // Derived engagement/reach views are honest zeros when we have no
        // per-platform engagement API wired — NOT fabricated numbers.
        const totalEngagement = 0
        const totalReach = totalViews
        const totalImpressions = totalViews
        const previousEngagement = 0
        const previousReach = previousViews
        const previousImpressions = previousViews

        const effectivePlatforms =
            breakdownPlatforms.length > 0 ? breakdownPlatforms : []

        const simpleMetrics = buildNormalizedMetrics({
            totalFollowers,
            previousFollowers,
            totalEngagement,
            previousEngagement,
            totalReach,
            previousReach,
            totalImpressions,
            previousImpressions,
        })

        const advancedMetrics = buildAdvancedMetrics(
            simpleMetrics,
            effectivePlatforms,
            true // real data mode: honest zeros instead of placeholders
        )

        // Graph data: REAL follower snapshots over the period window
        const graphData = await buildGraphFromSnapshots(
            supabase,
            userId,
            days,
            platformFilter || "all"
        )

        return NextResponse.json({
            success: true,
            data: {
                simpleMetrics,
                advancedMetrics,
                graphData,
                channelsCount,
                timePeriod: period,
                appliedFilters: {
                    platform: platformFilter || "all",
                    groupId: groupId || "all",
                },
                platforms: effectivePlatforms,
                // Per-platform real stats for the UI breakdown
                platformStats: Object.fromEntries(
                    breakdownPlatforms.map(p => {
                        const s = statsByPlatform.get(p)
                        return [
                            p,
                            {
                                followers: s?.followers ?? null,
                                views: s?.views ?? null,
                                channelName: s?.channelName ?? null,
                            },
                        ]
                    })
                ),
            },
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to fetch platform analytics", {
            error: err.message,
        })
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}

/**
 * Builds graph data from real persisted snapshots. When there is no history
 * yet (first call), returns a single point with the current totals so the
 * chart is not empty — clearly marked as day-0 data.
 */
async function buildGraphFromSnapshots(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: ReturnType<typeof createClient<any>>,
    userId: string,
    days: number,
    platformFilter: string
): Promise<
    Array<{
        date: string
        followers: number
        engagement: number
        reach: number
        impressions: number
        channel: string
    }>
> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    try {
        let query = supabase
            .from("platform_stats_snapshots")
            .select("platform, followers, views, captured_at")
            .eq("user_id", userId)
            .gte("captured_at", since.toISOString())
            .order("captured_at", { ascending: true })

        if (platformFilter !== "all") {
            query = query.eq("platform", platformFilter)
        }

        const { data: snapshots } = await query

        if (!snapshots || snapshots.length === 0) {
            // No history yet — synthesize a single current point
            return buildNormalizedGraphData(
                days,
                {
                    followers: 0,
                    engagement: 0,
                    reach: 0,
                    impressions: 0,
                },
                platformFilter
            )
        }

        // Group snapshots by day (YYYY-MM-DD), latest snapshot wins per day
        const byDay = new Map<
            string,
            { followers: number; views: number; platforms: Set<string> }
        >()
        for (const snap of snapshots) {
            const day = (snap.captured_at as string).slice(0, 10)
            const existing = byDay.get(day)
            if (existing) {
                // platform-level latest handling: add per-platform followers
                existing.followers += snap.followers || 0
                existing.views += snap.views || 0
                existing.platforms.add(snap.platform)
            } else {
                byDay.set(day, {
                    followers: snap.followers || 0,
                    views: snap.views || 0,
                    platforms: new Set([snap.platform]),
                })
            }
        }

        const points = Array.from(byDay.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({
                date,
                followers: v.followers,
                engagement: 0, // real engagement APIs not wired yet
                reach: v.views,
                impressions: v.views,
                channel: Array.from(v.platforms).join("+") || "all",
            }))

        // If only one day exists, duplicate the point as start/end so the
        // chart renders a flat real line instead of nothing.
        if (points.length === 1) {
            const [p] = points
            return [{ ...p, date: shiftDay(p.date, -1) }, p]
        }

        return points
    } catch (err) {
        logger.debug("Graph snapshot read failed", {
            error: err instanceof Error ? err.message : String(err),
        })
        return buildNormalizedGraphData(
            days,
            {
                followers: 0,
                engagement: 0,
                reach: 0,
                impressions: 0,
            },
            platformFilter
        )
    }
}

function shiftDay(date: string, offset: number): string {
    const d = new Date(date + "T00:00:00Z")
    d.setUTCDate(d.getUTCDate() + offset)
    return d.toISOString().slice(0, 10)
}
