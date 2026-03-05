// Property-Based Tests for Metering System
// Feature: distributed-infrastructure-logging

import fc from "fast-check"
import { Pool } from "pg"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { CreditSystemImpl } from "../credits/credit-system"
import { MeteringSystemImpl } from "./index"

describe("Metering System Properties", () => {
    let pool: Pool
    let meteringSystem: MeteringSystemImpl
    let creditSystem: CreditSystemImpl
    const testDbUrl =
        process.env.DATABASE_URL ||
        "postgres://platform:devpassword@localhost:5432/platform_test"

    beforeAll(async () => {
        pool = new Pool({ connectionString: testDbUrl })
        creditSystem = new CreditSystemImpl(pool)
        meteringSystem = new MeteringSystemImpl(pool, creditSystem)
    })

    afterAll(async () => {
        await pool.end()
    })

    beforeEach(async () => {
        // Clean up test data
        await pool.query(
            'DELETE FROM usage_metrics WHERE user_id LIKE "test-%"'
        )
        await pool.query(
            'DELETE FROM daily_usage_summary WHERE user_id LIKE "test-%"'
        )
        await pool.query('DELETE FROM transactions WHERE user_id LIKE "test-%"')
        await pool.query(
            'DELETE FROM user_accounts WHERE user_id LIKE "test-%"'
        )
    })

    // Feature: distributed-infrastructure-logging, Property 24: Bandwidth recording persistence
    // **Validates: Requirements 5.1**
    describe("Property 24: Bandwidth recording persistence", () => {
        it("should persist bandwidth recordings to usage_metrics table", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.integer({ min: 1, max: 1000000000 }), // bytes
                    async (userId, bytes) => {
                        const testUserId = `test-${userId}`

                        // Setup user account
                        await pool.query(
                            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                            [testUserId, 1000.0]
                        )

                        // Record bandwidth
                        await meteringSystem.recordBandwidth(testUserId, bytes)

                        // Verify entry exists in usage_metrics
                        const result = await pool.query(
                            `SELECT * FROM usage_metrics 
                             WHERE user_id = $1 AND metric_type = "bandwidth" 
                             ORDER BY created_at DESC LIMIT 1`,
                            [testUserId]
                        )

                        expect(result.rows.length).toBe(1)
                        expect(result.rows[0].metric_type).toBe("bandwidth")
                        expect(parseFloat(result.rows[0].value)).toBe(bytes)
                        expect(result.rows[0].unit).toBe("bytes")
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 25: Storage recording persistence
    // **Validates: Requirements 5.2**
    describe("Property 25: Storage recording persistence", () => {
        it("should persist storage recordings to usage_metrics table", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.integer({ min: 1, max: 1000000000 }), // bytes
                    async (userId, bytes) => {
                        const testUserId = `test-${userId}`

                        await pool.query(
                            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                            [testUserId, 1000.0]
                        )

                        await meteringSystem.recordStorage(testUserId, bytes)

                        const result = await pool.query(
                            `SELECT * FROM usage_metrics 
                             WHERE user_id = $1 AND metric_type = "storage" 
                             ORDER BY created_at DESC LIMIT 1`,
                            [testUserId]
                        )

                        expect(result.rows.length).toBe(1)
                        expect(result.rows[0].metric_type).toBe("storage")
                        expect(parseFloat(result.rows[0].value)).toBe(bytes)
                        expect(result.rows[0].unit).toBe("bytes")
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 26: Cache operation recording
    // **Validates: Requirements 5.3**
    describe("Property 26: Cache operation recording", () => {
        it("should persist cache operations to usage_metrics table", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.constantFrom("hit", "miss", "set"),
                    async (userId, operation: "hit" | "miss" | "set") => {
                        const testUserId = `test-${userId}`

                        await pool.query(
                            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                            [testUserId, 1000.0]
                        )

                        await meteringSystem.recordCacheOp(
                            testUserId,
                            operation
                        )

                        const result = await pool.query(
                            `SELECT * FROM usage_metrics 
                             WHERE user_id = $1 AND metric_type = "cache_ops" 
                             ORDER BY created_at DESC LIMIT 1`,
                            [testUserId]
                        )

                        expect(result.rows.length).toBe(1)
                        expect(result.rows[0].metric_type).toBe("cache_ops")
                        expect(parseFloat(result.rows[0].value)).toBe(1)
                        expect(result.rows[0].unit).toBe("operation")
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 27: API call recording
    // **Validates: Requirements 5.4**
    describe("Property 27: API call recording", () => {
        it("should persist API calls to usage_metrics table", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.string({ maxLength: 100 }), // endpoint
                    async (userId, endpoint) => {
                        const testUserId = `test-${userId}`

                        await pool.query(
                            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                            [testUserId, 1000.0]
                        )

                        await meteringSystem.recordApiCall(testUserId, endpoint)

                        const result = await pool.query(
                            `SELECT * FROM usage_metrics 
                             WHERE user_id = $1 AND metric_type = "api_calls" 
                             ORDER BY created_at DESC LIMIT 1`,
                            [testUserId]
                        )

                        expect(result.rows.length).toBe(1)
                        expect(result.rows[0].metric_type).toBe("api_calls")
                        expect(parseFloat(result.rows[0].value)).toBe(1)
                        expect(result.rows[0].unit).toBe("call")
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 28: Raw usage value logging
    // **Validates: Requirements 5.5**
    describe("Property 28: Raw usage value logging", () => {
        it("should store raw usage values without conversion", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.integer({ min: 1, max: 1000000000 }),
                    async (userId, bytes) => {
                        const testUserId = `test-${userId}`

                        await pool.query(
                            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                            [testUserId, 1000.0]
                        )

                        await meteringSystem.recordBandwidth(testUserId, bytes)

                        const result = await pool.query(
                            `SELECT value FROM usage_metrics 
                             WHERE user_id = $1 AND metric_type = "bandwidth" 
                             ORDER BY created_at DESC LIMIT 1`,
                            [testUserId]
                        )

                        // Verify raw value is stored (not converted to GB)
                        expect(parseFloat(result.rows[0].value)).toBe(bytes)
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 29: Unit conversion accuracy
    // **Validates: Requirements 5.6**
    describe("Property 29: Unit conversion accuracy", () => {
        it("should convert bytes to GB accurately during aggregation", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.integer({ min: 1073741824, max: 10737418240 }), // 1GB to 10GB in bytes
                    async (userId, bytes) => {
                        const testUserId = `test-${userId}`

                        await pool.query(
                            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                            [testUserId, 1000.0]
                        )

                        // Insert usage metric for yesterday
                        const yesterday = new Date()
                        yesterday.setDate(yesterday.getDate() - 1)

                        await pool.query(
                            `INSERT INTO usage_metrics (user_id, metric_type, value, unit, created_at)
                             VALUES ($1, "bandwidth", $2, "bytes", $3)`,
                            [testUserId, bytes, yesterday]
                        )

                        // Run aggregation
                        await meteringSystem.aggregateDaily()

                        // Verify conversion accuracy
                        const summary = await pool.query(
                            `SELECT * FROM daily_usage_summary 
                             WHERE user_id = $1 
                             ORDER BY created_at DESC LIMIT 1`,
                            [testUserId]
                        )

                        const expectedGb = bytes / 1024 ** 3
                        const actualGb = parseFloat(
                            summary.rows[0].bandwidth_gb
                        )

                        // Allow small floating point error
                        expect(Math.abs(actualGb - expectedGb)).toBeLessThan(
                            0.0001
                        )
                    }
                ),
                { numRuns: 10 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 30: Cost calculation and billing
    // **Validates: Requirements 5.8**
    describe("Property 30: Cost calculation and billing", () => {
        it("should calculate costs correctly and debit from credit balance", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.record({
                        bandwidth: fc.integer({
                            min: 1073741824,
                            max: 2147483648,
                        }), // 1-2 GB
                        storage: fc.integer({
                            min: 1073741824,
                            max: 2147483648,
                        }), // 1-2 GB
                        cacheOps: fc.integer({ min: 100, max: 1000 }),
                        apiCalls: fc.integer({ min: 100, max: 1000 }),
                    }),
                    async (
                        userId,
                        { bandwidth, storage, cacheOps, apiCalls }
                    ) => {
                        const testUserId = `test-${userId}`

                        // Setup user with balance
                        await pool.query(
                            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                            [testUserId, 1000.0]
                        )

                        const initialBalanceResult = await pool.query(
                            "SELECT balance FROM user_accounts WHERE user_id = $1",
                            [testUserId]
                        )
                        const initialBalance = parseFloat(
                            initialBalanceResult.rows[0].balance
                        )

                        // Insert usage metrics for yesterday
                        const yesterday = new Date()
                        yesterday.setDate(yesterday.getDate() - 1)

                        await pool.query(
                            `INSERT INTO usage_metrics (user_id, metric_type, value, unit, created_at)
                             VALUES 
                               ($1, "bandwidth", $2, "bytes", $3),
                               ($1, "storage", $4, "bytes", $3),
                               ($1, "cache_ops", $5, "operation", $3),
                               ($1, "api_calls", $6, "call", $3)`,
                            [
                                testUserId,
                                bandwidth,
                                yesterday,
                                storage,
                                cacheOps,
                                apiCalls,
                            ]
                        )

                        // Get pricing
                        const pricingResult = await pool.query(
                            "SELECT * FROM pricing_config"
                        )
                        const pricing = new Map(
                            pricingResult.rows.map(row => [
                                row.metric_type,
                                parseFloat(row.cost_per_unit),
                            ])
                        )

                        // Calculate expected cost
                        const bandwidthGb = bandwidth / 1024 ** 3
                        const storageGb = storage / 1024 ** 3
                        const expectedCost =
                            bandwidthGb * pricing.get("bandwidth")! +
                            storageGb * pricing.get("storage")! +
                            cacheOps * pricing.get("cache_ops")! +
                            apiCalls * pricing.get("api_calls")!

                        // Run aggregation
                        await meteringSystem.aggregateDaily()

                        // Verify cost calculation
                        const summary = await pool.query(
                            `SELECT total_cost FROM daily_usage_summary 
                             WHERE user_id = $1 
                             ORDER BY created_at DESC LIMIT 1`,
                            [testUserId]
                        )

                        const actualCost = parseFloat(
                            summary.rows[0].total_cost
                        )
                        expect(
                            Math.abs(actualCost - expectedCost)
                        ).toBeLessThan(0.01)

                        // Verify balance was debited
                        const finalBalanceResult = await pool.query(
                            "SELECT balance FROM user_accounts WHERE user_id = $1",
                            [testUserId]
                        )
                        const finalBalance = parseFloat(
                            finalBalanceResult.rows[0].balance
                        )

                        expect(
                            Math.abs(
                                finalBalance - (initialBalance - expectedCost)
                            )
                        ).toBeLessThan(0.01)
                    }
                ),
                { numRuns: 5 }
            )
        })
    })
})

// Unit Tests for Edge Cases
describe("Metering System Edge Cases", () => {
    let pool: Pool
    let meteringSystem: MeteringSystemImpl
    let creditSystem: CreditSystemImpl
    const testDbUrl =
        process.env.DATABASE_URL ||
        "postgres://platform:devpassword@localhost:5432/platform_test"

    beforeAll(async () => {
        pool = new Pool({ connectionString: testDbUrl })
        creditSystem = new CreditSystemImpl(pool)
        meteringSystem = new MeteringSystemImpl(pool, creditSystem)
    })

    afterAll(async () => {
        await pool.end()
    })

    beforeEach(async () => {
        await pool.query(
            'DELETE FROM usage_metrics WHERE user_id LIKE "test-%"'
        )
        await pool.query(
            'DELETE FROM daily_usage_summary WHERE user_id LIKE "test-%"'
        )
        await pool.query('DELETE FROM transactions WHERE user_id LIKE "test-%"')
        await pool.query(
            'DELETE FROM user_accounts WHERE user_id LIKE "test-%"'
        )
    })

    it("should handle aggregation with no usage data", async () => {
        const result = await meteringSystem.aggregateDaily()

        expect(result.usersProcessed).toBe(0)
        expect(result.totalCost).toBe(0)
        expect(result.errors).toEqual([])
    })

    it("should handle aggregation with failed debit", async () => {
        const testUserId = "test-failed-debit"

        // Set balance to 0 to cause debit failure
        await pool.query(
            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2)",
            [testUserId, 0]
        )

        // Insert large usage for yesterday
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        await pool.query(
            `INSERT INTO usage_metrics (user_id, metric_type, value, unit, created_at)
             VALUES ($1, "bandwidth", $2, "bytes", $3)`,
            [testUserId, 10 * 1024 ** 3, yesterday] // 10 GB
        )

        // Run aggregation
        const result = await meteringSystem.aggregateDaily()

        // Should process user but report error
        expect(result.usersProcessed).toBe(1)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors[0]).toContain("Failed to debit user")

        // Summary should still be created
        const summary = await pool.query(
            "SELECT * FROM daily_usage_summary WHERE user_id = $1",
            [testUserId]
        )
        expect(summary.rows.length).toBe(1)
    })

    it("should handle aggregation re-run for same date (upsert)", async () => {
        const testUserId = "test-upsert"
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const dateStr = yesterday.toISOString().split("T")[0]

        await pool.query(
            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2)",
            [testUserId, 1000.0]
        )

        // Insert usage for yesterday
        await pool.query(
            `INSERT INTO usage_metrics (user_id, metric_type, value, unit, created_at)
             VALUES ($1, "bandwidth", $2, "bytes", $3)`,
            [testUserId, 1024 ** 3, yesterday] // 1 GB
        )

        // Run aggregation first time
        await meteringSystem.aggregateDaily()

        const firstSummary = await pool.query(
            "SELECT * FROM daily_usage_summary WHERE user_id = $1 AND date = $2",
            [testUserId, dateStr]
        )
        expect(firstSummary.rows.length).toBe(1)
        const firstCost = parseFloat(firstSummary.rows[0].total_cost)

        // Insert more usage for same day
        await pool.query(
            `INSERT INTO usage_metrics (user_id, metric_type, value, unit, created_at)
             VALUES ($1, "bandwidth", $2, "bytes", $3)`,
            [testUserId, 2 * 1024 ** 3, yesterday] // 2 GB more
        )

        // Run aggregation again
        await meteringSystem.aggregateDaily()

        // Should update existing summary (upsert)
        const secondSummary = await pool.query(
            "SELECT * FROM daily_usage_summary WHERE user_id = $1 AND date = $2",
            [testUserId, dateStr]
        )
        expect(secondSummary.rows.length).toBe(1) // Still only one row

        const secondCost = parseFloat(secondSummary.rows[0].total_cost)
        expect(secondCost).toBeGreaterThan(firstCost) // Cost should be higher
    })

    it("should handle pricing config updates", async () => {
        const testUserId = "test-pricing"

        await pool.query(
            "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2)",
            [testUserId, 1000.0]
        )

        // Update pricing
        const updatePricingQuery =
            'UPDATE pricing_config SET cost_per_unit = 0.20 WHERE metric_type = "bandwidth"'
        await pool.query(updatePricingQuery)

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        // Insert usage
        await pool.query(
            `INSERT INTO usage_metrics (user_id, metric_type, value, unit, created_at)
             VALUES ($1, "bandwidth", $2, "bytes", $3)`,
            [testUserId, 1024 ** 3, yesterday] // 1 GB
        )

        // Run aggregation
        await meteringSystem.aggregateDaily()

        // Verify new pricing was used
        const summary = await pool.query(
            "SELECT total_cost FROM daily_usage_summary WHERE user_id = $1",
            [testUserId]
        )

        const cost = parseFloat(summary.rows[0].total_cost)
        expect(cost).toBeCloseTo(0.2, 2) // 1 GB * $0.20

        // Restore original pricing
        const restorePricingQuery =
            'UPDATE pricing_config SET cost_per_unit = 0.10 WHERE metric_type = "bandwidth"'
        await pool.query(restorePricingQuery)
    })
})
