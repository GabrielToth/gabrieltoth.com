/**
 * POST /api/credits/grant
 * Admin-only: Grant free credits to the current user's account
 *
 * Security:
 * - Session auth required (cookie: session)
 * - Admin check via CREDIT_ADMIN_IDS env var whitelist
 * - Input validation: type checks, extra field rejection, length limits
 * - Rate limiting: 10 requests per minute per IP
 * - CSRF: Not yet implemented (credit system uses separate session cookie from auth CSRF middleware)
 *         Risk mitigated by admin whitelist + session auth + rate limiting
 *
 * Request:
 * POST /api/credits/grant
 * Content-Type: application/json
 * Cookie: session=<session_token>
 *
 * Body:
 * {
 *   "amount": 100,          // Required: Positive integer
 *   "reason": "Test grant"  // Optional: Default "Admin grant"
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "100 credits granted",
 *   "data": {
 *     "transactionId": "uuid",
 *     "newBalance": 1100
 *   }
 * }
 *
 * Error:
 * - 400: Invalid amount (type, value, or extra fields)
 * - 401: No valid session or not an admin
 * - 429: Rate limit exceeded
 */

import {
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
    AuthErrorType,
} from "@/lib/auth/error-handling"
import { adminGrant } from "@/lib/credits/service"
import { getSessionUser, isAdminUser } from "@/lib/credits/session"
import { rateLimitByKey, buildClientKey } from "@/lib/rate-limit"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            request.headers.get("x-real-ip") ??
            "127.0.0.1"

        const rlResult = await rateLimitByKey(
            buildClientKey({
                ip,
                path: "/api/credits/grant",
                userAgent: request.headers.get("user-agent"),
            })
        )

        if (!rlResult.success) {
            return createErrorResponse(
                AuthErrorType.TOO_MANY_ATTEMPTS,
                undefined,
                "Too many requests. Please try again later."
            )
        }

        const user = await getSessionUser(request)
        if (!user) {
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        }

        if (!isAdminUser(user.id)) {
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        }

        let body: Record<string, unknown>
        try {
            body = await request.json()
        } catch {
            return createErrorResponse(
                AuthErrorType.INVALID_INPUT,
                undefined,
                "Invalid JSON body"
            )
        }

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return createErrorResponse(
                AuthErrorType.INVALID_INPUT,
                undefined,
                "Body must be a JSON object"
            )
        }

        const allowedKeys = new Set(["amount", "reason"])
        for (const key of Object.keys(body)) {
            if (!allowedKeys.has(key)) {
                return createErrorResponse(
                    AuthErrorType.INVALID_INPUT,
                    undefined,
                    `Unexpected field: ${key}`
                )
            }
        }

        const rawAmount = body.amount
        if (typeof rawAmount !== "number" || !Number.isFinite(rawAmount)) {
            return createErrorResponse(
                AuthErrorType.INVALID_INPUT,
                undefined,
                "Amount must be a finite number"
            )
        }

        if (rawAmount <= 0 || !Number.isInteger(rawAmount) || rawAmount > Number.MAX_SAFE_INTEGER) {
            return createErrorResponse(
                AuthErrorType.INVALID_INPUT,
                undefined,
                "Amount must be a positive integer within safe range"
            )
        }

        const rawReason = body.reason
        if (rawReason !== undefined) {
            if (typeof rawReason !== "string") {
                return createErrorResponse(
                    AuthErrorType.INVALID_INPUT,
                    undefined,
                    "Reason must be a string"
                )
            }
            if (rawReason.length > 500) {
                return createErrorResponse(
                    AuthErrorType.INVALID_INPUT,
                    undefined,
                    "Reason must be at most 500 characters"
                )
            }
        }

        const amount = rawAmount as number
        const reason = (rawReason as string | undefined) ?? "Admin grant"

        const result = await adminGrant(user.id, amount, reason)
        if (!result.success) {
            return createErrorResponse(
                AuthErrorType.INTERNAL_ERROR,
                undefined,
                result.error ?? "Grant failed"
            )
        }

        return createSuccessResponse(
            {
                transactionId: result.transactionId,
                newBalance: result.newBalance,
            },
            `${amount} credits granted`
        )
    } catch (err) {
        return handleUnexpectedError(err, "Credits", "/api/credits/grant")
    }
}
