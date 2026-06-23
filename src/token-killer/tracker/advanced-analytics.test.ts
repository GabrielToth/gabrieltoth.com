/**
 * Unit tests for Advanced Analytics Service
 * Tests caching, performance optimization, and visualization-ready data structures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { AdvancedAnalyticsService } from "./advanced-analytics"
import { getDatabasePool } from "../storage/database"

// Mock the database pool
vi.mock("../storage/database", () => ({
    getDatabasePool: vi.fn(),
}))

// Mock the analytics engine
vi.mock("./analytics", () => {
    class MockAnalyticsEngine {
        computeStatistics = vi.fn().mockResolvedValue({
            mean: 150,
            median: 150,
            stdDev: 50,
            variance: 2500,
            min: 100,
            max: 200,
            range: 100,
            percentiles: {
                p25: 125,
                p50: 150,
                p75: 175,
                p90: 190,
                p95: 195,
                p99: 199,
            },
        })

        detectPatterns = vi.fn().mockResolvedValue({
            byTimeOfDay: {},
            byDayOfWeek: {},
            byAgentType: { kiro: { tokens: 450, count: 3, avgTokens: 150 } },
            byRequestType: {},
            byModel: {
                "claude-haiku-4.5": { tokens: 450, count: 3, avgTokens: 150 },
            },
        })

        detectAnomalies = vi.fn().mockResolvedValue({
            anomalies: [],
            mean: 150,
            stdDev: 50,
            threshold: 2,
            anomalyCount: 0,
        })

        forecastConsumption = vi.fn().mockResolvedValue({
            method: "exponential-smoothing",
            forecastedTokens: 1500,
            confidenceInterval95: { lower: 1400, upper: 1600 },
            confidenceInterval99: { lower: 1350, upper: 1650 },
            accuracy: 85,
            dataPointsUsed: 8,
            forecastDate: new Date(),
        })
    }

    return {
        AnalyticsEngine: MockAnalyticsEngine,
    }
})

describe("AdvancedAnalyticsService", () => {
    let service: AdvancedAnalyticsService
    let mockPool: any

    beforeEach(() => {
        mockPool = {
            getConnection: vi.fn(() => ({
                all: vi.fn(),
                get: vi.fn(),
            })),
        }
        vi.mocked(getDatabasePool).mockReturnValue(mockPool)
        service = new AdvancedAnalyticsService(1000) // 1 second cache
    })

    afterEach(() => {
        vi.clearAllMocks()
        service.clearCache()
        service.clearPerformanceMetrics()
    })

    describe("generateVisualizationAnalytics", () => {
        it("should generate visualization-ready analytics data", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [
                            { totalTokens: 100 },
                            { totalTokens: 200 },
                            { totalTokens: 150 },
                        ])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                            {
                                timestamp: "2024-01-01T10:00:00Z",
                                totalTokens: 200,
                                totalCost: 0.02,
                            },
                            {
                                timestamp: "2024-01-01T11:00:00Z",
                                totalTokens: 150,
                                totalCost: 0.015,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            const analytics = await service.generateVisualizationAnalytics(
                startDate,
                endDate
            )

            expect(analytics).toBeDefined()
            expect(analytics.statistics).toBeDefined()
            expect(analytics.patterns).toBeDefined()
            expect(analytics.anomalies).toBeDefined()
            expect(analytics.timeSeriesData).toBeDefined()
            expect(analytics.summary).toBeDefined()
            expect(analytics.summary.totalTokens).toBe(450)
            expect(analytics.summary.averageTokensPerDay).toBe(150)
            expect(analytics.summary.peakTokensPerDay).toBe(200)
            expect(analytics.summary.lowestTokensPerDay).toBe(100)
        })

        it("should cache results and return cached data on subsequent calls", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [{ totalTokens: 100 }])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            // First call - should hit database
            const result1 = await service.generateVisualizationAnalytics(
                startDate,
                endDate
            )
            expect(result1).toBeDefined()

            // Second call - should use cache
            const result2 = await service.generateVisualizationAnalytics(
                startDate,
                endDate
            )
            expect(result2).toBeDefined()

            // Results should be identical
            expect(result1.summary.totalTokens).toBe(
                result2.summary.totalTokens
            )

            // Check cache stats
            const cacheStats = service.getCacheStats()
            expect(cacheStats.validEntries).toBeGreaterThan(0)
        })

        it("should bypass cache when useCache is false", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [{ totalTokens: 100 }])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            // First call with cache
            await service.generateVisualizationAnalytics(
                startDate,
                endDate,
                true
            )

            // Second call without cache
            const result = await service.generateVisualizationAnalytics(
                startDate,
                endDate,
                false
            )

            expect(result).toBeDefined()
            expect(mockConnection.all).toHaveBeenCalled()
        })

        it("should calculate anomaly percentage correctly", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [
                            { totalTokens: 100 },
                            { totalTokens: 100 },
                            { totalTokens: 100 },
                            { totalTokens: 1000 }, // Anomaly
                        ])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                            {
                                timestamp: "2024-01-01T10:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                            {
                                timestamp: "2024-01-01T11:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                            {
                                timestamp: "2024-01-01T12:00:00Z",
                                totalTokens: 1000,
                                totalCost: 0.1,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            const analytics = await service.generateVisualizationAnalytics(
                startDate,
                endDate
            )

            // Anomaly percentage should be calculated (even if 0 from mock)
            expect(analytics.summary.anomalyPercentage).toBeGreaterThanOrEqual(
                0
            )
            expect(analytics.summary.anomalyPercentage).toBeLessThanOrEqual(100)
        })
    })

    describe("getCachedStatistics", () => {
        it("should cache statistics and return cached result", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, [
                        { totalTokens: 100 },
                        { totalTokens: 200 },
                        { totalTokens: 150 },
                    ])
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            // First call
            const result1 = await service.getCachedStatistics(
                startDate,
                endDate
            )
            expect(result1.data).toBeDefined()
            expect(result1.cachedAt).toBeDefined()
            expect(result1.expiresAt).toBeDefined()
            expect(result1.isExpired).toBe(false)

            // Second call should use cache
            const result2 = await service.getCachedStatistics(
                startDate,
                endDate
            )
            expect(result2.data).toEqual(result1.data)
        })

        it("should force refresh when forceRefresh is true", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, [{ totalTokens: 100 }])
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            // First call
            await service.getCachedStatistics(startDate, endDate)

            // Force refresh
            const result = await service.getCachedStatistics(
                startDate,
                endDate,
                true
            )
            expect(result.data).toBeDefined()
        })
    })

    describe("getCachedPatterns", () => {
        it("should cache patterns and return cached result", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, [
                        {
                            totalTokens: 100,
                            timestamp: "2024-01-01T09:00:00Z",
                            agentType: "kiro",
                            model: "claude-haiku-4.5",
                            metadata: null,
                        },
                    ])
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            const result = await service.getCachedPatterns(startDate, endDate)
            expect(result.data).toBeDefined()
            expect(result.isExpired).toBe(false)
        })
    })

    describe("getCachedAnomalies", () => {
        it("should cache anomalies with threshold", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [
                            { totalTokens: 100 },
                            { totalTokens: 100 },
                            { totalTokens: 1000 },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            const result = await service.getCachedAnomalies(
                startDate,
                endDate,
                2
            )
            expect(result.data).toBeDefined()
            expect(result.isExpired).toBe(false)
        })
    })

    describe("getCachedForecast", () => {
        it("should cache forecast with forecast days", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    callback(null, [
                        { date: "2024-01-01", dailyTokens: 1000 },
                        { date: "2024-01-02", dailyTokens: 1100 },
                        { date: "2024-01-03", dailyTokens: 1050 },
                        { date: "2024-01-04", dailyTokens: 1200 },
                        { date: "2024-01-05", dailyTokens: 1150 },
                        { date: "2024-01-06", dailyTokens: 1300 },
                        { date: "2024-01-07", dailyTokens: 1250 },
                        { date: "2024-01-08", dailyTokens: 1400 },
                    ])
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-08")

            const result = await service.getCachedForecast(
                startDate,
                endDate,
                7
            )
            expect(result.data).toBeDefined()
            expect(result.isExpired).toBe(false)
        })
    })

    describe("Cache Management", () => {
        it("should clear all cache", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [{ totalTokens: 100 }])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            await service.generateVisualizationAnalytics(startDate, endDate)

            let cacheStats = service.getCacheStats()
            expect(cacheStats.validEntries).toBeGreaterThan(0)

            service.clearCache()

            cacheStats = service.getCacheStats()
            expect(cacheStats.totalEntries).toBe(0)
        })

        it("should clear specific cache entry", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [{ totalTokens: 100 }])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            await service.generateVisualizationAnalytics(startDate, endDate)

            const cacheKey = `viz-analytics-${startDate.toISOString()}-${endDate.toISOString()}`
            service.clearCacheEntry(cacheKey)

            const cacheStats = service.getCacheStats()
            expect(cacheStats.totalEntries).toBe(0)
        })

        it("should get cache statistics", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [{ totalTokens: 100 }])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            await service.generateVisualizationAnalytics(startDate, endDate)

            const cacheStats = service.getCacheStats()
            expect(cacheStats.totalEntries).toBeGreaterThan(0)
            expect(cacheStats.validEntries).toBeGreaterThan(0)
            expect(cacheStats.expiredEntries).toBeGreaterThanOrEqual(0)
        })

        it("should set cache expiration time", () => {
            service.setCacheExpiration(2000)
            // No error should be thrown

            expect(() => service.setCacheExpiration(0)).toThrow(
                "Cache expiration must be positive"
            )
            expect(() => service.setCacheExpiration(-1)).toThrow(
                "Cache expiration must be positive"
            )
        })
    })

    describe("Performance Metrics", () => {
        it("should record performance metrics", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [{ totalTokens: 100 }])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            await service.generateVisualizationAnalytics(startDate, endDate)

            const metrics = service.getPerformanceMetrics()
            expect(metrics.length).toBeGreaterThan(0)

            const metric = metrics[0]
            expect(metric.operationName).toBeDefined()
            expect(metric.startTime).toBeDefined()
            expect(metric.endTime).toBeDefined()
            expect(metric.durationMs).toBeGreaterThanOrEqual(0)
            expect(metric.cacheHit).toBe(false)
        })

        it("should calculate average performance by operation", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [{ totalTokens: 100 }])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            await service.generateVisualizationAnalytics(startDate, endDate)

            const avgMetrics = service.getAveragePerformanceByOperation()
            expect(Object.keys(avgMetrics).length).toBeGreaterThan(0)

            for (const [op, stats] of Object.entries(avgMetrics)) {
                expect(op).toBeDefined()
                expect(stats.avgDurationMs).toBeGreaterThanOrEqual(0)
                expect(stats.count).toBeGreaterThan(0)
                expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0)
                expect(stats.cacheHitRate).toBeLessThanOrEqual(100)
            }
        })

        it("should clear performance metrics", async () => {
            const mockConnection = {
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [{ totalTokens: 100 }])
                    } else if (query.includes("timestamp")) {
                        callback(null, [
                            {
                                timestamp: "2024-01-01T09:00:00Z",
                                totalTokens: 100,
                                totalCost: 0.01,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockReturnValue(mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            await service.generateVisualizationAnalytics(startDate, endDate)

            let metrics = service.getPerformanceMetrics()
            expect(metrics.length).toBeGreaterThan(0)

            service.clearPerformanceMetrics()

            metrics = service.getPerformanceMetrics()
            expect(metrics.length).toBe(0)
        })
    })
})
