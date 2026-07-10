/**
 * Twitter OAuth Authorize Endpoint
 * POST /api/oauth/authorize/twitter
 * Initiates OAuth 2.0 PKCE flow for Twitter/X
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTwitterConfig, getTwitterOAuthService } from "@/lib/twitter"
import { generateState } from "@/lib/oauth/state-signer"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TwitterAuthorizeEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)

        if (!session?.user?.id) {
            logger.warn("Unauthorized OAuth authorization attempt", {
                platform: "twitter",
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

        logger.info("Twitter/X linking initiation requested", { userId })

        const config = getTwitterConfig()
        const oauthService = getTwitterOAuthService(config)
        await oauthService.initialize()

        // Generate PKCE challenge and authorization URL
        const authResponse = oauthService.generateAuthorizationUrl(userId)

        // Store code_verifier in HMAC-signed state payload
        const signedState = generateState(
            userId,
            "twitter",
            undefined,
            undefined,
            authResponse.codeVerifier
        )

        // Use the signed state as the oauth state parameter
        const authorizeUrl = authResponse.authorizationUrl.replace(
            `state=${authResponse.state}`,
            `state=${encodeURIComponent(signedState.token)}`
        )

        logger.info("Twitter authorization URL generated (PKCE S256)", {
            userId,
        })

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
        logger.error("Failed to initiate Twitter linking", err)

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
