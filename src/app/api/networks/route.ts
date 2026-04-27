/**
 * Networks List Endpoint
 * GET /api/networks
 * Returns all linked networks for the authenticated user
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { createLogger } from "@/lib/logger"
import { getNetworkManager } from "@/lib/networks"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("NetworksListEndpoint")

/**
 * GET /api/networks
 * Returns all linked networks for the user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized networks list request")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const networkManager = getNetworkManager()
        const networks = await networkManager.getUserNetworks(userId)

        logger.info("Networks list retrieved", {
            userId,
            count: networks.length,
        })

        return NextResponse.json(
            {
                networks,
                count: networks.length,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Failed to retrieve networks list", {
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to retrieve networks",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
