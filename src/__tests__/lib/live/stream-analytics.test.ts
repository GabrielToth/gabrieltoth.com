import { describe, expect, it } from "vitest"
import {
    aggregateMetricsSnapshots,
    calculateChatVelocity,
    calculateEngagementScore,
    evaluateRetentionRate,
    StreamMetricSnapshot,
} from "@/lib/live/stream-analytics"

describe("stream-analytics", () => {
    describe("calculateChatVelocity", () => {
        it("should return 0 when duration is 0 or negative", () => {
            expect(calculateChatVelocity(50, 0)).toBe(0)
            expect(calculateChatVelocity(50, -5)).toBe(0)
        })

        it("should calculate correct chat messages per minute", () => {
            expect(calculateChatVelocity(120, 2)).toBe(60)
            expect(calculateChatVelocity(15, 10)).toBe(1.5)
        })
    })

    describe("evaluateRetentionRate", () => {
        it("should return 0 if peak viewers is 0", () => {
            expect(evaluateRetentionRate(10, 0)).toBe(0)
        })

        it("should calculate retention rate correctly and cap at 100", () => {
            expect(evaluateRetentionRate(80, 100)).toBe(80)
            expect(evaluateRetentionRate(120, 100)).toBe(100)
            expect(evaluateRetentionRate(50, 200)).toBe(25)
        })
    })

    describe("calculateEngagementScore", () => {
        it("should return 0 if viewers is 0", () => {
            expect(calculateEngagementScore(0, 50)).toBe(0)
        })

        it("should compute reasonable score capped at 100", () => {
            const score = calculateEngagementScore(100, 10)
            expect(score).toBeGreaterThan(0)
            expect(score).toBeLessThanOrEqual(100)
        })
    })

    describe("aggregateMetricsSnapshots", () => {
        it("should handle empty snapshots gracefully", () => {
            const result = aggregateMetricsSnapshots([])
            expect(result.totalSnapshots).toBe(0)
            expect(result.currentViewers).toBe(0)
            expect(result.peakViewers).toBe(0)
        })

        it("should aggregate series of metric snapshots accurately", () => {
            const now = Date.now()
            const snapshots: StreamMetricSnapshot[] = [
                {
                    timestamp: now - 120000,
                    viewers: 50,
                    chatMessagesCount: 10,
                    platform: "twitch",
                },
                {
                    timestamp: now - 60000,
                    viewers: 100,
                    chatMessagesCount: 25,
                    platform: "kick",
                },
                {
                    timestamp: now,
                    viewers: 80,
                    chatMessagesCount: 15,
                    platform: "twitch",
                },
            ]

            const result = aggregateMetricsSnapshots(snapshots)
            expect(result.totalSnapshots).toBe(3)
            expect(result.currentViewers).toBe(80)
            expect(result.peakViewers).toBe(100)
            expect(result.avgViewers).toBe(77)
            expect(result.retentionRatePercent).toBe(80)
            expect(result.platformBreakdown.twitch).toBe(130)
            expect(result.platformBreakdown.kick).toBe(100)
        })
    })
})
