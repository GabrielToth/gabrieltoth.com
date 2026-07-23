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

interface YouTubeChannelInfo {
    channelId: string
    title: string
    description: string
    customUrl?: string
    subscriberCount?: number
    profileImageUrl?: string
}

async function fetchYouTubeChannelInfo(
    accessToken: string
): Promise<YouTubeChannelInfo | null> {
    try {
        const url = new URL("https://www.googleapis.com/youtube/v3/channels")
        url.searchParams.set("part", "snippet,statistics")
        url.searchParams.set("mine", "true")

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
            },
            signal: AbortSignal.timeout(10000),
        })

        if (!response.ok) {
            logger.warn("YouTube API request failed", {
                status: response.status,
            })
            return null
        }

        const data = await response.json()
        if (!data.items || data.items.length === 0) {
            logger.warn("No YouTube channel found for the authenticated user")
            return null
        }

        const channel = data.items[0]
        return {
            channelId: channel.id,
            title: channel.snippet?.title || "",
            description: channel.snippet?.description || "",
            customUrl: channel.snippet?.customUrl,
            subscriberCount: parseInt(
                channel.statistics?.subscriberCount || "0"
            ),
            profileImageUrl: channel.snippet?.thumbnails?.default?.url,
        }
    } catch (error) {
        logger.warn("Failed to fetch YouTube channel info", {
            error: error instanceof Error ? error.message : String(error),
        })
        return null
    }
}

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
                    const payloadJson = Buffer.from(
                        parts[0],
                        "base64url"
                    ).toString("utf-8")
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
            const redirectUrl = new URL(
                `/${fallbackLocale}/dashboard/channels`,
                request.nextUrl.origin
            )
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

            const redirectUrl = new URL(
                `/en/dashboard/channels`,
                request.nextUrl.origin
            )
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
            const redirectUrl = new URL(
                `/${locale}/dashboard/channels`,
                request.nextUrl.origin
            )
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
                // Clean up any stale rows with empty platform_user_id
                // (created by a previous buggy version of this callback)
                await supabase
                    .from("social_networks")
                    .delete()
                    .eq("user_id", userId)
                    .eq("platform", "youtube")
                    .eq("platform_user_id", "")

                // Fetch real channel info from YouTube API
                const channelInfo = await fetchYouTubeChannelInfo(
                    tokenResponse.accessToken
                )

                if (channelInfo) {
                    await supabase.from("social_networks").upsert(
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
                } else {
                    // Fallback: save minimal record when YouTube API is unavailable
                    await supabase.from("social_networks").upsert(
                        {
                            user_id: userId,
                            platform: "youtube",
                            platform_user_id: "",
                            platform_username: "youtube",
                            status: "connected",
                            linked_at: new Date().toISOString(),
                            metadata: {
                                scopeVersion: getScopeVersion("youtube"),
                            },
                            updated_at: new Date().toISOString(),
                        },
                        {
                            onConflict: "user_id, platform, platform_user_id",
                        }
                    )
                }
            } else {
                await supabase.from("social_networks").upsert(
                    {
                        user_id: userId,
                        platform: normalizedPlatform,
                        platform_user_id: "",
                        platform_username: normalizedPlatform,
                        status: "connected",
                        linked_at: new Date().toISOString(),
                        metadata: {
                            scopeVersion: getScopeVersion(normalizedPlatform),
                        },
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: "user_id, platform, platform_user_id",
                    }
                )
            }
        } catch (socialError) {
            logger.warn(
                "Failed to save social_networks record, token already stored",
                {
                    platform: normalizedPlatform,
                    userId,
                    error:
                        socialError instanceof Error
                            ? socialError.message
                            : String(socialError),
                }
            )
        }

        const user = await getUserById(userId)
        void notifyUserAuditDiscord("platform_linked", {
            email: user?.google_email,
            userId,
            platform: normalizedPlatform,
            environment: getAuditEnvironment(),
        })

        // Redirect back to original page (or fall back to channels page)
        const locale = stateResult.locale || "en"
        const redirectPath =
            stateResult.redirectTo || `/${locale}/dashboard/channels`
        const redirectUrl = new URL(redirectPath, request.nextUrl.origin)
        redirectUrl.searchParams.set("oauth_success", normalizedPlatform)
        return NextResponse.redirect(redirectUrl)
    } catch (error) {
        logger.error("OAuth callback failed", {
            platform: normalizedPlatform,
            error: error instanceof Error ? error.message : String(error),
        })

        const redirectUrl = new URL(
            "/en/dashboard/channels",
            request.nextUrl.origin
        )
        redirectUrl.searchParams.set("oauth_error", "callback_failed")
        return NextResponse.redirect(redirectUrl)
    }
}
