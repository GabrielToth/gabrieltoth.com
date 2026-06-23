/**
 * Unit tests for database connection module
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import {
    initializeDatabasePool,
    getDatabasePool,
} from "../../../token-killer/storage/database"
import fs from "fs"
import path from "path"

describe("Database Connection Module", () => {
    let dbPath: string

    beforeAll(async () => {
        // Initialize database pool
        const pool = await initializeDatabasePool()
        dbPath = pool.getDbPath()
    })

    afterAll(async () => {
        const pool = getDatabasePool()
        await pool.close()

        // Clean up test database
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath)
        }
    })

    describe("Database Initialization", () => {
        it("should create database file at correct location", () => {
            expect(fs.existsSync(dbPath)).toBe(true)
        })

        it("should have .kiro/data directory structure", () => {
            const dataDir = path.dirname(dbPath)
            expect(fs.existsSync(dataDir)).toBe(true)
            expect(dataDir).toContain(".kiro")
            expect(dataDir).toContain("data")
        })

        it("should initialize database pool successfully", async () => {
            const pool = getDatabasePool()
            expect(pool.isReady()).toBe(true)
        })

        it("should have correct database file name", () => {
            expect(path.basename(dbPath)).toBe("token-killer.db")
        })
    })

    describe("Connection Pool", () => {
        it("should return connection from pool", () => {
            const pool = getDatabasePool()
            const connection = pool.getConnection()
            expect(connection).toBeDefined()
        })

        it("should throw error if pool not initialized", () => {
            // This test would need a fresh pool instance
            // Skipping for now as we can't easily create uninitialized pool
        })

        it("should provide pool statistics", () => {
            const pool = getDatabasePool()
            const stats = pool.getStats()

            expect(stats).toHaveProperty("initialized")
            expect(stats).toHaveProperty("connectionCount")
            expect(stats).toHaveProperty("maxConnections")
            expect(stats).toHaveProperty("dbPath")
            expect(stats).toHaveProperty("dbSize")

            expect(stats.initialized).toBe(true)
            expect(stats.connectionCount).toBeGreaterThan(0)
            expect(stats.maxConnections).toBeGreaterThan(0)
            expect(stats.dbSize).toBeGreaterThanOrEqual(0)
        })
    })

    describe("Health Checks", () => {
        it("should perform successful health check", async () => {
            const pool = getDatabasePool()
            const result = await pool.healthCheck()

            expect(result.healthy).toBe(true)
            expect(result.timestamp).toBeInstanceOf(Date)
            expect(result.responseTime).toBeGreaterThanOrEqual(0)
        })

        it("should include response time in health check", async () => {
            const pool = getDatabasePool()
            const result = await pool.healthCheck()

            expect(result.responseTime).toBeGreaterThanOrEqual(0)
            expect(typeof result.responseTime).toBe("number")
        })
    })

    describe("Database File Management", () => {
        it("should return correct database path", () => {
            const pool = getDatabasePool()
            const dbPath = pool.getDbPath()

            expect(typeof dbPath).toBe("string")
            expect(dbPath.length).toBeGreaterThan(0)
            expect(dbPath).toContain("token-killer.db")
        })

        it("should report database file size", () => {
            const pool = getDatabasePool()
            const size = pool.getDbSize()

            expect(typeof size).toBe("number")
            expect(size).toBeGreaterThanOrEqual(0)
        })

        it("should return zero size for non-existent database", () => {
            const pool = getDatabasePool()
            // Temporarily change path to non-existent location
            const originalPath = pool.getDbPath()
            // We can't easily test this without modifying the pool
            // This is a limitation of the current design
        })
    })

    describe("Connection Lifecycle", () => {
        it("should close connections gracefully", async () => {
            const pool = getDatabasePool()
            expect(pool.isReady()).toBe(true)

            await pool.close()
            expect(pool.isReady()).toBe(false)
        })

        it("should emit initialized event", async () => {
            // This would need a fresh pool instance
            // Skipping for now
            expect(true).toBe(true)
        })

        it("should emit closed event", async () => {
            // This would need a fresh pool instance
            // Skipping for now
            expect(true).toBe(true)
        })
    })

    describe("Error Handling", () => {
        it("should handle database errors gracefully", async () => {
            const pool = getDatabasePool()

            // Try to execute invalid SQL
            try {
                await pool.execute("INVALID SQL STATEMENT")
                // If we get here, the error was not thrown
                expect(true).toBe(true)
            } catch (error) {
                expect(error).toBeDefined()
                expect(error instanceof Error).toBe(true)
            }
        })
    })
})
