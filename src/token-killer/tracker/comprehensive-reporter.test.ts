/**
 * Unit tests for Comprehensive Reporter
 * Tests report generation, export formats, and trend analysis
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ComprehensiveReporter } from "./comprehensive-reporter"
import { getDatabasePool } from "../storage/database"

// Mock the database pool
vi.mock("../storage/database", () => ({
    getDatabasePool: vi.fn(),
}))

describe("ComprehensiveReporter", () => {
    let reporter: ComprehensiveReporter
    let mockPool: any

    beforeEach(() => {
        mockPool = {
            getConnection: vi.fn(() => ({
                all: vi.fn(),
                get: vi.fn(),
            })),
        }
        vi.mocked(getDatabasePool).mockReturnValue(mockPool)
        reporter = new ComprehensiveReporter(undefined, 5.0)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("generateComprehensiveReport", () => {
        it("should generate report with all sections", async () => {
            const mockConnection = {
                get: vi.fn((query, params, callback) => {
                    callback(null, {
                        requestCount: 10,
                        taskCount: 2,
                        totalTokens: 5000,
                        inputTokens: 3000,
                        outputTokens: 2000,
                        totalCostUSD: 0.05,
                    })
                }),
                all: vi.fn((query, params, callback) => {
                    // Return data for statistics query (SELECT totalTokens)
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [
                            { totalTokens: 500 },
                            { totalTokens: 500 },
                            { totalTokens: 500 },
                            { totalTokens: 500 },
                            { totalTokens: 500 },
                        ])
                    } else if (query.includes("agentType")) {
                        callback(null, [
                            {
                                agentType: "kiro",
                                tokens: 3000,
                                cost: 0.03,
                                count: 6,
                            },
                            {
                                agentType: "cursor",
                                tokens: 2000,
                                cost: 0.02,
                                count: 4,
                            },
                        ])
                    } else if (query.includes("model")) {
                        callback(null, [
                            {
                                model: "claude-haiku-4.5",
                                tokens: 5000,
                                cost: 0.05,
                                count: 10,
                            },
                        ])
                    } else if (query.includes("metadata")) {
                        callback(null, [
                            {
                                metadata: JSON.stringify({
                                    requestType: "spec-creation",
                                }),
                                tokens: 5000,
                                cost: 0.05,
                                count: 10,
                            },
                        ])
                    } else if (query.includes("DATE(timestamp)")) {
                        callback(null, [
                            { date: "2024-01-01", tokens: 2500, cost: 0.025 },
                            { date: "2024-01-02", tokens: 2500, cost: 0.025 },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockImplementation(() => mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            const report = await reporter.generateComprehensiveReport(
                startDate,
                endDate
            )

            expect(report).toBeDefined()
            expect(report.generatedAt).toBeDefined()
            expect(report.period.start).toEqual(startDate)
            expect(report.period.end).toEqual(endDate)
            expect(report.summary).toBeDefined()
            expect(report.byAgent).toBeDefined()
            expect(report.byModel).toBeDefined()
            expect(report.byRequestType).toBeDefined()
            expect(report.statistics).toBeDefined()
            expect(report.patterns).toBeDefined()
            expect(report.trends).toBeDefined()
            expect(report.metadata).toBeDefined()
        })

        it("should call progress callback with correct stages", async () => {
            const mockConnection = {
                get: vi.fn((query, params, callback) => {
                    callback(null, {
                        requestCount: 10,
                        taskCount: 2,
                        totalTokens: 5000,
                        inputTokens: 3000,
                        outputTokens: 2000,
                        totalCostUSD: 0.05,
                    })
                }),
                all: vi.fn((query, params, callback) => {
                    // Return empty array for all queries to avoid processing
                    callback(null, [])
                }),
            }
            mockPool.getConnection.mockImplementation(() => mockConnection)

            const progressCallback = vi.fn()
            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            try {
                await reporter.generateComprehensiveReport(
                    startDate,
                    endDate,
                    progressCallback
                )
            } catch {
                // Expected to fail due to empty data, but we're testing the callback
            }

            expect(progressCallback).toHaveBeenCalled()
            const calls = progressCallback.mock.calls
            expect(calls.length).toBeGreaterThan(0)

            // Check that first stage is called
            const firstStage = calls[0][0].stage
            expect(firstStage).toBe("Fetching summary data")
        })

        it("should calculate correct percentages", async () => {
            const mockConnection = {
                get: vi.fn((query, params, callback) => {
                    callback(null, {
                        requestCount: 10,
                        taskCount: 2,
                        totalTokens: 5000,
                        inputTokens: 3000,
                        outputTokens: 2000,
                        totalCostUSD: 1.0,
                    })
                }),
                all: vi.fn((query, params, callback) => {
                    if (query.includes("SELECT totalTokens")) {
                        callback(null, [
                            { totalTokens: 500 },
                            { totalTokens: 500 },
                            { totalTokens: 500 },
                            { totalTokens: 500 },
                            { totalTokens: 500 },
                        ])
                    } else if (query.includes("agentType")) {
                        callback(null, [
                            {
                                agentType: "kiro",
                                tokens: 3000,
                                cost: 0.6,
                                count: 6,
                            },
                            {
                                agentType: "cursor",
                                tokens: 2000,
                                cost: 0.4,
                                count: 4,
                            },
                        ])
                    } else {
                        callback(null, [])
                    }
                }),
            }
            mockPool.getConnection.mockImplementation(() => mockConnection)

            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-01-02")

            const report = await reporter.generateComprehensiveReport(
                startDate,
                endDate
            )

            expect(report.byAgent["kiro"].percentage).toBe(60)
            expect(report.byAgent["cursor"].percentage).toBe(40)
        })
    })

    describe("exportAsJSON", () => {
        it("should export report as valid JSON", async () => {
            const mockReport = {
                generatedAt: new Date(),
                period: { start: new Date(), end: new Date() },
                summary: {
                    totalTokens: 5000,
                    inputTokens: 3000,
                    outputTokens: 2000,
                    totalCostUSD: 0.05,
                    totalCostBRL: 0.25,
                    requestCount: 10,
                    taskCount: 2,
                    averageTokensPerRequest: 500,
                    averageCostPerRequest: 0.005,
                },
                byAgent: {},
                byModel: {},
                byRequestType: {},
                statistics: {
                    mean: 500,
                    median: 500,
                    stdDev: 100,
                    variance: 10000,
                    min: 100,
                    max: 1000,
                    range: 900,
                    percentiles: {
                        p25: 250,
                        p50: 500,
                        p75: 750,
                        p90: 900,
                        p95: 950,
                        p99: 990,
                    },
                },
                patterns: {
                    byTimeOfDay: {},
                    byDayOfWeek: {},
                    byAgentType: {},
                    byRequestType: {},
                    byModel: {},
                },
                trends: {
                    dailyTrend: [],
                    weeklyTrend: [],
                    monthlyTrend: [],
                },
                metadata: {
                    generatedDate: new Date().toISOString(),
                    dataRange: "test",
                    filtersApplied: [],
                    timezone: "UTC",
                },
            }

            const json = await reporter.exportAsJSON(mockReport)

            expect(json).toBeDefined()
            expect(typeof json).toBe("string")

            // Verify it's valid JSON
            const parsed = JSON.parse(json)
            expect(parsed.summary.totalTokens).toBe(5000)
            expect(parsed.summary.totalCostUSD).toBe(0.05)
        })
    })

    describe("exportAsCSV", () => {
        it("should export report as CSV with headers and data", async () => {
            const mockReport = {
                generatedAt: new Date("2024-01-01"),
                period: {
                    start: new Date("2024-01-01"),
                    end: new Date("2024-01-02"),
                },
                summary: {
                    totalTokens: 5000,
                    inputTokens: 3000,
                    outputTokens: 2000,
                    totalCostUSD: 0.05,
                    totalCostBRL: 0.25,
                    requestCount: 10,
                    taskCount: 2,
                    averageTokensPerRequest: 500,
                    averageCostPerRequest: 0.005,
                },
                byAgent: {
                    kiro: {
                        tokens: 3000,
                        cost: 0.03,
                        count: 6,
                        percentage: 60,
                    },
                },
                byModel: {
                    "claude-haiku-4.5": {
                        tokens: 5000,
                        cost: 0.05,
                        count: 10,
                        percentage: 100,
                    },
                },
                byRequestType: {
                    "spec-creation": {
                        tokens: 5000,
                        cost: 0.05,
                        count: 10,
                        percentage: 100,
                    },
                },
                statistics: {
                    mean: 500,
                    median: 500,
                    stdDev: 100,
                    variance: 10000,
                    min: 100,
                    max: 1000,
                    range: 900,
                    percentiles: {
                        p25: 250,
                        p50: 500,
                        p75: 750,
                        p90: 900,
                        p95: 950,
                        p99: 990,
                    },
                },
                patterns: {
                    byTimeOfDay: {},
                    byDayOfWeek: {},
                    byAgentType: {},
                    byRequestType: {},
                    byModel: {},
                },
                trends: {
                    dailyTrend: [],
                    weeklyTrend: [],
                    monthlyTrend: [],
                },
                metadata: {
                    generatedDate: new Date().toISOString(),
                    dataRange: "test",
                    filtersApplied: [],
                    timezone: "UTC",
                },
            }

            const csv = await reporter.exportAsCSV(mockReport)

            expect(csv).toBeDefined()
            expect(typeof csv).toBe("string")
            expect(csv).toContain("Token Killer Comprehensive Report")
            expect(csv).toContain("SUMMARY")
            expect(csv).toContain("Total Tokens")
            expect(csv).toContain("5000")
            expect(csv).toContain("BY AGENT TYPE")
            expect(csv).toContain("kiro")
            expect(csv).toContain("BY MODEL")
            expect(csv).toContain("claude-haiku-4.5")
        })

        it("should include forecast data when available", async () => {
            const mockReport = {
                generatedAt: new Date("2024-01-01"),
                period: {
                    start: new Date("2024-01-01"),
                    end: new Date("2024-01-02"),
                },
                summary: {
                    totalTokens: 5000,
                    inputTokens: 3000,
                    outputTokens: 2000,
                    totalCostUSD: 0.05,
                    totalCostBRL: 0.25,
                    requestCount: 10,
                    taskCount: 2,
                    averageTokensPerRequest: 500,
                    averageCostPerRequest: 0.005,
                },
                byAgent: {},
                byModel: {},
                byRequestType: {},
                statistics: {
                    mean: 500,
                    median: 500,
                    stdDev: 100,
                    variance: 10000,
                    min: 100,
                    max: 1000,
                    range: 900,
                    percentiles: {
                        p25: 250,
                        p50: 500,
                        p75: 750,
                        p90: 900,
                        p95: 950,
                        p99: 990,
                    },
                },
                patterns: {
                    byTimeOfDay: {},
                    byDayOfWeek: {},
                    byAgentType: {},
                    byRequestType: {},
                    byModel: {},
                },
                forecast: {
                    method: "exponential-smoothing" as const,
                    forecastedTokens: 5500,
                    confidenceInterval95: { lower: 5000, upper: 6000 },
                    confidenceInterval99: { lower: 4800, upper: 6200 },
                    accuracy: 85,
                    dataPointsUsed: 30,
                    forecastDate: new Date("2024-01-09"),
                },
                trends: {
                    dailyTrend: [],
                    weeklyTrend: [],
                    monthlyTrend: [],
                },
                metadata: {
                    generatedDate: new Date().toISOString(),
                    dataRange: "test",
                    filtersApplied: [],
                    timezone: "UTC",
                },
            }

            const csv = await reporter.exportAsCSV(mockReport)

            expect(csv).toContain("FORECAST")
            expect(csv).toContain("Forecasted Tokens")
            expect(csv).toContain("5500")
            expect(csv).toContain("95% CI Lower")
            expect(csv).toContain("99% CI Upper")
        })
    })

    describe("exchangeRate", () => {
        it("should set and get exchange rate", () => {
            reporter.setExchangeRate(6.0)
            expect(reporter.getExchangeRate()).toBe(6.0)
        })

        it("should reject negative exchange rate", () => {
            expect(() => reporter.setExchangeRate(-1)).toThrow(
                "Exchange rate must be positive"
            )
        })

        it("should reject zero exchange rate", () => {
            expect(() => reporter.setExchangeRate(0)).toThrow(
                "Exchange rate must be positive"
            )
        })
    })
})
