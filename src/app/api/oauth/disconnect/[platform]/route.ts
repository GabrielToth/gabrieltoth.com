/**
 * OAuth Disconnect Endpoint
 * POST /api/oauth/disconnect/:platform
 * Disconnects a social media account and revokes access
 * Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7
 */

import { createLogger } from "@/lib/logger"
import { getOAuthManager } from "@/lib/oauth"
import { rateLimitByKey } from "@/lib/rate-limit"
import { getTokenStore } from "@/lib/token-store"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("OAuthDisconnectEndpoint")

/**
 * POST /api/oauth/disconnect/:platform
 * Disconnects a social media account
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { platform: string } }
): Promise<NextResponse> {
    try {
        // Rate limiting
        const clientIp =
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown"

        const rateLimitResult = await rateLimitByKey(
            `oauth:disconnect:${clientIp}`
        )

        if (!rateLimitResult.success) {
            logger.warn("Rate limit exceeded for OAuth disconnect", {
                platform: params.platform,
                clientIp,
            })
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            )
        }

        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized OAuth disconnect attempt", {
                platform: params.platform,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const platform = params.platform.toLowerCase()

        // Get the token to revoke
        const tokenStore = getTokenStore()
        const token = await tokenStore.getToken(userId, platform)

        if (!token) {
            logger.warn("Token not found for disconnect", {
                platform,
                userId,
            })
            return NextResponse.json(
                { error: "No token found for this platform" },
                { status: 404 }
            )
        }

        // Revoke the token with the OAuth provider
        const oauthManager = getOAuthManager()
        const revoked = await oauthManager.revokeToken(
            platform as any,
            token.accessToken,
            userId
        )

        if (!revoked) {
            logger.warn("Failed to revoke token with provider", {
                platform,
                userId,
            })
            // Continue with local deletion even if revocation fails
        }

        // Delete the token from local storage
        await tokenStore.deleteToken(userId, platform)

        logger.info("OAuth token disconnected successfully", {
            platform,
            userId,
        })

        return NextResponse.json(
            {
                success: true,
                message: `Successfully disconnected from ${platform}`,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("OAuth disconnect failed", {
            platform: params.platform,
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to disconnect OAuth account",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
