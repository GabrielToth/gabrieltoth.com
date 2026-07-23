/**
 * GET /api/youtube/link/callback
 * Handles OAuth callback from Google after user authorizes YouTube channel linking
 * Exchanges authorization code for tokens, retrieves channel info, stores encrypted tokens
 *
 * Security:
 * - HMAC-signed state parameter (CSRF prevention) — no Redis needed
 * - Token encryption via AES-256-GCM before storage
 * - Input validation on code and state parameters
 */

import { validateEnv } from "@/lib/config/env"
import { createLogger } from "@/lib/logger"
import { getYouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import { getYouTubeOAuthService } from "@/lib/youtube/oauth-service"
import { getChannelValidationService } from "@/lib/youtube/channel-validation"
import { getTokenStore } from "@/lib/token-store"
import { getScopeVersion } from "@/lib/oauth/scope-versions"
import { verifyState } from "@/lib/oauth/state-signer"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("YouTubeLinkCallbackEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const oauthError = searchParams.get("error")

        if (oauthError) {
            logger.warn("OAuth error from Google", { error: oauthError })
            return NextResponse.redirect(
                new URL(
                    `/dashboard?youtube=error&reason=${oauthError}`,
                    request.url
                )
            )
        }

        if (!code) {
            logger.warn("Missing authorization code in callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?youtube=error&reason=missing_params",
                    request.url
                )
            )
        }

        if (!state) {
            logger.warn("Missing state parameter in callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?youtube=error&reason=missing_params",
                    request.url
                )
            )
        }

        const verification = verifyState(state)
        if (!verification.valid) {
            logger.warn("Invalid or expired state parameter", {
                error: verification.error,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?youtube=error&reason=invalid_state",
                    request.url
                )
            )
        }

        const userId = verification.payload!.userId

        logger.info("State parameter validated successfully via HMAC", {
            userId,
        })

        const env = validateEnv()
        const config = getYouTubeChannelLinkingConfig(env)
        const oauthService = getYouTubeOAuthService(config)
        await oauthService.initialize()

        const tokenResponse = await oauthService.exchangeCodeForToken(code)

        logger.info("Authorization code exchanged successfully", { userId })

        const channelValidationService = getChannelValidationService(config)
        await channelValidationService.initialize()

        const channelInfo = await channelValidationService.getChannelInfo(
            tokenResponse.accessToken
        )

        if (!channelInfo) {
            logger.warn("No channel info returned from YouTube API", { userId })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?youtube=error&reason=no_channel",
                    request.url
                )
            )
        }

        logger.info("Channel info retrieved", {
            userId,
            channelId: channelInfo.channelId,
            channelTitle: channelInfo.title,
        })

        const expiresAt = tokenResponse.expiresIn
            ? Date.now() + tokenResponse.expiresIn * 1000
            : undefined

        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt,
            platform: "youtube",
            userId,
        })

        logger.info("OAuth tokens stored successfully", { userId })

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error: socialError } = await supabase
            .from("social_networks")
            .upsert(
                {
                    user_id: userId,
                    platform: "youtube",
                    platform_user_id: channelInfo.channelId,
                    platform_username: channelInfo.title,
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: {
                        channelId: channelInfo.channelId,
                        channelTitle: channelInfo.title,
                        channelDescription: channelInfo.description,
                        customUrl: channelInfo.customUrl,
                        subscriberCount: channelInfo.subscriberCount,
                        profileImageUrl: channelInfo.profileImageUrl,
                        scopeVersion: getScopeVersion("youtube"),
                    },
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id, platform, platform_user_id",
                }
            )

        if (socialError) {
            logger.error("Failed to upsert social_networks record", {
                userId,
                error: socialError.message,
            })
            return NextResponse.redirect(
                new URL("/dashboard?youtube=partial", request.url)
            )
        }

        logger.info("YouTube channel linked successfully", {
            userId,
            channelId: channelInfo.channelId,
            channelTitle: channelInfo.title,
        })

        return NextResponse.redirect(
            new URL("/dashboard?youtube=success", request.url)
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to complete YouTube channel linking", err)

        return NextResponse.redirect(
            new URL("/dashboard?youtube=error&reason=server_error", request.url)
        )
    }
}
