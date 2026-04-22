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
    router.post(
        "/api/usage",
        asyncHandler(async (req: Request, res: Response) => {
            const { userId, type, amount } = req.body

            // Validate required fields
            // Requirement 13.1-13.7: Validation errors
            const validation = validateRequiredFields(req.body, [
                "userId",
                "type",
                "amount",
            ])
            if (!validation.isValid) {
                throw new ApiError(
                    400,
                    "VALIDATION_ERROR",
                    `Missing required fields: ${validation.missingFields?.join(", ")}`
                )
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
                    throw new ApiError(
                        400,
                        "INVALID_TYPE",
                        `Invalid usage type: ${type}`
                    )
            }

            logger.info("Usage recorded", { userId, type, amount })

            res.json({
                success: true,
                message: "Usage recorded successfully",
            })
        })
    )

    /**
     * GET /api/balance - Query credit system for user balance
     */
    router.get(
        "/api/balance/:userId",
        asyncHandler(async (req: Request, res: Response) => {
            const { userId } = req.params

            if (!userId) {
                throw new ApiError(
                    400,
                    "VALIDATION_ERROR",
                    "User ID is required"
                )
            }

            const balance = await creditSystem.getBalance(userId)

            logger.info("Balance queried", { userId, balance })

            res.json({
                userId,
                balance,
            })
        })
    )

    /**
     * POST /api/credits - Add credits to user account
     */
    router.post(
        "/api/credits",
        asyncHandler(async (req: Request, res: Response) => {
            const { userId, amount, reason } = req.body

            // Validate required fields
            // Requirement 13.1-13.7: Validation errors
            const validation = validateRequiredFields(req.body, [
                "userId",
                "amount",
            ])
            if (!validation.isValid) {
                throw new ApiError(
                    400,
                    "VALIDATION_ERROR",
                    `Missing required fields: ${validation.missingFields?.join(", ")}`
                )
            }

            const result = await creditSystem.credit(
                userId,
                amount,
                reason || "Manual credit"
            )

            if (!result.success) {
                throw new ApiError(400, "CREDIT_FAILED", result.error)
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
        })
    )

    /**
     * POST /api/debit - Debit credits from user account
     */
    router.post(
        "/api/debit",
        asyncHandler(async (req: Request, res: Response) => {
            const { userId, amount, reason } = req.body

            // Validate required fields
            // Requirement 13.1-13.7: Validation errors
            const validation = validateRequiredFields(req.body, [
                "userId",
                "amount",
            ])
            if (!validation.isValid) {
                throw new ApiError(
                    400,
                    "VALIDATION_ERROR",
                    `Missing required fields: ${validation.missingFields?.join(", ")}`
                )
            }

            const result = await creditSystem.debit(
                userId,
                amount,
                reason || "Manual debit"
            )

            if (!result.success) {
                throw new ApiError(400, "DEBIT_FAILED", result.error)
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
        })
    )

    /**
     * GET /api/transactions/:userId - Get transaction history
     */
    router.get(
        "/api/transactions/:userId",
        asyncHandler(async (req: Request, res: Response) => {
            const { userId } = req.params
            const limit = parseInt(req.query.limit as string) || 100

            if (!userId) {
                throw new ApiError(
                    400,
                    "VALIDATION_ERROR",
                    "User ID is required"
                )
            }

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
        })
    )

    return router
}
