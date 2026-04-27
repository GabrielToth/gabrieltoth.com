/**
 * Group Networks Endpoints
 * POST /api/groups/:groupId/networks - Add network to group
 * DELETE /api/groups/:groupId/networks/:networkId - Remove network from group
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

import { getNetworkGroupManager } from "@/lib/groups"
import { createLogger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("GroupNetworksEndpoint")

/**
 * Request body for adding a network to a group
 */
interface AddNetworkRequest {
    platform: string
}

/**
 * POST /api/groups/:groupId/networks
 * Adds a network to a group
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { groupId: string } }
): Promise<NextResponse> {
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized add network to group attempt", {
                groupId: params.groupId,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body: AddNetworkRequest = await request.json()

        if (!body.platform) {
            logger.warn("Missing required field: platform", {
                userId,
                groupId: params.groupId,
            })
            return NextResponse.json(
                { error: "Missing required field: platform" },
                { status: 400 }
            )
        }

        const groupManager = getNetworkGroupManager()
        const group = await groupManager.addNetworkToGroup(
            userId,
            params.groupId,
            body.platform as any
        )

        logger.info("Network added to group", {
            userId,
            groupId: params.groupId,
            platform: body.platform,
        })

        return NextResponse.json(
            {
                success: true,
                group,
                message: `Network ${body.platform} added to group`,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Failed to add network to group", {
            groupId: params.groupId,
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to add network to group",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
