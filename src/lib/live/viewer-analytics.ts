/**
 * Viewer Analytics & Retention Tracker
 */

export interface ViewerDataPoint {
    timestamp: number
    count: number
}

export interface ViewerRetentionStats {
    peakViewers: number
    averageViewers: number
    retentionRate: number // percentage 0-100
    durationMinutes: number
}

export function calculateViewerRetention(history: ViewerDataPoint[]): ViewerRetentionStats {
    if (!history || history.length === 0) {
        return {
            peakViewers: 0,
            averageViewers: 0,
            retentionRate: 0,
            durationMinutes: 0,
        }
    }

    const peakViewers = Math.max(...history.map((p) => p.count))
    const totalViewers = history.reduce((acc, p) => acc + p.count, 0)
    const averageViewers = Math.round(totalViewers / history.length)

    const initialViewers = history[0].count
    const finalViewers = history[history.length - 1].count
    const retentionRate =
        initialViewers > 0
            ? Math.min(100, Math.round((finalViewers / initialViewers) * 100))
            : 100

    const startTime = history[0].timestamp
    const endTime = history[history.length - 1].timestamp
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60))

    return {
        peakViewers,
        averageViewers,
        retentionRate,
        durationMinutes,
    }
}
