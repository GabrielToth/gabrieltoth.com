/**
 * OAuth Authorization Endpoint
 * POST /api/oauth/authorize/:platform
 * Initiates OAuth flow for a specific platform
 * Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7
 */

import { getServerSession } from "@/lib/auth/get-server-session"
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
    context: { params: Promise<{ platform: string }> }
): Promise<NextResponse> {
    const { platform } = await context.params

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
                platform: platform,
                clientIp,
            })
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            )
        }

        // Get user ID from session
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            logger.warn("Unauthorized OAuth authorization attempt", {
                platform: platform,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        const userId = session.user.id

        // Extract locale from request body or query params
        let locale: string | undefined
        try {
            const body = await request.clone().json()
            locale = body.locale
        } catch {
            // Not JSON body, try query params
            locale = request.nextUrl.searchParams.get("locale") || undefined
        }

        // Validate platform
        const oauthManager = getOAuthManager()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // Generate authorization URL with locale for redirect back
        const authResponse = await oauthManager.generateAuthorizationUrl(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            platform as any,
            userId,
            locale
        )

        logger.info("OAuth authorization URL generated", {
            platform,
            userId,
        })

        return NextResponse.json(authResponse, { status: 200 })
    } catch (error) {
        logger.error("OAuth authorization failed", {
            platform: platform,
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
