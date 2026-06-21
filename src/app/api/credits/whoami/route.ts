/**
 * GET /api/credits/whoami
 * Get current user's identity and admin status
 *
 * Security:
 * - Session auth required
 * - No rate limit (read-only)
 *
 * Request: GET /api/credits/whoami
 * Cookie: session=<session_token>
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "user-uuid",
 *     "email": "user@example.com",
 *     "name": "User Name",
 *     "isAdmin": false,
 *     "instructions": "Copy your 'id' value and add it to CREDIT_ADMIN_IDS in .env.local"
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
import { getSessionUser, isAdminUser } from "@/lib/credits/session"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const user = await getSessionUser(request)
        if (!user) {
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        }

        return createSuccessResponse({
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: isAdminUser(user.id),
            instructions:
                "Copy your 'id' value and add it to CREDIT_ADMIN_IDS in .env.local",
        })
    } catch (err) {
        return handleUnexpectedError(err, "Credits", "/api/credits/whoami")
    }
}
