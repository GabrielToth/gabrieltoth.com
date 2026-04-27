/**
 * Network Status Endpoint
 * GET /api/networks/status
 * Returns the status of all networks for the authenticated user
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { createLogger } from "@/lib/logger"
import { getNetworkManager } from "@/lib/networks"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("NetworkStatusEndpoint")

/**
 * GET /api/networks/status
 * Returns status for all networks
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized network status request")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const networkManager = getNetworkManager()
        const statuses = await networkManager.getUserNetworkStatuses(userId)

        const connectedCount = Object.values(statuses).filter(
            s => s === "connected"
        ).length
        const expiredCount = Object.values(statuses).filter(
            s => s === "expired"
        ).length

        logger.info("Network statuses retrieved", {
            userId,
            connectedCount,
            expiredCount,
        })

        return NextResponse.json(
            {
                statuses,
                connectedCount,
                expiredCount,
                totalNetworks: Object.keys(statuses).length,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("Failed to retrieve network statuses", {
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to retrieve network statuses",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
