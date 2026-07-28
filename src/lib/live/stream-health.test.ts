import { evaluateStreamHealth, StreamHealthMetrics } from "./stream-health"

describe("evaluateStreamHealth", () => {
    it("returns excellent for optimal stream metrics", () => {
        const metrics: StreamHealthMetrics = {
            bitrateKbps: 6000,
            fps: 60,
            droppedFrames: 0,
            totalFrames: 10000,
            latencyMs: 1500,
            resolution: "1080p",
            codec: "h264",
            timestamp: Date.now(),
        }

        const health = evaluateStreamHealth(metrics)
        expect(health.level).toBe("excellent")
        expect(health.score).toBe(100)
        expect(health.issues).toHaveLength(0)
    })

    it("detects high dropped frames and low bitrate", () => {
        const metrics: StreamHealthMetrics = {
            bitrateKbps: 1200,
            fps: 20,
            droppedFrames: 1000,
            totalFrames: 10000,
            latencyMs: 9000,
            resolution: "720p",
            codec: "h264",
            timestamp: Date.now(),
        }

        const health = evaluateStreamHealth(metrics)
        expect(health.score).toBeLessThan(40)
        expect(health.level).toBe("critical")
        expect(health.issues.length).toBeGreaterThan(0)
    })
})
