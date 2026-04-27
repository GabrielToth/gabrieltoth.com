/**
 * OAuth Callback Endpoint
 * GET /api/oauth/callback/:platform
 * Handles OAuth callback and token exchange
 * Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7
 */

import { createLogger } from "@/lib/logger"
import { getOAuthManager } from "@/lib/oauth"
import { getTokenStore } from "@/lib/token-store"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("OAuthCallbackEndpoint")

/**
 * GET /api/oauth/callback/:platform
 * Handles OAuth callback and exchanges code for token
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { platform: string } }
): Promise<NextResponse> {
    try {
        const searchParams = request.nextUrl.searchParams
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        const platform = params.platform.toLowerCase()

        // Handle OAuth errors
        if (error) {
            logger.warn("OAuth error from provider", {
                platform,
                error,
                errorDescription,
            })

            const redirectUrl = new URL("/dashboard", request.nextUrl.origin)
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
                platform,
                hasCode: !!code,
                hasState: !!state,
            })

            const redirectUrl = new URL("/dashboard", request.nextUrl.origin)
            redirectUrl.searchParams.set("oauth_error", "missing_parameters")
            return NextResponse.redirect(redirectUrl)
        }

        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized OAuth callback", { platform })

            const redirectUrl = new URL("/auth/login", request.nextUrl.origin)
            redirectUrl.searchParams.set("oauth_error", "unauthorized")
            return NextResponse.redirect(redirectUrl)
        }

        // Validate state parameter
        const oauthManager = getOAuthManager()
        const isStateValid = await oauthManager.validateState(
            platform as any,
            userId,
            state
        )

        if (!isStateValid) {
            logger.warn("Invalid state parameter", { platform, userId })

            const redirectUrl = new URL("/dashboard", request.nextUrl.origin)
            redirectUrl.searchParams.set("oauth_error", "invalid_state")
            return NextResponse.redirect(redirectUrl)
        }

        // Exchange code for token
        const tokenResponse = await oauthManager.exchangeCodeForToken(
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

        // Redirect to dashboard with success
        const redirectUrl = new URL("/dashboard", request.nextUrl.origin)
        redirectUrl.searchParams.set("oauth_success", platform)
        return NextResponse.redirect(redirectUrl)
    } catch (error) {
        logger.error("OAuth callback failed", {
            platform: params.platform,
            error: error instanceof Error ? error.message : String(error),
        })

        const redirectUrl = new URL("/dashboard", request.nextUrl.origin)
        redirectUrl.searchParams.set("oauth_error", "callback_failed")
        return NextResponse.redirect(redirectUrl)
    }
}
