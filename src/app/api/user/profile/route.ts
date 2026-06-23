/**
 * PUT /api/user/profile
 * Update user profile (name, profile photo)
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 8.3
 */

import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
} from "@/lib/auth/error-handling"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"
import { NextResponse } from "next/server"
import {
    addCsrfTokenToResponse,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    validateCsrfFromRequest,
} from "@/lib/middleware/api-csrf-middleware"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { NextRequest } from "next/server"

const logger = createLogger("UserProfile")

export async function PUT(request: NextRequest) {
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
                path: "/api/user/profile",
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

        const allowed = new Set(["name", "profilePhoto"])
        for (const key of Object.keys(body))
            if (!allowed.has(key))
                return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const { name, profilePhoto } = body
        if (
            name !== undefined &&
            (typeof name !== "string" || name.length > 100)
        )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        if (
            profilePhoto !== undefined &&
            (typeof profilePhoto !== "string" || profilePhoto.length > 500)
        )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const updates: string[] = []
        const params: Array<string | number | boolean | null | Date> = []
        let idx = 1
        if (name !== undefined) {
            updates.push(`name = $${idx}`)
            params.push(name as string)
            idx++
        }
        if (profilePhoto !== undefined) {
            updates.push(`picture = $${idx}`)
            params.push(profilePhoto as string)
            idx++
        }
        if (updates.length === 0)
            return createErrorResponse(AuthErrorType.INVALID_INPUT)

        params.push(session.user_id)
        await db.query(
            `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}`,
            params
        )

        const user = await db.queryOne<{
            id: string
            name: string | null
            email: string
            picture: string | null
            created_at: Date
            updated_at: Date
        }>(
            "SELECT id, name, email, picture, created_at, updated_at FROM users WHERE id = $1",
            [session.user_id]
        )

        logger.info("Profile updated", { userId: session.user_id })
        const response = createSuccessResponse(user)
        const newCsrfToken = regenerateCsrfToken(request)
        if (newCsrfToken) return addCsrfTokenToResponse(response, newCsrfToken)
        return response
    } catch (err) {
        return handleUnexpectedError(err, "UserProfile", "/api/user/profile")
    }
}
