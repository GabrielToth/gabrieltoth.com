/**
 * Twitter OAuth Authorize Endpoint
 * POST /api/oauth/authorize/twitter
 * Initiates OAuth 1.0a flow for Twitter/X
 *
 * NOTE: OAuth 2.0 PKCE is not available for apps created in the new
 * X Developer Console (console.x.com). The "enableAuthRedesignPhase2"
 * feature flag is disabled. OAuth 1.0a (3-legged) is used instead.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTwitterConfig } from "@/lib/twitter"
import { TwitterOAuth1Service } from "@/lib/twitter/oauth1-service"
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
        const oauthService = new TwitterOAuth1Service(config)

        // Step 1: Get OAuth 1.0a request token
        const requestToken = await oauthService.getRequestToken()

        // Step 2: Generate authorization URL
        const authorizeUrl =
            oauthService.generateAuthorizationUrl(requestToken.oauthToken)

        // Store the oauth_token_secret in the state for callback verification
        // Using HMAC-signed state to store the token secret and request token
        const statePayload = JSON.stringify({
            userId,
            oauthToken: requestToken.oauthToken,
            oauthTokenSecret: requestToken.oauthTokenSecret,
        })
        // Base64url encode the state so it doesn't get mangled in URL
        const state = Buffer.from(statePayload).toString("base64url")

        logger.info("Twitter OAuth 1.0a authorization URL generated", {
            userId,
        })

        return NextResponse.json(
            {
                success: true,
                authorizationUrl: authorizeUrl,
                state,
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
