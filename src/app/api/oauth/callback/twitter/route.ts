/**
 * Twitter OAuth Callback Endpoint
 * GET /api/oauth/callback/twitter
 * Handles OAuth 1.0a callback and token exchange for Twitter/X
 *
 * OAuth 1.0a parameters (from X):
 *   - oauth_token: The request token
 *   - oauth_verifier: The verification code
 *   - state: Base64url-encoded JSON with { userId, oauthToken, oauthTokenSecret }
 *
 * NOTE: OAuth 2.0 PKCE is not available for apps created in the new
 * X Developer Console (console.x.com). OAuth 1.0a is used instead.
 */

import { createLogger } from "@/lib/logger"
import { getTwitterConfig } from "@/lib/twitter"
import { TwitterOAuth1Service } from "@/lib/twitter/oauth1-service"
import { getTokenStore } from "@/lib/token-store"
import { getScopeVersion } from "@/lib/oauth/scope-versions"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TwitterCallbackEndpoint")

interface OAuth1State {
    userId: string
    oauthToken: string
    oauthTokenSecret: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const oauthToken = searchParams.get("oauth_token")
        const oauthVerifier = searchParams.get("oauth_verifier")
        const denied = searchParams.get("denied")

        // If user denied authorization
        if (denied) {
            logger.info("User denied Twitter authorization", { denied })
            return NextResponse.redirect(
                new URL("/dashboard?twitter=error&reason=denied", request.url)
            )
        }

        if (!oauthToken || !oauthVerifier) {
            logger.warn(
                "Missing OAuth 1.0a parameters in Twitter callback",
                { hasToken: !!oauthToken, hasVerifier: !!oauthVerifier }
            )
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=missing_params",
                    request.url
                )
            )
        }

        // Parse state from query parameter (base64url-encoded JSON)
        const stateParam = searchParams.get("state")
        if (!stateParam) {
            logger.warn("Missing state parameter in Twitter callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=missing_params",
                    request.url
                )
            )
        }

        let state: OAuth1State
        try {
            const decoded = Buffer.from(stateParam, "base64url").toString(
                "utf-8"
            )
            state = JSON.parse(decoded)
        } catch {
            logger.warn("Invalid state format in Twitter callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=invalid_state",
                    request.url
                )
            )
        }

        const { userId, oauthToken: storedToken, oauthTokenSecret } = state

        if (!userId || !storedToken || !oauthTokenSecret) {
            logger.warn("Incomplete state payload in Twitter callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=invalid_state",
                    request.url
                )
            )
        }

        // Verify the oauth_token matches
        if (storedToken !== oauthToken) {
            logger.warn("OAuth token mismatch in Twitter callback", {
                expected: storedToken?.substring(0, 10),
                received: oauthToken.substring(0, 10),
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=token_mismatch",
                    request.url
                )
            )
        }

        logger.info("Twitter OAuth 1.0a state validated", { userId })

        const config = getTwitterConfig()
        const oauthService = new TwitterOAuth1Service(config)

        // Exchange request token + verifier for access token
        const accessToken = await oauthService.getAccessToken(
            oauthToken,
            oauthVerifier,
            oauthTokenSecret
        )

        logger.info("Twitter OAuth 1.0a access token obtained", {
            userId,
            screenName: accessToken.screenName,
        })

        // Get Twitter user info for display name and ID
        const twitterUser = await oauthService.getUserInfo(
            accessToken.oauthToken,
            accessToken.oauthTokenSecret
        )

        if (!twitterUser) {
            logger.warn("Failed to retrieve Twitter user info", { userId })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=user_info_failed",
                    request.url
                )
            )
        }

        logger.info("Twitter user retrieved", {
            userId,
            twitterId: twitterUser.id,
            username: twitterUser.username,
            name: twitterUser.name,
        })

        // Store tokens securely
        // OAuth 1.0a tokens:
        //   accessToken = oauth_token (permanent, doesn't expire)
        //   refreshToken = oauth_token_secret (needed to sign requests)
        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: accessToken.oauthToken,
            refreshToken: accessToken.oauthTokenSecret,
            platform: "twitter",
            userId,
            // OAuth 1.0a tokens don't expire, but we set a far-future expiry
            // to keep the token store happy (it checks expiresAt for validity)
            expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        })

        logger.info("Twitter user token stored successfully", { userId })

        // Save to social_networks so channel appears in dashboard
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error: socialError } = await supabase
            .from("social_networks")
            .upsert(
                {
                    user_id: userId,
                    platform: "twitter",
                    platform_user_id: twitterUser.id,
                    platform_username: `@${accessToken.screenName}`,
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: {
                        twitterId: twitterUser.id,
                        name: twitterUser.name,
                        username: accessToken.screenName,
                        profileImageUrl: twitterUser.profileImageUrl,
                        scopeVersion: getScopeVersion("twitter"),
                    },
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id, platform, platform_user_id",
                }
            )

        if (socialError) {
            logger.error("Failed to upsert Twitter social_networks record", {
                userId,
                error: socialError.message,
            })
        }

        logger.info("Twitter/X account linked successfully", {
            userId,
            twitterId: twitterUser.id,
        })

        return NextResponse.redirect(
            new URL("/dashboard?twitter=success", request.url)
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to complete Twitter linking", {
            error: err.message,
            stack: err.stack?.slice(0, 500),
        })

        const errorMsg = encodeURIComponent(err.message.slice(0, 100))

        return NextResponse.redirect(
            new URL(`/dashboard?twitter=error&reason=${errorMsg}`, request.url)
        )
    }
}
