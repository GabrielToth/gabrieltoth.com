import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getValidTikTokToken } from "@/lib/tiktok/get-valid-token"
import { getTikTokConfig } from "@/lib/tiktok/config"
import { getTikTokOAuthService } from "@/lib/tiktok/oauth-service"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TikTokPublishStatusEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            logger.warn("Missing user ID in TikTok publish status request")
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
        const publishId = searchParams.get("publishId")

        if (!publishId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "publishId query parameter is required",
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

        logger.info("Checking TikTok publish status", { userId, publishId })

        const status = await oauthService.getPublishStatus(
            accessToken,
            publishId
        )

        return NextResponse.json(
            {
                success: true,
                status: status.status,
                postUrl: status.postUrl || null,
                failReason: status.failReason || null,
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to check TikTok publish status", err)

        return NextResponse.json(
            {
                success: false,
                error: "STATUS_CHECK_FAILED",
                message: err.message,
            },
            { status: 500 }
        )
    }
}
