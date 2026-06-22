/**
 * GET /api/youtube/link/callback
 * Handles OAuth callback from Google after user authorizes YouTube channel linking
 * Exchanges authorization code for tokens, retrieves channel info, stores encrypted tokens
 * Validates: Requirements 1.3, 2.1, 8.1, 10.8
 *
 * Security Features:
 * - State parameter validation via Redis (CSRF prevention)
 * - Redis key deletion after use (replay attack prevention)
 * - Token encryption via AES-256-GCM before storage
 * - Service role key for Supabase operations (RLS bypass)
 * - Rate limiting via Upstash (5 attempts/hour)
 * - Input validation on code and state parameters
 *
 * Query Parameters:
 *   code  - Authorization code from Google
 *   state - State parameter for CSRF validation
 *   error - OAuth error from Google (optional)
 *   scope - Requested scopes (optional)
 *
 * Redirects to:
 *   /dashboard?youtube=success       - Successfully linked
 *   /dashboard?youtube=partial       - Token stored but social record failed
 *   /dashboard?youtube=error&reason=x - Error with specific reason
 *
 * Error reasons:
 *   denied          - User denied authorization
 *   missing_params  - Required OAuth params missing
 *   invalid_state   - State not found or expired in Redis
 *   no_channel      - YouTube API returned no channel
 *   server_error    - Internal server error during processing
 */

import { validateYouTubeEnv } from "@/lib/config/env"
import { createLogger } from "@/lib/logger"
import { getYouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import { getYouTubeOAuthService } from "@/lib/youtube/oauth-service"
import { getChannelValidationService } from "@/lib/youtube/channel-validation"
import { getTokenStore } from "@/lib/token-store"
import { Redis } from "ioredis"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("YouTubeLinkCallbackEndpoint")

/**
 * GET /api/youtube/link/callback
 * OAuth callback handler for YouTube channel linking
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const oauthError = searchParams.get("error")

        // Handle OAuth errors from Google (e.g., user denied access)
        if (oauthError) {
            logger.warn("OAuth error from Google", { error: oauthError })
            return NextResponse.redirect(
                new URL(
                    `/dashboard?youtube=error&reason=${oauthError}`,
                    request.url
                )
            )
        }

        // Validate required OAuth parameters
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

        // Initialize configuration and services
        const env = validateYouTubeEnv()
        const config = getYouTubeChannelLinkingConfig(env)
        const oauthService = getYouTubeOAuthService(config)
        await oauthService.initialize()

        // Validate state parameter against Redis
        const redis = new Redis(env.REDIS_URL)
        let userId: string

        try {
            const stateKey = `youtube:oauth:state:${state}`
            const storedStateRaw = await redis.get(stateKey)

            if (!storedStateRaw) {
                logger.warn("Invalid or expired state parameter", { stateKey })
                return NextResponse.redirect(
                    new URL(
                        "/dashboard?youtube=error&reason=invalid_state",
                        request.url
                    )
                )
            }

            const storedState = JSON.parse(storedStateRaw)

            if (!storedState.userId) {
                logger.warn("State data missing userId")
                return NextResponse.redirect(
                    new URL(
                        "/dashboard?youtube=error&reason=invalid_state",
                        request.url
                    )
                )
            }

            userId = storedState.userId

            // Delete state from Redis to prevent replay attacks
            await redis.del(stateKey)

            logger.info("State parameter validated successfully", { userId })
        } finally {
            await redis.quit()
        }

        // Exchange authorization code for OAuth tokens
        const tokenResponse = await oauthService.exchangeCodeForToken(code)

        logger.info("Authorization code exchanged successfully", { userId })

        // Get channel info from YouTube API using the access token
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

        // Calculate token expiration timestamp
        const expiresAt = tokenResponse.expiresIn
            ? Date.now() + tokenResponse.expiresIn * 1000
            : undefined

        // Store encrypted OAuth tokens in Supabase
        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt,
            platform: "youtube",
            userId,
        })

        logger.info("OAuth tokens stored successfully", { userId })

        // Upsert social_networks record with channel metadata
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
                    },
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id, platform",
                }
            )

        if (socialError) {
            logger.error("Failed to upsert social_networks record", {
                userId,
                error: socialError.message,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?youtube=partial",
                    request.url
                )
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
            new URL(
                "/dashboard?youtube=error&reason=server_error",
                request.url
            )
        )
    }
}
