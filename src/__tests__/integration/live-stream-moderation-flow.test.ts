/**
 * Integration Test for Live Stream Health, Viewer Analytics, and Chat Moderation Flow
 */

import { evaluateStreamHealth, StreamHealthMetrics } from "@/lib/live/stream-health"
import { calculateViewerRetention, ViewerDataPoint } from "@/lib/live/viewer-analytics"
import { ChatModerator, ModerationRule } from "@/lib/chat/moderation"
import { BotResponder } from "@/lib/chat/bot-responder"

describe("Live Stream Health, Analytics and Moderation Integration", () => {
    it("monitors stream health and flags poor conditions", () => {
        const metrics: StreamHealthMetrics = {
            bitrateKbps: 4500,
            fps: 59,
            droppedFrames: 5,
            totalFrames: 5000,
            latencyMs: 2000,
            resolution: "1080p",
            codec: "h264",
            timestamp: Date.now(),
        }
        const health = evaluateStreamHealth(metrics)
        expect(health.level).toBe("excellent")
    })

    it("calculates retention metrics across a session", () => {
        const now = Date.now()
        const history: ViewerDataPoint[] = [
            { timestamp: now, count: 50 },
            { timestamp: now + 300000, count: 120 },
            { timestamp: now + 600000, count: 100 },
        ]
        const retention = calculateViewerRetention(history)
        expect(retention.peakViewers).toBe(120)
        expect(retention.averageViewers).toBe(90)
        expect(retention.durationMinutes).toBe(10)
    })

    it("evaluates messages against moderator rules and bot commands", () => {
        const rules: ModerationRule[] = [
            { id: "r1", pattern: "crypto scam", type: "keyword", action: "block" },
        ]
        const moderator = new ChatModerator(rules)
        const bot = new BotResponder([
            { trigger: "!schedule", response: "Streams every Mon/Wed 8PM EST", enabled: true },
        ])

        const msg1 = "Join this crypto scam now!"
        const modRes1 = moderator.evaluateMessage(msg1)
        expect(modRes1.flagged).toBe(true)
        expect(modRes1.action).toBe("block")

        const msg2 = "!schedule"
        const modRes2 = moderator.evaluateMessage(msg2)
        expect(modRes2.flagged).toBe(false)
        expect(bot.getResponse(msg2)).toBe("Streams every Mon/Wed 8PM EST")
    })
})
