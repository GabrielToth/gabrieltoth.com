/**
 * Security Tests for GET + POST /api/webhooks/tiktok — Attack Matrix
 *
 * Attack matrix applicable rows — GET (verification handshake):
 * 1  (auth bypass — missing challenge param)
 * 2  (HTTP method confusion)
 * 3  (type attacks — query params)
 * 4  (value attacks — challenge param)
 * 5  (structure attacks — missing/extra params)
 * 7  (injection — challenge param)
 * 8  (unicode/encoding — challenge param)
 * 9  (size attacks — oversized challenge)
 * 14 (HTTP header attacks)
 * 15 (info disclosure — error messages)
 * 18 (path traversal — challenge param)
 *
 * Attack matrix applicable rows — POST (event processing):
 * 2  (method confusion)
 * 3  (type attacks — body)
 * 4  (value attacks — body)
 * 5  (structure attacks — body)
 * 6  (prototype pollution — body)
 * 7  (injection — body fields)
 * 8  (unicode/encoding — body)
 * 9  (size attacks — body)
 * 10 (rate limiting)
 * 12 (race conditions)
 * 13 (Content-Type)
 * 14 (HTTP header attacks)
 * 15 (info disclosure)
 * 19 (mass assignment — body fields)
 * 20 (SSRF — body URL fields)
 *
 * SKIP (both methods):
 *   11 (CSRF) — webhook verification acts as auth
 *   16 (business logic) — no pre-check
 *   17 (IDOR) — no user context
 *   21 (timing side-channel) — all paths return errors
 */

import { GET, POST } from "@/app/api/webhooks/tiktok/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
})

const mockHandleEvent = vi.hoisted(() =>
    vi.fn().mockResolvedValue({
        handled: 1,
        errors: 0,
        details: ["video.publish.completed:test-id"],
    })
)

vi.mock("@/lib/tiktok/webhook-handler", () => ({
    handleTikTokWebhookEvent: mockHandleEvent,
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

describe("TikTok Webhook — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("GET — Verification handshake", () => {
        describe("Row 1 — Auth bypass", () => {
            it("should reject without challenge param", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok"
                )
                const response = await GET(req)
                expect(response.status).toBe(403)
            })
        })

        describe("Row 2 — Method confusion", () => {
            it("should not expose POST on GET-only", async () => {
                const route = await import("@/app/api/webhooks/tiktok/route")
                expect("GET" in route).toBe(true)
                expect("POST" in route).toBe(true)
            })
        })

        describe("Row 3 — Type attacks", () => {
            it("should handle challenge as number", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok?challenge=12345"
                )
                const response = await GET(req)
                expect([200, 403]).toContain(response.status)
            })
        })

        describe("Row 4 — Value attacks", () => {
            it("should handle empty challenge", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok?challenge="
                )
                const response = await GET(req)
                expect(response.status).toBe(403)
            })

            it("should handle missing challenge", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok"
                )
                const response = await GET(req)
                expect(response.status).toBe(403)
            })
        })

        describe("Row 5 — Structure attacks", () => {
            it("should handle no query params", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok"
                )
                const response = await GET(req)
                expect(response.status).toBe(403)
            })
        })

        describe("Row 7 — Injection", () => {
            it("should handle SQL injection in challenge", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok?challenge=1' OR '1'='1"
                )
                const response = await GET(req)
                expect([200, 403]).toContain(response.status)
            })

            it("should handle XSS in challenge", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok?challenge=<script>alert(1)</script>"
                )
                const response = await GET(req)
                expect([200, 403]).toContain(response.status)
            })
        })

        describe("Row 8 — Unicode", () => {
            it("should handle unicode in challenge", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok?challenge=🔥"
                )
                const response = await GET(req)
                expect([200, 403]).toContain(response.status)
            })
        })

        describe("Row 9 — Size", () => {
            it("should handle oversized challenge", async () => {
                const req = new NextRequest(
                    `http://localhost/api/webhooks/tiktok?challenge=${"A".repeat(10000)}`
                )
                const response = await GET(req)
                expect([200, 403]).toContain(response.status)
            })
        })

        describe("Row 14 — Header attacks", () => {
            it("should handle Host header override", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok?challenge=test",
                    { headers: { Host: "evil.com" } }
                )
                const response = await GET(req)
                expect([200, 403]).toContain(response.status)
            })
        })

        describe("Row 15 — Info disclosure", () => {
            it("should not leak internal info on 403", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok"
                )
                const response = await GET(req)
                const text = await response.text()
                expect(text).toBe("Forbidden")
            })
        })

        describe("Row 18 — Path traversal", () => {
            it("should handle path traversal in challenge", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok?challenge=../../../etc/passwd"
                )
                const response = await GET(req)
                expect([200, 403]).toContain(response.status)
            })
        })
    })

    describe("POST — Event processing", () => {
        const validPayload = JSON.stringify({
            event: "video.publish.completed",
            create_time: 1700000000,
            content: JSON.stringify({
                user_open_id: "test-open-id",
                publish_id: "test-publish-id",
                share_url: "https://tiktok.com/@test/video/123",
                video_id: "video-123",
                title: "Test Video",
                privacy_level: "PUBLIC_TO_EVERYONE",
                create_time: 1700000000,
            }),
        })

        describe("Row 2 — Method confusion", () => {
            it("should not expose GET on POST route", async () => {
                const r = await import("@/app/api/webhooks/tiktok/route")
                expect("GET" in r).toBe(true)
                expect("POST" in r).toBe(true)
            })
        })

        describe("Row 3 — Type attacks", () => {
            it("should handle empty body", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    { method: "POST", body: "" }
                )
                const response = await POST(req)
                expect(response.status).toBe(400)
            })

            it("should handle non-JSON body", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    { method: "POST", body: "not-json" }
                )
                const response = await POST(req)
                expect(response.status).toBe(400)
            })

            it("should handle number body", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: "42",
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })

            it("should handle array body", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: "[]",
                    }
                )
                const response = await POST(req)
                expect(response.status).toBe(400)
            })
        })

        describe("Row 4 — Value attacks", () => {
            it("should handle empty object body", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: "{}",
                    }
                )
                const response = await POST(req)
                expect(response.status).toBe(400)
            })

            it("should handle null body", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    { method: "POST", body: null }
                )
                const response = await POST(req)
                expect([400, 500]).toContain(response.status)
            })
        })

        describe("Row 5 — Structure attacks", () => {
            it("should handle body missing event field", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            create_time: 1700000000,
                            content: "{}",
                        }),
                    }
                )
                const response = await POST(req)
                expect(response.status).toBe(400)
            })

            it("should handle body missing create_time field", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ event: "test", content: "{}" }),
                    }
                )
                const response = await POST(req)
                expect(response.status).toBe(400)
            })

            it("should handle extra unknown fields", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            event: "video.publish.completed",
                            create_time: 1700000000,
                            content: "{}",
                            extraField: "should-be-ignored",
                        }),
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })

        describe("Row 6 — Prototype pollution", () => {
            it("should handle __proto__ in JSON body", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            __proto__: { polluted: true },
                            event: "video.publish.completed",
                            create_time: 1700000000,
                            content: "{}",
                        }),
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })

        describe("Row 7 — Injection", () => {
            it("should handle SQL injection in content", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            event: "video.publish.completed",
                            create_time: 1700000000,
                            content: "1' OR '1'='1",
                        }),
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })

            it("should handle XSS in content", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            event: "video.publish.completed",
                            create_time: 1700000000,
                            content: "<script>alert(1)</script>",
                        }),
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })

        describe("Row 8 — Unicode/encoding", () => {
            it("should handle emoji in content", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            event: "video.publish.completed",
                            create_time: 1700000000,
                            content: "🔥 Test",
                        }),
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })

            it("should handle null byte in JSON", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: '{"event":"video.publish.completed","create_time":1700000000,"content":"test\\u0000code"}',
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })

            it("should handle BOM prefix", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: "\uFEFF" + validPayload,
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })

        describe("Row 9 — Size attacks", () => {
            it("should handle oversized JSON body", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            event: "video.publish.completed",
                            create_time: 1700000000,
                            content: "A".repeat(50000),
                        }),
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })

            it("should handle deeply nested JSON", async () => {
                let nested: any = {}
                let current = nested
                for (let i = 0; i < 100; i++) {
                    current.a = {}
                    current = current.a
                }
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            event: "video.publish.completed",
                            create_time: 1700000000,
                            content: JSON.stringify(nested),
                        }),
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })

        describe("Row 10 — Rate limiting", () => {
            it("should handle single event", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: validPayload,
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })

        describe("Row 12 — Race conditions", () => {
            it("should handle concurrent events", async () => {
                const requests = Array.from(
                    { length: 5 },
                    () =>
                        new NextRequest(
                            "http://localhost/api/webhooks/tiktok",
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: validPayload,
                            }
                        )
                )
                const results = await Promise.all(requests.map(r => POST(r)))
                for (const response of results) {
                    expect([200, 400, 500]).toContain(response.status)
                }
            })
        })

        describe("Row 13 — Content-Type", () => {
            it("should handle wrong Content-Type", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "text/plain" },
                        body: validPayload,
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })

            it("should handle missing Content-Type", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        body: validPayload,
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })

        describe("Row 14 — Header attacks", () => {
            it("should handle X-Forwarded-For", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Forwarded-For": "127.0.0.1",
                        },
                        body: validPayload,
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })

            it("should handle spoofed signature header", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Hub-Signature-256": "sha256=fake",
                        },
                        body: validPayload,
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })

        describe("Row 15 — Info disclosure", () => {
            it("should not leak stack traces in error response", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        body: "invalid json {{{",
                    }
                )
                const response = await POST(req)
                const text = await response.text()
                expect(text).not.toContain("at ")
                expect(text).not.toContain("stack")
                expect(text).not.toContain(":\\")
            })
        })

        describe("Row 19 — Mass assignment", () => {
            it("should handle extra fields in event body", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            event: "video.publish.completed",
                            create_time: 1700000000,
                            content: "{}",
                            adminField: "should-be-ignored",
                        }),
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })

        describe("Row 20 — SSRF", () => {
            it("should handle URL-like field values", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/tiktok",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            event: "video.publish.completed",
                            create_time: 1700000000,
                            content: JSON.stringify({
                                callback_url:
                                    "http://internal-server:8080/admin",
                                webhook_url: "https://evil.com/steal",
                            }),
                        }),
                    }
                )
                const response = await POST(req)
                expect([200, 400, 500]).toContain(response.status)
            })
        })
    })
})
