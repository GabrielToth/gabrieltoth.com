/**
 * Twitter OAuth Callback Endpoint
 * GET /api/oauth/callback/twitter
 * Handles OAuth 1.0a callback and token exchange for Twitter/X
 *
 * OAuth 1.0a parameters (from X):
 *   - oauth_token: The request token
 *   - oauth_verifier: The verification code
 *
 * State management: In OAuth 1.0a, the callback URL is registered during
 * the request token step and cannot include dynamic query params (unlike
 * OAuth 2.0's state parameter). Instead, we store the OAuth session
 * (oauthToken -> userId + oauthTokenSecret) in Supabase during the
 * authorize step and look it up by oauth_token on callback.
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

        // Look up OAuth session from Supabase by oauth_token
        // During authorize step, we stored { oauthToken, oauthTokenSecret, userId }
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: sessionData, error: sessionError } = await supabase
            .from("oauth_sessions")
            .select("oauth_token_secret, user_id")
            .eq("oauth_token", oauthToken)
            .eq("platform", "twitter")
            .single()

        if (sessionError || !sessionData) {
            logger.warn("OAuth session not found in callback", {
                oauthToken: oauthToken.substring(0, 10),
                error: sessionError?.message || "No session found",
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=session_not_found",
                    request.url
                )
            )
        }

        const { oauth_token_secret: oauthTokenSecret, user_id: userId } =
            sessionData

        if (!oauthTokenSecret || !userId) {
            logger.warn("Incomplete OAuth session data", {
                oauthToken: oauthToken.substring(0, 10),
                hasSecret: !!oauthTokenSecret,
                hasUserId: !!userId,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=invalid_session",
                    request.url
                )
            )
        }

        // Clean up the session immediately to prevent replay attacks
        await supabase
            .from("oauth_sessions")
            .delete()
            .eq("oauth_token", oauthToken)

        logger.info("Twitter OAuth 1.0a session validated", { userId })

        const config = getTwitterConfig()
        const oauthService = new TwitterOAuth1Service(config)
        await oauthService.initialize()

        // Exchange request token + verifier for access token
        const accessToken = await oauthService.getAccessToken(
            oauthToken,
            oauthVerifier,
            oauthTokenSecret
        )

        logger.info("Twitter OAuth 1.0a access token obtained", {
            userId,
            screenName: accessToken.screenName,
            twitterUserId: accessToken.userId,
        })

        // Attempt to get extended Twitter user info (display name, profile image).
        // This may fail with 403 for apps created in the new X Developer Console
        // (OAuth 1.0a + /2/users/me requires OAuth 2.0 scopes that aren't available).
        // The access token exchange already gives us user_id and screen_name,
        // so this is non-fatal.
        let displayName = accessToken.screenName
        let profileImageUrl: string | undefined
        let twitterId = accessToken.userId

        try {
            const twitterUser = await oauthService.getUserInfo(
                accessToken.oauthToken,
                accessToken.oauthTokenSecret
            )
            if (twitterUser) {
                displayName = twitterUser.name || twitterUser.username
                profileImageUrl = twitterUser.profileImageUrl
                twitterId = twitterUser.id || accessToken.userId
                logger.info("Extended Twitter user info retrieved", {
                    userId,
                    twitterId,
                    displayName,
                })
            }
        } catch (userInfoErr) {
            // Non-fatal: use access token data as fallback
            logger.warn("Could not retrieve extended Twitter user info", {
                userId,
                error: userInfoErr instanceof Error ? userInfoErr.message : String(userInfoErr),
                fallback: { screenName: accessToken.screenName, userId: accessToken.userId },
            })
        }

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
        const { error: socialError } = await supabase
            .from("social_networks")
            .upsert(
                {
                    user_id: userId,
                    platform: "twitter",
                    platform_user_id: twitterId,
                    platform_username: `@${accessToken.screenName}`,
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: {
                        twitterId,
                        name: displayName,
                        username: accessToken.screenName,
                        profileImageUrl: profileImageUrl || null,
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
            twitterId,
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
