// Credit System - Enhanced with Logging and Validation
// Focus: Atomicity, Debugability, Reliability

import { queryOne, transaction } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { PoolClient } from "pg"

// Credit costs per action
export const CREDIT_COSTS = {
    // Chat
    chat_message_received: 1,
    chat_timeout: 10,
    chat_ban: 25,
    chat_unban: 5,

    // YouTube
    youtube_video_download_per_minute: 100,
    youtube_metadata: 0,
    youtube_post_schedule: 50,
    youtube_ai_rewrite_per_1k_tokens: 500,

    // Analytics
    analytics_daily_access: 1000,

    // Streaming
    stream_per_minute_base: 1000,
    stream_destination_extra: 100,

    // Infrastructure
    infra_bandwidth_per_gb: 5000,
    infra_storage_per_gb_month: 1000,
    infra_cache_per_1k_ops: 50,
    infra_api_per_1k_req: 100,
} as const

export type CreditAction = keyof typeof CREDIT_COSTS

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
    return BigInt(row.credits_balance) >= BigInt(cost)
}

/**
 * Deduct credits atomically
 */
export async function deductCredits(
    userId: string,
    action: CreditAction,
    quantity = 1,
    metadata?: Record<string, unknown>
): Promise<DeductResult> {
    const cost = CREDIT_COSTS[action] * quantity

    // Free actions always succeed
    if (cost === 0) return { success: true }

    try {
        return await transaction(async (client: PoolClient) => {
            // Lock row
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

            const current = BigInt(res.rows[0].credits_balance)
            const bigCost = BigInt(cost)

            if (current < bigCost) {
                logger.debug("Insufficient credits", {
                    context: "CREDITS",
                    data: { userId, current: current.toString(), cost },
                })
                return { success: false, error: "Insufficient credits" }
            }

            const newBalance = current - bigCost

            // Sanity check - should never be negative
            if (newBalance < 0n) {
                logger.fatal("NEGATIVE BALANCE DETECTED - BUG", {
                    context: "CREDITS",
                    data: { userId, newBalance: newBalance.toString() },
                })
                return { success: false, error: "Internal error" }
            }

            // Update balance
            await client.query(
                "UPDATE profiles SET credits_balance = $1, updated_at = NOW() WHERE id = $2",
                [newBalance.toString(), userId]
            )

            // Log transaction
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
                    newBalance: newBalance.toString(),
                },
            })

            return { success: true, newBalance: Number(newBalance) }
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

            const current = BigInt(res.rows[0].credits_balance)
            const newBalance = current + BigInt(amount)

            await client.query(
                "UPDATE profiles SET credits_balance = $1, updated_at = NOW() WHERE id = $2",
                [newBalance.toString(), userId]
            )

            await client.query(
                "INSERT INTO credit_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)",
                [userId, amount, type, description]
            )

            logger.info("Credits added", {
                context: "CREDITS",
                data: { userId, amount, type },
            })

            return { success: true, newBalance: Number(newBalance) }
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
