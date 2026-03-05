// Example API Routes Using All Systems
// Demonstrates integration of credit system, metering system, and logging

import { Request, Response, Router } from "express"
import { CreditSystemImpl } from "../lib/credits/credit-system"
import { createLogger } from "../lib/logger"
import { MeteringSystemImpl } from "../lib/metering"

const logger = createLogger("APIRoutes")

export function createRoutes(
    creditSystem: CreditSystemImpl,
    meteringSystem: MeteringSystemImpl
): Router {
    const router = Router()

    /**
     * POST /api/usage - Record usage via metering system
     */
    router.post("/api/usage", async (req: Request, res: Response) => {
        try {
            const { userId, type, amount } = req.body

            if (!userId || !type || !amount) {
                return res.status(400).json({
                    error: "Missing required fields: userId, type, amount",
                })
            }

            // Record usage based on type
            switch (type) {
                case "bandwidth":
                    await meteringSystem.recordBandwidth(userId, amount)
                    break
                case "storage":
                    await meteringSystem.recordStorage(userId, amount)
                    break
                case "cache":
                    await meteringSystem.recordCacheOp(userId, "hit")
                    break
                case "api":
                    await meteringSystem.recordApiCall(userId, req.path)
                    break
                default:
                    return res.status(400).json({
                        error: `Invalid usage type: ${type}`,
                    })
            }

            logger.info("Usage recorded", { userId, type, amount })

            res.json({
                success: true,
                message: "Usage recorded successfully",
            })
        } catch (error) {
            logger.error("Failed to record usage", error as Error)
            res.status(500).json({
                error: "Internal server error",
            })
        }
    })

    /**
     * GET /api/balance - Query credit system for user balance
     */
    router.get("/api/balance/:userId", async (req: Request, res: Response) => {
        try {
            const { userId } = req.params

            const balance = await creditSystem.getBalance(userId)

            logger.info("Balance queried", { userId, balance })

            res.json({
                userId,
                balance,
            })
        } catch (error) {
            logger.error("Failed to get balance", error as Error)
            res.status(500).json({
                error: "Internal server error",
            })
        }
    })

    /**
     * POST /api/credits - Add credits to user account
     */
    router.post("/api/credits", async (req: Request, res: Response) => {
        try {
            const { userId, amount, reason } = req.body

            if (!userId || !amount) {
                return res.status(400).json({
                    error: "Missing required fields: userId, amount",
                })
            }

            const result = await creditSystem.credit(
                userId,
                amount,
                reason || "Manual credit"
            )

            if (!result.success) {
                return res.status(400).json({
                    error: result.error,
                })
            }

            logger.info("Credits added", {
                userId,
                amount,
                newBalance: result.newBalance,
            })

            res.json({
                success: true,
                transactionId: result.transactionId,
                newBalance: result.newBalance,
            })
        } catch (error) {
            logger.error("Failed to add credits", error as Error)
            res.status(500).json({
                error: "Internal server error",
            })
        }
    })

    /**
     * POST /api/debit - Debit credits from user account
     */
    router.post("/api/debit", async (req: Request, res: Response) => {
        try {
            const { userId, amount, reason } = req.body

            if (!userId || !amount) {
                return res.status(400).json({
                    error: "Missing required fields: userId, amount",
                })
            }

            const result = await creditSystem.debit(
                userId,
                amount,
                reason || "Manual debit"
            )

            if (!result.success) {
                return res.status(400).json({
                    error: result.error,
                })
            }

            logger.info("Credits debited", {
                userId,
                amount,
                newBalance: result.newBalance,
            })

            res.json({
                success: true,
                transactionId: result.transactionId,
                newBalance: result.newBalance,
            })
        } catch (error) {
            logger.error("Failed to debit credits", error as Error)
            res.status(500).json({
                error: "Internal server error",
            })
        }
    })

    /**
     * GET /api/transactions/:userId - Get transaction history
     */
    router.get(
        "/api/transactions/:userId",
        async (req: Request, res: Response) => {
            try {
                const { userId } = req.params
                const limit = parseInt(req.query.limit as string) || 100

                const transactions = await creditSystem.getTransactionHistory(
                    userId,
                    limit
                )

                logger.info("Transaction history queried", {
                    userId,
                    count: transactions.length,
                })

                res.json({
                    userId,
                    transactions,
                })
            } catch (error) {
                logger.error(
                    "Failed to get transaction history",
                    error as Error
                )
                res.status(500).json({
                    error: "Internal server error",
                })
            }
        }
    )

    return router
}
