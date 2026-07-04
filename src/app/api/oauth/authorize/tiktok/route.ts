import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTikTokConfig } from "@/lib/tiktok/config"
import { getTikTokOAuthService } from "@/lib/tiktok/oauth-service"
import { generateState } from "@/lib/oauth/state-signer"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TikTokAuthorizeEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)

        if (!session?.user?.id) {
            logger.warn("Unauthorized OAuth authorization attempt", {
                platform: "tiktok",
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "UNAUTHORIZED",
                    message: "Authentication required",
                },
                { status: 401 }
            )
        }
        const userId = session.user.id

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

        const authorizationUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`

        logger.info("TikTok authorization URL generated (HMAC state)", {
            userId,
        })

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
        logger.error("Failed to initiate TikTok linking", err)

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
