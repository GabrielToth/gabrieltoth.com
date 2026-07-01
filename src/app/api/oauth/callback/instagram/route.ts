/**
 * GET /api/oauth/callback/instagram
 * Handles OAuth callback from Facebook after user authorizes Instagram Business account linking
 * Exchanges authorization code for tokens, retrieves Business Account info, stores encrypted tokens
 *
 * Security Features:
 * - State parameter validation via HMAC-SHA256 (no Redis needed)
 * - Platform field verification inside signed state
 * - Token encryption via AES-256-GCM before storage
 * - Input validation on code and state parameters
 *
 * Query Parameters:
 *   code  - Authorization code from Facebook
 *   state - HMAC-signed state token (CSRF prevention)
 *   error - OAuth error from Facebook (optional)
 *
 * Redirects to:
 *   /dashboard?instagram=success       - Successfully linked
 *   /dashboard?instagram=partial       - Token stored but social record failed
 *   /dashboard?instagram=error&reason=x - Error with specific reason
 */

import { createLogger } from "@/lib/logger"
import { getInstagramConfig } from "@/lib/instagram/config"
import { getInstagramOAuthService } from "@/lib/instagram/oauth-service"
import { getTokenStore } from "@/lib/token-store"
import { getScopeVersion } from "@/lib/oauth/scope-versions"
import { verifyState } from "@/lib/oauth/state-signer"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("InstagramCallbackEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const oauthError = searchParams.get("error")

        if (oauthError) {
            logger.warn("Instagram OAuth error from Facebook", {
                error: oauthError,
            })
            return NextResponse.redirect(
                new URL(
                    `/dashboard?instagram=error&reason=${oauthError}`,
                    request.url
                )
            )
        }

        if (!code) {
            logger.warn("Missing authorization code in Instagram callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?instagram=error&reason=missing_params",
                    request.url
                )
            )
        }

        if (!state) {
            logger.warn("Missing state parameter in Instagram callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?instagram=error&reason=missing_params",
                    request.url
                )
            )
        }

        const config = getInstagramConfig()
        const oauthService = getInstagramOAuthService(config)
        await oauthService.initialize()

        const verification = verifyState(state)

        if (!verification.valid || !verification.payload) {
            logger.warn("Invalid or expired Instagram state parameter", {
                error: verification.error,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?instagram=error&reason=invalid_state",
                    request.url
                )
            )
        }

        const userId = verification.payload.userId

        if (verification.payload.platform !== "instagram") {
            logger.warn(
                "Instagram callback received state for different platform",
                { platform: verification.payload.platform }
            )
            return NextResponse.redirect(
                new URL(
                    "/dashboard?instagram=error&reason=invalid_state",
                    request.url
                )
            )
        }

        logger.info("Instagram state parameter validated via HMAC", {
            userId,
        })

        const tokenResponse = await oauthService.exchangeCodeForToken(code)

        logger.info("Instagram authorization code exchanged successfully", {
            userId,
        })

        const businessAccount = await oauthService.getBusinessAccount(
            tokenResponse.accessToken
        )

        if (!businessAccount) {
            logger.warn("No Instagram Business Account found for user", {
                userId,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?instagram=error&reason=no_business_account",
                    request.url
                )
            )
        }

        logger.info("Instagram Business Account retrieved", {
            userId,
            igUserId: businessAccount.id,
            username: businessAccount.username,
        })

        const expiresAt = tokenResponse.expiresIn
            ? Date.now() + tokenResponse.expiresIn * 1000
            : undefined

        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt,
            platform: "instagram",
            userId,
        })

        logger.info("Instagram OAuth tokens stored successfully", { userId })

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error: socialError } = await supabase
            .from("social_networks")
            .upsert(
                {
                    user_id: userId,
                    platform: "instagram",
                    platform_user_id: businessAccount.id,
                    platform_username: businessAccount.username,
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: {
                        igUserId: businessAccount.id,
                        username: businessAccount.username,
                        name: businessAccount.name,
                        profilePictureUrl: businessAccount.profilePictureUrl,
                        followerCount: businessAccount.followerCount,
                        scopeVersion: getScopeVersion("instagram"),
                    },
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id, platform",
                }
            )

        if (socialError) {
            logger.error("Failed to upsert Instagram social_networks record", {
                userId,
                error: socialError.message,
            })
            return NextResponse.redirect(
                new URL("/dashboard?instagram=partial", request.url)
            )
        }

        logger.info("Instagram Business Account linked successfully", {
            userId,
            igUserId: businessAccount.id,
            username: businessAccount.username,
        })

        return NextResponse.redirect(
            new URL("/dashboard?instagram=success", request.url)
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to complete Instagram linking", err)

        return NextResponse.redirect(
            new URL(
                "/dashboard?instagram=error&reason=server_error",
                request.url
            )
        )
    }
}
