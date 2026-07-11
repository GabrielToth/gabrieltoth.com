/**
 * Twitter OAuth Authorize Endpoint
 * POST /api/oauth/authorize/twitter
 * Initiates OAuth 1.0a flow for Twitter/X
 *
 * NOTE: OAuth 2.0 PKCE is not available for apps created in the new
 * X Developer Console (console.x.com). The "enableAuthRedesignPhase2"
 * feature flag is disabled. OAuth 1.0a (3-legged) is used instead.
 *
 * State management: In OAuth 1.0a, the callback URL is registered during
 * the request token step and cannot include dynamic params (like state)
 * because the callback URL is part of the signed OAuth parameters.
 * Instead, we store the OAuth session (oauthToken -> userId + oauthTokenSecret)
 * in Supabase and look it up on callback.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getTwitterConfig } from "@/lib/twitter"
import { TwitterOAuth1Service } from "@/lib/twitter/oauth1-service"
import { createClient } from "@supabase/supabase-js"
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
        await oauthService.initialize()

        // Step 1: Get OAuth 1.0a request token
        const requestToken = await oauthService.getRequestToken()

        // Step 2: Store OAuth session in Supabase for callback lookup
        // We store by oauth_token so the callback can retrieve oauth_token_secret
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        // Upsert: if same oauth_token (shouldn't happen but handle gracefully)
        const { error: dbError } = await supabase
            .from("oauth_sessions")
            .upsert(
                {
                    oauth_token: requestToken.oauthToken,
                    oauth_token_secret: requestToken.oauthTokenSecret,
                    user_id: userId,
                    platform: "twitter",
                    created_at: new Date().toISOString(),
                },
                { onConflict: "oauth_token" }
            )

        if (dbError) {
            logger.error("Failed to store OAuth session", {
                error: dbError.message,
            })
            // Non-fatal: callback will fail but at least user gets the auth URL
            // to try again
        } else {
            logger.info("OAuth session stored for callback", {
                userId,
                oauthToken: requestToken.oauthToken.substring(0, 10),
            })
        }

        // Step 3: Generate authorization URL
        // We do NOT include state in the URL because OAuth 1.0a callback
        // URL is fixed during request token step. Instead, we stored the
        // session in the DB keyed by oauth_token.
        const authorizeUrl =
            oauthService.generateAuthorizationUrl(requestToken.oauthToken)

        logger.info("Twitter OAuth 1.0a authorization URL generated", {
            userId,
        })

        return NextResponse.json(
            {
                success: true,
                authorizationUrl: authorizeUrl,
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
