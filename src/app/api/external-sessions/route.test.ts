import { describe, expect, it, vi } from "vitest"
import { DELETE, GET, POST } from "./route"
import { NextRequest } from "next/server"

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: vi.fn().mockImplementation(async (req: NextRequest) => {
        const authHeader = req.headers.get("authorization")
        if (authHeader === "Bearer valid-token") {
            return { user: { id: "manager-user-123" } }
        }
        return null
    }),
}))

vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                    data: [
                        {
                            id: "sess-1",
                            managed_client_name: "Waveigl",
                            platform: "tiktok",
                            platform_username: "waveigl_official",
                            status: "active",
                        },
                    ],
                    error: null,
                }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                }),
            }),
        }),
    }),
}))

describe("External Sessions API Route", () => {
    it("should return 401 Unauthorized for GET without valid session", async () => {
        const req = new NextRequest(
            "http://localhost:3000/api/external-sessions"
        )
        const res = await GET(req)
        expect(res.status).toBe(401)
    })

    it("should return session list for GET with valid manager session", async () => {
        const req = new NextRequest(
            "http://localhost:3000/api/external-sessions",
            {
                headers: { authorization: "Bearer valid-token" },
            }
        )
        const res = await GET(req)
        const body = await res.json()
        expect(res.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data).toHaveLength(1)
        expect(body.data[0].managed_client_name).toBe("Waveigl")
    })

    it("should store new encrypted session for POST", async () => {
        const req = new NextRequest(
            "http://localhost:3000/api/external-sessions",
            {
                method: "POST",
                headers: {
                    authorization: "Bearer valid-token",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    managedClientName: "Waveigl",
                    platform: "tiktok",
                    platformUsername: "waveigl_official",
                    cookies: [
                        {
                            name: "sessionid",
                            value: "abc",
                            domain: ".tiktok.com",
                            path: "/",
                        },
                    ],
                }),
            }
        )

        const res = await POST(req)
        const body = await res.json()
        expect(res.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.managedClientName).toBe("Waveigl")
    })

    it("should revoke session for DELETE", async () => {
        const req = new NextRequest(
            "http://localhost:3000/api/external-sessions?id=sess-1",
            {
                method: "DELETE",
                headers: { authorization: "Bearer valid-token" },
            }
        )

        const res = await DELETE(req)
        const body = await res.json()
        expect(res.status).toBe(200)
        expect(body.success).toBe(true)
    })
})
