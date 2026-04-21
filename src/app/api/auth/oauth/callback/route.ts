/**
 * GET/POST /api/auth/oauth/callback
 * OAuth callback endpoint for Google, Facebook, and TikTok
 *
 * Validates: Requirements 2.1, 2.2, 11.1
 */

import { logAuditEvent } from "@/lib/auth/audit-logging"
import {
    OAuthValidationError,
    validateOAuthToken,
} from "@/lib/auth/oauth-validator"
import { createSession } from "@/lib/auth/session"
import { generateTempToken } from "@/lib/auth/temp-token"
import { getUserByOAuthId } from "@/lib/auth/user"
import { logger } from "@/lib/logger"
import {
    getClientIp,
    getSecurityHeaders,
} from "@/lib/middleware/security-headers"
import { NextRequest, NextResponse } from "next/server"

interface OAuthCallbackResponse {
    success: boolean
    requiresPassword?: boolean
    requiresEmail?: boolean
    tempToken?: string
    userId?: string
    email?: string
    redirectUrl?: string
    error?: string
    errorCode?: string
}

/**
 * Exchange authorization code for OAuth token
 * This is a placeholder - actual implementation depends on provider
 */
async function exchangeCodeForToken(
    code: string,
    provider: "google" | "facebook" | "tiktok",
    redirectUri: string
): Promise<string> {
    try {
        // Get provider credentials from environment
        const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`]
        const clientSecret =
            process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]

        if (!clientId || !clientSecret) {
            throw new Error(
                `${provider} OAuth credentials not configured. Please set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET environment variables.`
            )
        }

        // Provider-specific token endpoints
        const tokenEndpoints: Record<string, string> = {
            google: "https://oauth2.googleapis.com/token",
            facebook: "https://graph.facebook.com/v12.0/oauth/access_token",
            tiktok: "https://open-api.tiktok.com/oauth/access_token/",
        }

        const tokenEndpoint = tokenEndpoints[provider]

        // Exchange code for token
        const response = await fetch(tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(
                `Token exchange failed: ${response.status} ${errorText}`
            )
        }

        const data = (await response.json()) as {
            id_token?: string
            access_token?: string
        }

        // Google returns id_token, Facebook/TikTok return access_token
        const token = data.id_token || data.access_token

        if (!token) {
            throw new Error("No token received from OAuth provider")
        }

        return token
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(
                `Failed to exchange authorization code: ${error.message}`
            )
        }
        throw new Error("Failed to exchange authorization code: Unknown error")
    }
}

/**
 * Process OAuth callback
 * Handles OAuth provider callbacks and determines next steps
 */
async function handleOAuthCallback(
    code: string,
    provider: "google" | "facebook" | "tiktok",
    clientIp: string
): Promise<NextResponse<OAuthCallbackResponse>> {
    try {
        // Get redirect URI from environment
        const redirectUri =
            process.env[`NEXT_PUBLIC_${provider.toUpperCase()}_REDIRECT_URI`]
        if (!redirectUri) {
            logger.error(`${provider} redirect URI not configured`, {
                context: "Auth",
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Server configuration error",
                    errorCode: "CONFIG_ERROR",
                },
                { status: 500, headers: getSecurityHeaders() }
            )
        }

        // Exchange authorization code for OAuth token
        let token: string
        try {
            token = await exchangeCodeForToken(code, provider, redirectUri)
        } catch (error) {
            logger.warn("Failed to exchange authorization code", {
                context: "Auth",
                error: error as Error,
                data: { ip: clientIp, provider },
            })

            // Log failed login attempt
            await logAuditEvent("LOGIN_FAILED", undefined, clientIp, {
                reason: "Failed to exchange authorization code",
                provider,
            })

            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to authenticate with ${provider}`,
                    errorCode: "TOKEN_EXCHANGE_FAILED",
                },
                { status: 401, headers: getSecurityHeaders() }
            )
        }

        // Validate OAuth token
        let tokenPayload
        try {
            tokenPayload = await validateOAuthToken(token, provider)
        } catch (error) {
            logger.warn("OAuth token validation failed", {
                context: "Auth",
                error: error as Error,
                data: { ip: clientIp, provider },
            })

            // Log failed login attempt
            const errorCode =
                error instanceof OAuthValidationError ||
                (error as any).code !== undefined
                    ? (error as OAuthValidationError).code
                    : "VALIDATION_FAILED"
            await logAuditEvent("LOGIN_FAILED", undefined, clientIp, {
                reason: "Invalid or expired OAuth token",
                provider,
                errorCode,
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid or expired OAuth token",
                    errorCode,
                },
                { status: 401, headers: getSecurityHeaders() }
            )
        }

        // Extract user information from token
        const oauthId = tokenPayload.sub
        const email = tokenPayload.email
        const name = tokenPayload.name || ""
        const picture = tokenPayload.picture

        // Check if user exists by OAuth ID
        let user
        try {
            user = await getUserByOAuthId(provider, oauthId)
        } catch (error) {
            logger.error("Failed to query user by OAuth ID", {
                context: "Auth",
                error: error as Error,
                data: { provider, oauthId },
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Database error",
                    errorCode: "DB_ERROR",
                },
                { status: 500, headers: getSecurityHeaders() }
            )
        }

        // NEW USER: Generate temporary token and return requiresPassword
        if (!user) {
            logger.debug("New OAuth user, requires password creation", {
                context: "Auth",
                data: { provider, email },
            })

            // Generate temporary token with OAuth user data
            const tempToken = generateTempToken({
                email: email || "",
                oauth_provider: provider,
                oauth_id: oauthId,
                name,
                picture,
            })

            // Log authentication attempt
            await logAuditEvent("LOGIN_FAILED", email, clientIp, {
                reason: "New user requires password",
                provider,
            })

            return NextResponse.json(
                {
                    success: true,
                    requiresPassword: true,
                    tempToken,
                    email,
                },
                { status: 200, headers: getSecurityHeaders() }
            )
        }

        // EXISTING USER WITH PASSWORD: Create session and return redirect URL
        if (user.password_hash) {
            logger.debug(
                "Existing OAuth user with password, creating session",
                {
                    context: "Auth",
                    data: { userId: user.id, provider },
                }
            )

            // Create session
            let session
            try {
                session = await createSession(user.id)
            } catch (error) {
                logger.error("Failed to create session", {
                    context: "Auth",
                    error: error as Error,
                    data: { userId: user.id },
                })

                await logAuditEvent(
                    "LOGIN_FAILED",
                    user.email,
                    clientIp,
                    { reason: "Failed to create session", provider },
                    user.id
                )

                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to create session",
                        errorCode: "SESSION_ERROR",
                    },
                    { status: 500, headers: getSecurityHeaders() }
                )
            }

            // Log successful login
            await logAuditEvent(
                "LOGIN_SUCCESS",
                user.email,
                clientIp,
                { action: `User logged in via ${provider} OAuth`, provider },
                user.id
            )

            logger.info(`User logged in successfully via ${provider} OAuth`, {
                context: "Auth",
                data: { userId: user.id, email: user.email },
            })

            // Create response with session cookie
            const response = NextResponse.json(
                {
                    success: true,
                    redirectUrl: "/dashboard",
                },
                { status: 200, headers: getSecurityHeaders() }
            )

            // Set HTTP-Only session cookie
            response.cookies.set("session", session.session_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
                path: "/",
            })

            return response
        }

        // EXISTING USER WITHOUT PASSWORD (MIGRATION): Return requiresPassword with userId
        logger.debug(
            "Existing OAuth user without password, requires migration",
            {
                context: "Auth",
                data: { userId: user.id, provider },
            }
        )

        await logAuditEvent("LOGIN_FAILED", user.email, clientIp, {
            reason: "Existing user requires password (migration)",
            provider,
        })

        return NextResponse.json(
            {
                success: true,
                requiresPassword: true,
                userId: user.id,
                email: user.email,
            },
            { status: 200, headers: getSecurityHeaders() }
        )
    } catch (err) {
        logger.error("OAuth callback processing error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp, provider },
        })

        return NextResponse.json(
            {
                success: false,
                error: "An error occurred. Please try again later",
                errorerrorCode: "INTERNAL_ERROR",
            },
            { status: 500, headers: getSecurityHeaders() }
        )
    }
}

/**
 * GET handler for OAuth callback
 * OAuth providers redirect here with authorization code in query parameters
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<OAuthCallbackResponse>> {
    const clientIp = getClientIp(request)

    try {
        // Get authorization code and provider from query parameters
        const code = request.nextUrl.searchParams.get("code")
        const provider = request.nextUrl.searchParams.get("provider") as
            | "google"
            | "facebook"
            | "tiktok"
            | null

        // Validate authorization code
        if (!code) {
            logger.warn("OAuth callback without authorization code", {
                context: "Auth",
                data: { ip: clientIp },
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Authorization code is required",
                    errorCode: "MISSING_CODE",
                },
                { status: 400, headers: getSecurityHeaders() }
            )
        }

        // Validate provider
        if (!provider || !["google", "facebook", "tiktok"].includes(provider)) {
            logger.warn("OAuth callback with invalid provider", {
                context: "Auth",
                data: { ip: clientIp, provider },
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid OAuth provider",
                    errorCode: "INVALID_PROVIDER",
                },
                { status: 400, headers: getSecurityHeaders() }
            )
        }

        return handleOAuthCallback(code, provider, clientIp)
    } catch (err) {
        logger.error("OAuth callback GET error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp },
        })

        return NextResponse.json(
            {
                success: false,
                error: "An error occurred. Please try again later",
                errorCode: "INTERNAL_ERROR",
            },
            { status: 500, headers: getSecurityHeaders() }
        )
    }
}

/**
 * POST handler for OAuth callback
 * Frontend can also POST the authorization code
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<OAuthCallbackResponse>> {
    const clientIp = getClientIp(request)

    try {
        // Parse request body
        const body = (await request.json().catch(() => ({}))) as {
            code?: string
            provider?: string
        }

        // Validate authorization code
        if (!body.code) {
            logger.warn("OAuth callback POST without authorization code", {
                context: "Auth",
                data: { ip: clientIp },
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Authorization code is required",
                    errorCode: "MISSING_CODE",
                },
                { status: 400, headers: getSecurityHeaders() }
            )
        }

        // Validate provider
        if (
            !body.provider ||
            !["google", "facebook", "tiktok"].includes(body.provider)
        ) {
            logger.warn("OAuth callback POST with invalid provider", {
                context: "Auth",
                data: { ip: clientIp, provider: body.provider },
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid OAuth provider",
                    errorCode: "INVALID_PROVIDER",
                },
                { status: 400, headers: getSecurityHeaders() }
            )
        }

        return handleOAuthCallback(
            body.code,
            body.provider as "google" | "facebook" | "tiktok",
            clientIp
        )
    } catch (err) {
        logger.error("OAuth callback POST error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp },
        })

        return NextResponse.json(
            {
                success: false,
                error: "An error occurred. Please try again later",
                errorCode: "INTERNAL_ERROR",
            },
            { status: 500, headers: getSecurityHeaders() }
        )
    }
}
