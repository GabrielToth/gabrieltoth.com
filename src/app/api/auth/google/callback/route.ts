/**
 * GET/POST /api/auth/google/callback
 * Google OAuth callback endpoint
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5,
 *            4.1, 4.2, 4.3, 4.4, 11.1, 11.2, 11.3, 13.1, 13.2, 13.3, 13.4, 14.2, 14.3, 14.4
 */

import { logAuditEvent } from "@/lib/auth/audit-logging"
import {
    exchangeCodeForToken,
    validateGoogleToken,
} from "@/lib/auth/google-auth"
import { createSession } from "@/lib/auth/session"
import { upsertUser } from "@/lib/auth/user"
import { logger } from "@/lib/logger"
import {
    getClientIp,
    getSecurityHeaders,
} from "@/lib/middleware/security-headers"
import { NextRequest, NextResponse } from "next/server"

interface GoogleCallbackResponse {
    success: boolean
    message?: string
    error?: string
    redirectUrl?: string
}

/**
 * Process Google OAuth callback
 * Handles both GET (from Google redirect) and POST (from frontend)
 */
async function handleGoogleCallback(
    code: string,
    clientIp: string
): Promise<NextResponse<GoogleCallbackResponse>> {
    try {
        // Get redirect URI from environment
        // Note: Using NEXT_PUBLIC_ variable here because the redirect URI
        // must match exactly what was sent from the client-side button.
        // This is not a security issue - the redirect URI is public information
        // that Google validates against the OAuth app configuration.
        const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
        if (!redirectUri) {
            logger.error("Google redirect URI not configured", {
                context: "Auth",
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Server configuration error",
                },
                { status: 500, headers: getSecurityHeaders() }
            )
        }

        // Exchange authorization code for Google ID token
        let idToken: string
        try {
            idToken = await exchangeCodeForToken(code, redirectUri)
        } catch (error) {
            logger.warn("Failed to exchange authorization code", {
                context: "Auth",
                error: error as Error,
                data: { ip: clientIp },
            })

            // Log failed login attempt
            await logAuditEvent("LOGIN_FAILED", undefined, clientIp, {
                reason: "Failed to exchange authorization code",
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to authenticate with Google",
                },
                { status: 401, headers: getSecurityHeaders() }
            )
        }

        // Validate Google token
        let googleTokenPayload
        try {
            googleTokenPayload = await validateGoogleToken(idToken)
        } catch (error) {
            logger.warn("Google token validation failed", {
                context: "Auth",
                error: error as Error,
                data: { ip: clientIp },
            })

            // Log failed login attempt
            await logAuditEvent("LOGIN_FAILED", undefined, clientIp, {
                reason: "Invalid or expired Google token",
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid or expired Google token",
                },
                { status: 401, headers: getSecurityHeaders() }
            )
        }

        // Extract user information from token
        const googleUserData = {
            google_id: googleTokenPayload.sub,
            google_email: googleTokenPayload.email,
            google_name: googleTokenPayload.name,
            google_picture: googleTokenPayload.picture,
        }

        // Create or update user
        let user
        try {
            user = await upsertUser(googleUserData)
        } catch (error) {
            logger.error("Failed to create or update user", {
                context: "Auth",
                error: error as Error,
                data: { google_id: googleUserData.google_id },
            })

            // Log failed login attempt
            await logAuditEvent(
                "LOGIN_FAILED",
                googleUserData.google_email,
                clientIp,
                { reason: "Failed to create or update user" }
            )

            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to authenticate",
                },
                { status: 500, headers: getSecurityHeaders() }
            )
        }

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

            // Log failed login attempt
            await logAuditEvent(
                "LOGIN_FAILED",
                user.google_email,
                clientIp,
                { reason: "Failed to create session" },
                user.id
            )

            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to create session",
                },
                { status: 500, headers: getSecurityHeaders() }
            )
        }

        // Log successful login
        try {
            await logAuditEvent(
                "LOGIN_SUCCESS",
                user.google_email,
                clientIp,
                { action: "User logged in via Google OAuth" },
                user.id
            )
        } catch (error) {
            logger.error("Failed to log login event", {
                context: "Auth",
                error: error as Error,
                data: { userId: user.id },
            })
            // Don't fail the login if audit logging fails
        }

        logger.info("User logged in successfully via Google OAuth", {
            context: "Auth",
            data: { userId: user.id, email: user.google_email },
        })

        // Create response with session cookie
        const response = NextResponse.json(
            {
                success: true,
                message: "Login successful",
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
    } catch (err) {
        logger.error("Google callback processing error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp },
        })

        return NextResponse.json(
            {
                success: false,
                error: "An error occurred. Please try again later",
            },
            { status: 500, headers: getSecurityHeaders() }
        )
    }
}

/**
 * GET handler for Google OAuth callback
 * Google redirects here with authorization code in query parameters
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<GoogleCallbackResponse>> {
    const clientIp = getClientIp(request)

    try {
        // Get authorization code from query parameters
        const code = request.nextUrl.searchParams.get("code")

        // Validate authorization code
        if (!code) {
            logger.warn("Google callback without authorization code", {
                context: "Auth",
                data: { ip: clientIp },
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Authorization code is required",
                },
                { status: 400, headers: getSecurityHeaders() }
            )
        }

        // Redirect to dashboard after successful authentication
        // The handleGoogleCallback will set the session cookie
        const response = await handleGoogleCallback(code, clientIp)

        // If successful, redirect to dashboard
        if (response.status === 200) {
            return NextResponse.redirect(new URL("/dashboard", request.url), {
                status: 302,
            })
        }

        return response
    } catch (err) {
        logger.error("Google callback GET error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp },
        })

        return NextResponse.json(
            {
                success: false,
                error: "An error occurred. Please try again later",
            },
            { status: 500, headers: getSecurityHeaders() }
        )
    }
}

/**
 * POST handler for Google OAuth callback
 * Frontend can also POST the authorization code
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<GoogleCallbackResponse>> {
    const clientIp = getClientIp(request)

    try {
        // Parse request body
        const body = (await request.json().catch(() => ({}))) as {
            code?: string
        }

        // Validate authorization code
        if (!body.code) {
            logger.warn("Google callback POST without authorization code", {
                context: "Auth",
                data: { ip: clientIp },
            })

            return NextResponse.json(
                {
                    success: false,
                    error: "Authorization code is required",
                },
                { status: 400, headers: getSecurityHeaders() }
            )
        }

        return handleGoogleCallback(body.code, clientIp)
    } catch (err) {
        logger.error("Google callback POST error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp },
        })

        return NextResponse.json(
            {
                success: false,
                error: "An error occurred. Please try again later",
            },
            { status: 500, headers: getSecurityHeaders() }
        )
    }
}
