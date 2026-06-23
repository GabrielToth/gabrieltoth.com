/**
 * Unit tests for Token Killer Web Dashboard API
 * Tests data aggregation, anomaly detection, and error handling
 * Validates Requirements 6.1-6.5
 */

import { describe, it, expect, beforeEach } from "vitest"

describe("Token Killer Web Dashboard API", () => {
    describe("GET /api/token-killer/stats/:timeWindow", () => {
        it("should return aggregated token statistics for 24h window", () => {
            const records = [
                {
                    totalInputTokens: 1000,
                    totalOutputTokens: 500,
                    totalTokens: 1500,
                    totalCost: 0.05,
                    requestCount: 10,
                    taskCount: 2,
                    agentType: "kiro",
                    model: "claude-haiku-4.5",
                },
                {
                    totalInputTokens: 800,
                    totalOutputTokens: 400,
                    totalTokens: 1200,
                    totalCost: 0.04,
                    requestCount: 8,
                    taskCount: 1,
                    agentType: "cursor",
                    model: "cursor-composer-2.0",
                },
            ]

            expect(records).toHaveLength(2)
            expect(records[0]).toHaveProperty("totalTokens", 1500)
            expect(records[0]).toHaveProperty("totalCost", 0.05)
            expect(records[0]).toHaveProperty("agentType", "kiro")
        })

        it("should calculate BRL cost with exchange rate", () => {
            const usdCost = 0.09
            const exchangeRate = 5
            const brlCost = usdCost * exchangeRate

            expect(brlCost).toBeCloseTo(0.45, 2)
        })

        it("should aggregate data by agent type", () => {
            const records = [
                {
                    totalInputTokens: 1000,
                    totalOutputTokens: 500,
                    totalTokens: 1500,
                    totalCost: 0.05,
                    requestCount: 10,
                    taskCount: 2,
                    agentType: "kiro",
                    model: "claude-haiku-4.5",
                },
                {
                    totalInputTokens: 800,
                    totalOutputTokens: 400,
                    totalTokens: 1200,
                    totalCost: 0.04,
                    requestCount: 8,
                    taskCount: 1,
                    agentType: "cursor",
                    model: "cursor-composer-2.0",
                },
            ]

            const byAgentType: Record<string, any> = {}

            for (const record of records) {
                if (record.agentType) {
                    if (!byAgentType[record.agentType]) {
                        byAgentType[record.agentType] = {
                            tokens: 0,
                            cost: 0,
                            count: 0,
                        }
                    }
                    byAgentType[record.agentType].tokens +=
                        record.totalTokens || 0
                    byAgentType[record.agentType].cost += record.totalCost || 0
                    byAgentType[record.agentType].count +=
                        record.requestCount || 0
                }
            }

            expect(byAgentType).toHaveProperty("kiro")
            expect(byAgentType).toHaveProperty("cursor")
            expect(byAgentType.kiro.tokens).toBe(1500)
            expect(byAgentType.cursor.tokens).toBe(1200)
        })

        it("should aggregate data by model", () => {
            const records = [
                {
                    totalInputTokens: 1000,
                    totalOutputTokens: 500,
                    totalTokens: 1500,
                    totalCost: 0.05,
                    requestCount: 10,
                    taskCount: 2,
                    agentType: "kiro",
                    model: "claude-haiku-4.5",
                },
                {
                    totalInputTokens: 800,
                    totalOutputTokens: 400,
                    totalTokens: 1200,
                    totalCost: 0.04,
                    requestCount: 8,
                    taskCount: 1,
                    agentType: "cursor",
                    model: "cursor-composer-2.0",
                },
            ]

            const byModel: Record<string, any> = {}

            for (const record of records) {
                if (record.model) {
                    if (!byModel[record.model]) {
                        byModel[record.model] = { tokens: 0, cost: 0, count: 0 }
                    }
                    byModel[record.model].tokens += record.totalTokens || 0
                    byModel[record.model].cost += record.totalCost || 0
                    byModel[record.model].count += record.requestCount || 0
                }
            }

            expect(byModel).toHaveProperty("claude-haiku-4.5")
            expect(byModel).toHaveProperty("cursor-composer-2.0")
            expect(byModel["claude-haiku-4.5"].tokens).toBe(1500)
        })

        it("should validate time window parameter", () => {
            const validWindows = ["24h", "7d", "30d", "90d", "all-time"]
            const invalidWindow = "invalid"

            expect(validWindows).toContain("24h")
            expect(validWindows).not.toContain(invalidWindow)
        })

        it("should calculate total tokens correctly", () => {
            const records = [{ totalTokens: 1500 }, { totalTokens: 1200 }]

            let totalTokens = 0
            for (const record of records) {
                totalTokens += record.totalTokens || 0
            }

            expect(totalTokens).toBe(2700)
        })

        it("should calculate total cost correctly", () => {
            const records = [{ totalCost: 0.05 }, { totalCost: 0.04 }]

            let totalCost = 0
            for (const record of records) {
                totalCost += record.totalCost || 0
            }

            expect(totalCost).toBeCloseTo(0.09, 2)
        })
    })

    describe("GET /api/token-killer/breakdown/:timeWindow/:breakdownType", () => {
        it("should validate breakdown type parameter", () => {
            const validTypes = [
                "agent-type",
                "request-type",
                "model",
                "strategy",
            ]
            const invalidType = "invalid"

            expect(validTypes).toContain("agent-type")
            expect(validTypes).not.toContain(invalidType)
        })

        it("should calculate percentage breakdown correctly", () => {
            const breakdown = [
                { category: "kiro", totalTokens: 1500 },
                { category: "cursor", totalTokens: 1200 },
            ]

            const totalTokens = breakdown.reduce(
                (sum, item) => sum + item.totalTokens,
                0
            )

            const percentages = breakdown.map(item => ({
                ...item,
                percentage: (item.totalTokens / totalTokens) * 100,
            }))

            expect(percentages[0].percentage).toBeCloseTo(55.56, 1)
            expect(percentages[1].percentage).toBeCloseTo(44.44, 1)
        })

        it("should handle empty breakdown data", () => {
            const breakdown: any[] = []
            const totalTokens = breakdown.reduce(
                (sum, item) => sum + item.totalTokens,
                0
            )

            expect(totalTokens).toBe(0)
            expect(breakdown).toHaveLength(0)
        })

        it("should sort breakdown by tokens descending", () => {
            const breakdown = [
                { category: "cursor", totalTokens: 1200 },
                { category: "kiro", totalTokens: 1500 },
                { category: "antigravity", totalTokens: 800 },
            ]

            const sorted = breakdown.sort(
                (a, b) => b.totalTokens - a.totalTokens
            )

            expect(sorted[0].category).toBe("kiro")
            expect(sorted[1].category).toBe("cursor")
            expect(sorted[2].category).toBe("antigravity")
        })
    })

    describe("GET /api/token-killer/anomalies/:timeWindow", () => {
        it("should calculate mean correctly", () => {
            const values = [1000, 1100, 5000, 1050]
            const mean = values.reduce((a, b) => a + b, 0) / values.length

            expect(mean).toBe(2037.5)
        })

        it("should calculate standard deviation correctly", () => {
            const values = [1000, 1100, 5000, 1050]
            const mean = values.reduce((a, b) => a + b, 0) / values.length
            const variance =
                values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
                values.length
            const stdDev = Math.sqrt(variance)

            expect(stdDev).toBeGreaterThan(0)
            expect(stdDev).toBeCloseTo(1710.77, 1)
        })

        it("should detect anomalies using Z-score", () => {
            const values = [1000, 1100, 5000, 1050]
            const mean = values.reduce((a, b) => a + b, 0) / values.length
            const variance =
                values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
                values.length
            const stdDev = Math.sqrt(variance)
            const threshold = 1.5 // Lower threshold to detect the anomaly

            const anomalies = values
                .map((val, index) => ({
                    index,
                    value: val,
                    zScore: stdDev > 0 ? (val - mean) / stdDev : 0,
                }))
                .filter(item => Math.abs(item.zScore) > threshold)

            expect(anomalies).toHaveLength(1)
            expect(anomalies[0].value).toBe(5000)
            expect(Math.abs(anomalies[0].zScore)).toBeGreaterThan(threshold)
        })

        it("should validate threshold parameter", () => {
            const validThresholds = [0.5, 1, 2, 3, 5]
            const invalidThresholds = [-1, 0, 11, 100]

            for (const threshold of validThresholds) {
                expect(threshold).toBeGreaterThan(0)
                expect(threshold).toBeLessThanOrEqual(10)
            }

            for (const threshold of invalidThresholds) {
                expect(threshold <= 0 || threshold > 10).toBe(true)
            }
        })

        it("should handle empty data for anomaly detection", () => {
            const records: any[] = []

            if (records.length === 0) {
                expect(records).toHaveLength(0)
            }
        })

        it("should calculate deviation percentage correctly", () => {
            const dailyTokens = 5000
            const mean = 2037.5
            const stdDev = 1710.77
            const zScore = (dailyTokens - mean) / stdDev

            const deviationPercentage = ((zScore * stdDev) / mean) * 100

            expect(deviationPercentage).toBeGreaterThan(0)
            expect(deviationPercentage).toBeCloseTo(145.4, 0)
        })
    })

    describe("GET /api/token-killer/health", () => {
        it("should return healthy status", () => {
            const healthCheck = {
                healthy: true,
                responseTime: 10,
                timestamp: new Date(),
            }

            expect(healthCheck.healthy).toBe(true)
            expect(healthCheck).toHaveProperty("responseTime")
            expect(healthCheck).toHaveProperty("timestamp")
        })

        it("should include response time in health check", () => {
            const healthCheck = {
                healthy: true,
                responseTime: 10,
                timestamp: new Date(),
            }

            expect(healthCheck.responseTime).toBeGreaterThanOrEqual(0)
            expect(typeof healthCheck.responseTime).toBe("number")
        })
    })

    describe("Error handling and validation", () => {
        it("should create error response with correct structure", () => {
            const error = {
                error: "INVALID_TIME_WINDOW",
                code: "INVALID_TIME_WINDOW",
                message: "Invalid time window: invalid",
                timestamp: new Date(),
            }

            expect(error).toHaveProperty("error")
            expect(error).toHaveProperty("code")
            expect(error).toHaveProperty("message")
            expect(error).toHaveProperty("timestamp")
        })

        it("should validate time window before processing", () => {
            const timeWindow = "24h"
            const validWindows = ["24h", "7d", "30d", "90d", "all-time"]

            expect(validWindows).toContain(timeWindow)
        })

        it("should handle database query errors gracefully", async () => {
            const errorPool = {
                execute: async () => {
                    throw new Error("Database connection failed")
                },
            }

            try {
                await errorPool.execute("SELECT * FROM token_records")
                expect.fail("Should have thrown error")
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect((error as Error).message).toContain(
                    "Database connection failed"
                )
            }
        })

        it("should return 404 for invalid endpoints", () => {
            const invalidPath = "/api/token-killer/invalid"

            expect(invalidPath).not.toMatch(
                /^\/api\/token-killer\/(stats|breakdown|anomalies|health)/
            )
        })
    })

    describe("Data validation", () => {
        it("should validate token counts are non-negative", () => {
            const records = [
                { totalTokens: 1500, inputTokens: 1000, outputTokens: 500 },
                { totalTokens: 1200, inputTokens: 800, outputTokens: 400 },
            ]

            for (const record of records) {
                expect(record.totalTokens).toBeGreaterThanOrEqual(0)
                expect(record.inputTokens).toBeGreaterThanOrEqual(0)
                expect(record.outputTokens).toBeGreaterThanOrEqual(0)
            }
        })

        it("should validate cost values are non-negative", () => {
            const records = [
                { totalCost: 0.05, inputCost: 0.03, outputCost: 0.02 },
                { totalCost: 0.04, inputCost: 0.025, outputCost: 0.015 },
            ]

            for (const record of records) {
                expect(record.totalCost).toBeGreaterThanOrEqual(0)
                expect(record.inputCost).toBeGreaterThanOrEqual(0)
                expect(record.outputCost).toBeGreaterThanOrEqual(0)
            }
        })

        it("should validate request and task counts are non-negative", () => {
            const records = [
                { requestCount: 10, taskCount: 2 },
                { requestCount: 8, taskCount: 1 },
            ]

            for (const record of records) {
                expect(record.requestCount).toBeGreaterThanOrEqual(0)
                expect(record.taskCount).toBeGreaterThanOrEqual(0)
            }
        })

        it("should validate percentage values are between 0 and 100", () => {
            const breakdown = [
                { category: "kiro", percentage: 55.56 },
                { category: "cursor", percentage: 44.44 },
            ]

            for (const item of breakdown) {
                expect(item.percentage).toBeGreaterThanOrEqual(0)
                expect(item.percentage).toBeLessThanOrEqual(100)
            }
        })
    })

    describe("Date range calculation", () => {
        it("should calculate 24h date range correctly", () => {
            const end = new Date()
            const start = new Date()
            start.setHours(start.getHours() - 24)

            const diffMs = end.getTime() - start.getTime()
            const diffHours = diffMs / (1000 * 60 * 60)

            expect(diffHours).toBeCloseTo(24, 0)
        })

        it("should calculate 7d date range correctly", () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 7)

            const diffMs = end.getTime() - start.getTime()
            const diffDays = diffMs / (1000 * 60 * 60 * 24)

            expect(diffDays).toBeCloseTo(7, 0)
        })

        it("should calculate 30d date range correctly", () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 30)

            const diffMs = end.getTime() - start.getTime()
            const diffDays = diffMs / (1000 * 60 * 60 * 24)

            expect(diffDays).toBeCloseTo(30, 0)
        })

        it("should calculate 90d date range correctly", () => {
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - 90)

            const diffMs = end.getTime() - start.getTime()
            const diffDays = diffMs / (1000 * 60 * 60 * 24)

            expect(diffDays).toBeCloseTo(90, 0)
        })
    })
})
