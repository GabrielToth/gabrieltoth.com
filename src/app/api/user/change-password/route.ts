/**
 * POST /api/user/change-password
 * Change authenticated user's password
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 6.4, 6.5, 8.3
 */

import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
} from "@/lib/auth/error-handling"
import {
    hashPasswordArgon2id,
    verifyPasswordArgon2id,
} from "@/lib/auth/password-security"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"
import {
    addCsrfTokenToResponse,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    validateCsrfFromRequest,
} from "@/lib/middleware/api-csrf-middleware"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ChangePassword")

export async function POST(request: NextRequest) {
    try {
        const sessionToken = request.cookies.get("session")?.value
        if (!sessionToken)
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)

        const session = await db.queryOne<{
            user_id: string
            expires_at: Date
        }>("SELECT user_id, expires_at FROM sessions WHERE session_id = $1", [
            sessionToken,
        ])
        if (!session) return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        if (new Date(session.expires_at) < new Date())
            return createErrorResponse(AuthErrorType.SESSION_EXPIRED)

        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            "unknown"
        const rateLimit = await rateLimitByKey(
            buildClientKey({
                ip: clientIp,
                path: "/api/user/change-password",
                userAgent: request.headers.get("user-agent"),
            })
        )
        if (!rateLimit.success)
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            )

        const { valid } = await validateCsrfFromRequest(request)
        if (!valid) return createCsrfErrorResponse()

        let body: Record<string, unknown>
        try {
            body = await request.json()
        } catch {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }
        if (typeof body !== "object" || body === null || Array.isArray(body))
            return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const allowed = new Set(["currentPassword", "newPassword"])
        for (const key of Object.keys(body))
            if (!allowed.has(key))
                return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const { currentPassword, newPassword } = body
        if (typeof currentPassword !== "string" || currentPassword.length === 0)
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        if (typeof newPassword !== "string" || newPassword.length < 8)
            return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const user = await db.queryOne<{
            email: string
            password_hash: string | null
        }>("SELECT email, password_hash FROM users WHERE id = $1", [
            session.user_id,
        ])
        if (!user || !user.password_hash)
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)

        const isValid = await verifyPasswordArgon2id(
            currentPassword,
            user.password_hash
        )
        if (!isValid)
            return createErrorResponse(AuthErrorType.INVALID_CREDENTIALS)

        const hashResult = await hashPasswordArgon2id(newPassword)
        await db.query(
            "UPDATE users SET password_hash = $1, password_algorithm = $2 WHERE id = $3",
            [hashResult.hash, hashResult.algorithm, session.user_id]
        )

        logger.info("Password changed", { userId: session.user_id })
        const response = createSuccessResponse({
            message: "Password changed successfully",
        })
        const newCsrfToken = regenerateCsrfToken(request)
        if (newCsrfToken) return addCsrfTokenToResponse(response, newCsrfToken)
        return response
    } catch (err) {
        return handleUnexpectedError(
            err,
            "ChangePassword",
            "/api/user/change-password"
        )
    }
}
