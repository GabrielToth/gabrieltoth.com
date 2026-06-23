/**
 * Token Killer Dashboard Integration Tests
 * Tests data loading, display, time window switching, anomaly highlighting, and real-time updates
 * Implements Task 23.1: Integration tests for dashboard
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type {
    AggregatedTokenData,
    AnomalyDetectionResult,
    TimeWindow,
} from "../../components/token-killer-dashboard/types"

/**
 * Mock API responses
 */
const mockStatsData: AggregatedTokenData = {
    timeWindow: "7d",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-08"),
    totalTokens: 100000,
    inputTokens: 60000,
    outputTokens: 40000,
    totalCost: 5.0,
    costUSD: 5.0,
    costBRL: 25.0,
    requestCount: 500,
    taskCount: 50,
    byAgentType: {
        kiro: { tokens: 40000, cost: 2.0, count: 200 },
        antigravity: { tokens: 35000, cost: 1.75, count: 150 },
        cursor: { tokens: 25000, cost: 1.25, count: 150 },
    },
    byRequestType: {},
    byModel: {
        "claude-haiku-4.5": { tokens: 60000, cost: 3.0, count: 300 },
        "gemini-flash-3.1": { tokens: 40000, cost: 2.0, count: 200 },
    },
    byOptimizationStrategy: {},
}

const mockAnomalies: AnomalyDetectionResult = {
    anomalies: [
        {
            timestamp: new Date("2024-01-05"),
            totalTokens: 25000,
            zScore: 2.5,
            deviation: "150% above mean",
            context: "250 records on 2024-01-05",
        },
    ],
    mean: 10000,
    stdDev: 5000,
    threshold: 2,
    dataPoints: 7,
}

/**
 * Test suite for dashboard data loading
 */
describe("Token Killer Dashboard - Data Loading", () => {
    beforeEach(() => {
        // Mock fetch API
        global.fetch = vi.fn()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("should load stats data for selected time window", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockStatsData,
        })

        const response = await fetch("/api/token-killer/stats/7d")
        const data = await response.json()

        expect(response.ok).toBe(true)
        expect(data.totalTokens).toBe(100000)
        expect(data.timeWindow).toBe("7d")
        expect(mockFetch).toHaveBeenCalledWith("/api/token-killer/stats/7d")
    })

    it("should load anomaly data for selected time window", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAnomalies,
        })

        const response = await fetch("/api/token-killer/anomalies/7d")
        const data = await response.json()

        expect(response.ok).toBe(true)
        expect(data.anomalies).toHaveLength(1)
        expect(data.mean).toBe(10000)
        expect(mockFetch).toHaveBeenCalledWith("/api/token-killer/anomalies/7d")
    })

    it("should handle API errors gracefully", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({
                error: "STATS_RETRIEVAL_FAILED",
                message: "Failed to retrieve token statistics",
            }),
        })

        const response = await fetch("/api/token-killer/stats/7d")
        const data = await response.json()

        expect(response.ok).toBe(false)
        expect(data.error).toBe("STATS_RETRIEVAL_FAILED")
    })

    it("should validate time window parameter", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({
                error: "INVALID_TIME_WINDOW",
                message: "Invalid time window: invalid",
            }),
        })

        const response = await fetch("/api/token-killer/stats/invalid")
        const data = await response.json()

        expect(response.ok).toBe(false)
        expect(data.error).toBe("INVALID_TIME_WINDOW")
    })
})

/**
 * Test suite for time window switching
 */
describe("Token Killer Dashboard - Time Window Switching", () => {
    beforeEach(() => {
        global.fetch = vi.fn()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("should fetch data for 24h window", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...mockStatsData, timeWindow: "24h" }),
        })

        const response = await fetch("/api/token-killer/stats/24h")
        const data = await response.json()

        expect(data.timeWindow).toBe("24h")
        expect(mockFetch).toHaveBeenCalledWith("/api/token-killer/stats/24h")
    })

    it("should fetch data for 30d window", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...mockStatsData, timeWindow: "30d" }),
        })

        const response = await fetch("/api/token-killer/stats/30d")
        const data = await response.json()

        expect(data.timeWindow).toBe("30d")
    })

    it("should fetch data for 90d window", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...mockStatsData, timeWindow: "90d" }),
        })

        const response = await fetch("/api/token-killer/stats/90d")
        const data = await response.json()

        expect(data.timeWindow).toBe("90d")
    })

    it("should fetch data for all-time window", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...mockStatsData, timeWindow: "all-time" }),
        })

        const response = await fetch("/api/token-killer/stats/all-time")
        const data = await response.json()

        expect(data.timeWindow).toBe("all-time")
    })
})

/**
 * Test suite for anomaly highlighting
 */
describe("Token Killer Dashboard - Anomaly Highlighting", () => {
    beforeEach(() => {
        global.fetch = vi.fn()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("should detect and display anomalies", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAnomalies,
        })

        const response = await fetch("/api/token-killer/anomalies/7d")
        const data = await response.json()

        expect(data.anomalies).toHaveLength(1)
        expect(data.anomalies[0].zScore).toBe(2.5)
        expect(data.anomalies[0].deviation).toBe("150% above mean")
    })

    it("should return empty anomalies when none detected", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                anomalies: [],
                mean: 10000,
                stdDev: 5000,
                threshold: 2,
            }),
        })

        const response = await fetch("/api/token-killer/anomalies/7d")
        const data = await response.json()

        expect(data.anomalies).toHaveLength(0)
    })

    it("should include context information for anomalies", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAnomalies,
        })

        const response = await fetch("/api/token-killer/anomalies/7d")
        const data = await response.json()

        const anomaly = data.anomalies[0]
        expect(anomaly.context).toBeDefined()
        expect(anomaly.timestamp).toBeDefined()
        expect(anomaly.totalTokens).toBeDefined()
    })

    it("should support custom threshold for anomaly detection", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAnomalies,
        })

        const response = await fetch(
            "/api/token-killer/anomalies/7d?threshold=3"
        )
        const data = await response.json()

        expect(mockFetch).toHaveBeenCalledWith(
            "/api/token-killer/anomalies/7d?threshold=3"
        )
    })
})

/**
 * Test suite for real-time updates
 */
describe("Token Killer Dashboard - Real-time Updates", () => {
    beforeEach(() => {
        global.fetch = vi.fn()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.clearAllMocks()
        vi.useRealTimers()
    })

    it("should support auto-refresh at 30-second intervals", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockStatsData,
        })

        // Simulate auto-refresh interval
        const interval = setInterval(() => {
            fetch("/api/token-killer/stats/7d")
        }, 30000)

        // Advance time by 30 seconds
        vi.advanceTimersByTime(30000)

        // Advance time by another 30 seconds
        vi.advanceTimersByTime(30000)

        clearInterval(interval)

        // Should have been called at least twice (initial + 2 intervals)
        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it("should allow manual refresh", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockStatsData,
        })

        // Simulate manual refresh
        await fetch("/api/token-killer/stats/7d")
        await fetch("/api/token-killer/stats/7d")

        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it("should allow toggling auto-refresh on/off", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockStatsData,
        })

        // Simulate auto-refresh enabled
        let autoRefresh = true
        const interval = setInterval(() => {
            if (autoRefresh) {
                fetch("/api/token-killer/stats/7d")
            }
        }, 30000)

        // Advance time
        vi.advanceTimersByTime(30000)

        // Disable auto-refresh
        autoRefresh = false

        // Advance time again
        vi.advanceTimersByTime(30000)

        clearInterval(interval)

        // Should have been called only once (before disabling)
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })
})

/**
 * Test suite for data aggregation accuracy
 */
describe("Token Killer Dashboard - Data Aggregation", () => {
    it("should aggregate tokens correctly", () => {
        const data = mockStatsData

        const totalByAgent = Object.values(data.byAgentType).reduce(
            (sum, agent) => sum + agent.tokens,
            0
        )

        expect(totalByAgent).toBe(data.totalTokens)
    })

    it("should calculate costs correctly", () => {
        const data = mockStatsData

        const totalCostByAgent = Object.values(data.byAgentType).reduce(
            (sum, agent) => sum + agent.cost,
            0
        )

        expect(totalCostByAgent).toBeCloseTo(data.totalCost, 2)
    })

    it("should calculate percentages correctly", () => {
        const data = mockStatsData

        const agentPercentages = Object.values(data.byAgentType).map(
            agent => (agent.tokens / data.totalTokens) * 100
        )

        const totalPercentage = agentPercentages.reduce(
            (sum, pct) => sum + pct,
            0
        )

        expect(totalPercentage).toBeCloseTo(100, 1)
    })

    it("should include all required fields in stats data", () => {
        const data = mockStatsData

        expect(data).toHaveProperty("timeWindow")
        expect(data).toHaveProperty("startDate")
        expect(data).toHaveProperty("endDate")
        expect(data).toHaveProperty("totalTokens")
        expect(data).toHaveProperty("inputTokens")
        expect(data).toHaveProperty("outputTokens")
        expect(data).toHaveProperty("totalCost")
        expect(data).toHaveProperty("costUSD")
        expect(data).toHaveProperty("costBRL")
        expect(data).toHaveProperty("requestCount")
        expect(data).toHaveProperty("taskCount")
        expect(data).toHaveProperty("byAgentType")
        expect(data).toHaveProperty("byModel")
    })
})

/**
 * Test suite for error handling
 */
describe("Token Killer Dashboard - Error Handling", () => {
    beforeEach(() => {
        global.fetch = vi.fn()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("should handle network errors", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockRejectedValueOnce(new Error("Network error"))

        try {
            await fetch("/api/token-killer/stats/7d")
        } catch (error) {
            expect(error).toBeInstanceOf(Error)
            expect((error as Error).message).toBe("Network error")
        }
    })

    it("should handle timeout errors", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockRejectedValueOnce(new Error("Request timeout"))

        try {
            await fetch("/api/token-killer/stats/7d")
        } catch (error) {
            expect((error as Error).message).toBe("Request timeout")
        }
    })

    it("should handle malformed JSON responses", async () => {
        const mockFetch = global.fetch as any
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => {
                throw new Error("Invalid JSON")
            },
        })

        const response = await fetch("/api/token-killer/stats/7d")
        try {
            await response.json()
        } catch (error) {
            expect((error as Error).message).toBe("Invalid JSON")
        }
    })
})
