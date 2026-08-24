import { describe, expect, it, vi } from "vitest"
import { GET, POST } from "@/app/api/live/metrics/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: vi.fn(async (req: NextRequest) => {
        const auth = req.headers.get("authorization")
        if (auth === "Bearer valid-token") {
            return { user: { id: "user-123", email: "test@example.com" } }
        }
        return null
    }),
}))

describe("Live Metrics API Route", () => {
    it("should return 401 for unauthenticated requests", async () => {
        const req = new NextRequest("http://localhost/api/live/metrics")
        const res = await GET(req)
        expect(res.status).toBe(401)
        const json = await res.json()
        expect(json.success).toBe(false)
    })

    it("should return stream metrics for authenticated requests", async () => {
        const req = new NextRequest("http://localhost/api/live/metrics", {
            headers: { authorization: "Bearer valid-token" },
        })
        const res = await GET(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data).toBeDefined()
    })

    it("should record a new stream metric snapshot via POST", async () => {
        const req = new NextRequest("http://localhost/api/live/metrics", {
            method: "POST",
            headers: {
                authorization: "Bearer valid-token",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                viewers: 150,
                chatMessagesCount: 20,
                platform: "twitch",
            }),
        })
        const res = await POST(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.viewers).toBe(150)
    })

    it("should return 400 for invalid metric payload", async () => {
        const req = new NextRequest("http://localhost/api/live/metrics", {
            method: "POST",
            headers: {
                authorization: "Bearer valid-token",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                viewers: "invalid",
            }),
        })
        const res = await POST(req)
        expect(res.status).toBe(400)
    })
})
