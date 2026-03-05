// Atomic Credit System
// Focus: Atomicity, Row Locking, Audit Trail

import { Pool } from "pg"
import { createLogger } from "../logger/pino-logger"

const logger = createLogger("CreditSystem")

export interface CreditSystem {
    getBalance(userId: string): Promise<number>
    debit(
        userId: string,
        amount: number,
        reason: string
    ): Promise<TransactionResult>
    credit(
        userId: string,
        amount: number,
        reason: string
    ): Promise<TransactionResult>
    getTransactionHistory(
        userId: string,
        limit?: number
    ): Promise<Transaction[]>
}

export interface TransactionResult {
    success: boolean
    transactionId?: string
    newBalance?: number
    error?: string
}

export interface Transaction {
    id: string
    userId: string
    amount: number
    type: "debit" | "credit"
    reason: string
    balanceBefore: number
    balanceAfter: number
    timestamp: Date
}

export class CreditSystemImpl implements CreditSystem {
    constructor(private pool: Pool) {}

    async getBalance(userId: string): Promise<number> {
        const result = await this.pool.query(
            "SELECT balance FROM user_accounts WHERE user_id = $1",
            [userId]
        )
        return result.rows[0]?.balance ? parseFloat(result.rows[0].balance) : 0
    }

    async debit(
        userId: string,
        amount: number,
        reason: string
    ): Promise<TransactionResult> {
        const client = await this.pool.connect()

        try {
            await client.query("BEGIN")

            // Lock row and get current balance using FOR NO KEY UPDATE
            const lockResult = await client.query(
                "SELECT balance FROM user_accounts WHERE user_id = $1 FOR NO KEY UPDATE",
                [userId]
            )

            if (lockResult.rows.length === 0) {
                await client.query("ROLLBACK")
                logger.warn("Debit failed: user account not found", { userId })
                return { success: false, error: "User account not found" }
            }

            const balanceBefore = parseFloat(lockResult.rows[0].balance)

            // Validate sufficient balance
            if (balanceBefore < amount) {
                await client.query("ROLLBACK")
                logger.warn("Insufficient balance", {
                    userId,
                    amount,
                    balanceBefore,
                })
                return { success: false, error: "Insufficient balance" }
            }

            const balanceAfter = balanceBefore - amount

            // Sanity check - should never be negative due to validation above
            if (balanceAfter < 0) {
                await client.query("ROLLBACK")
                logger.fatal("NEGATIVE BALANCE DETECTED - BUG", {
                    userId,
                    balanceAfter,
                })
                return { success: false, error: "Internal error" }
            }

            // Update balance
            await client.query(
                "UPDATE user_accounts SET balance = $1, updated_at = NOW() WHERE user_id = $2",
                [balanceAfter, userId]
            )

            // Record transaction
            const txResult = await client.query(
                `INSERT INTO transactions (user_id, amount, type, reason, balance_before, balance_after)
         VALUES ($1, $2, 'debit', $3, $4, $5)
         RETURNING id`,
                [userId, amount, reason, balanceBefore, balanceAfter]
            )

            await client.query("COMMIT")

            logger.info("Debit successful", {
                userId,
                amount,
                reason,
                transactionId: txResult.rows[0].id,
                balanceAfter,
            })

            return {
                success: true,
                transactionId: txResult.rows[0].id,
                newBalance: balanceAfter,
            }
        } catch (error) {
            await client.query("ROLLBACK")
            logger.error("Debit transaction failed", error as Error, {
                userId,
                amount,
                reason,
            })
            return { success: false, error: "Transaction failed" }
        } finally {
            client.release()
        }
    }

    async credit(
        userId: string,
        amount: number,
        reason: string
    ): Promise<TransactionResult> {
        const client = await this.pool.connect()

        try {
            await client.query("BEGIN")

            // Upsert: Create account if it doesn't exist, then lock it
            await client.query(
                `INSERT INTO user_accounts (user_id, balance) VALUES ($1, 0)
         ON CONFLICT (user_id) DO NOTHING`,
                [userId]
            )

            const lockResult = await client.query(
                "SELECT balance FROM user_accounts WHERE user_id = $1 FOR NO KEY UPDATE",
                [userId]
            )

            const balanceBefore = parseFloat(lockResult.rows[0].balance)
            const balanceAfter = balanceBefore + amount

            // Update balance
            await client.query(
                "UPDATE user_accounts SET balance = $1, updated_at = NOW() WHERE user_id = $2",
                [balanceAfter, userId]
            )

            // Record transaction
            const txResult = await client.query(
                `INSERT INTO transactions (user_id, amount, type, reason, balance_before, balance_after)
         VALUES ($1, $2, 'credit', $3, $4, $5)
         RETURNING id`,
                [userId, amount, reason, balanceBefore, balanceAfter]
            )

            await client.query("COMMIT")

            logger.info("Credit successful", {
                userId,
                amount,
                reason,
                transactionId: txResult.rows[0].id,
                balanceAfter,
            })

            return {
                success: true,
                transactionId: txResult.rows[0].id,
                newBalance: balanceAfter,
            }
        } catch (error) {
            await client.query("ROLLBACK")
            logger.error("Credit transaction failed", error as Error, {
                userId,
                amount,
                reason,
            })
            return { success: false, error: "Transaction failed" }
        } finally {
            client.release()
        }
    }

    async getTransactionHistory(
        userId: string,
        limit = 100
    ): Promise<Transaction[]> {
        const result = await this.pool.query(
            `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
            [userId, limit]
        )

        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            amount: parseFloat(row.amount),
            type: row.type,
            reason: row.reason,
            balanceBefore: parseFloat(row.balance_before),
            balanceAfter: parseFloat(row.balance_after),
            timestamp: row.created_at,
        }))
    }
}

// Factory function
export function createCreditSystem(pool: Pool): CreditSystem {
    return new CreditSystemImpl(pool)
}

export default createCreditSystem
