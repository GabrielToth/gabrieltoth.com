import { CREDIT_COSTS, type CreditAction } from "./constants"
export { CREDIT_COSTS, type CreditAction }

import { queryOne, transaction } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { PoolClient } from "pg"

interface DeductResult {
    success: boolean
    newBalance?: number
    error?: string
}

/**
 * Check if user has enough credits for an action
 */
export async function hasCredits(
    userId: string,
    action: CreditAction,
    quantity = 1
): Promise<boolean> {
    const cost = CREDIT_COSTS[action] * quantity
    if (cost === 0) return true

    const row = await queryOne<{ credits_balance: string }>(
        "SELECT credits_balance FROM profiles WHERE id = $1",
        [userId]
    )

    if (!row) return false
    return parseFloat(row.credits_balance) >= cost
}

/**
 * Deduct credits atomically
 */
export async function deductCredits(
    userId: string,
    action: CreditAction,
    quantity = 1,
    _metadata?: Record<string, unknown>
): Promise<DeductResult> {
    const cost = CREDIT_COSTS[action] * quantity

    if (cost === 0) return { success: true }

    try {
        return await transaction(async (client: PoolClient) => {
            const res = await client.query<{ credits_balance: string }>(
                "SELECT credits_balance FROM profiles WHERE id = $1 FOR UPDATE",
                [userId]
            )

            if (res.rowCount === 0) {
                logger.warn("Deduct failed: user not found", {
                    context: "CREDITS",
                    data: { userId },
                })
                return { success: false, error: "User not found" }
            }

            const current = parseFloat(res.rows[0].credits_balance)

            if (current < cost) {
                logger.debug("Insufficient credits", {
                    context: "CREDITS",
                    data: { userId, current, cost },
                })
                return { success: false, error: "Insufficient credits" }
            }

            const newBalance = +(current - cost).toFixed(2)

            if (newBalance < 0) {
                logger.fatal("NEGATIVE BALANCE DETECTED - BUG", {
                    context: "CREDITS",
                    data: { userId, newBalance },
                })
                return { success: false, error: "Internal error" }
            }

            await client.query(
                "UPDATE profiles SET credits_balance = $1, updated_at = NOW() WHERE id = $2",
                [newBalance.toFixed(2), userId]
            )

            await client.query(
                "INSERT INTO credit_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)",
                [
                    userId,
                    -cost,
                    "usage",
                    `${action}${quantity > 1 ? ` x${quantity}` : ""}`,
                ]
            )

            logger.debug("Credits deducted", {
                context: "CREDITS",
                data: {
                    userId,
                    action,
                    cost,
                    newBalance,
                },
            })

            return { success: true, newBalance }
        })
    } catch (err) {
        logger.error("Deduct credits failed", {
            context: "CREDITS",
            error: err as Error,
            data: { userId, action },
        })
        return { success: false, error: "Internal error" }
    }
}

/**
 * Add credits (admin or purchase)
 */
export async function addCredits(
    userId: string,
    amount: number,
    type: "purchase" | "subscription" | "refund",
    description: string
): Promise<DeductResult> {
    try {
        return await transaction(async (client: PoolClient) => {
            const res = await client.query<{ credits_balance: string }>(
                "SELECT credits_balance FROM profiles WHERE id = $1 FOR UPDATE",
                [userId]
            )

            if (res.rowCount === 0) {
                return { success: false, error: "User not found" }
            }

            const current = parseFloat(res.rows[0].credits_balance)
            const newBalance = +(current + amount).toFixed(2)

            await client.query(
                "UPDATE profiles SET credits_balance = $1, updated_at = NOW() WHERE id = $2",
                [newBalance.toFixed(2), userId]
            )

            await client.query(
                "INSERT INTO credit_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)",
                [userId, amount, type, description]
            )

            logger.info("Credits added", {
                context: "CREDITS",
                data: { userId, amount, type },
            })

            return { success: true, newBalance }
        })
    } catch (err) {
        logger.error("Add credits failed", {
            context: "CREDITS",
            error: err as Error,
        })
        return { success: false, error: "Internal error" }
    }
}

export default { CREDIT_COSTS, hasCredits, deductCredits, addCredits }
