import { createLogger } from "@/lib/logger"
import { getTikTokConfig } from "@/lib/tiktok/config"
import { getTikTokOAuthService } from "@/lib/tiktok/oauth-service"
import { generateState } from "@/lib/oauth/state-signer"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TikTokAuthorizeEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            logger.warn("Missing user ID in request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 },
            )
        }

        logger.info("TikTok linking initiation requested", { userId })

        const config = getTikTokConfig()
        const oauthService = getTikTokOAuthService(config)
        await oauthService.initialize()

        const signedState = generateState(userId, "tiktok")

        const params = new URLSearchParams({
            client_key: config.oauth.clientKey,
            redirect_uri: config.oauth.redirectUri,
            response_type: "code",
            scope: config.oauth.scopes.join(","),
            state: signedState.token,
        })

        const authorizationUrl =
            `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`

        logger.info("TikTok authorization URL generated (HMAC state)", {
            userId,
        })

        return NextResponse.json(
            {
                success: true,
                authorizationUrl,
                state: signedState.token,
            },
            { status: 200 },
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to initiate TikTok linking", err)

        return NextResponse.json(
            {
                success: false,
                error: "LINKING_INITIATION_FAILED",
                message: err.message,
            },
            { status: 500 },
        )
    }
}
