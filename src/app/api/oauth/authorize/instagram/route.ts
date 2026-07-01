/**
 * POST /api/oauth/authorize/instagram
 * Initiates Instagram Business Account linking process
 * Generates OAuth authorization URL with HMAC-signed state (no Redis needed)
 *
 * Request body: {} (empty)
 *
 * Response:
 * {
 *   "success": true,
 *   "authorizationUrl": "https://www.facebook.com/v22.0/dialog/oauth?...",
 *   "state": "base64payload.base64signature"
 * }
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getInstagramConfig } from "@/lib/instagram/config"
import { getInstagramOAuthService } from "@/lib/instagram/oauth-service"
import { generateState } from "@/lib/oauth/state-signer"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("InstagramAuthorizeEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)

        if (!session?.user?.id) {
            logger.warn("Unauthorized OAuth authorization attempt", { platform: "instagram" })
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

        logger.info("Instagram linking initiation requested", { userId })

        const config = getInstagramConfig()
        const oauthService = getInstagramOAuthService(config)
        await oauthService.initialize()

        const signedState = generateState(userId, "instagram")

        const params = new URLSearchParams({
            client_id: config.oauth.appId,
            redirect_uri: config.oauth.redirectUri,
            response_type: "code",
            scope: config.oauth.scopes.join(","),
            state: signedState.token,
        })

        const authorizationUrl = `https://www.facebook.com/${config.oauth.apiVersion}/dialog/oauth?${params.toString()}`

        logger.info("Instagram authorization URL generated (HMAC state)", {
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
        logger.error("Failed to initiate Instagram linking", err)

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
