/**
 * Stream Analytics Library
 * Calculates real-time metrics, engagement scores, viewer retention, and chat velocity.
 */

export interface StreamMetricSnapshot {
    timestamp: number
    viewers: number
    chatMessagesCount: number
    platform: string
}

export interface AggregatedStreamMetrics {
    totalSnapshots: number
    currentViewers: number
    peakViewers: number
    avgViewers: number
    chatVelocityPerMinute: number
    engagementScore: number
    retentionRatePercent: number
    platformBreakdown: Record<string, number>
}

/**
 * Calculates chat velocity (messages per minute)
 */
export function calculateChatVelocity(
    totalMessages: number,
    durationMinutes: number
): number {
    if (durationMinutes <= 0) return 0
    return Math.round((totalMessages / durationMinutes) * 100) / 100
}

/**
 * Calculates retention rate percentage (current / peak * 100)
 */
export function evaluateRetentionRate(
    currentViewers: number,
    peakViewers: number
): number {
    if (peakViewers <= 0) return 0
    const rate = (currentViewers / peakViewers) * 100
    return Math.min(100, Math.round(rate * 100) / 100)
}

/**
 * Calculates an engagement score (0-100 scale) based on viewers and chat velocity
 */
export function calculateEngagementScore(
    viewers: number,
    chatRatePerMin: number
): number {
    if (viewers <= 0) return 0
    // Ideal ratio is 1-5 messages/min per 10 viewers
    const ratio = chatRatePerMin / viewers
    const rawScore = Math.min(100, ratio * 500)
    return Math.round(rawScore * 10) / 10
}

/**
 * Aggregates a series of stream metric snapshots into a single analytics report
 */
export function aggregateMetricsSnapshots(
    snapshots: StreamMetricSnapshot[]
): AggregatedStreamMetrics {
    if (!snapshots || snapshots.length === 0) {
        return {
            totalSnapshots: 0,
            currentViewers: 0,
            peakViewers: 0,
            avgViewers: 0,
            chatVelocityPerMinute: 0,
            engagementScore: 0,
            retentionRatePercent: 0,
            platformBreakdown: {},
        }
    }

    let peakViewers = 0
    let totalViewersSum = 0
    let totalMessages = 0
    const platformBreakdown: Record<string, number> = {}

    const sortedSnapshots = [...snapshots].sort(
        (a, b) => a.timestamp - b.timestamp
    )

    for (const snap of sortedSnapshots) {
        if (snap.viewers > peakViewers) {
            peakViewers = snap.viewers
        }
        totalViewersSum += snap.viewers
        totalMessages += snap.chatMessagesCount || 0
        platformBreakdown[snap.platform] =
            (platformBreakdown[snap.platform] || 0) + snap.viewers
    }

    const latest = sortedSnapshots[sortedSnapshots.length - 1]
    const currentViewers = latest.viewers
    const avgViewers = Math.round(totalViewersSum / sortedSnapshots.length)

    const startTime = sortedSnapshots[0].timestamp
    const endTime = latest.timestamp
    const durationMinutes = Math.max(1, (endTime - startTime) / 60000)

    const chatVelocity = calculateChatVelocity(totalMessages, durationMinutes)
    const retentionRate = evaluateRetentionRate(currentViewers, peakViewers)
    const engagementScore = calculateEngagementScore(
        currentViewers,
        chatVelocity
    )

    return {
        totalSnapshots: sortedSnapshots.length,
        currentViewers,
        peakViewers,
        avgViewers,
        chatVelocityPerMinute: chatVelocity,
        engagementScore,
        retentionRatePercent: retentionRate,
        platformBreakdown,
    }
}
