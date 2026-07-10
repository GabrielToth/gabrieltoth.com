/**
 * LinkedIn OAuth Authorize Endpoint
 * POST /api/oauth/authorize/linkedin
 * Initiates OAuth 2.0 flow for LinkedIn
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getLinkedInConfig, getLinkedInOAuthService } from "@/lib/linkedin"
import { generateState } from "@/lib/oauth/state-signer"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LinkedInAuthorizeEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)

        if (!session?.user?.id) {
            logger.warn("Unauthorized OAuth authorization attempt", {
                platform: "linkedin",
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

        logger.info("LinkedIn linking initiation requested", { userId })

        const config = getLinkedInConfig()
        const oauthService = getLinkedInOAuthService(config)
        await oauthService.initialize()

        const authResponse = oauthService.generateAuthorizationUrl(userId)

        // Sign the state with HMAC for verification in callback
        const signedState = generateState(userId, "linkedin")

        // Use the signed state as the oauth state parameter
        const authorizeUrl = authResponse.authorizationUrl.replace(
            `state=${authResponse.state}`,
            `state=${encodeURIComponent(signedState.token)}`
        )

        logger.info("LinkedIn authorization URL generated", { userId })

        return NextResponse.json(
            {
                success: true,
                authorizationUrl: authorizeUrl,
                state: signedState.token,
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to initiate LinkedIn linking", err)

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
