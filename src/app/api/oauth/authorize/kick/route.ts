/**
 * POST /api/oauth/authorize/kick
 * Initiates Kick account linking process
 * Generates OAuth authorization URL with HMAC-signed state (no Redis needed)
 *
 * Request body: {} (not read — userId comes from header)
 *
 * Response:
 * {
 *   "success": true,
 *   "authorizationUrl": "https://id.kick.com/oauth/authorize?client_id=...",
 *   "state": "base64payload.base64signature"
 * }
 */

import crypto from "crypto"
import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getKickConfig } from "@/lib/kick/config"
import { getKickOAuthService } from "@/lib/kick/oauth-service"
import { generateState } from "@/lib/oauth/state-signer"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("KickAuthorizeEndpoint")

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)

        if (!session?.user?.id) {
            logger.warn("Unauthorized OAuth authorization attempt", {
                platform: "kick",
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

        logger.info("Kick linking initiation requested", { userId })

        const config = getKickConfig()
        const oauthService = getKickOAuthService(config)
        await oauthService.initialize()

        // Generate PKCE code_verifier + code_challenge and store verifier in HMAC state
        const codeVerifier = crypto.randomBytes(32).toString("base64url")
        const codeChallenge = crypto
            .createHash("sha256")
            .update(codeVerifier)
            .digest("base64url")

        const signedState = generateState(
            userId,
            "kick",
            undefined,
            undefined,
            codeVerifier
        )

        const params = new URLSearchParams({
            client_id: config.oauth.clientId,
            redirect_uri: config.oauth.redirectUri,
            response_type: "code",
            scope: config.oauth.scopes.join(" "),
            state: signedState.token,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
        })

        const authorizationUrl = `${config.oauthAuthorizeUrl}?${params.toString()}`

        logger.info("Kick authorization URL generated (HMAC state)", {
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
        logger.error("Failed to initiate Kick linking", err)

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
