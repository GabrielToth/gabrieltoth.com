import { describe, expect, it, vi } from "vitest"
import { POST as DiscordPOST } from "@/app/api/webhooks/discord/route"
import { POST as TelegramPOST } from "@/app/api/webhooks/telegram/route"
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

vi.mock("@/lib/notifications/webhook-notifier", () => ({
    sendDiscordNotification: vi.fn(async (url: string) => {
        if (url.includes("fail")) return { success: false, error: "Failed" }
        return { success: true }
    }),
    sendTelegramNotification: vi.fn(async (token: string) => {
        if (token.includes("fail")) return { success: false, error: "Failed" }
        return { success: true }
    }),
}))

describe("Webhook API Routes", () => {
    describe("Discord API Route", () => {
        it("should return 401 when unauthorized", async () => {
            const req = new NextRequest(
                "http://localhost/api/webhooks/discord",
                {
                    method: "POST",
                }
            )
            const res = await DiscordPOST(req)
            expect(res.status).toBe(401)
        })

        it("should dispatch discord notification successfully", async () => {
            const req = new NextRequest(
                "http://localhost/api/webhooks/discord",
                {
                    method: "POST",
                    headers: {
                        authorization: "Bearer valid-token",
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        webhookUrl: "https://discord.com/api/webhooks/123/abc",
                        event: {
                            title: "Test",
                            description: "Test event",
                            eventType: "stream_live",
                        },
                    }),
                }
            )
            const res = await DiscordPOST(req)
            expect(res.status).toBe(200)
            const json = await res.json()
            expect(json.success).toBe(true)
        })
    })

    describe("Telegram API Route", () => {
        it("should return 401 when unauthorized", async () => {
            const req = new NextRequest(
                "http://localhost/api/webhooks/telegram",
                {
                    method: "POST",
                }
            )
            const res = await TelegramPOST(req)
            expect(res.status).toBe(401)
        })

        it("should dispatch telegram notification successfully", async () => {
            const req = new NextRequest(
                "http://localhost/api/webhooks/telegram",
                {
                    method: "POST",
                    headers: {
                        authorization: "Bearer valid-token",
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        botToken: "123:abc",
                        chatId: "999",
                        event: {
                            title: "Test",
                            description: "Test event",
                            eventType: "stream_live",
                        },
                    }),
                }
            )
            const res = await TelegramPOST(req)
            expect(res.status).toBe(200)
            const json = await res.json()
            expect(json.success).toBe(true)
        })
    })
})
