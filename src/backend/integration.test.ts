// Integration Tests for Complete Flows
// Feature: distributed-infrastructure-logging

import { Redis } from "ioredis"
import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { CreditSystemImpl } from "../lib/credits/credit-system"
import { createDiscordAlerter } from "../lib/discord/alerter"
import { MeteringSystemImpl } from "../lib/metering"
import { createShutdownHandler } from "../lib/shutdown"

describe("Integration Tests", () => {
    let pool: Pool
    let redis: Redis
    let creditSystem: CreditSystemImpl
    let meteringSystem: MeteringSystemImpl
    const testDbUrl =
        process.env.DATABASE_URL ||
        "postgres://platform:devpassword@localhost:5432/platform_test"
    const testRedisUrl = process.env.REDIS_URL || "redis://localhost:6379"

    beforeAll(async () => {
        pool = new Pool({ connectionString: testDbUrl })
        redis = new Redis(testRedisUrl)
        creditSystem = new CreditSystemImpl(pool)
        meteringSystem = new MeteringSystemImpl(pool, creditSystem)
    })

    afterAll(async () => {
        await pool.end()
        await redis.quit()
    })

    describe("Complete Credit Transaction Flow", () => {
        it("should handle complete credit lifecycle", async () => {
            const testUserId = `test-integration-${Date.now()}`

            try {
                // 1. Add initial credits
                const creditResult = await creditSystem.credit(
                    testUserId,
                    100,
                    "Initial credit"
                )
                expect(creditResult.success).toBe(true)
                expect(creditResult.newBalance).toBe(100)

                // 2. Check balance
                const balance1 = await creditSystem.getBalance(testUserId)
                expect(balance1).toBe(100)

                // 3. Debit some credits
                const debitResult = await creditSystem.debit(
                    testUserId,
                    30,
                    "Usage charge"
                )
                expect(debitResult.success).toBe(true)
                expect(debitResult.newBalance).toBe(70)

                // 4. Check balance again
                const balance2 = await creditSystem.getBalance(testUserId)
                expect(balance2).toBe(70)

                // 5. Get transaction history
                const history =
                    await creditSystem.getTransactionHistory(testUserId)
                expect(history.length).toBe(2)
                expect(history[0].type).toBe("debit")
                expect(history[1].type).toBe("credit")

                // 6. Try to debit more than balance (should fail)
                const failedDebit = await creditSystem.debit(
                    testUserId,
                    100,
                    "Excessive charge"
                )
                expect(failedDebit.success).toBe(false)
                expect(failedDebit.error).toContain("Insufficient balance")

                // 7. Balance should remain unchanged
                const balance3 = await creditSystem.getBalance(testUserId)
                expect(balance3).toBe(70)
            } finally {
                // Cleanup
                await pool.query(
                    "DELETE FROM transactions WHERE user_id = $1",
                    [testUserId]
                )
                await pool.query(
                    "DELETE FROM user_accounts WHERE user_id = $1",
                    [testUserId]
                )
            }
        })
    })

    describe("Complete Metering and Billing Flow", () => {
        it("should record usage and bill correctly", async () => {
            const testUserId = `test-metering-${Date.now()}`

            try {
                // 1. Setup user with credits
                await pool.query(
                    "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2)",
                    [testUserId, 1000.0]
                )

                // 2. Record various usage types
                await meteringSystem.recordBandwidth(testUserId, 1024 ** 3) // 1 GB
                await meteringSystem.recordStorage(testUserId, 512 * 1024 ** 2) // 512 MB
                await meteringSystem.recordCacheOp(testUserId, "hit")
                await meteringSystem.recordApiCall(testUserId, "/api/test")

                // 3. Verify usage was recorded
                const usageResult = await pool.query(
                    "SELECT COUNT(*) as count FROM usage_metrics WHERE user_id = $1",
                    [testUserId]
                )
                expect(parseInt(usageResult.rows[0].count)).toBe(4)

                // 4. Run aggregation (for yesterday's data)
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)

                // Insert usage for yesterday
                await pool.query(
                    `INSERT INTO usage_metrics (user_id, metric_type, value, unit, created_at)
           VALUES 
             ($1, 'bandwidth', $2, 'bytes', $3),
             ($1, 'storage', $4, 'bytes', $3)`,
                    [testUserId, 2 * 1024 ** 3, yesterday, 1024 ** 3]
                )

                const aggregationResult = await meteringSystem.aggregateDaily()
                expect(aggregationResult.usersProcessed).toBeGreaterThanOrEqual(
                    1
                )

                // 5. Verify summary was created
                const summaryResult = await pool.query(
                    "SELECT * FROM daily_usage_summary WHERE user_id = $1",
                    [testUserId]
                )
                expect(summaryResult.rows.length).toBeGreaterThan(0)

                // 6. Verify balance was debited
                const finalBalance = await creditSystem.getBalance(testUserId)
                expect(finalBalance).toBeLessThan(1000)
            } finally {
                // Cleanup
                await pool.query(
                    "DELETE FROM usage_metrics WHERE user_id = $1",
                    [testUserId]
                )
                await pool.query(
                    "DELETE FROM daily_usage_summary WHERE user_id = $1",
                    [testUserId]
                )
                await pool.query(
                    "DELETE FROM transactions WHERE user_id = $1",
                    [testUserId]
                )
                await pool.query(
                    "DELETE FROM user_accounts WHERE user_id = $1",
                    [testUserId]
                )
            }
        })
    })

    describe("Error Logging and Discord Alerts", () => {
        it("should handle errors gracefully", async () => {
            const testUserId = "non-existent-user"

            // Try to debit from non-existent user
            const result = await creditSystem.debit(testUserId, 100, "Test")

            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
        })
    })

    describe("Graceful Shutdown", () => {
        it("should shutdown gracefully", async () => {
            const testPool = new Pool({ connectionString: testDbUrl })
            const testRedis = new Redis(testRedisUrl)
            const discordAlerter = createDiscordAlerter(
                process.env.DISCORD_WEBHOOK_URL ||
                    "https://discord.com/api/webhooks/test"
            )

            const shutdownHandler = createShutdownHandler(
                testPool,
                testRedis,
                discordAlerter
            )

            // Register handlers
            shutdownHandler.register()

            // Note: We can't actually test shutdown without killing the process
            // This just verifies the handler can be created and registered
            expect(shutdownHandler).toBeDefined()

            // Cleanup
            await testPool.end()
            await testRedis.quit()
        })
    })
})
