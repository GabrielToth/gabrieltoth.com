/**
 * Group Detail Endpoints
 * GET /api/groups/:groupId - Get group details
 * PUT /api/groups/:groupId - Update group
 * DELETE /api/groups/:groupId - Delete group
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

import { getNetworkGroupManager } from "@/lib/groups"
import { createLogger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("GroupDetailEndpoint")

/**
 * Request body for updating a group
 */
interface UpdateGroupRequest {
    name?: string
    description?: string
}

/**
 * GET /api/groups/:groupId
 * Returns group details
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
    const { groupId } = await context.params
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized group detail request", {
                groupId,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const groupManager = getNetworkGroupManager()
        const group = await groupManager.getGroup(userId, groupId)

        if (!group) {
            logger.warn("Group not found", {
                userId,
                groupId: groupId,
            })
            return NextResponse.json(
                { error: "Group not found" },
                { status: 404 }
            )
        }

        logger.info("Group detail retrieved", {
            userId,
            groupId: groupId,
        })

        return NextResponse.json(group, { status: 200 })
    } catch (error) {
        logger.error("Failed to retrieve group detail", {
            groupId: groupId,
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to retrieve group",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/groups/:groupId
 * Updates a group
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
    const { groupId } = await context.params
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized group update attempt", {
                groupId: groupId,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body: UpdateGroupRequest = await request.json()

        if (!body.name) {
            logger.warn("Missing required field: name", {
                userId,
                groupId: groupId,
            })
            return NextResponse.json(
                { error: "Missing required field: name" },
                { status: 400 }
            )
        }

        const groupManager = getNetworkGroupManager()
        const group = await groupManager.renameGroup(
            userId,
            groupId,
            body.name
        )

        logger.info("Group updated successfully", {
            userId,
            groupId: groupId,
            newName: body.name,
        })

        return NextResponse.json(
            {
                success: true,
                group,
                message: "Group updated successfully",
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Failed to update group", {
            groupId: groupId,
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to update group",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/groups/:groupId
 * Deletes a group
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
    const { groupId } = await context.params
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized group delete attempt", {
                groupId: groupId,
            })
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const groupManager = getNetworkGroupManager()
        const deleted = await groupManager.deleteGroup(userId, groupId)

        if (!deleted) {
            logger.warn("Group not found for deletion", {
                userId,
                groupId: groupId,
            })
            return NextResponse.json(
                { error: "Group not found" },
                { status: 404 }
            )
        }

        logger.info("Group deleted successfully", {
            userId,
            groupId: groupId,
        })

        return NextResponse.json(
            {
                success: true,
                message: "Group deleted successfully",
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Failed to delete group", {
            groupId: groupId,
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to delete group",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
