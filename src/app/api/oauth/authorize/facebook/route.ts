import { createLogger } from "@/lib/logger"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { generateState } from "@/lib/oauth/state-signer"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("FacebookAuthorizeEndpoint")

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

        logger.info("Facebook linking initiation requested", { userId })

        const config = getFacebookConfig()
        const oauthService = getFacebookOAuthService(config)
        await oauthService.initialize()

        const signedState = generateState(userId, "facebook")

        const params = new URLSearchParams({
            client_id: config.oauth.appId,
            redirect_uri: config.oauth.redirectUri,
            response_type: "code",
            scope: config.oauth.scopes.join(","),
            state: signedState.token,
        })

        const authorizationUrl =
            `https://www.facebook.com/${config.oauth.apiVersion}/dialog/oauth?${params.toString()}`

        logger.info("Facebook authorization URL generated (HMAC state)", {
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
        logger.error("Failed to initiate Facebook linking", err)

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
