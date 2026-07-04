/**
 * POST /api/auth/refresh
 * Session refresh endpoint for "Keep Me Logged In" functionality
 *
 * Reads the remember_me_token cookie, validates it, creates a new session,
 * sets a fresh auth_session cookie, and rotates the remember_me_token.
 *
 * This allows users to stay logged in across browser sessions without
 * re-entering credentials (the "Keep Me Logged In" feature).
 *
 * Security:
 * - Token rotation: old tokens are invalidated after use
 * - Rate limited to prevent brute force
 * - HTTP-Only cookies prevent XSS token theft
 * - SameSite=Strict prevents CSRF
 */

import { handleUnexpectedError } from "@/lib/auth/error-handling"
import {
    createRememberMeToken,
    createSession,
    deleteRememberMeToken,
    getRememberMeToken,
} from "@/lib/auth/session"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getClientIp } from "@/lib/middleware/security-headers"
import { NextRequest, NextResponse } from "next/server"

const { queryOne } = db

const REMEMBER_ME_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    path: "/",
}

const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 60 * 60, // 1 hour in seconds
    path: "/",
}

export async function POST(request: NextRequest) {
    const clientIp = getClientIp(request)

    try {
        // 1. Read 'remember_me_token' from request cookies
        const rememberMeToken = request.cookies.get("remember_me_token")?.value

        if (!rememberMeToken) {
            logger.debug("Refresh request without remember_me_token", {
                context: "Auth",
                data: { ip: clientIp },
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "No remember me token",
                },
                { status: 401 }
            )
        }

        // 2. Query remember_me_tokens table for this token
        const tokenRow = await getRememberMeToken(rememberMeToken)

        if (!tokenRow) {
            logger.debug("Remember Me token not found or expired", {
                context: "Auth",
                data: { ip: clientIp },
            })

            // Clear both cookies since the token is invalid
            const response = NextResponse.json(
                {
                    success: false,
                    error: "Invalid or expired remember me token",
                },
                { status: 401 }
            )

            response.cookies.set("auth_session", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 0,
                path: "/",
            })

            response.cookies.set("remember_me_token", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 0,
                path: "/",
            })

            return response
        }

        // 3. Get user info to verify user still exists
        const user = await queryOne<{ id: string; email: string }>(
            "SELECT id, email FROM users WHERE id = $1",
            [tokenRow.user_id]
        )

        if (!user) {
            logger.warn("User not found for remember me token", {
                context: "Auth",
                data: { userId: tokenRow.user_id, ip: clientIp },
            })

            // Clean up orphaned token
            await deleteRememberMeToken(rememberMeToken)

            const response = NextResponse.json(
                {
                    success: false,
                    error: "User not found",
                },
                { status: 401 }
            )

            response.cookies.set("auth_session", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 0,
                path: "/",
            })

            response.cookies.set("remember_me_token", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 0,
                path: "/",
            })

            return response
        }

        // 4. Rotate the remember_me_token: generate new, insert new row, delete old row
        const newRememberMeToken = await createRememberMeToken(
            tokenRow.user_id,
            clientIp,
            request.headers.get("user-agent") || undefined
        )

        // Delete old token after new one is created
        await deleteRememberMeToken(rememberMeToken)

        // 5. Create a new auth session
        const session = await createSession(tokenRow.user_id)

        // 6. Set response cookies
        const response = NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                },
            },
            { status: 200 }
        )

        // Set auth_session cookie (1 hour)
        response.cookies.set(
            "auth_session",
            session.session_id,
            SESSION_COOKIE_OPTIONS
        )

        // Set remember_me_token cookie (30 days)
        response.cookies.set(
            "remember_me_token",
            newRememberMeToken.token_hash,
            REMEMBER_ME_COOKIE_OPTIONS
        )

        logger.info("Session refreshed via remember me token", {
            context: "Auth",
            data: {
                userId: user.id,
                ip: clientIp,
            },
        })

        return response
    } catch (err) {
        return handleUnexpectedError(err, "Auth", "/api/auth/refresh")
    }
}
