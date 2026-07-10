/**
 * Twitter OAuth Callback Endpoint
 * GET /api/oauth/callback/twitter
 * Handles OAuth 2.0 PKCE callback and token exchange for Twitter/X
 */

import { createLogger } from "@/lib/logger"
import { getTwitterConfig, getTwitterOAuthService } from "@/lib/twitter"
import { getTokenStore } from "@/lib/token-store"
import { getScopeVersion } from "@/lib/oauth/scope-versions"
import { verifyState } from "@/lib/oauth/state-signer"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TwitterCallbackEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const oauthError = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (oauthError) {
            logger.warn("Twitter OAuth error from provider", {
                error: oauthError,
                errorDescription,
            })
            return NextResponse.redirect(
                new URL(
                    `/dashboard?twitter=error&reason=${oauthError}`,
                    request.url
                )
            )
        }

        if (!code) {
            logger.warn("Missing authorization code in Twitter callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=missing_params",
                    request.url
                )
            )
        }

        if (!state) {
            logger.warn("Missing state parameter in Twitter callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=missing_params",
                    request.url
                )
            )
        }

        // Verify the HMAC-signed state and extract payload (includes code_verifier)
        const verification = verifyState(state)

        if (!verification.valid || !verification.payload) {
            logger.warn("Invalid or expired Twitter state parameter", {
                error: verification.error,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=invalid_state",
                    request.url
                )
            )
        }

        const userId = verification.payload.userId
        const codeVerifier = verification.payload.codeVerifier

        if (verification.payload.platform !== "twitter") {
            logger.warn(
                "Twitter callback received state for different platform",
                { platform: verification.payload.platform }
            )
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=invalid_state",
                    request.url
                )
            )
        }

        if (!codeVerifier) {
            logger.warn(
                "Twitter state missing code_verifier (required for PKCE)",
                { userId }
            )
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitter=error&reason=missing_code_verifier",
                    request.url
                )
            )
        }

        logger.info("Twitter state parameter validated via HMAC", { userId })

        const config = getTwitterConfig()
        const oauthService = getTwitterOAuthService(config)
        await oauthService.initialize()

        // Exchange authorization code for token (using PKCE code_verifier)
        const tokenResponse = await oauthService.exchangeCodeForToken(
            code,
            codeVerifier
        )

        logger.info("Twitter authorization code exchanged successfully", {
            userId,
            hasAccessToken: !!tokenResponse.accessToken,
            hasRefreshToken: !!tokenResponse.refreshToken,
        })

        // Get Twitter user info for display name and ID
        const twitterUser = await oauthService.getUserInfo(
            tokenResponse.accessToken
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

        const expiresAt = tokenResponse.expiresIn
            ? Date.now() + tokenResponse.expiresIn * 1000
            : undefined

        // Store token securely
        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt,
            platform: "twitter",
            userId,
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
                    platform_username: `@${twitterUser.username}`,
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: {
                        twitterId: twitterUser.id,
                        name: twitterUser.name,
                        username: twitterUser.username,
                        profileImageUrl: twitterUser.profileImageUrl,
                        verified: twitterUser.verified,
                        description: twitterUser.description,
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
