/**
 * App Health Check Endpoint Unit Tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route"

describe("App Health Check Endpoint", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("GET /api/health", () => {
        it("should return 200 and healthy status", async () => {
            const response = await GET()
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toMatchObject({
                status: "healthy",
                checks: {
                    app: {
                        status: "pass",
                        message: "Application is running",
                    },
                },
            })
            expect(data.timestamp).toBeDefined()
            expect(data.uptime).toBeGreaterThanOrEqual(0)
        })

        it("should include uptime in response", async () => {
            const response = await GET()
            const data = await response.json()

            expect(typeof data.uptime).toBe("number")
            expect(data.uptime).toBeGreaterThanOrEqual(0)
        })

        it("should include valid ISO 8601 timestamp", async () => {
            const response = await GET()
            const data = await response.json()

            const timestamp = new Date(data.timestamp)
            expect(timestamp.toISOString()).toBe(data.timestamp)
        })

        it("should include version and environment", async () => {
            const response = await GET()
            const data = await response.json()

            expect(data.version).toBeDefined()
            expect(data.environment).toBeDefined()
        })

        it("should have correct response format structure", async () => {
            const response = await GET()
            const data = await response.json()

            expect(data).toHaveProperty("status")
            expect(data).toHaveProperty("timestamp")
            expect(data).toHaveProperty("uptime")
            expect(data).toHaveProperty("version")
            expect(data).toHaveProperty("environment")
            expect(data).toHaveProperty("checks")
            expect(data.checks).toHaveProperty("app")
        })

        it("should return consistent uptime across multiple calls", async () => {
            const response1 = await GET()
            const data1 = await response1.json()

            await new Promise(resolve => setTimeout(resolve, 100))

            const response2 = await GET()
            const data2 = await response2.json()

            expect(data2.uptime).toBeGreaterThanOrEqual(data1.uptime)
        })
    })
})
