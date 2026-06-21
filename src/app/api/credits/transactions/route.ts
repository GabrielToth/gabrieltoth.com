/**
 * GET /api/credits/transactions
 * Get current user's transaction history
 *
 * Security:
 * - Session auth required
 * - No rate limit (read-only, low-impact)
 *
 * Query Parameters:
 * - limit (optional): Max results (default 50, max 100)
 *
 * Request: GET /api/credits/transactions?limit=50
 * Cookie: session=<session_token>
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "transactions": [
 *       {
 *         "id": "uuid",
 *         "amount": -50,
 *         "type": "debit",
 *         "reason": "video_upload",
 *         "balanceBefore": 1000,
 *         "balanceAfter": 950,
 *         "createdAt": "ISO date string"
 *       }
 *     ]
 *   }
 * }
 *
 * Error: 401 if no valid session
 */

import {
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
    AuthErrorType,
} from "@/lib/auth/error-handling"
import { getTransactions } from "@/lib/credits/service"
import { getSessionUser } from "@/lib/credits/session"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        }

        const limitParam = request.nextUrl.searchParams.get("limit")
        let limit: number
        if (limitParam !== null) {
            if (!/^\d+$/.test(limitParam)) {
                return createErrorResponse(
                    AuthErrorType.INVALID_INPUT,
                    undefined,
                    "Limit must be a positive integer"
                )
            }
            const parsed = parseInt(limitParam, 10)
            if (!Number.isFinite(parsed) || parsed < 1) {
                return createErrorResponse(
                    AuthErrorType.INVALID_INPUT,
                    undefined,
                    "Limit must be a positive integer"
                )
            }
            limit = Math.min(parsed, 100)
        } else {
            limit = 50
        }

        const transactions = await getTransactions(user.id, limit)
        return createSuccessResponse({ transactions })
    } catch (err) {
        return handleUnexpectedError(err, "Credits", "/api/credits/transactions")
    }
}
