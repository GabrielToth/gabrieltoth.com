import { describe, expect, it } from "vitest"
import {
    buildAdvancedMetrics,
    buildNormalizedGraphData,
    buildNormalizedMetrics,
} from "@/lib/analytics/normalized-analytics-service"

describe("normalized-analytics-service", () => {
    describe("buildNormalizedMetrics", () => {
        it("should calculate correct changes and percentage changes", () => {
            const metrics = buildNormalizedMetrics({
                totalFollowers: 1000,
                previousFollowers: 800,
                totalEngagement: 200,
                previousEngagement: 100,
            })

            expect(metrics).toHaveLength(4)
            const followers = metrics.find(m => m.id === "followers")
            expect(followers?.value).toBe(1000)
            expect(followers?.change).toBe(200)
            expect(followers?.changePercent).toBe(25)

            const engagement = metrics.find(m => m.id === "engagement")
            expect(engagement?.value).toBe(200)
            expect(engagement?.change).toBe(100)
            expect(engagement?.changePercent).toBe(100)
        })

        it("should handle 0 initial values safely", () => {
            const metrics = buildNormalizedMetrics({})
            expect(metrics).toHaveLength(4)
            expect(metrics[0].value).toBe(0)
            expect(metrics[0].changePercent).toBe(0)
        })
    })

    describe("buildAdvancedMetrics", () => {
        it("should build detailed breakdown metrics for advanced view", () => {
            const simple = buildNormalizedMetrics({ totalFollowers: 500 })
            const advanced = buildAdvancedMetrics(simple, ["twitch"])

            expect(advanced.length).toBeGreaterThan(0)
            expect(advanced[0].platformBreakdown.twitch).toBeDefined()
        })
    })

    describe("buildNormalizedGraphData", () => {
        it("should generate graph points corresponding to period days", () => {
            const points = buildNormalizedGraphData(7, {
                followers: 1000,
                engagement: 500,
                reach: 2000,
                impressions: 5000,
            })

            expect(points).toHaveLength(7)
            expect(points[0].followers).toBeGreaterThan(0)
            expect(points[6].followers).toBe(1000)
        })
    })
})
