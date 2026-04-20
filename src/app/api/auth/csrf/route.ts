/**
 * CSRF Token API Endpoint
 * Provides CSRF tokens for authenticated sessions
 *
 * GET /api/auth/csrf - Get CSRF token for current session
 *
 * Requirements: 6.1, 6.4
 */

import { logger } from "@/lib/logger"
import {
    addCsrfTokenToResponse,
    getOrGenerateCsrfToken,
} from "@/lib/middleware/api-csrf-middleware"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/auth/csrf
 * Generate or retrieve CSRF token for the current session
 */
export async function GET(request: NextRequest) {
    try {
        // Get or generate CSRF token
        const csrfToken = getOrGenerateCsrfToken(request)

        if (!csrfToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No active session",
                },
                { status: 401 }
            )
        }

        // Create response with CSRF token
        const response = NextResponse.json({
            success: true,
            data: {
                csrfToken,
            },
        })

        // Add token to response header as well
        return addCsrfTokenToResponse(response, csrfToken)
    } catch (error) {
        logger.error("Failed to generate CSRF token", {
            context: "Security",
            error,
        })

        return NextResponse.json(
            {
                success: false,
                error: "Failed to generate CSRF token",
            },
            { status: 500 }
        )
    }
}
