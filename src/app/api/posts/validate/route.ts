/**
 * Content Validation Endpoint
 * POST /api/posts/validate
 * Validates content against selected networks and detects conflicts
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import type { SocialPlatform } from "@/lib/networks/network-manager"
import { getConflictDetector, getContentAdapter } from "@/lib/posting"
import type { PostContentType } from "@/lib/posting/platform-capabilities"
import {
    ERROR_LOCAL_MODE_ON_SERVER,
    isLocalExecutionRequest,
    validatePublishRequest,
} from "@/lib/posting/publish-guard"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ContentValidationEndpoint")

/**
 * Request body for content validation
 */
interface ValidateContentRequest {
    content: string
    platforms: SocialPlatform[]
    scheduledTime?: number
    mode?: "cloud" | "local"
    contentType?: PostContentType
    durationSeconds?: number
    fileSizeBytes?: number
}

/**
 * POST /api/posts/validate
 * Validates content against selected networks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Get user ID from session cookie
        const session = await getServerSession(request)
        const userId = session?.user?.id
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

        // LOCAL never reaches this endpoint: it must run entirely in-browser.
        if (isLocalExecutionRequest(body.mode)) {
            return NextResponse.json(
                {
                    error: ERROR_LOCAL_MODE_ON_SERVER,
                    message:
                        "LOCAL execution must be validated in the browser, not on the backend.",
                },
                { status: 400 }
            )
        }

        const capabilities = validatePublishRequest({
            platforms: body.platforms,
            environment: "cloud",
            contentType: body.contentType,
            contentTypeCandidates: body.contentType ? undefined : ["text_only"],
            characterCount: body.content.length,
            durationSeconds:
                typeof body.durationSeconds === "number"
                    ? body.durationSeconds
                    : undefined,
            fileSizeBytes:
                typeof body.fileSizeBytes === "number"
                    ? body.fileSizeBytes
                    : undefined,
        })

        const contentAdapter = getContentAdapter()
        const conflictDetector = getConflictDetector()

        // Validate content for each platform
        const platformValidations = contentAdapter.validateForPlatforms(
            body.content,
            body.platforms as SocialPlatform[]
        )

        // Detect conflicts
        const conflictResult = await conflictDetector.detectConflicts(
            userId,
            body.content,
            body.platforms as SocialPlatform[],
            body.scheduledTime
        )

        logger.info("Content validation completed", {
            userId,
            platforms: body.platforms,
            hasConflicts: conflictResult.hasConflicts,
            canPublish: conflictResult.canPublish,
            capabilityOk: capabilities.ok,
        })

        return NextResponse.json(
            {
                validation: {
                    platforms: platformValidations,
                    characterLimits: contentAdapter.getAllCharacterLimits(),
                },
                capabilities,
                conflicts: conflictResult,
                canPublish: conflictResult.canPublish && capabilities.ok,
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
