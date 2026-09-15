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

vi.mock("@/lib/supabase/server", () => {
    function makeBuilder() {
        const builder: Record<string, unknown> = {}
        const b = builder as {
            select: ReturnType<typeof vi.fn>
            insert: ReturnType<typeof vi.fn>
            update: ReturnType<typeof vi.fn>
            delete: ReturnType<typeof vi.fn>
            eq: ReturnType<typeof vi.fn>
            single: ReturnType<typeof vi.fn>
            then: (onFulfilled: (v: unknown) => unknown) => unknown
        } & { _payload?: { trigger?: string; response_template?: string; type?: string } }

        b.select = vi.fn(() => b)
        b.insert = vi.fn((payload: { trigger?: string; response_template?: string; type?: string }) => {
            b._payload = payload
            return b
        })
        b.update = vi.fn(() => b)
        b.delete = vi.fn(() => b)
        b.eq = vi.fn(() => b)
        b.single = vi.fn(() => {
            const payload = b._payload
            const data = payload
                ? {
                      id: "test-id",
                      trigger: payload.trigger ?? "!socials",
                      response_template: payload.response_template ?? "Check out my socials!",
                      type: payload.type ?? "response",
                  }
                : { id: "test-id", trigger: "!socials" }
            return Promise.resolve({ data, error: null })
        })
        b.then = (onFulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(onFulfilled as never)
        return b
    }

    return {
        getAdminClient: vi.fn(() => ({
            from: vi.fn(() => makeBuilder()),
        })),
    }
})

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
        const json = (await res.json()) as {
            success: boolean
            data: { matched: boolean; response: string }
        }
        expect(json.success).toBe(true)
        expect(json.data.matched).toBe(true)
        expect(json.data.response.toLowerCase()).toContain("discord")
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
                type: "response",
                responseTemplate: "Check out my socials!",
            }),
        })
        const res = await POST(req)
        expect(res.status).toBe(200)
        const json = (await res.json()) as {
            success: boolean
            data: { trigger: string }
        }
        expect(json.success).toBe(true)
        expect(json.data.trigger).toBe("!socials")
    })
})
