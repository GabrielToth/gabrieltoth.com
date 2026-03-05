// Database Schema Validation Tests
// Feature: distributed-infrastructure-logging

import { readFileSync } from "fs"
import { join } from "path"
import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// Note: These tests require a running PostgreSQL instance
// They are integration tests that verify schema constraints

describe("Database Schema Validation", () => {
    let pool: Pool
    const testDbUrl =
        process.env.DATABASE_URL ||
        "postgres://platform:devpassword@localhost:5432/platform_test"

    beforeAll(async () => {
        pool = new Pool({ connectionString: testDbUrl })

        // Apply schema
        const schemaPath = join(__dirname, "schema.sql")
        const schema = readFileSync(schemaPath, "utf-8")

        try {
            await pool.query(schema)
        } catch (error) {
            console.warn(
                "Schema application failed (may already exist):",
                error
            )
        }
    })

    afterAll(async () => {
        await pool.end()
    })

    describe("Unit Tests: Schema Constraints", () => {
        it("should enforce positive_balance constraint on user_accounts", async () => {
            const testUserId = "00000000-0000-0000-0000-000000000001"

            // First create a profile
            await pool.query(
                "INSERT INTO profiles (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
                [testUserId, "test@example.com"]
            )

            // Create user account
            await pool.query(
                "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                [testUserId, 100]
            )

            // Try to set negative balance - should fail
            try {
                await pool.query(
                    "UPDATE user_accounts SET balance = $1 WHERE user_id = $2",
                    [-10, testUserId]
                )
                expect.fail("Should have thrown constraint violation")
            } catch (error: any) {
                expect(error.message).toContain("positive_balance")
            }
        })

        it("should enforce foreign key constraint on transactions", async () => {
            const nonExistentUserId = "99999999-9999-9999-9999-999999999999"

            // Try to insert transaction for non-existent user - should fail
            try {
                await pool.query(
                    "INSERT INTO transactions (user_id, amount, type, reason, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5, $6)",
                    [nonExistentUserId, 100, "credit", "test", 0, 100]
                )
                expect.fail("Should have thrown foreign key violation")
            } catch (error: any) {
                expect(error.message).toContain("foreign key")
            }
        })

        it("should enforce unique constraint on daily_usage_summary", async () => {
            const testUserId = "00000000-0000-0000-0000-000000000002"
            const testDate = "2024-01-01"

            // First create a profile
            await pool.query(
                "INSERT INTO profiles (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
                [testUserId, "test2@example.com"]
            )

            // Insert first summary
            await pool.query(
                "INSERT INTO daily_usage_summary (user_id, date, bandwidth_gb) VALUES ($1, $2, $3) ON CONFLICT (user_id, date) DO NOTHING",
                [testUserId, testDate, 1.5]
            )

            // Try to insert duplicate - should fail or be ignored by ON CONFLICT
            try {
                await pool.query(
                    "INSERT INTO daily_usage_summary (user_id, date, bandwidth_gb) VALUES ($1, $2, $3)",
                    [testUserId, testDate, 2.0]
                )
                expect.fail("Should have thrown unique constraint violation")
            } catch (error: any) {
                expect(error.message).toContain("unique")
            }
        })

        it("should have correct indexes for performance", async () => {
            // Check that indexes exist
            const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('transactions', 'usage_metrics')
      `)

            const indexNames = result.rows.map(r => r.indexname)

            // Should have index on transactions
            expect(
                indexNames.some(name => name.includes("user_transactions"))
            ).toBe(true)

            // Should have indexes on usage_metrics
            expect(indexNames.some(name => name.includes("user_metrics"))).toBe(
                true
            )
            expect(indexNames.some(name => name.includes("aggregation"))).toBe(
                true
            )
        })

        it("should have pricing_config table with default values", async () => {
            const result = await pool.query("SELECT * FROM pricing_config")

            expect(result.rows.length).toBeGreaterThan(0)

            const metricTypes = result.rows.map(r => r.metric_type)
            expect(metricTypes).toContain("bandwidth")
            expect(metricTypes).toContain("storage")
            expect(metricTypes).toContain("cache_ops")
            expect(metricTypes).toContain("api_calls")
        })

        it("should enforce type constraint on transactions", async () => {
            const testUserId = "00000000-0000-0000-0000-000000000003"

            // First create a profile and account
            await pool.query(
                "INSERT INTO profiles (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
                [testUserId, "test3@example.com"]
            )

            await pool.query(
                "INSERT INTO user_accounts (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = $2",
                [testUserId, 100]
            )

            // Try to insert transaction with invalid type - should fail
            try {
                await pool.query(
                    "INSERT INTO transactions (user_id, amount, type, reason, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5, $6)",
                    [testUserId, 100, "invalid_type", "test", 0, 100]
                )
                expect.fail("Should have thrown check constraint violation")
            } catch (error: any) {
                expect(error.message).toContain("check")
            }
        })
    })
})
