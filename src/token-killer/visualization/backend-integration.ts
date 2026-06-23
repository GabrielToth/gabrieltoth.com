/**
 * Token Killer Backend Integration
 * Integrates the Token Killer API with the Express.js backend
 * Provides middleware and route setup for the web dashboard
 */

import { Express, Router } from "express"
import { createTokenKillerRouter } from "./api"
import { DatabasePool } from "../storage/database"
import { createLogger } from "../../lib/logger"

const logger = createLogger("TokenKillerBackendIntegration")

/**
 * Initialize Token Killer API routes in the Express app
 * Requirement 6.1-6.5: Web dashboard API endpoints
 */
export function integrateTokenKillerAPI(
    app: Express,
    tokenKillerPool: DatabasePool
): void {
    try {
        logger.info("Integrating Token Killer API with backend")

        // Create and mount the Token Killer router
        const tokenKillerRouter = createTokenKillerRouter(tokenKillerPool)
        app.use(tokenKillerRouter)

        logger.info("Token Killer API integrated successfully")
        logger.info("Available endpoints:")
        logger.info("  GET /api/token-killer/stats/:timeWindow")
        logger.info(
            "  GET /api/token-killer/breakdown/:timeWindow/:breakdownType"
        )
        logger.info("  GET /api/token-killer/anomalies/:timeWindow")
        logger.info("  GET /api/token-killer/health")
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("Failed to integrate Token Killer API", error as Error)
        throw new Error(`Failed to integrate Token Killer API: ${message}`)
    }
}

/**
 * Create a standalone Token Killer router for use in other applications
 * Can be used in Next.js API routes or other Express-based servers
 */
export function createStandaloneTokenKillerRouter(
    tokenKillerPool: DatabasePool
): Router {
    return createTokenKillerRouter(tokenKillerPool)
}

export { createTokenKillerRouter }
