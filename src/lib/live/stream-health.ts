/**
 * Stream Health Monitoring Domain & Logic
 */

export interface StreamHealthMetrics {
    bitrateKbps: number
    fps: number
    droppedFrames: number
    totalFrames: number
    latencyMs: number
    resolution: string
    codec: string
    timestamp: number
}

export type HealthStatusLevel = "excellent" | "good" | "fair" | "poor" | "critical"

export interface StreamHealthStatus {
    level: HealthStatusLevel
    score: number // 0-100
    issues: string[]
}

export function evaluateStreamHealth(metrics: StreamHealthMetrics): StreamHealthStatus {
    const issues: string[] = []
    let score = 100

    // Frame drop ratio
    if (metrics.totalFrames > 0) {
        const dropRatio = metrics.droppedFrames / metrics.totalFrames
        if (dropRatio > 0.05) {
            score -= 40
            issues.push(`High dropped frames: ${(dropRatio * 100).toFixed(1)}%`)
        } else if (dropRatio > 0.01) {
            score -= 15
            issues.push(`Minor dropped frames: ${(dropRatio * 100).toFixed(1)}%`)
        }
    }

    // Bitrate check
    if (metrics.bitrateKbps < 1500) {
        score -= 30
        issues.push(`Low bitrate: ${metrics.bitrateKbps} Kbps (min recommended: 1500)`)
    } else if (metrics.bitrateKbps < 3000) {
        score -= 10
        issues.push(`Sub-optimal bitrate: ${metrics.bitrateKbps} Kbps`)
    }

    // Latency check
    if (metrics.latencyMs > 8000) {
        score -= 20
        issues.push(`High latency: ${(metrics.latencyMs / 1000).toFixed(1)}s`)
    }

    // FPS check
    if (metrics.fps < 24) {
        score -= 25
        issues.push(`Low frame rate: ${metrics.fps} FPS`)
    }

    score = Math.max(0, Math.min(100, score))

    let level: HealthStatusLevel = "excellent"
    if (score < 40) level = "critical"
    else if (score < 60) level = "poor"
    else if (score < 75) level = "fair"
    else if (score < 90) level = "good"

    return { level, score, issues }
}
