import { calculateViewerRetention, ViewerDataPoint, ChatDataPoint } from "./viewer-analytics"

describe("calculateViewerRetention", () => {
    it("handles empty history gracefully", () => {
        const stats = calculateViewerRetention([])
        expect(stats.peakViewers).toBe(0)
        expect(stats.averageViewers).toBe(0)
        expect(stats.viewerRetentionRate).toBe(0)
        expect(stats.chatRetentionRate).toBe(0)
    })

    it("calculates peak, average, viewer retention and chat retention rate correctly", () => {
        const now = Date.now()
        const history: ViewerDataPoint[] = [
            { timestamp: now, count: 100 },
            { timestamp: now + 60000, count: 150 },
            { timestamp: now + 120000, count: 120 },
            { timestamp: now + 180000, count: 90 },
        ]

        const chatHistory: ChatDataPoint[] = [
            { timestamp: now, chattersCount: 20, repeatChattersCount: 5 },
            { timestamp: now + 60000, chattersCount: 30, repeatChattersCount: 15 },
            { timestamp: now + 120000, chattersCount: 25, repeatChattersCount: 12 },
            { timestamp: now + 180000, chattersCount: 15, repeatChattersCount: 8 },
        ]

        const stats = calculateViewerRetention(history, chatHistory)
        expect(stats.peakViewers).toBe(150)
        expect(stats.averageViewers).toBe(115)
        expect(stats.viewerRetentionRate).toBe(77) // Math.round((115 / 150) * 100)
        expect(stats.chatRetentionRate).toBe(44) // Math.round((40 / 90) * 100)
        expect(stats.durationMinutes).toBe(3)
    })
})
