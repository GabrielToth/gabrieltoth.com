// Credit System Property-Based Tests
// Feature: distributed-infrastructure-logging

import fc from "fast-check"
import { Pool } from "pg"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { CreditSystemImpl } from "./credit-system"

// Note: These are integration tests that require a running PostgreSQL instance
describe("Credit System Properties", () => {
    let pool: Pool
    let creditSystem: CreditSystemImpl
    const testDbUrl =
        process.env.DATABASE_URL ||
        "postgres://platform:devpassword@localhost:5432/platform_test"

    beforeAll(async () => {
        pool = new Pool({ connectionString: testDbUrl })
        creditSystem = new CreditSystemImpl(pool)
    })

    afterAll(async () => {
        await pool.end()
    })

    beforeEach(async () => {
        // Clean up test data
        await pool.query("DELETE FROM transactions WHERE user_id LIKE 'test-%'")
        await pool.query(
            "DELETE FROM user_accounts WHERE user_id LIKE 'test-%'"
        )
    })

    // Feature: distributed-infrastructure-logging, Property 19: Insufficient balance rejection
    // **Validates: Requirements 4.2**
    describe("Property 19: Insufficient balance rejection", () => {
        it("should reject debit when amount exceeds balance", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.integer({ min: 1, max: 100 }),
                    fc.integer({ min: 101, max: 200 }),
                    async (userId, balance, debitAmount) => {
                        const testUserId = `test-${userId}`

                        // Setup: Create account with balance
                        await pool.query(
                            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                            [testUserId, balance]
                        )

                        // Try to debit more than balance
                        const result = await creditSystem.debit(
                            testUserId,
                            debitAmount,
                            "test"
                        )

                        // Should fail
                        expect(result.success).toBe(false)
                        expect(result.error).toContain("Insufficient balance")

                        // Balance should remain unchanged
                        const finalBalance =
                            await creditSystem.getBalance(testUserId)
                        expect(finalBalance).toBe(balance)
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 20: Balance non-negativity invariant
    // **Validates: Requirements 4.4**
    describe("Property 20: Balance non-negativity invariant", () => {
        it("should never allow negative balance", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.array(
                        fc.record({
                            type: fc.constantFrom("credit", "debit"),
                            amount: fc.integer({ min: 1, max: 50 }),
                        }),
                        { minLength: 1, maxLength: 10 }
                    ),
                    async (userId, operations) => {
                        const testUserId = `test-${userId}`

                        // Execute operations
                        for (const op of operations) {
                            if (op.type === "credit") {
                                await creditSystem.credit(
                                    testUserId,
                                    op.amount,
                                    "test"
                                )
                            } else {
                                await creditSystem.debit(
                                    testUserId,
                                    op.amount,
                                    "test"
                                )
                            }
                        }

                        // Balance should never be negative
                        const balance =
                            await creditSystem.getBalance(testUserId)
                        expect(balance).toBeGreaterThanOrEqual(0)
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 21: Transaction logging completeness
    // **Validates: Requirements 4.5**
    describe("Property 21: Transaction logging completeness", () => {
        it("should log all transaction details", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.integer({ min: 1, max: 100 }),
                    fc.string(),
                    async (userId, amount, reason) => {
                        const testUserId = `test-${userId}`

                        // Perform credit
                        const result = await creditSystem.credit(
                            testUserId,
                            amount,
                            reason
                        )

                        if (result.success) {
                            // Check transaction history
                            const history =
                                await creditSystem.getTransactionHistory(
                                    testUserId
                                )

                            expect(history.length).toBeGreaterThan(0)
                            const tx = history[0]
                            expect(tx.userId).toBe(testUserId)
                            expect(tx.amount).toBe(amount)
                            expect(tx.type).toBe("credit")
                            expect(tx.reason).toBe(reason)
                            expect(tx.timestamp).toBeDefined()
                        }
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 22: Transaction rollback on failure
    // **Validates: Requirements 4.7**
    describe("Property 22: Transaction rollback on failure", () => {
        it("should rollback on insufficient balance", async () => {
            const testUserId = "test-rollback-user"

            // Setup: Create account with 50 balance
            await pool.query(
                "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                [testUserId, 50]
            )

            const initialBalance = await creditSystem.getBalance(testUserId)
            const initialHistory =
                await creditSystem.getTransactionHistory(testUserId)

            // Try to debit 100 (should fail)
            const result = await creditSystem.debit(testUserId, 100, "test")

            expect(result.success).toBe(false)

            // Balance should be unchanged
            const finalBalance = await creditSystem.getBalance(testUserId)
            expect(finalBalance).toBe(initialBalance)

            // No new transaction should be recorded
            const finalHistory =
                await creditSystem.getTransactionHistory(testUserId)
            expect(finalHistory.length).toBe(initialHistory.length)
        })
    })

    // Feature: distributed-infrastructure-logging, Property 23: Transaction history persistence
    // **Validates: Requirements 4.8**
    describe("Property 23: Transaction history persistence", () => {
        it("should persist all transaction details", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.array(fc.integer({ min: 1, max: 50 }), {
                        minLength: 1,
                        maxLength: 5,
                    }),
                    async (userId, amounts) => {
                        const testUserId = `test-${userId}`

                        // Perform multiple credits
                        for (const amount of amounts) {
                            await creditSystem.credit(
                                testUserId,
                                amount,
                                `credit-${amount}`
                            )
                        }

                        // Get history
                        const history =
                            await creditSystem.getTransactionHistory(testUserId)

                        // Should have all transactions
                        expect(history.length).toBe(amounts.length)

                        // Each transaction should have complete details
                        history.forEach(tx => {
                            expect(tx.id).toBeDefined()
                            expect(tx.userId).toBe(testUserId)
                            expect(tx.amount).toBeGreaterThan(0)
                            expect(tx.type).toBe("credit")
                            expect(tx.balanceBefore).toBeGreaterThanOrEqual(0)
                            expect(tx.balanceAfter).toBeGreaterThan(
                                tx.balanceBefore
                            )
                            expect(tx.timestamp).toBeDefined()
                        })
                    }
                ),
                { numRuns: 10 }
            )
        })
    })

    // Unit tests for edge cases
    describe("Unit Tests: Credit System Edge Cases", () => {
        it("should handle debit with exact balance", async () => {
            const testUserId = "test-exact-balance"

            await pool.query(
                "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                [testUserId, 100]
            )

            const result = await creditSystem.debit(
                testUserId,
                100,
                "exact debit"
            )

            expect(result.success).toBe(true)
            expect(result.newBalance).toBe(0)

            const balance = await creditSystem.getBalance(testUserId)
            expect(balance).toBe(0)
        })

        it("should create account on first credit (upsert)", async () => {
            const testUserId = "test-new-user"

            const result = await creditSystem.credit(
                testUserId,
                100,
                "initial credit"
            )

            expect(result.success).toBe(true)
            expect(result.newBalance).toBe(100)

            const balance = await creditSystem.getBalance(testUserId)
            expect(balance).toBe(100)
        })

        it("should handle transaction history pagination", async () => {
            const testUserId = "test-pagination"

            // Create 10 transactions
            for (let i = 0; i < 10; i++) {
                await creditSystem.credit(testUserId, 10, `credit-${i}`)
            }

            // Get limited history
            const history = await creditSystem.getTransactionHistory(
                testUserId,
                5
            )

            expect(history.length).toBe(5)

            // Should be most recent first
            expect(history[0].reason).toContain("credit-9")
        })

        it("should return 0 balance for non-existent user", async () => {
            const balance = await creditSystem.getBalance("non-existent-user")
            expect(balance).toBe(0)
        })

        it("should fail debit for non-existent user", async () => {
            const result = await creditSystem.debit(
                "non-existent-user",
                100,
                "test"
            )

            expect(result.success).toBe(false)
            expect(result.error).toContain("not found")
        })

        it("should handle concurrent transactions correctly", async () => {
            const testUserId = "test-concurrent"

            // Setup initial balance
            await pool.query(
                "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                [testUserId, 1000]
            )

            // Execute multiple debits concurrently
            const promises = []
            for (let i = 0; i < 5; i++) {
                promises.push(
                    creditSystem.debit(testUserId, 100, `concurrent-${i}`)
                )
            }

            const results = await Promise.all(promises)

            // All should succeed
            const successCount = results.filter(r => r.success).length
            expect(successCount).toBe(5)

            // Final balance should be correct
            const balance = await creditSystem.getBalance(testUserId)
            expect(balance).toBe(500)
        })
    })
})
