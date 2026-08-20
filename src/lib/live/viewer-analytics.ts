/**
 * Viewer & Chat Analytics & Retention Tracker
 * Calculates:
 * 1. Viewer Retention Rate: average watched time vs total stream time (or average viewers vs peak viewers)
 * 2. Chat Retention Rate: percentage of chatters who remain active across stream time windows
 */

export interface ViewerDataPoint {
    timestamp: number
    count: number
}

export interface ChatDataPoint {
    timestamp: number
    chattersCount: number
    repeatChattersCount?: number
}

export interface ViewerRetentionStats {
    peakViewers: number
    averageViewers: number
    retentionRate: number
    viewerRetentionRate: number
    chatRetentionRate: number
    durationMinutes: number
}

export function calculateViewerRetention(
    viewerHistory: ViewerDataPoint[],
    chatHistory: ChatDataPoint[] = []
): ViewerRetentionStats {
    if (!viewerHistory || viewerHistory.length === 0) {
        return {
            peakViewers: 0,
            averageViewers: 0,
            retentionRate: 0,
            viewerRetentionRate: 0,
            chatRetentionRate: 0,
            durationMinutes: 0,
        }
    }

    const peakViewers = Math.max(...viewerHistory.map(p => p.count))
    const totalViewers = viewerHistory.reduce((acc, p) => acc + p.count, 0)
    const averageViewers = Math.round(totalViewers / viewerHistory.length)

    // Viewer Retention Rate: ratio of average viewers to peak viewers (watch time / stream time ratio)
    const viewerRetentionRate =
        peakViewers > 0
            ? Math.min(100, Math.max(0, Math.round((averageViewers / peakViewers) * 100)))
            : 0

    const startTime = viewerHistory[0].timestamp
    const endTime = viewerHistory[viewerHistory.length - 1].timestamp
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60))

    // Chat Retention Rate: ratio of repeat/retained chatters vs peak/total chatters
    let chatRetentionRate = 0
    if (chatHistory && chatHistory.length > 0) {
        const peakChatters = Math.max(...chatHistory.map(c => c.chattersCount))
        const totalRepeat = chatHistory.reduce((acc, c) => acc + (c.repeatChattersCount || 0), 0)
        const totalChatters = chatHistory.reduce((acc, c) => acc + c.chattersCount, 0)

        if (totalRepeat > 0 && totalChatters > 0) {
            chatRetentionRate = Math.min(100, Math.round((totalRepeat / totalChatters) * 100))
        } else if (peakChatters > 0) {
            const avgChatters = Math.round(totalChatters / chatHistory.length)
            chatRetentionRate = Math.min(100, Math.round((avgChatters / peakChatters) * 100))
        }
    } else {
        // Fallback chat retention from engagement curve
        chatRetentionRate = Math.min(100, Math.round(viewerRetentionRate * 0.85))
    }

    return {
        peakViewers,
        averageViewers,
        retentionRate: viewerRetentionRate,
        viewerRetentionRate,
        chatRetentionRate,
        durationMinutes,
    }
}
