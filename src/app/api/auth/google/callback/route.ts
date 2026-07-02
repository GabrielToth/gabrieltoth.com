/**
 * GET/POST /api/auth/google/callback
 * Google OAuth callback endpoint
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5,
 *            4.1, 4.2, 4.3, 4.4, 11.1, 11.2, 11.3, 13.1, 13.2, 13.3, 13.4, 14.2, 14.3, 14.4
 */

import {
    getAuditEnvironment,
    notifyUserAuditDiscord,
} from "@/lib/audit/discord-user-audit"
import { logAuditEvent } from "@/lib/auth/audit-logging"
import {
    exchangeCodeForToken,
    validateGoogleToken,
} from "@/lib/auth/google-auth"
import { createRememberMeToken, createSession } from "@/lib/auth/session"
import { upsertUser } from "@/lib/auth/user"
import { logger } from "@/lib/logger"
import {
    getClientIp,
    getSecurityHeaders,
} from "@/lib/middleware/security-headers"
import { NextRequest, NextResponse } from "next/server"

type CallbackResult =
    | { success: true; sessionId: string; userEmail: string; userId: string }
    | { success: false; response: NextResponse }

const SESSION_COOKIE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60, // 1 hour
    path: "/",
}

const REMEMBER_ME_COOKIE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
}

/**
 * Set the session cookie on a NextResponse
 */
function setSessionCookie(res: NextResponse, sessionId: string): void {
    res.cookies.set("auth_session", sessionId, SESSION_COOKIE)
}

/**
 * Build an error response
 */
function errorResponse(message: string, status: number): NextResponse {
    return NextResponse.json(
        { success: false, error: message },
        { status, headers: getSecurityHeaders() }
    )
}

/**
 * Process Google OAuth callback
 * Handles both GET (from Google redirect) and POST (from frontend)
 * Returns session data on success, error response on failure
 */
async function handleGoogleCallback(
    code: string,
    clientIp: string
): Promise<CallbackResult> {
    try {
        // Get redirect URI from environment
        const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
        if (!redirectUri) {
            logger.error("Google redirect URI not configured", {
                context: "Auth",
            })
            return {
                success: false,
                response: errorResponse("Server configuration error", 500),
            }
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
            await logAuditEvent("LOGIN_FAILED", undefined, clientIp, {
                reason: "Failed to exchange authorization code",
            })
            return {
                success: false,
                response: errorResponse(
                    "Failed to authenticate with Google",
                    401
                ),
            }
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
            await logAuditEvent("LOGIN_FAILED", undefined, clientIp, {
                reason: "Invalid or expired Google token",
            })
            return {
                success: false,
                response: errorResponse("Invalid or expired Google token", 401),
            }
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
            await logAuditEvent(
                "LOGIN_FAILED",
                googleUserData.google_email,
                clientIp,
                {
                    reason: "Failed to create or update user",
                }
            )
            return {
                success: false,
                response: errorResponse("Failed to authenticate", 500),
            }
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
            await logAuditEvent(
                "LOGIN_FAILED",
                user.google_email,
                clientIp,
                {
                    reason: "Failed to create session",
                },
                user.id
            )
            return {
                success: false,
                response: errorResponse("Failed to create session", 500),
            }
        }

        // Log successful login
        try {
            await logAuditEvent(
                "LOGIN_SUCCESS",
                user.google_email,
                clientIp,
                {
                    action: "User logged in via Google OAuth",
                },
                user.id
            )
        } catch (error) {
            logger.error("Failed to log login event", {
                context: "Auth",
                error: error as Error,
                data: { userId: user.id },
            })
        }

        logger.info("User logged in successfully via Google OAuth", {
            context: "Auth",
            data: { userId: user.id, email: user.google_email },
        })

        void notifyUserAuditDiscord("user_login", {
            email: user.google_email,
            userId: user.id,
            provider: "google",
            ip: clientIp,
            environment: getAuditEnvironment(),
        })

        return {
            success: true,
            sessionId: session.session_id,
            userEmail: user.google_email,
            userId: user.id,
        }
    } catch (err) {
        logger.error("Google callback processing error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp },
        })
        return {
            success: false,
            response: errorResponse(
                "An error occurred. Please try again later",
                500
            ),
        }
    }
}

/**
 * GET handler for Google OAuth callback
 * Google redirects here with authorization code in query parameters
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    const clientIp = getClientIp(request)

    try {
        const code = request.nextUrl.searchParams.get("code")

        if (!code) {
            logger.warn("Google callback without authorization code", {
                context: "Auth",
                data: { ip: clientIp },
            })
            return errorResponse("Authorization code is required", 400)
        }

        const result = await handleGoogleCallback(code, clientIp)

        if (!result.success) {
            return result.response
        }

        // Build redirect with session cookie directly on the redirect response
        const redirectResponse = NextResponse.redirect(
            new URL("/dashboard", request.url)
        )
        setSessionCookie(redirectResponse, result.sessionId)
        return redirectResponse
    } catch (err) {
        logger.error("Google callback GET error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp },
        })
        return errorResponse("An error occurred. Please try again later", 500)
    }
}

/**
 * POST handler for Google OAuth callback
 * Frontend can also POST the authorization code
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const clientIp = getClientIp(request)
    const userAgent = request.headers.get("user-agent") || undefined

    try {
        const body = (await request.json().catch(() => ({}))) as {
            code?: string
            rememberMe?: boolean
        }

        if (!body.code) {
            logger.warn("Google callback POST without authorization code", {
                context: "Auth",
                data: { ip: clientIp },
            })
            return errorResponse("Authorization code is required", 400)
        }

        const result = await handleGoogleCallback(body.code, clientIp)

        if (!result.success) {
            return result.response
        }

        // POST handler from frontend — return JSON so client JS can redirect
        const response = NextResponse.json({
            success: true,
            message: "Login successful",
            redirectUrl: "/dashboard",
        })
        setSessionCookie(response, result.sessionId)

        // If rememberMe is true, create remember_me_token in DB and set cookie
        if (body.rememberMe) {
            try {
                const rememberMeToken = await createRememberMeToken(
                    result.userId,
                    clientIp,
                    userAgent
                )
                response.cookies.set(
                    "remember_me_token",
                    rememberMeToken.token_hash,
                    REMEMBER_ME_COOKIE
                )
            } catch (error) {
                logger.warn("Failed to create Remember Me token for Google OAuth", {
                    context: "Auth",
                    error: error as Error,
                    data: { userId: result.userId },
                })
                // Don't fail the login if remember me fails
            }
        }

        return response
    } catch (err) {
        logger.error("Google callback POST error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp },
        })
        return errorResponse("An error occurred. Please try again later", 500)
    }
}
