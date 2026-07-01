/**
 * GET /api/oauth/callback/kick
 * Handles OAuth callback from Kick after user authorizes account linking
 * Exchanges authorization code for tokens, retrieves user/channel info, stores encrypted tokens
 *
 * Security Features:
 * - State parameter validation via HMAC-SHA256 (no Redis needed)
 * - Platform field verification inside signed state
 * - Token encryption via AES-256-GCM before storage
 * - Input validation on code and state parameters
 *
 * Query Parameters:
 *   code  - Authorization code from Kick
 *   state - HMAC-signed state token (CSRF prevention)
 *   error - OAuth error from Kick (optional)
 *
 * Redirects to:
 *   /dashboard?kick=success       - Successfully linked
 *   /dashboard?kick=partial       - Token stored but social record failed
 *   /dashboard?kick=error&reason=x - Error with specific reason
 */

import { createLogger } from "@/lib/logger"
import { getKickConfig } from "@/lib/kick/config"
import { getKickOAuthService } from "@/lib/kick/oauth-service"
import { getTokenStore } from "@/lib/token-store"
import { getScopeVersion } from "@/lib/oauth/scope-versions"
import { verifyState } from "@/lib/oauth/state-signer"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("KickCallbackEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const oauthError = searchParams.get("error")

        if (oauthError) {
            logger.warn("Kick OAuth error received", { error: oauthError })
            return NextResponse.redirect(
                new URL(
                    `/dashboard?kick=error&reason=${oauthError}`,
                    request.url
                )
            )
        }

        if (!code) {
            logger.warn("Missing authorization code in Kick callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?kick=error&reason=missing_params",
                    request.url
                )
            )
        }

        if (!state) {
            logger.warn("Missing state parameter in Kick callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?kick=error&reason=missing_params",
                    request.url
                )
            )
        }

        const config = getKickConfig()
        const oauthService = getKickOAuthService(config)
        await oauthService.initialize()

        const verification = verifyState(state)

        if (!verification.valid || !verification.payload) {
            logger.warn("Invalid or expired Kick state parameter", {
                error: verification.error,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?kick=error&reason=invalid_state",
                    request.url
                )
            )
        }

        const userId = verification.payload.userId

        if (verification.payload.platform !== "kick") {
            logger.warn("Kick callback received state for different platform", {
                platform: verification.payload.platform,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?kick=error&reason=invalid_state",
                    request.url
                )
            )
        }

        logger.info("Kick state parameter validated via HMAC", {
            userId,
        })

        const tokenResponse = await oauthService.exchangeCodeForToken(code)

        logger.info("Kick authorization code exchanged successfully", {
            userId,
        })

        const user = await oauthService.getUser(tokenResponse.accessToken)
        const channel = await oauthService.getChannel(tokenResponse.accessToken)

        if (!user) {
            logger.warn("No Kick user found", { userId })
            return NextResponse.redirect(
                new URL("/dashboard?kick=error&reason=no_user", request.url)
            )
        }

        if (!channel) {
            logger.warn("No Kick channel found", { userId })
            return NextResponse.redirect(
                new URL("/dashboard?kick=error&reason=no_channel", request.url)
            )
        }

        logger.info("Kick user and channel retrieved", {
            userId,
            kickUserId: user.userId,
            username: user.username,
            channelName: channel.name,
        })

        const expiresAt = tokenResponse.expiresIn
            ? Date.now() + tokenResponse.expiresIn * 1000
            : undefined

        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt,
            platform: "kick",
            userId,
        })

        logger.info("Kick OAuth tokens stored successfully", { userId })

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error: socialError } = await supabase
            .from("social_networks")
            .upsert(
                {
                    user_id: userId,
                    platform: "kick",
                    platform_user_id: user.userId,
                    platform_username: user.username,
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: {
                        userId: user.userId,
                        username: user.username,
                        email: user.email,
                        profilePictureUrl: user.profilePictureUrl,
                        channelId: channel.id,
                        channelName: channel.name,
                        channelSlug: channel.slug,
                        scopeVersion: getScopeVersion("kick"),
                    },
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id, platform",
                }
            )

        if (socialError) {
            logger.error("Failed to upsert Kick social_networks record", {
                userId,
                error: socialError.message,
            })
            return NextResponse.redirect(
                new URL("/dashboard?kick=partial", request.url)
            )
        }

        logger.info("Kick account linked successfully", {
            userId,
            kickUserId: user.userId,
            username: user.username,
        })

        return NextResponse.redirect(
            new URL("/dashboard?kick=success", request.url)
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to complete Kick linking", err)

        return NextResponse.redirect(
            new URL("/dashboard?kick=error&reason=server_error", request.url)
        )
    }
}
