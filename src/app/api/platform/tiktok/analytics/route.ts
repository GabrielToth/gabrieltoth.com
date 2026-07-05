import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getTokenStore } from "@/lib/token-store"
import { getValidTikTokToken } from "@/lib/tiktok/get-valid-token"
import { getTikTokConfig } from "@/lib/tiktok/config"
import { getTikTokOAuthService } from "@/lib/tiktok/oauth-service"
import {
    extractUserStats,
    extractVideoEngagement,
    type TikTokVideoEngagement,
} from "@/lib/tiktok/analytics"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TikTokAnalyticsEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            logger.warn("Missing user ID in TikTok analytics request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        const config = getTikTokConfig()
        const oauthService = getTikTokOAuthService(config)
        await oauthService.initialize()

        const accessToken = await getValidTikTokToken(userId, { oauthService })

        if (!accessToken) {
            logger.warn("TikTok not linked for user", { userId })
            return NextResponse.json(
                {
                    success: false,
                    error: "TIKTOK_NOT_LINKED",
                    message: "TikTok account is not linked",
                },
                { status: 404 }
            )
        }

        const { searchParams } = new URL(request.url)
        const includeVideos = searchParams.get("includeVideos") === "true"
        const videoLimit = Math.min(
            parseInt(searchParams.get("videoLimit") || "5", 10),
            20
        )

        const user = await oauthService.getUserInfo(accessToken)

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: "USER_INFO_FAILED",
                    message: "Failed to retrieve TikTok user information",
                },
                { status: 500 }
            )
        }

        const stats = extractUserStats(user)

        let videos: TikTokVideoEngagement[] = []
        if (includeVideos) {
            const videoData = await oauthService.getVideoList(accessToken, {
                maxCount: videoLimit,
            })
            videos = extractVideoEngagement(videoData.videos)
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    stats,
                    videos,
                    user: {
                        displayName: user.displayName,
                        username: user.username,
                        avatarUrl: user.avatarUrl100,
                        isVerified: user.isVerified,
                        bioDescription: user.bioDescription,
                    },
                },
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to fetch TikTok analytics", err)

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
