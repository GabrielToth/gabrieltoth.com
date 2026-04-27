/**
 * Remove Network from Group Endpoint
 * DELETE /api/groups/:groupId/networks/:platform
 * Removes a network from a group
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

import { getNetworkGroupManager } from "@/lib/groups"
import { createLogger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("RemoveNetworkFromGroupEndpoint")

/**
 * DELETE /api/groups/:groupId/networks/:platform
 * Removes a network from a group
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { groupId: string; platform: string } }
): Promise<NextResponse> {
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized remove network from group attempt", {
                groupId: params.groupId,
                platform: params.platform,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const groupManager = getNetworkGroupManager()
        const group = await groupManager.removeNetworkFromGroup(
            userId,
            params.groupId,
            params.platform as any
        )

        logger.info("Network removed from group", {
            userId,
            groupId: params.groupId,
            platform: params.platform,
        })

        return NextResponse.json(
            {
                success: true,
                group,
                message: `Network ${params.platform} removed from group`,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Failed to remove network from group", {
            groupId: params.groupId,
            platform: params.platform,
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to remove network from group",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
