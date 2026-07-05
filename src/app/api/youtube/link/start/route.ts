/**
 * POST /api/youtube/link/start
 * Initiates YouTube channel linking process
 * Generates OAuth authorization URL with HMAC-signed state (no Redis needed)
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { validateYouTubeEnv } from "@/lib/config/env"
import { createLogger } from "@/lib/logger"
import { getYouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import { getYouTubeOAuthService } from "@/lib/youtube/oauth-service"
import { generateState } from "@/lib/oauth/state-signer"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("YouTubeLinkStartEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id

        if (!userId) {
            logger.warn("Missing user ID in request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        logger.info("Linking initiation requested", { userId })

        const env = validateYouTubeEnv()
        const config = getYouTubeChannelLinkingConfig(env)

        const oauthService = getYouTubeOAuthService(config)
        await oauthService.initialize()

        const { authorizationUrl } =
            oauthService.generateAuthorizationUrl(userId)

        const signedState = generateState(userId, "youtube")

        logger.info("State parameter signed with HMAC", { userId })

        return NextResponse.json(
            {
                success: true,
                authorizationUrl,
                state: signedState.token,
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to initiate YouTube linking", err)

        return NextResponse.json(
            {
                success: false,
                error: "LINKING_INITIATION_FAILED",
                message: err.message,
            },
            { status: 500 }
        )
    }
}
