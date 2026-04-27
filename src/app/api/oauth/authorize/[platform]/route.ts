/**
 * OAuth Authorization Endpoint
 * POST /api/oauth/authorize/:platform
 * Initiates OAuth flow for a specific platform
 * Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7
 */

import { createLogger } from "@/lib/logger"
import { getOAuthManager } from "@/lib/oauth"
import { rateLimitByKey } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("OAuthAuthorizeEndpoint")

/**
 * POST /api/oauth/authorize/:platform
 * Initiates OAuth authorization flow
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
            `oauth:authorize:${clientIp}`
        )

        if (!rateLimitResult.success) {
            logger.warn("Rate limit exceeded for OAuth authorization", {
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
            logger.warn("Unauthorized OAuth authorization attempt", {
                platform: params.platform,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Validate platform
        const oauthManager = getOAuthManager()
        const platform = params.platform.toLowerCase()

        if (!oauthManager.isPlatformConfigured(platform as any)) {
            logger.warn("Unsupported platform for OAuth", {
                platform,
                userId,
            })
            return NextResponse.json(
                { error: `Platform ${platform} is not supported` },
                { status: 400 }
            )
        }

        // Generate authorization URL
        const authResponse = await oauthManager.generateAuthorizationUrl(
            platform as any,
            userId
        )

        logger.info("OAuth authorization URL generated", {
            platform,
            userId,
        })

        return NextResponse.json(authResponse, { status: 200 })
    } catch (error) {
        logger.error("OAuth authorization failed", {
            platform: params.platform,
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to initiate OAuth authorization",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
