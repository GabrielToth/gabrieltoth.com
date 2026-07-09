/**
 * GET /api/platform/instagram/analytics
 * Get Instagram Business Account analytics (basic insights).
 *
 * Query Parameters:
 *   metric - Comma-separated metrics (default: impressions,reach,profile_views)
 *            Supported: impressions, reach, profile_views, follower_count
 *   period - Time period: day, week, days_28 (default: day)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "businessAccount": { "id": "...", "username": "...", "name": "..." },
 *     "insights": { "impressions": ..., "reach": ..., ... }
 *   }
 * }
 *
 * Error codes:
 *   MISSING_USER_ID      - x-user-id header not present
 *   INSTAGRAM_NOT_LINKED - User has no Instagram linked
 *   FETCH_FAILED         - Instagram API returned an error
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { getValidInstagramToken } from "@/lib/instagram/get-valid-token"
import { getInstagramConfig } from "@/lib/instagram/config"
import { getInstagramOAuthService } from "@/lib/instagram/oauth-service"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("InstagramAnalyticsEndpoint")

const GRAPH_API_BASE = "https://graph.facebook.com"

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            logger.warn("Missing user ID in Instagram analytics request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        const tokenStore = getTokenStore()
        const config = getInstagramConfig()
        const oauthService = getInstagramOAuthService(config)
        await oauthService.initialize()

        const accessToken = await getValidInstagramToken(userId, {
            tokenStore,
            oauthService,
        })

        if (!accessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "TOKEN_EXPIRED",
                    message:
                        "Instagram token has expired. Re-link your account.",
                },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const metric =
            searchParams.get("metric") || "impressions,reach,profile_views"
        const period = searchParams.get("period") || "day"

        const apiVersion = config.oauth.apiVersion

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: network } = await supabase
            .from("social_networks")
            .select("platform_user_id, platform_username, metadata")
            .eq("user_id", userId)
            .eq("platform", "instagram")
            .single()

        if (!network) {
            logger.warn("No Instagram social_networks record found", {
                userId,
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "INSTAGRAM_NOT_LINKED",
                    message: "Instagram account is not linked",
                },
                { status: 404 }
            )
        }

        const igUserId = network.platform_user_id
        const igUsername = network.platform_username

        const insightsParams = new URLSearchParams({
            metric,
            period,
            access_token: accessToken,
        })

        const insightsUrl = `${GRAPH_API_BASE}/${apiVersion}/${igUserId}/insights?${insightsParams.toString()}`

        const insightsResponse = await fetch(insightsUrl)

        if (!insightsResponse.ok) {
            const error = await insightsResponse.json()
            logger.warn("Failed to fetch Instagram insights", {
                error: error.error?.message,
            })
            return NextResponse.json(
                {
                    success: true,
                    data: {
                        businessAccount: { id: igUserId, username: igUsername },
                        insights: null,
                    },
                },
                { status: 200 }
            )
        }

        const insightsData = await insightsResponse.json()

        const insights: Record<string, number> = {}
        for (const dataPoint of insightsData.data || []) {
            const values = dataPoint.values || []
            const latestValue = values[values.length - 1]
            insights[dataPoint.name] = latestValue?.value ?? 0
        }

        logger.info("Instagram analytics retrieved", {
            userId,
            igUserId,
        })

        return NextResponse.json(
            {
                success: true,
                data: {
                    businessAccount: { id: igUserId, username: igUsername },
                    insights,
                },
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to fetch Instagram analytics", err)

        return NextResponse.json(
            {
                success: false,
                error: "FETCH_FAILED",
                message: err.message,
            },
            { status: 500 }
        )
    }
}
