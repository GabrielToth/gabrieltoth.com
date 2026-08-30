import { GET } from "@/app/api/live/health/route"
import { describe, expect, it } from "vitest"

describe("GET /api/live/health", () => {
    it("returns platform-specific stream health metrics for twitch", async () => {
        const req = new Request(
            "http://localhost:3000/api/live/health?platform=twitch&isLive=true"
        )
        const res = await GET(req)
        expect(res.status).toBe(200)
        const data = await res.json()

        expect(data.success).toBe(true)
        expect(data.platform).toBe("twitch")
        expect(data.metrics.bitrateKbps).toBe(6000)
        expect(data.metrics.codec).toBe("h264")
        expect(data.health.level).toBeDefined()
    })

    it("returns platform-specific stream health metrics for youtube", async () => {
        const req = new Request(
            "http://localhost:3000/api/live/health?platform=youtube&isLive=true"
        )
        const res = await GET(req)
        expect(res.status).toBe(200)
        const data = await res.json()

        expect(data.success).toBe(true)
        expect(data.platform).toBe("youtube")
        expect(data.metrics.bitrateKbps).toBe(8500)
        expect(data.metrics.codec).toBe("av1")
    })
})
