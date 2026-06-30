/**
 * Network Connect Endpoint
 * POST /api/networks/:platform/connect
 * Connects a social media network to the user account
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { createLogger } from "@/lib/logger"
import { getNetworkManager } from "@/lib/networks"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("NetworkConnectEndpoint")

/**
 * Request body for connecting a network
 */
interface ConnectNetworkRequest {
    platformUserId: string
    platformUsername: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
}

/**
 * POST /api/networks/:platform/connect
 * Connects a social media network
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ platform: string }> }
): Promise<NextResponse> {
    const { platform } = await context.params

    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized network connect attempt", {
                platform: platform,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body: ConnectNetworkRequest = await request.json()

        if (!body.platformUserId || !body.platformUsername) {
            logger.warn("Missing required fields for network connect", {
                platform: platform,
                userId,
            })
            return NextResponse.json(
                {
                    error: "Missing required fields: platformUserId, platformUsername",
                },
                { status: 400 }
            )
        }

        const networkManager = getNetworkManager()
        const network = await networkManager.linkNetwork(
            userId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            platform as any,
            body.platformUserId,
            body.platformUsername,
            body.metadata
        )

        logger.info("Network connected successfully", {
            userId,
            platform,
            platformUserId: body.platformUserId,
        })

        return NextResponse.json(
            {
                success: true,
                network,
                message: `Successfully connected to ${platform}`,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Failed to connect network", {
            platform: platform,
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to connect network",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
