/**
 * OAuth Status Endpoint
 * GET /api/oauth/status
 * Returns the OAuth status for all platforms
 * Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7
 */

import { createLogger } from "@/lib/logger"
import { getOAuthManager } from "@/lib/oauth"
import { getTokenStore } from "@/lib/token-store"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("OAuthStatusEndpoint")

/**
 * OAuth status response
 */
interface OAuthStatusResponse {
    platform: string
    connected: boolean
    linkedAt?: number
    expiresAt?: number
    expired: boolean
}

/**
 * GET /api/oauth/status
 * Returns OAuth status for all platforms
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Get user ID from session
        const userId = request.headers.get("x-user-id")
        if (!userId) {
            logger.warn("Unauthorized OAuth status request")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const oauthManager = getOAuthManager()
        const tokenStore = getTokenStore()

        // Get all supported platforms
        const platforms = oauthManager.getSupportedPlatforms()

        // Get status for each platform
        const statuses: OAuthStatusResponse[] = []

        for (const platform of platforms) {
            try {
                const token = await tokenStore.getToken(userId, platform)

                if (!token) {
                    statuses.push({
                        platform,
                        connected: false,
                        expired: false,
                    })
                    continue
                }

                const isExpired =
                    token.expiresAt && token.expiresAt < Date.now()

                statuses.push({
                    platform,
                    connected: true,
                    linkedAt: token.expiresAt
                        ? token.expiresAt - token.expiresAt
                        : undefined,
                    expiresAt: token.expiresAt,
                    expired: isExpired || false,
                })
            } catch (error) {
                logger.error("Failed to get status for platform", {
                    platform,
                    userId,
                    error:
                        error instanceof Error ? error.message : String(error),
                })

                statuses.push({
                    platform,
                    connected: false,
                    expired: false,
                })
            }
        }

        logger.info("OAuth status retrieved", {
            userId,
            connectedCount: statuses.filter(s => s.connected).length,
        })

        return NextResponse.json(
            {
                statuses,
                connectedCount: statuses.filter(s => s.connected).length,
                totalPlatforms: statuses.length,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error("OAuth status request failed", {
            error: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                error: "Failed to retrieve OAuth status",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
