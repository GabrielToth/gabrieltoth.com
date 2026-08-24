import { describe, expect, it, vi } from "vitest"
import { GET, POST } from "@/app/api/chat-commands/route"
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

describe("Chat Commands API Route", () => {
    it("should return 401 for unauthorized GET", async () => {
        const req = new NextRequest("http://localhost/api/chat-commands")
        const res = await GET(req)
        expect(res.status).toBe(401)
    })

    it("should return list of chat commands for authorized GET", async () => {
        const req = new NextRequest("http://localhost/api/chat-commands", {
            headers: { authorization: "Bearer valid-token" },
        })
        const res = await GET(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(Array.isArray(json.data)).toBe(true)
    })

    it("should execute a chat command via POST action=execute", async () => {
        const req = new NextRequest("http://localhost/api/chat-commands", {
            method: "POST",
            headers: {
                authorization: "Bearer valid-token",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                action: "execute",
                messageText: "!discord",
                username: "Gabriel",
                platform: "Twitch",
            }),
        })
        const res = await POST(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.matched).toBe(true)
        expect(json.data.response).toContain("Discord")
    })

    it("should create a new custom chat command via POST", async () => {
        const req = new NextRequest("http://localhost/api/chat-commands", {
            method: "POST",
            headers: {
                authorization: "Bearer valid-token",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                trigger: "!socials",
                responseTemplate: "Follow my twitter @gabrieltoth",
            }),
        })
        const res = await POST(req)
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.trigger).toBe("!socials")
    })
})
