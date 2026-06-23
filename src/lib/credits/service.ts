import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { CREDIT_COSTS, type CreditAction } from "./index"

export interface DeductResult {
    success: boolean
    transactionId?: string
    newBalance?: number
    error?: string
}

export interface GrantResult {
    success: boolean
    transactionId?: string
    newBalance?: number
    error?: string
}

export interface BalanceResult {
    balance: number
}

export interface TransactionRecord {
    id: string
    userId: string
    amount: number
    type: "debit" | "credit"
    reason: string
    balanceBefore: number
    balanceAfter: number
    createdAt: string
}

export async function getBalance(userId: string): Promise<BalanceResult> {
    const row = await db.queryOne<{ balance: string }>(
        "SELECT balance FROM user_accounts WHERE user_id = $1",
        [userId]
    )
    return { balance: row ? parseFloat(row.balance) : 0 }
}

export async function deductAction(
    userId: string,
    action: CreditAction,
    quantity = 1
): Promise<DeductResult> {
    const cost = CREDIT_COSTS[action] * quantity
    if (cost === 0) return { success: true }

    try {
        return await db.transaction(async client => {
            const lockResult = await client.query<{ balance: string }>(
                "SELECT balance FROM user_accounts WHERE user_id = $1 FOR NO KEY UPDATE",
                [userId]
            )

            if (lockResult.rows.length === 0) {
                return { success: false, error: "User account not found" }
            }

            const balanceBefore = parseFloat(lockResult.rows[0].balance)
            if (balanceBefore < cost) {
                return { success: false, error: "Insufficient balance" }
            }

            const balanceAfter = balanceBefore - cost

            await client.query(
                "UPDATE user_accounts SET balance = $1, updated_at = NOW() WHERE user_id = $2",
                [balanceAfter, userId]
            )

            const txResult = await client.query<{ id: string }>(
                `INSERT INTO transactions (user_id, amount, type, reason, balance_before, balance_after)
                 VALUES ($1, $2, 'debit', $3, $4, $5)
                 RETURNING id`,
                [
                    userId,
                    cost,
                    `${action}${quantity > 1 ? ` x${quantity}` : ""}`,
                    balanceBefore,
                    balanceAfter,
                ]
            )

            logger.info("Credits deducted for action", {
                userId,
                action,
                cost,
                balanceAfter,
                transactionId: txResult.rows[0].id,
            })

            return {
                success: true,
                transactionId: txResult.rows[0].id,
                newBalance: balanceAfter,
            }
        })
    } catch (error) {
        logger.error("deductAction failed", {
            error,
            data: { userId, action, cost },
        })
        return { success: false, error: "Transaction failed" }
    }
}

export async function adminGrant(
    userId: string,
    amount: number,
    reason: string
): Promise<GrantResult> {
    if (amount <= 0) {
        return { success: false, error: "Amount must be positive" }
    }

    try {
        return await db.transaction(async client => {
            await client.query(
                `INSERT INTO user_accounts (user_id, balance) VALUES ($1, 0)
                 ON CONFLICT (user_id) DO NOTHING`,
                [userId]
            )

            const lockResult = await client.query<{ balance: string }>(
                "SELECT balance FROM user_accounts WHERE user_id = $1 FOR NO KEY UPDATE",
                [userId]
            )

            const balanceBefore = parseFloat(lockResult.rows[0].balance)
            const balanceAfter = balanceBefore + amount

            await client.query(
                "UPDATE user_accounts SET balance = $1, updated_at = NOW() WHERE user_id = $2",
                [balanceAfter, userId]
            )

            const txResult = await client.query<{ id: string }>(
                `INSERT INTO transactions (user_id, amount, type, reason, balance_before, balance_after)
                 VALUES ($1, $2, 'credit', $3, $4, $5)
                 RETURNING id`,
                [userId, amount, reason, balanceBefore, balanceAfter]
            )

            logger.info("Admin grant successful", {
                userId,
                amount,
                reason,
                balanceAfter,
                transactionId: txResult.rows[0].id,
            })

            return {
                success: true,
                transactionId: txResult.rows[0].id,
                newBalance: balanceAfter,
            }
        })
    } catch (error) {
        logger.error("adminGrant failed", {
            error,
            data: { userId, amount, reason },
        })
        return { success: false, error: "Transaction failed" }
    }
}

export async function getTransactions(
    userId: string,
    limit = 50
): Promise<TransactionRecord[]> {
    const rows = await db.queryMany<{
        id: string
        user_id: string
        amount: string
        type: "debit" | "credit"
        reason: string
        balance_before: string
        balance_after: string
        created_at: Date
    }>(
        `SELECT id, user_id, amount, type, reason, balance_before, balance_after, created_at
         FROM transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
    )

    return rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        amount: parseFloat(r.amount),
        type: r.type,
        reason: r.reason,
        balanceBefore: parseFloat(r.balance_before),
        balanceAfter: parseFloat(r.balance_after),
        createdAt: r.created_at.toISOString(),
    }))
}

/**
 * Deduct an arbitrary amount (for computed costs like video storage).
 */
export async function deductAmount(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>
): Promise<DeductResult> {
    if (amount <= 0) {
        return { success: true, transactionId: undefined }
    }

    const amountRounded = +amount.toFixed(2)

    try {
        return await db.transaction(async client => {
            const lockResult = await client.query<{ balance: string }>(
                "SELECT balance FROM user_accounts WHERE user_id = $1 FOR NO KEY UPDATE",
                [userId]
            )

            if (lockResult.rows.length === 0) {
                return { success: false, error: "User account not found" }
            }

            const balanceBefore = parseFloat(lockResult.rows[0].balance)
            if (balanceBefore < amountRounded) {
                return { success: false, error: "Insufficient balance" }
            }

            const balanceAfter = balanceBefore - amountRounded

            await client.query(
                "UPDATE user_accounts SET balance = $1, updated_at = NOW() WHERE user_id = $2",
                [balanceAfter, userId]
            )

            const txResult = await client.query<{ id: string }>(
                `INSERT INTO transactions (user_id, amount, type, reason, balance_before, balance_after)
                 VALUES ($1, $2, 'debit', $3, $4, $5)
                 RETURNING id`,
                [userId, amountRounded, reason, balanceBefore, balanceAfter]
            )

            logger.info("Amount deducted", {
                amount: amountRounded,
                balanceAfter,
                transactionId: txResult.rows[0].id,
                metadata,
            })

            return {
                success: true,
                transactionId: txResult.rows[0].id,
                newBalance: balanceAfter,
            }
        })
    } catch (error) {
        logger.error("deductAmount failed", {
            error,
            data: { userId, amount: amountRounded, reason },
        })
        return { success: false, error: "Transaction failed" }
    }
}

/**
 * Grant credits to a user (for refunds or admin).
 */
export async function grantCredits(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>
): Promise<GrantResult> {
    if (amount <= 0) {
        return { success: true, transactionId: undefined }
    }

    const amountRounded = +amount.toFixed(2)

    try {
        return await db.transaction(async client => {
            await client.query(
                `INSERT INTO user_accounts (user_id, balance) VALUES ($1, 0)
                 ON CONFLICT (user_id) DO NOTHING`,
                [userId]
            )

            const lockResult = await client.query<{ balance: string }>(
                "SELECT balance FROM user_accounts WHERE user_id = $1 FOR NO KEY UPDATE",
                [userId]
            )

            const balanceBefore = parseFloat(lockResult.rows[0].balance)
            const balanceAfter = balanceBefore + amountRounded

            await client.query(
                "UPDATE user_accounts SET balance = $1, updated_at = NOW() WHERE user_id = $2",
                [balanceAfter, userId]
            )

            const txResult = await client.query<{ id: string }>(
                `INSERT INTO transactions (user_id, amount, type, reason, balance_before, balance_after)
                 VALUES ($1, $2, 'credit', $3, $4, $5)
                 RETURNING id`,
                [userId, amountRounded, reason, balanceBefore, balanceAfter]
            )

            logger.info("Credits granted", {
                amount: amountRounded,
                balanceAfter,
                transactionId: txResult.rows[0].id,
                metadata,
            })

            return {
                success: true,
                transactionId: txResult.rows[0].id,
                newBalance: balanceAfter,
            }
        })
    } catch (error) {
        logger.error("grantCredits failed", {
            error,
            data: { userId, amount: amountRounded, reason },
        })
        return { success: false, error: "Transaction failed" }
    }
}

export { CREDIT_COSTS }
export type { CreditAction }
