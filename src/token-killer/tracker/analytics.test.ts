/**
 * Unit tests for Analytics Engine
 * Tests statistical analysis, pattern detection, and forecasting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { AnalyticsEngine } from "./analytics"
import { getDatabasePool } from "../storage/database"

// Mock the database pool
vi.mock("../storage/database", () => ({
    getDatabasePool: vi.fn(),
}))

describe("AnalyticsEngine", () => {
    let engine: AnalyticsEngine
    let mockPool: any

    beforeEach(() => {
        mockPool = {
            getConnection: vi.fn(() => ({
                all: vi.fn(),
                get: vi.fn(),
            })),
        }
        vi.mocked(getDatabasePool).mockReturnValue(mockPool)
        engine = new AnalyticsEngine()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("computeStatistics", () => {
        it("should compute correct statistics for token data", async () => {
            const mockData = [
                { totalTokens: 100 },
                { totalTokens: 200 },
                { totalTokens: 300 },
                { totalTokens: 400 },
                { totalTokens: 500 },
            ]

            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, mockData)
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-31")

            const stats = await engine.computeStatistics(startDate, endDate)

            expect(stats.mean).toBe(300)
            expect(stats.median).toBe(300)
            expect(stats.min).toBe(100)
            expect(stats.max).toBe(500)
            expect(stats.range).toBe(400)
            expect(stats.stdDev).toBeGreaterThan(0)
            expect(stats.percentiles.p25).toBe(200)
            expect(stats.percentiles.p50).toBe(300)
            expect(stats.percentiles.p75).toBe(400)
        })

        it("should handle single data point", async () => {
            const mockData = [{ totalTokens: 250 }]

            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, mockData)
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-31")

            const stats = await engine.computeStatistics(startDate, endDate)

            expect(stats.mean).toBe(250)
            expect(stats.median).toBe(250)
            expect(stats.min).toBe(250)
            expect(stats.max).toBe(250)
            expect(stats.stdDev).toBe(0)
        })

        it("should reject when no data available", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, [])
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-31")

            await expect(
                engine.computeStatistics(startDate, endDate)
            ).rejects.toThrow("No data available for statistics")
        })

        it("should handle database errors", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(new Error("Database error"))
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-31")

            await expect(
                engine.computeStatistics(startDate, endDate)
            ).rejects.toThrow("Database error")
        })
    })

    describe("detectPatterns", () => {
        it("should detect patterns by time of day", async () => {
            const mockData = [
                {
                    totalTokens: 100,
                    timestamp: "2024-01-01T09:00:00Z",
                    agentType: "kiro",
                    model: "claude-haiku-4.5",
                    metadata: JSON.stringify({ requestType: "spec-creation" }),
                },
                {
                    totalTokens: 150,
                    timestamp: "2024-01-01T10:00:00Z",
                    agentType: "kiro",
                    model: "claude-haiku-4.5",
                    metadata: JSON.stringify({ requestType: "spec-creation" }),
                },
            ]

            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, mockData)
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-31")

            const patterns = await engine.detectPatterns(startDate, endDate)

            expect(patterns.byTimeOfDay).toBeDefined()
            expect(patterns.byDayOfWeek).toBeDefined()
            expect(patterns.byAgentType).toBeDefined()
            expect(patterns.byModel).toBeDefined()
            expect(patterns.byRequestType).toBeDefined()

            // Verify aggregation
            expect(patterns.byAgentType["kiro"]).toBeDefined()
            expect(patterns.byAgentType["kiro"].tokens).toBe(250)
            expect(patterns.byAgentType["kiro"].count).toBe(2)
            expect(patterns.byAgentType["kiro"].avgTokens).toBe(125)
        })

        it("should handle missing metadata gracefully", async () => {
            const mockData = [
                {
                    totalTokens: 100,
                    timestamp: "2024-01-01T09:00:00Z",
                    agentType: "kiro",
                    model: "claude-haiku-4.5",
                    metadata: null,
                },
            ]

            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, mockData)
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-31")

            const patterns = await engine.detectPatterns(startDate, endDate)

            expect(patterns.byAgentType["kiro"]).toBeDefined()
            expect(patterns.byAgentType["kiro"].tokens).toBe(100)
        })
    })

    describe("detectAnomalies", () => {
        it("should detect anomalies using z-score", async () => {
            const mockData = [
                {
                    totalTokens: 100,
                    timestamp: "2024-01-01T09:00:00Z",
                    id: "1",
                },
                {
                    totalTokens: 110,
                    timestamp: "2024-01-01T10:00:00Z",
                    id: "2",
                },
                {
                    totalTokens: 105,
                    timestamp: "2024-01-01T11:00:00Z",
                    id: "3",
                },
                {
                    totalTokens: 1000,
                    timestamp: "2024-01-01T12:00:00Z",
                    id: "4",
                }, // Anomaly
                { totalTokens: 95, timestamp: "2024-01-01T13:00:00Z", id: "5" },
            ]

            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    // Return same data for both statistics and anomaly queries
                    callback(null, mockData)
                }),
            }
            // Return a new connection object each time to avoid state issues
            mockPool.getConnection.mockImplementation(() => mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-31")

            // Use threshold of 1 to catch the anomaly
            const result = await engine.detectAnomalies(startDate, endDate, 1)

            expect(result.anomalies.length).toBeGreaterThan(0)
            expect(result.mean).toBeGreaterThan(0)
            expect(result.stdDev).toBeGreaterThan(0)
            expect(result.threshold).toBe(1)

            // Check that the high value is detected as anomaly
            const highValueAnomaly = result.anomalies.find(
                a => a.totalTokens === 1000
            )
            expect(highValueAnomaly).toBeDefined()
            expect(Math.abs(highValueAnomaly!.zScore)).toBeGreaterThan(1)
        })

        it("should calculate correct deviation percentage", async () => {
            const mockData = [
                {
                    totalTokens: 100,
                    timestamp: "2024-01-01T09:00:00Z",
                    id: "1",
                },
                {
                    totalTokens: 100,
                    timestamp: "2024-01-01T10:00:00Z",
                    id: "2",
                },
                {
                    totalTokens: 100,
                    timestamp: "2024-01-01T11:00:00Z",
                    id: "3",
                },
                {
                    totalTokens: 200,
                    timestamp: "2024-01-01T12:00:00Z",
                    id: "4",
                }, // 100% above mean
            ]

            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, mockData)
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-31")

            const result = await engine.detectAnomalies(startDate, endDate, 1)

            const anomaly = result.anomalies.find(a => a.totalTokens === 200)
            expect(anomaly).toBeDefined()
            expect(anomaly!.deviation).toContain("+")
        })
    })

    describe("forecastConsumption", () => {
        it("should forecast with sufficient data", async () => {
            const mockData = [
                { date: "2024-01-01", dailyTokens: 1000 },
                { date: "2024-01-02", dailyTokens: 1100 },
                { date: "2024-01-03", dailyTokens: 1050 },
                { date: "2024-01-04", dailyTokens: 1200 },
                { date: "2024-01-05", dailyTokens: 1150 },
                { date: "2024-01-06", dailyTokens: 1300 },
                { date: "2024-01-07", dailyTokens: 1250 },
                { date: "2024-01-08", dailyTokens: 1400 },
            ]

            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, mockData)
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-08")

            const forecast = await engine.forecastConsumption(
                startDate,
                endDate,
                7
            )

            expect(forecast.method).toBe("exponential-smoothing")
            expect(forecast.forecastedTokens).toBeGreaterThan(0)
            expect(forecast.confidenceInterval95.lower).toBeGreaterThan(0)
            expect(forecast.confidenceInterval95.upper).toBeGreaterThan(
                forecast.confidenceInterval95.lower
            )
            expect(forecast.confidenceInterval99.upper).toBeGreaterThan(
                forecast.confidenceInterval95.upper
            )
            expect(forecast.accuracy).toBeGreaterThan(0)
            expect(forecast.dataPointsUsed).toBe(mockData.length)
        })

        it("should reject with insufficient data", async () => {
            const mockData = [
                { date: "2024-01-01", dailyTokens: 1000 },
                { date: "2024-01-02", dailyTokens: 1100 },
            ]

            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, mockData)
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            await expect(
                engine.forecastConsumption(startDate, endDate, 7)
            ).rejects.toThrow("Insufficient data for forecasting")
        })

        it("should handle database errors during forecasting", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(new Error("Database error"))
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-31")

            await expect(
                engine.forecastConsumption(startDate, endDate, 7)
            ).rejects.toThrow("Database error")
        })
    })
})
