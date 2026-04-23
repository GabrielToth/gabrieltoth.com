/**
 * POST /api/youtube/link/start
 * Initiates YouTube channel linking process
 * Generates OAuth authorization URL and stores state parameter in Redis
 * Validates: Requirements 1.1, 1.2
 */

import { validateEnv } from "@/lib/config/env"
import { createLogger } from "@/lib/logger"
import { getYouTubeChannelLinkingConfig } from "@/lib/youtube/config"
import { getYouTubeOAuthService } from "@/lib/youtube/oauth-service"
import { Redis } from "ioredis"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("YouTubeLinkStartEndpoint")

/**
 * POST /api/youtube/link/start
 * Initiates the YouTube channel linking process
 *
 * Request body: {} (empty)
 *
 * Response:
 * {
 *   "success": true,
 *   "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
 *   "state": "random_state_string"
 * }
 *
 * Error response:
 * {
 *   "success": false,
 *   "error": "error_code",
 *   "message": "error message"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Get user ID from session/auth header
        // For now, we'll extract from a custom header or session
        const userId = request.headers.get("x-user-id")

        if (!userId) {
            logger.warn("Missing user ID in request")
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_USER_ID",
                    message: "User ID is required",
                },
                { status: 400 }
            )
        }

        logger.info("Linking initiation requested", { userId })

        // Initialize configuration
        const env = validateEnv()
        const config = getYouTubeChannelLinkingConfig(env)

        // Initialize OAuth service
        const oauthService = getYouTubeOAuthService(config)
        await oauthService.initialize()

        // Generate authorization URL
        const { authorizationUrl, state } =
            oauthService.generateAuthorizationUrl(userId)

        // Initialize Redis client
        const redis = new Redis(env.REDIS_URL)

        try {
            // Store state parameter in Redis with expiration (10 minutes)
            const stateKey = `youtube:oauth:state:${state}`
            const stateValue = JSON.stringify({
                userId,
                createdAt: new Date().toISOString(),
            })

            // Set with 10-minute expiration
            await redis.setex(stateKey, 600, stateValue)

            logger.info("State parameter stored in Redis", {
                userId,
                stateKey,
                expiresIn: 600,
            })

            // Return authorization URL to frontend
            return NextResponse.json(
                {
                    success: true,
                    authorizationUrl,
                    state,
                },
                { status: 200 }
            )
        } finally {
            // Close Redis connection
            await redis.quit()
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to initiate YouTube linking", err)

        return NextResponse.json(
            {
                success: false,
                error: "LINKING_INITIATION_FAILED",
                message: err.message,
            },
            { status: 500 }
        )
    }
}
