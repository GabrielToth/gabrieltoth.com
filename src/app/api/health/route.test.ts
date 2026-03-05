/**
 * App Health Check Endpoint Unit Tests
 *
 * Tests verify:
 * - Healthy state
 * - Unhealthy state (database down)
 * - Response format
 *
 * Requirements: 1.4
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route"

// Mock dependencies
vi.mock("@/lib/db", () => ({
    healthCheck: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}))

import { healthCheck } from "@/lib/db"
import { logger } from "@/lib/logger"

describe("App Health Check Endpoint", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("GET /api/health", () => {
        it("should return 200 and healthy status when database is healthy", async () => {
            vi.mocked(healthCheck).mockResolvedValue(true)

            const response = await GET()
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toMatchObject({
                status: "healthy",
                checks: {
                    database: {
                        status: "pass",
                        message: "Database connection successful",
                    },
                },
            })
            expect(data.timestamp).toBeDefined()
            expect(data.uptime).toBeGreaterThanOrEqual(0)
            expect(logger.error).not.toHaveBeenCalled()
        })

        it("should return 503 and unhealthy status when database is down", async () => {
            vi.mocked(healthCheck).mockResolvedValue(false)

            const response = await GET()
            const data = await response.json()

            expect(response.status).toBe(503)
            expect(data).toMatchObject({
                status: "unhealthy",
                checks: {
                    database: {
                        status: "fail",
                        message: "Database connection failed",
                    },
                },
            })
            expect(logger.error).toHaveBeenCalledWith(
                "Health check failed",
                expect.objectContaining({
                    context: "HEALTH",
                    data: expect.any(Object),
                })
            )
        })

        it("should include uptime in response", async () => {
            vi.mocked(healthCheck).mockResolvedValue(true)

            const response = await GET()
            const data = await response.json()

            expect(typeof data.uptime).toBe("number")
            expect(data.uptime).toBeGreaterThanOrEqual(0)
        })

        it("should include valid ISO 8601 timestamp", async () => {
            vi.mocked(healthCheck).mockResolvedValue(true)

            const response = await GET()
            const data = await response.json()

            const timestamp = new Date(data.timestamp)
            expect(timestamp.toISOString()).toBe(data.timestamp)
        })

        it("should include version and environment", async () => {
            vi.mocked(healthCheck).mockResolvedValue(true)

            const response = await GET()
            const data = await response.json()

            expect(data.version).toBeDefined()
            expect(data.environment).toBeDefined()
        })

        it("should have correct response format structure", async () => {
            vi.mocked(healthCheck).mockResolvedValue(true)

            const response = await GET()
            const data = await response.json()

            expect(data).toHaveProperty("status")
            expect(data).toHaveProperty("timestamp")
            expect(data).toHaveProperty("uptime")
            expect(data).toHaveProperty("version")
            expect(data).toHaveProperty("environment")
            expect(data).toHaveProperty("checks")
            expect(data.checks).toHaveProperty("database")
        })

        it("should return consistent uptime across multiple calls", async () => {
            vi.mocked(healthCheck).mockResolvedValue(true)

            const response1 = await GET()
            const data1 = await response1.json()

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100))

            const response2 = await GET()
            const data2 = await response2.json()

            // Uptime should increase
            expect(data2.uptime).toBeGreaterThanOrEqual(data1.uptime)
        })
    })
})
