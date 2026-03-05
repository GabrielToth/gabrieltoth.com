/**
 * Backend Health Check Endpoint Unit Tests
 *
 * Tests verify:
 * - Healthy state (all checks pass)
 * - Unhealthy state (database down)
 * - Unhealthy state (redis down)
 * - Response format
 *
 * Requirements: 1.4
 */

import express from "express"
import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies
vi.mock("../lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
        debug: vi.fn(),
    }),
}))

vi.mock("../lib/config/env", () => ({
    validateEnv: () => ({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://test:test@localhost:5432/test",
        REDIS_URL: "redis://localhost:6379",
        PORT: 4000,
        DEBUG: false,
        DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/test",
    }),
}))

// Mock pg Pool
const mockQuery = vi.fn()
vi.mock("pg", () => ({
    Pool: vi.fn(() => ({
        query: mockQuery,
        end: vi.fn(),
    })),
}))

// Mock ioredis
const mockPing = vi.fn()
const mockQuit = vi.fn()
vi.mock("ioredis", () => {
    return vi.fn(() => ({
        ping: mockPing,
        quit: mockQuit,
        on: vi.fn(),
    }))
})

describe("Backend Health Check Endpoint", () => {
    let app: express.Application

    beforeEach(async () => {
        // Reset mocks
        vi.clearAllMocks()
        mockQuery.mockResolvedValue({ rows: [{ "?column?": 1 }] })
        mockPing.mockResolvedValue("PONG")

        // Import app after mocks are set up
        const module = await import("./server")
        app = module.app
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("GET /health", () => {
        it("should return 200 and healthy status when all checks pass", async () => {
            const response = await request(app).get("/health")

            expect(response.status).toBe(200)
            expect(response.body).toMatchObject({
                status: "healthy",
                checks: {
                    database: {
                        status: "pass",
                        message: "Database connection successful",
                    },
                    redis: {
                        status: "pass",
                        message: "Redis connection successful",
                    },
                    memory: {
                        status: "pass",
                    },
                },
            })
            expect(response.body.timestamp).toBeDefined()
            expect(response.body.uptime).toBeGreaterThanOrEqual(0)
        })

        it("should return 503 and unhealthy status when database is down", async () => {
            mockQuery.mockRejectedValue(new Error("Connection refused"))

            const response = await request(app).get("/health")

            expect(response.status).toBe(503)
            expect(response.body).toMatchObject({
                status: "unhealthy",
                checks: {
                    database: {
                        status: "fail",
                        message: "Connection refused",
                    },
                    redis: {
                        status: "pass",
                    },
                    memory: {
                        status: "pass",
                    },
                },
            })
        })

        it("should return 503 and unhealthy status when redis is down", async () => {
            mockPing.mockRejectedValue(new Error("Connection timeout"))

            const response = await request(app).get("/health")

            expect(response.status).toBe(503)
            expect(response.body).toMatchObject({
                status: "unhealthy",
                checks: {
                    database: {
                        status: "pass",
                    },
                    redis: {
                        status: "fail",
                        message: "Connection timeout",
                    },
                    memory: {
                        status: "pass",
                    },
                },
            })
        })

        it("should return 503 when both database and redis are down", async () => {
            mockQuery.mockRejectedValue(new Error("DB error"))
            mockPing.mockRejectedValue(new Error("Redis error"))

            const response = await request(app).get("/health")

            expect(response.status).toBe(503)
            expect(response.body).toMatchObject({
                status: "unhealthy",
                checks: {
                    database: {
                        status: "fail",
                    },
                    redis: {
                        status: "fail",
                    },
                },
            })
        })

        it("should include response times for database and redis checks", async () => {
            const response = await request(app).get("/health")

            expect(
                response.body.checks.database.responseTime
            ).toBeGreaterThanOrEqual(0)
            expect(
                response.body.checks.redis.responseTime
            ).toBeGreaterThanOrEqual(0)
        })

        it("should include memory usage information", async () => {
            const response = await request(app).get("/health")

            expect(response.body.checks.memory.status).toBe("pass")
            expect(response.body.checks.memory.message).toMatch(/Heap usage:/)
            expect(response.body.checks.memory.message).toMatch(/MB/)
        })

        it("should return valid ISO 8601 timestamp", async () => {
            const response = await request(app).get("/health")

            const timestamp = new Date(response.body.timestamp)
            expect(timestamp.toISOString()).toBe(response.body.timestamp)
        })

        it("should return uptime in seconds", async () => {
            const response = await request(app).get("/health")

            expect(typeof response.body.uptime).toBe("number")
            expect(response.body.uptime).toBeGreaterThanOrEqual(0)
        })

        it("should have correct response format structure", async () => {
            const response = await request(app).get("/health")

            expect(response.body).toHaveProperty("status")
            expect(response.body).toHaveProperty("timestamp")
            expect(response.body).toHaveProperty("uptime")
            expect(response.body).toHaveProperty("checks")
            expect(response.body.checks).toHaveProperty("database")
            expect(response.body.checks).toHaveProperty("redis")
            expect(response.body.checks).toHaveProperty("memory")
        })
    })

    describe("GET /", () => {
        it("should return service information", async () => {
            const response = await request(app).get("/")

            expect(response.status).toBe(200)
            expect(response.body).toMatchObject({
                service: "Backend API",
                version: "1.0.0",
                status: "running",
            })
        })
    })
})
