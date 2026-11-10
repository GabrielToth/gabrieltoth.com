import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getTokenStore } from "@/lib/token-store"
import { getValidFacebookToken } from "@/lib/facebook/get-valid-token"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import {
    getPageInsights,
    COMMON_PAGE_METRICS,
    PageInsightMetric,
} from "@/lib/facebook/analytics"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("FacebookAnalyticsEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            logger.warn("Missing user ID in Facebook analytics request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        const { searchParams } = new URL(request.url)
        const pageId = searchParams.get("pageId")

        if (!pageId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "pageId query parameter is required",
                },
                { status: 400 }
            )
        }

        const config = getFacebookConfig()
        const oauthService = getFacebookOAuthService(config)
        await oauthService.initialize()

        const accessToken = await getValidFacebookToken(userId, {
            oauthService,
        })

        if (!accessToken) {
            logger.warn("Facebook not linked for user", { userId })
            return NextResponse.json(
                {
                    success: false,
                    error: "FACEBOOK_NOT_LINKED",
                    message: "Facebook account is not linked",
                },
                { status: 404 }
            )
        }

        const pageAccessToken = await oauthService.getPageAccessToken(
            pageId,
            accessToken
        )

        if (!pageAccessToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "PAGE_TOKEN_FAILED",
                    message:
                        "Failed to obtain access token for the specified page",
                },
                { status: 500 }
            )
        }

        const metricParam = searchParams.get("metric")
        const metrics: PageInsightMetric[] = metricParam
            ? (metricParam.split(",") as PageInsightMetric[])
            : COMMON_PAGE_METRICS

        const period =
            (searchParams.get("period") as
                | "day"
                | "week"
                | "days_28"
                | "month"
                | "lifetime") || "day"

        const since = searchParams.get("since") || undefined
        const until = searchParams.get("until") || undefined

        const result = await getPageInsights(pageAccessToken, pageId, metrics, {
            period,
            since,
            until,
        })

        return NextResponse.json(
            {
                success: true,
                data: result.data,
                paging: result.paging,
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to fetch Facebook analytics", err)

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
