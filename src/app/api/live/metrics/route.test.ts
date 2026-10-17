import { describe, expect, it, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/live/metrics/route"
import { NextRequest } from "next/server"

// Mock Supabase admin client (in-memory store of snapshots)
const insertMock = vi.fn()
const selectRows: Array<{
    user_id: string
    platform: string
    viewers: number
    chat_messages_count: number
    timestamp: string
}> = []

vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        from: vi.fn((table: string) => ({
            insert: insertMock.mockResolvedValue({ error: null }),
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn(() =>
                        Promise.resolve({
                            data: selectRows.filter(
                                r => r.user_id === "user-123"
                            ),
                            error: null,
                        })
                    ),
                })),
            })),
        })),
    })),
}))

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
    beforeEach(() => {
        vi.clearAllMocks()
        selectRows.length = 0
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
        vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key")
    })

    it("should return 401 for unauthenticated requests", async () => {
        const req = new NextRequest("http://localhost/api/live/metrics")
        const res = await GET(req)
        expect(res.status).toBe(401)
        const json = await res.json()
        expect(json.success).toBe(false)
    })

    it("should return honest zero metrics when no snapshots exist", async () => {
        const req = new NextRequest("http://localhost/api/live/metrics", {
            headers: { authorization: "Bearer valid-token" },
        })
        const res = await GET(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.currentViewers).toBe(0)
        expect(json.data.totalSnapshots).toBe(0)
    })

    it("should persist a snapshot via POST and aggregate it via GET", async () => {
        // Simulate an existing snapshot row that POST would have written
        selectRows.push({
            user_id: "user-123",
            platform: "twitch",
            viewers: 150,
            chat_messages_count: 20,
            timestamp: new Date().toISOString(),
        })

        const getReq = new NextRequest("http://localhost/api/live/metrics", {
            headers: { authorization: "Bearer valid-token" },
        })
        const getRes = await GET(getReq)
        expect(getRes.status).toBe(200)
        const json = await getRes.json()
        expect(json.data.currentViewers).toBe(150)
        expect(json.data.totalSnapshots).toBe(1)
        expect(json.data.platformBreakdown.twitch).toBe(150)

        // POST persists a new snapshot
        const postReq = new NextRequest("http://localhost/api/live/metrics", {
            method: "POST",
            headers: {
                authorization: "Bearer valid-token",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                viewers: 200,
                chatMessagesCount: 30,
                platform: "twitch",
            }),
        })
        const postRes = await POST(postReq)
        expect(postRes.status).toBe(200)
        const postJson = await postRes.json()
        expect(postJson.success).toBe(true)
        expect(insertMock).toHaveBeenCalledTimes(1)
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
