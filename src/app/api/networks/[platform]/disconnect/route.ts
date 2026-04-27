/**
 * Network Disconnect Endpoint
 * DELETE /api/networks/:platform/disconnect
 * Disconnects a social media network from the user account
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { createLogger } from "@/lib/logger"
import { getNetworkManager } from "@/lib/networks"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("NetworkDisconnectEndpoint")

/**
 * DELETE /api/networks/:platform/disconnect
 * Disconnects a social media network
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { platform: string } }
): Promise<NextResponse> {
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized network disconnect attempt", {
                platform: params.platform,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const platform = params.platform.toLowerCase()

        const networkManager = getNetworkManager()
        const disconnected = await networkManager.unlinkNetwork(
            userId,
            platform as any
        )

        if (!disconnected) {
            logger.warn("Network not found for disconnect", {
                userId,
                platform,
            })
            return NextResponse.json(
                { error: "Network not found" },
                { status: 404 }
            )
        }

        logger.info("Network disconnected successfully", {
            userId,
            platform,
        })

        return NextResponse.json(
            {
                success: true,
                message: `Successfully disconnected from ${platform}`,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Failed to disconnect network", {
            platform: params.platform,
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to disconnect network",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
