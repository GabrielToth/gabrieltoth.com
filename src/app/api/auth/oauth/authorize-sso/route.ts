/**
 * SSO Authorization Endpoint (Unauthenticated)
 * POST /api/auth/oauth/authorize-sso
 * Initiates SSO (Single Sign-On) flow for unauthenticated users
 *
 * Validates: Requirements 5.0, 5.2
 */

import { createLogger } from "@/lib/logger"
import { rateLimitByKey } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("SSOAuthorizeEndpoint")

interface AuthorizeSSOResponse {
    success: boolean
    message?: string
    error?: string
}

/**
 * POST /api/auth/oauth/authorize-sso
 * Initiates SSO authorization flow for unauthenticated users
 *
 * Note: SSO flow requires email domain configuration in Supabase.
 * This endpoint returns a message indicating that SSO is not yet fully configured.
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<AuthorizeSSOResponse>> {
    try {
        // Rate limiting
        const clientIp =
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown"

        const rateLimitResult = await rateLimitByKey(
            `oauth:authorize-sso:${clientIp}`
        )

        if (!rateLimitResult.success) {
            logger.warn("Rate limit exceeded for SSO authorization", {
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

        logger.info("SSO authorization requested", {
            clientIp,
        })

        // SSO flow is not yet fully implemented
        // This is a placeholder for future implementation
        return NextResponse.json(
            {
                success: false,
                error: "SSO authentication is not yet available. Please use Google or Email authentication.",
            },
            { status: 501 }
        )
    } catch (error) {
        logger.error("SSO authorization failed", {
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                success: false,
                error: "Failed to initiate SSO authorization",
            },
            { status: 500 }
        )
    }
}
