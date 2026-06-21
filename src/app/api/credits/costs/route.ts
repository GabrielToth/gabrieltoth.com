/**
 * GET /api/credits/costs
 * Get the credit cost table for all billable actions
 *
 * Security:
 * - No auth required (public, read-only data)
 * - No rate limit
 *
 * Request: GET /api/credits/costs
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "costs": {
 *       "video_upload": 50,
 *       "video_process": 30,
 *       "email_send": 1,
 *       "search": 5,
 *       "analytics_query": 10,
 *       "ai_chat": 20,
 *       "ai_image": 50
 *     }
 *   }
 * }
 */

import { createSuccessResponse } from "@/lib/auth/error-handling"
import { CREDIT_COSTS } from "@/lib/credits/service"
import { NextRequest } from "next/server"

export async function GET(_request: NextRequest) {
    return createSuccessResponse({ costs: CREDIT_COSTS })
}
