/**
 * OAuth Callback Endpoint
 * GET /api/oauth/callback/:platform
 * Handles OAuth callback and token exchange
 * Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7
 */

import {
    getAuditEnvironment,
    notifyUserAuditDiscord,
} from "@/lib/audit/discord-user-audit"
import { getServerSession } from "@/lib/auth/get-server-session"
import { getUserById } from "@/lib/auth/user"
import { createLogger } from "@/lib/logger"
import { getOAuthManager } from "@/lib/oauth"
import { getScopeVersion } from "@/lib/oauth/scope-versions"
import { getTokenStore } from "@/lib/token-store"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("OAuthCallbackEndpoint")

/**
 * GET /api/oauth/callback/:platform
 * Handles OAuth callback and exchanges code for token
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ platform: string }> }
): Promise<NextResponse> {
    const { platform } = await context.params
    const normalizedPlatform = platform.toLowerCase()

    try {
        const searchParams = request.nextUrl.searchParams
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        // Helper to extract locale from state (may not be validated yet)
        const localeFromState = (s: string): string => {
            try {
                const parts = s.split(".")
                if (parts.length === 2) {
                    const payloadJson = Buffer.from(parts[0], "base64url").toString("utf-8")
                    const payload = JSON.parse(payloadJson)
                    return payload.locale || "en"
                }
            } catch {}
            return "en"
        }

        // Handle OAuth errors
        if (error) {
            logger.warn("OAuth error from provider", {
                platform: normalizedPlatform,
                error,
                errorDescription,
            })

            const fallbackLocale = state ? localeFromState(state) : "en"
            const redirectUrl = new URL(`/${fallbackLocale}/dashboard/channels`, request.nextUrl.origin)
            redirectUrl.searchParams.set("oauth_error", error)
            redirectUrl.searchParams.set(
                "oauth_error_description",
                errorDescription || "Unknown error"
            )
            return NextResponse.redirect(redirectUrl)
        }

        // Validate required parameters
        if (!code || !state) {
            logger.warn("Missing OAuth parameters", {
                platform: normalizedPlatform,
                hasCode: !!code,
                hasState: !!state,
            })

            const redirectUrl = new URL(`/en/dashboard/channels`, request.nextUrl.origin)
            redirectUrl.searchParams.set("oauth_error", "missing_parameters")
            return NextResponse.redirect(redirectUrl)
        }

        // Get user ID from session
        const session = await getServerSession(request)
        const userId = session?.user?.id
        if (!userId) {
            logger.warn("Unauthorized OAuth callback", {
                platform: normalizedPlatform,
            })

            const redirectUrl = new URL("/auth/login", request.nextUrl.origin)
            redirectUrl.searchParams.set("oauth_error", "unauthorized")
            return NextResponse.redirect(redirectUrl)
        }

        // Validate state parameter (HMAC-signed, no Redis needed)
        const oauthManager = getOAuthManager()
        const stateResult = await oauthManager.validateState(
            normalizedPlatform,
            userId,
            state
        )

        if (!stateResult.valid) {
            logger.warn("Invalid state parameter", {
                platform: normalizedPlatform,
                userId,
            })

            const locale = stateResult.locale || "en"
            const redirectUrl = new URL(`/${locale}/dashboard/channels`, request.nextUrl.origin)
            redirectUrl.searchParams.set("oauth_error", "invalid_state")
            return NextResponse.redirect(redirectUrl)
        }

        // Exchange code for token
        const tokenResponse = await oauthManager.exchangeCodeForToken(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            platform as any,
            code,
            userId
        )

        // Store token securely
        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt: tokenResponse.linkedAt + tokenResponse.expiresIn * 1000,
            platform,
            userId,
        })

        logger.info("OAuth token stored successfully", {
            platform,
            userId,
        })

        // Save to social_networks so channel appears in the dashboard list
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || "",
                process.env.SUPABASE_SERVICE_ROLE_KEY || ""
            )

            if (normalizedPlatform === "youtube") {
                // Fetch YouTube channel info using the access token
                const channelResponse = await fetch(
                    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
                    { headers: { Authorization: `Bearer ${tokenResponse.accessToken}` } }
                )
                if (channelResponse.ok) {
                    const channelData = await channelResponse.json()
                    const channel = channelData?.items?.[0]?.snippet
                    if (channel) {
                        await supabase.from("social_networks").upsert(
                            {
                                user_id: userId,
                                platform: "youtube",
                                platform_user_id: channelData.items[0].id,
                                platform_username: channel.title,
                                status: "connected",
                                linked_at: new Date().toISOString(),
                                metadata: {
                                    channelId: channelData.items[0].id,
                                    channelTitle: channel.title,
                                    channelDescription: channel.description,
                                    customUrl: channel.customUrl,
                                    profileImageUrl: channel.thumbnails?.default?.url,
                                    scopeVersion: getScopeVersion("youtube"),
                                },
                                updated_at: new Date().toISOString(),
                            },
                            { onConflict: "user_id, platform" }
                        )
                    }
                }
            } else {
                // Other platforms: save minimal record
                await supabase.from("social_networks").upsert(
                    {
                        user_id: userId,
                        platform: normalizedPlatform,
                        platform_user_id: "",
                        platform_username: normalizedPlatform,
                        status: "connected",
                        linked_at: new Date().toISOString(),
                        metadata: { scopeVersion: getScopeVersion(normalizedPlatform) },
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id, platform" }
                )
            }
        } catch (socialError) {
            logger.warn("Failed to save social_networks record, token already stored", {
                platform: normalizedPlatform,
                userId,
                error: socialError instanceof Error ? socialError.message : String(socialError),
            })
        }

        const user = await getUserById(userId)
        void notifyUserAuditDiscord("platform_linked", {
            email: user?.google_email,
            userId,
            platform: normalizedPlatform,
            environment: getAuditEnvironment(),
        })

        // Redirect back to channels page with correct locale
        const locale = stateResult.locale || "en"
        const redirectUrl = new URL(`/${locale}/dashboard/channels`, request.nextUrl.origin)
        redirectUrl.searchParams.set("oauth_success", normalizedPlatform)
        return NextResponse.redirect(redirectUrl)
    } catch (error) {
        logger.error("OAuth callback failed", {
            platform: normalizedPlatform,
            error: error instanceof Error ? error.message : String(error),
        })

        const redirectUrl = new URL("/en/dashboard/channels", request.nextUrl.origin)
        redirectUrl.searchParams.set("oauth_error", "callback_failed")
        return NextResponse.redirect(redirectUrl)
    }
}
