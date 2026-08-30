/**
 * POST /api/oauth/authorize/twitch
 * Initiates Twitch account linking process
 * Generates OAuth authorization URL with HMAC-signed state (no Redis needed)
 *
 * Request body: {} (not read — userId comes from header)
 *
 * Response:
 * {
 *   "success": true,
 *   "authorizationUrl": "https://id.twitch.tv/oauth2/authorize?client_id=...",
 *   "state": "base64payload.base64signature"
 * }
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTwitchConfig } from "@/lib/twitch/config"
import { getTwitchOAuthService } from "@/lib/twitch/oauth-service"
import { generateState } from "@/lib/oauth/state-signer"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TwitchAuthorizeEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        const userId = session?.user?.id || "guest"
        const locale = request.nextUrl.searchParams.get("locale") || "pt-BR"

        const config = getTwitchConfig()
        const oauthService = getTwitchOAuthService(config)
        await oauthService.initialize()

        const signedState = generateState(userId, "twitch", locale)
        const { authorizationUrl } = oauthService.generateAuthorizationUrl(
            signedState.token
        )
        return NextResponse.redirect(authorizationUrl)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)

        if (!session?.user?.id) {
            logger.warn("Unauthorized OAuth authorization attempt", {
                platform: "twitch",
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

        const { locale, redirectTo } = await request.json().catch(() => ({}))

        logger.info("Twitch linking initiation requested", {
            userId,
            locale,
            redirectTo,
        })

        const config = getTwitchConfig()
        const oauthService = getTwitchOAuthService(config)
        await oauthService.initialize()

        const signedState = generateState(userId, "twitch", locale, redirectTo)

        const { authorizationUrl } = oauthService.generateAuthorizationUrl(
            signedState.token
        )

        logger.info("Twitch authorization URL generated (HMAC state)", {
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
        logger.error("Failed to initiate Twitch linking", err)

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
