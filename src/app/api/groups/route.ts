/**
 * Network Groups Endpoints
 * GET /api/groups - List all groups
 * POST /api/groups - Create a new group
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

import { getNetworkGroupManager } from "@/lib/groups"
import { createLogger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("GroupsEndpoint")

/**
 * Request body for creating a group
 */
interface CreateGroupRequest {
    name: string
    description?: string
}

/**
 * GET /api/groups
 * Returns all groups for the user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized groups list request")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const groupManager = getNetworkGroupManager()
        const groups = await groupManager.getUserGroups(userId)

        logger.info("Groups list retrieved", {
            userId,
            count: groups.length,
        })

        return NextResponse.json(
            {
                groups,
                count: groups.length,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Failed to retrieve groups list", {
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to retrieve groups",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}

/**
 * POST /api/groups
 * Creates a new group
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized group creation attempt")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body: CreateGroupRequest = await request.json()

        if (!body.name) {
            logger.warn("Missing required field: name", { userId })
            return NextResponse.json(
                { error: "Missing required field: name" },
                { status: 400 }
            )
        }

        const groupManager = getNetworkGroupManager()
        const group = await groupManager.createGroup(
            userId,
            body.name,
            body.description
        )

        logger.info("Group created successfully", {
            userId,
            groupId: group.id,
            name: body.name,
        })

        return NextResponse.json(
            {
                success: true,
                group,
                message: "Group created successfully",
            },
            { status: 201 }
        )
    } catch (error) {
        logger.error("Failed to create group", {
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to create group",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
