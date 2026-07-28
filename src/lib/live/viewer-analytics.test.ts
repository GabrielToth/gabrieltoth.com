import { calculateViewerRetention, ViewerDataPoint } from "./viewer-analytics"

describe("calculateViewerRetention", () => {
    it("handles empty history gracefully", () => {
        const stats = calculateViewerRetention([])
        expect(stats.peakViewers).toBe(0)
        expect(stats.averageViewers).toBe(0)
    })

    it("calculates peak, average and retention rate correctly", () => {
        const now = Date.now()
        const history: ViewerDataPoint[] = [
            { timestamp: now, count: 100 },
            { timestamp: now + 60000, count: 150 },
            { timestamp: now + 120000, count: 120 },
            { timestamp: now + 180000, count: 90 },
        ]

        const stats = calculateViewerRetention(history)
        expect(stats.peakViewers).toBe(150)
        expect(stats.averageViewers).toBe(115)
        expect(stats.retentionRate).toBe(90)
        expect(stats.durationMinutes).toBe(3)
    })
})
