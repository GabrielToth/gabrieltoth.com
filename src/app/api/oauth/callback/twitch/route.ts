/**
 * GET /api/oauth/callback/twitch
 * Handles OAuth callback from Twitch after user authorizes account linking
 * Exchanges authorization code for tokens, retrieves user/channel info, stores encrypted tokens
 *
 * Security Features:
 * - State parameter validation via HMAC-SHA256 (no Redis needed)
 * - Platform field verification inside signed state
 * - Token encryption via AES-256-GCM before storage
 * - Input validation on code and state parameters
 *
 * Query Parameters:
 *   code  - Authorization code from Twitch
 *   state - HMAC-signed state token (CSRF prevention)
 *   error - OAuth error from Twitch (optional)
 *
 * Redirects to:
 *   /dashboard?twitch=success       - Successfully linked
 *   /dashboard?twitch=partial       - Token stored but social record failed
 *   /dashboard?twitch=error&reason=x - Error with specific reason
 */

import { createLogger } from "@/lib/logger"
import { getTwitchConfig } from "@/lib/twitch/config"
import { getTwitchOAuthService } from "@/lib/twitch/oauth-service"
import { getTokenStore } from "@/lib/token-store"
import { getScopeVersion } from "@/lib/oauth/scope-versions"
import { verifyState } from "@/lib/oauth/state-signer"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TwitchCallbackEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const oauthError = searchParams.get("error")

        if (oauthError) {
            logger.warn("Twitch OAuth error received", { error: oauthError })
            return NextResponse.redirect(
                new URL(
                    `/dashboard?twitch=error&reason=${oauthError}`,
                    request.url
                )
            )
        }

        if (!code) {
            logger.warn("Missing authorization code in Twitch callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitch=error&reason=missing_params",
                    request.url
                )
            )
        }

        if (!state) {
            logger.warn("Missing state parameter in Twitch callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitch=error&reason=missing_params",
                    request.url
                )
            )
        }

        const config = getTwitchConfig()
        const oauthService = getTwitchOAuthService(config)
        await oauthService.initialize()

        const verification = verifyState(state)

        if (!verification.valid || !verification.payload) {
            logger.warn("Invalid or expired Twitch state parameter", {
                error: verification.error,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitch=error&reason=invalid_state",
                    request.url
                )
            )
        }

        const userId = verification.payload.userId

        if (verification.payload.platform !== "twitch") {
            logger.warn(
                "Twitch callback received state for different platform",
                {
                    platform: verification.payload.platform,
                }
            )
            return NextResponse.redirect(
                new URL(
                    "/dashboard?twitch=error&reason=invalid_state",
                    request.url
                )
            )
        }

        logger.info("Twitch state parameter validated via HMAC", {
            userId,
        })

        const tokenResponse = await oauthService.exchangeCodeForToken(code)

        logger.info("Twitch authorization code exchanged successfully", {
            userId,
        })

        const user = await oauthService.getUser(tokenResponse.accessToken)

        if (!user) {
            logger.warn("No Twitch user found", { userId })
            return NextResponse.redirect(
                new URL("/dashboard?twitch=error&reason=no_user", request.url)
            )
        }

        logger.info("Twitch user retrieved", {
            userId,
            twitchUserId: user.id,
            username: user.login,
        })

        const expiresAt = tokenResponse.expiresIn
            ? Date.now() + tokenResponse.expiresIn * 1000
            : undefined

        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt,
            platform: "twitch",
            userId,
        })

        logger.info("Twitch OAuth tokens stored successfully", { userId })

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error: socialError } = await supabase
            .from("social_networks")
            .upsert(
                {
                    user_id: userId,
                    platform: "twitch",
                    platform_user_id: user.id,
                    platform_username: user.login,
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: {
                        userId: user.id,
                        username: user.login,
                        displayName: user.displayName,
                        email: user.email,
                        profileImageUrl: user.profileImageUrl,
                        broadcasterType: user.broadcasterType,
                        scopeVersion: getScopeVersion("twitch"),
                    },
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id, platform, platform_user_id",
                }
            )

        if (socialError) {
            logger.error("Failed to upsert Twitch social_networks record", {
                userId,
                error: socialError.message,
            })
            return NextResponse.redirect(
                new URL("/dashboard?twitch=partial", request.url)
            )
        }

        logger.info("Twitch account linked successfully", {
            userId,
            twitchUserId: user.id,
            username: user.login,
        })

        return NextResponse.redirect(
            new URL("/dashboard?twitch=success", request.url)
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to complete Twitch linking", err)

        return NextResponse.redirect(
            new URL("/dashboard?twitch=error&reason=server_error", request.url)
        )
    }
}
