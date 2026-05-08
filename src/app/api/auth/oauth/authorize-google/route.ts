/**
 * Google OAuth Authorization Endpoint (Unauthenticated)
 * POST /api/auth/oauth/authorize-google
 * Initiates Google OAuth flow for unauthenticated users
 *
 * Validates: Requirements 5.0, 5.1
 */

import { getGoogleOAuthAuthorizationUrl } from "@/lib/config/google-oauth"
import { createLogger } from "@/lib/logger"
import { rateLimitByKey } from "@/lib/rate-limit"
import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("GoogleOAuthAuthorizeEndpoint")

interface AuthorizeGoogleResponse {
    success: boolean
    authorizationUrl?: string
    error?: string
}

/**
 * Generate cryptographically secure state parameter
 */
function generateState(): string {
    return crypto.randomBytes(32).toString("hex")
}

/**
 * POST /api/auth/oauth/authorize-google
 * Initiates Google OAuth authorization flow for unauthenticated users
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<AuthorizeGoogleResponse>> {
    try {
        // Rate limiting
        const clientIp =
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown"

        const rateLimitResult = await rateLimitByKey(
            `oauth:authorize-google:${clientIp}`
        )

        if (!rateLimitResult.success) {
            logger.warn("Rate limit exceeded for Google OAuth authorization", {
                clientIp,
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "Too many requests. Please try again later.",
                },
                { status: 429 }
            )
        }

        // Generate state parameter for CSRF protection
        const state = generateState()

        // Generate authorization URL
        const authorizationUrl = getGoogleOAuthAuthorizationUrl(state)

        logger.info("Google OAuth authorization URL generated", {
            clientIp,
        })

        return NextResponse.json(
            {
                success: true,
                authorizationUrl,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Google OAuth authorization failed", {
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                success: false,
                error: "Failed to initiate Google OAuth authorization",
            },
            { status: 500 }
        )
    }
}
