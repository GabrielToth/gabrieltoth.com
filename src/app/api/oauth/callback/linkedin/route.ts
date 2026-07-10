/**
 * LinkedIn OAuth Callback Endpoint
 * GET /api/oauth/callback/linkedin
 * Handles OAuth 2.0 callback and token exchange for LinkedIn
 */

import { createLogger } from "@/lib/logger"
import { getLinkedInConfig, getLinkedInOAuthService } from "@/lib/linkedin"
import { getTokenStore } from "@/lib/token-store"
import { getScopeVersion } from "@/lib/oauth/scope-versions"
import { verifyState } from "@/lib/oauth/state-signer"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LinkedInCallbackEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const oauthError = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (oauthError) {
            logger.warn("LinkedIn OAuth error from provider", {
                error: oauthError,
                errorDescription,
            })
            return NextResponse.redirect(
                new URL(
                    `/dashboard?linkedin=error&reason=${oauthError}`,
                    request.url
                )
            )
        }

        if (!code) {
            logger.warn("Missing authorization code in LinkedIn callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?linkedin=error&reason=missing_params",
                    request.url
                )
            )
        }

        if (!state) {
            logger.warn("Missing state parameter in LinkedIn callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?linkedin=error&reason=missing_params",
                    request.url
                )
            )
        }

        // Verify the HMAC-signed state
        const verification = verifyState(state)

        if (!verification.valid || !verification.payload) {
            logger.warn("Invalid or expired LinkedIn state parameter", {
                error: verification.error,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?linkedin=error&reason=invalid_state",
                    request.url
                )
            )
        }

        const userId = verification.payload.userId

        if (verification.payload.platform !== "linkedin") {
            logger.warn(
                "LinkedIn callback received state for different platform",
                { platform: verification.payload.platform }
            )
            return NextResponse.redirect(
                new URL(
                    "/dashboard?linkedin=error&reason=invalid_state",
                    request.url
                )
            )
        }

        logger.info("LinkedIn state parameter validated via HMAC", { userId })

        const config = getLinkedInConfig()
        const oauthService = getLinkedInOAuthService(config)
        await oauthService.initialize()

        // Exchange authorization code for token
        const tokenResponse = await oauthService.exchangeCodeForToken(code)

        logger.info("LinkedIn authorization code exchanged successfully", {
            userId,
            hasAccessToken: !!tokenResponse.accessToken,
            hasRefreshToken: !!tokenResponse.refreshToken,
        })

        // Get LinkedIn user info for display name and ID
        const linkedInUser = await oauthService.getUserInfo(
            tokenResponse.accessToken
        )

        if (!linkedInUser) {
            logger.warn("Failed to retrieve LinkedIn user info", { userId })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?linkedin=error&reason=user_info_failed",
                    request.url
                )
            )
        }

        logger.info("LinkedIn user retrieved", {
            userId,
            linkedInSub: linkedInUser.sub,
            name: linkedInUser.name,
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
            platform: "linkedin",
            userId,
        })

        logger.info("LinkedIn user token stored successfully", { userId })

        // Save to social_networks so channel appears in dashboard
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const displayName =
            linkedInUser.name || linkedInUser.email || "linkedin"

        const { error: socialError } = await supabase
            .from("social_networks")
            .upsert(
                {
                    user_id: userId,
                    platform: "linkedin",
                    platform_user_id: linkedInUser.sub,
                    platform_username: displayName,
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: {
                        linkedInSub: linkedInUser.sub,
                        name: linkedInUser.name,
                        givenName: linkedInUser.givenName,
                        familyName: linkedInUser.familyName,
                        email: linkedInUser.email,
                        picture: linkedInUser.picture,
                        locale: linkedInUser.locale,
                        scopeVersion: getScopeVersion("linkedin"),
                    },
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id, platform, platform_user_id",
                }
            )

        if (socialError) {
            logger.error("Failed to upsert LinkedIn social_networks record", {
                userId,
                error: socialError.message,
            })
        }

        logger.info("LinkedIn account linked successfully", {
            userId,
            linkedInSub: linkedInUser.sub,
        })

        return NextResponse.redirect(
            new URL("/dashboard?linkedin=success", request.url)
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to complete LinkedIn linking", {
            error: err.message,
            stack: err.stack?.slice(0, 500),
        })

        const errorMsg = encodeURIComponent(err.message.slice(0, 100))

        return NextResponse.redirect(
            new URL(`/dashboard?linkedin=error&reason=${errorMsg}`, request.url)
        )
    }
}
