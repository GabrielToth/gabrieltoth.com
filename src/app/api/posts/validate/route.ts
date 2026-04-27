/**
 * Content Validation Endpoint
 * POST /api/posts/validate
 * Validates content against selected networks and detects conflicts
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8
 */

import { createLogger } from "@/lib/logger"
import { getConflictDetector, getContentAdapter } from "@/lib/posting"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ContentValidationEndpoint")

/**
 * Request body for content validation
 */
interface ValidateContentRequest {
    content: string
    platforms: string[]
    scheduledTime?: number
}

/**
 * POST /api/posts/validate
 * Validates content against selected networks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized content validation request")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body: ValidateContentRequest = await request.json()

        if (!body.content || !body.platforms || body.platforms.length === 0) {
            logger.warn("Missing required fields for content validation", {
                userId,
            })
            return NextResponse.json(
                {
                    error: "Missing required fields: content, platforms (non-empty array)",
                },
                { status: 400 }
            )
        }

        const contentAdapter = getContentAdapter()
        const conflictDetector = getConflictDetector()

        // Validate content for each platform
        const platformValidations = contentAdapter.validateForPlatforms(
            body.content,
            body.platforms as any
        )

        // Detect conflicts
        const conflictResult = await conflictDetector.detectConflicts(
            userId,
            body.content,
            body.platforms as any,
            body.scheduledTime
        )

        logger.info("Content validation completed", {
            userId,
            platforms: body.platforms,
            hasConflicts: conflictResult.hasConflicts,
            canPublish: conflictResult.canPublish,
        })

        return NextResponse.json(
            {
                validation: {
                    platforms: platformValidations,
                    characterLimits: contentAdapter.getAllCharacterLimits(),
                },
                conflicts: conflictResult,
                canPublish: conflictResult.canPublish,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Content validation failed", {
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Content validation failed",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
