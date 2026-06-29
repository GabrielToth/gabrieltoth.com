import { createLogger } from "@/lib/logger"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getTokenStore } from "@/lib/token-store"
import { getValidFacebookToken } from "@/lib/facebook/get-valid-token"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("FacebookPagesEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            logger.warn("Missing user ID in Facebook pages request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
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

        const pages = await oauthService.getUserPages(accessToken)

        return NextResponse.json(
            {
                success: true,
                data: pages.map(page => ({
                    id: page.id,
                    name: page.name,
                    category: page.category,
                    tasks: page.tasks,
                    pictureUrl: page.pictureUrl,
                    followerCount: page.followerCount,
                })),
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to fetch Facebook pages", err)

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
