/**
 * GET /api/credits/balance
 * Get current user's credit balance
 *
 * Security:
 * - Session auth required
 * - No rate limit (read-only, low-impact)
 *
 * Request: GET /api/credits/balance
 * Cookie: session=<session_token>
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "balance": 1000,       // Current credit balance
 *     "userId": "uuid",      // Current user's UUID
 *     "isAdmin": false        // Whether user is in CREDIT_ADMIN_IDS
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
import { getBalance, adminGrant } from "@/lib/credits/service"
import { getSessionUser, isAdminUser } from "@/lib/credits/session"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        }

        let result = await getBalance(user.id)

        // Grant initial test credits (100,000,000) for gabrieltothgoncalves@gmail.com to test Cloud Mode
        if (
            user.email?.toLowerCase() === "gabrieltothgoncalves@gmail.com" &&
            result.balance < 100000000
        ) {
            const grantAmount = 100000000 - result.balance
            await adminGrant(
                user.id,
                grantAmount,
                "Test credits grant for Cloud Mode"
            )
            result = await getBalance(user.id)
        }

        return createSuccessResponse({
            ...result,
            userId: user.id,
            isAdmin: isAdminUser(user.id),
        })
    } catch (err) {
        return handleUnexpectedError(err, "Credits", "/api/credits/balance")
    }
}
