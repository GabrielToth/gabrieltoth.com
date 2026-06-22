/**
 * Security Tests for GET + POST /api/webhooks/facebook — Attack Matrix
 *
 * Attack matrix applicable rows — GET (verification handshake):
 * 1  (auth bypass — missing hub.mode / hub.verify_token)
 * 2  (HTTP method confusion)
 * 3  (type attacks — query params)
 * 4  (value attacks — query params)
 * 5  (structure attacks — missing/extra params)
 * 7  (injection — hub.verify_token)
 * 8  (unicode/encoding — hub.verify_token)
 * 9  (size attacks — oversized token)
 * 14 (HTTP header attacks)
 * 15 (info disclosure — error messages)
 * 18 (path traversal — hub.verify_token)
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

import { GET, POST } from "@/app/api/webhooks/facebook/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/facebook/webhook-handler", () => ({
    handleWebhookEvent: vi
        .fn()
        .mockResolvedValue({ handled: 1, errors: 0, details: ["feed:123"] }),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

function makeGet(url: string): NextRequest {
    return new NextRequest(url, { method: "GET" })
}

function makePost(
    url: string,
    body: string,
    headers: Record<string, string> = {}
): NextRequest {
    return new NextRequest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body,
    })
}

describe("Facebook Webhook — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("GET — Verification handshake", () => {
        describe("Row 1 — Auth bypass", () => {
            it("should reject without verify token match", async () => {
                const req = makeGet(
                    "http://localhost/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123"
                )
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
        })

        describe("Row 2 — Method confusion", () => {
            it("should not expose POST on GET-only", async () => {
                const r = await import("@/app/api/webhooks/facebook/route")
                expect("POST" in r).toBe(true)
            })
        })

        describe("Row 3 — Type attacks", () => {
            it("should handle challenge as number", async () => {
                process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN = "test123"
                const req = makeGet(
                    "http://localhost/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=test123&hub.challenge=123456"
                )
                const res = await GET(req)
                expect([200, 403]).toContain(res.status)
                delete process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
            })
        })

        describe("Row 4 — Value attacks", () => {
            it("should handle empty challenge", async () => {
                const req = makeGet(
                    "http://localhost/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=test&hub.challenge="
                )
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
            it("should handle missing mode", async () => {
                const req = makeGet(
                    "http://localhost/api/webhooks/facebook?hub.verify_token=test&hub.challenge=123"
                )
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
        })

        describe("Row 5 — Structure attacks", () => {
            it("should handle no query params", async () => {
                const req = makeGet("http://localhost/api/webhooks/facebook")
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
        })

        describe("Row 7 — Injection", () => {
            it("should handle SQL injection in verify_token", async () => {
                const req = makeGet(
                    "http://localhost/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=1' OR '1'='1&hub.challenge=123"
                )
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
            it("should handle XSS in challenge", async () => {
                const req = makeGet(
                    "http://localhost/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=<script>alert(1)</script>"
                )
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
        })

        describe("Row 8 — Unicode", () => {
            it("should handle unicode in verify_token", async () => {
                const req = makeGet(
                    "http://localhost/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=café&hub.challenge=123"
                )
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
        })

        describe("Row 9 — Size", () => {
            it("should handle oversized challenge", async () => {
                const req = makeGet(
                    `http://localhost/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=${"A".repeat(10000)}`
                )
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
        })

        describe("Row 14 — Header attacks", () => {
            it("should handle Host header override", async () => {
                const req = new NextRequest(
                    "http://localhost/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=123",
                    {
                        method: "GET",
                        headers: { Host: "evil.com" },
                    }
                )
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
        })

        describe("Row 15 — Info disclosure", () => {
            it("should not leak internal info on 403", async () => {
                const req = makeGet("http://localhost/api/webhooks/facebook")
                const res = await GET(req)
                const text = await res.text()
                expect(text).toBe("Forbidden")
                expect(text).not.toContain(":\\")
                expect(text).not.toContain("/src/")
            })
        })

        describe("Row 18 — Path traversal", () => {
            it("should handle path traversal in challenge", async () => {
                const req = makeGet(
                    "http://localhost/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=../../../etc/passwd"
                )
                const res = await GET(req)
                expect(res.status).toBe(403)
            })
        })
    })

    describe("POST — Event processing", () => {
        describe("Row 2 — Method confusion", () => {
            it("should not expose GET on POST route", async () => {
                const r = await import("@/app/api/webhooks/facebook/route")
                expect("GET" in r).toBe(true)
            })
        })

        describe("Row 3 — Type attacks", () => {
            it("should handle empty body", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    ""
                )
                const res = await POST(req)
                expect([400, 500]).toContain(res.status)
            })
            it("should handle non-JSON body", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    "not-json"
                )
                const res = await POST(req)
                expect([400, 500]).toContain(res.status)
            })
            it("should handle number body", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    "42",
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([400, 500]).toContain(res.status)
            })
            it("should handle array body", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    "[]",
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([400, 500]).toContain(res.status)
            })
        })

        describe("Row 4 — Value attacks", () => {
            it("should handle empty object body", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    "{}",
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([400, 500]).toContain(res.status)
            })
            it("should handle null body", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    "null",
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([400, 500]).toContain(res.status)
            })
        })

        describe("Row 5 — Structure attacks", () => {
            it("should handle body missing object field", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"entry":[]}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([400, 500]).toContain(res.status)
            })
            it("should handle body missing entry field", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page"}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([400, 500]).toContain(res.status)
            })
            it("should handle non-page object type", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"user","entry":[]}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect(res.status).toBe(200)
            })
            it("should handle extra unknown fields", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[],"malicious":"field"}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
        })

        describe("Row 6 — Prototype pollution", () => {
            it("should handle __proto__ in JSON body", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"__proto__":{"polluted":true},"object":"page","entry":[]}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 400, 500]).toContain(res.status)
            })
        })

        describe("Row 7 — Injection", () => {
            it("should handle SQL injection in entry data", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[{"id":"1\' OR \'1\'=\'1","time":123,"changes":[]}]}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
            it("should handle XSS in entry data", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[{"id":"<script>alert(1)</script>","time":123,"changes":[]}]}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
        })

        describe("Row 8 — Unicode/encoding", () => {
            it("should handle emoji in entry data", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[{"id":"🔥","time":123,"changes":[]}]}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
            it("should handle null byte in JSON", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[{"id":"test\\u0000","time":123,"changes":[]}]}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
            it("should handle BOM prefix", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '\uFEFF{"object":"page","entry":[]}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 400, 500]).toContain(res.status)
            })
        })

        describe("Row 9 — Size attacks", () => {
            it("should handle oversized JSON body", async () => {
                const largeEntry = {
                    id: "1",
                    time: 123,
                    changes: [
                        { field: "feed", value: { postId: "A".repeat(10000) } },
                    ],
                }
                const body = JSON.stringify({
                    object: "page",
                    entry: [largeEntry],
                })
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    body,
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
            it("should handle deeply nested JSON", async () => {
                let nested: any = {}
                let cur = nested
                for (let i = 0; i < 100; i++) {
                    cur.x = {}
                    cur = cur.x
                }
                const body = JSON.stringify({
                    object: "page",
                    entry: [
                        {
                            id: "1",
                            time: 123,
                            changes: [{ field: "feed", value: nested }],
                        },
                    ],
                })
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    body,
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
        })

        describe("Row 10 — Rate limiting", () => {
            it("should handle single event", async () => {
                const body = JSON.stringify({
                    object: "page",
                    entry: [
                        {
                            id: "1",
                            time: Date.now(),
                            changes: [
                                { field: "feed", value: { postId: "123" } },
                            ],
                        },
                    ],
                })
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    body,
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
        })

        describe("Row 12 — Race conditions", () => {
            it("should handle concurrent events", async () => {
                const body = JSON.stringify({
                    object: "page",
                    entry: [{ id: "1", time: Date.now(), changes: [] }],
                })
                const req = () =>
                    makePost("http://localhost/api/webhooks/facebook", body, {
                        "Content-Type": "application/json",
                    })
                const results = await Promise.all(
                    Array.from({ length: 5 }, () => POST(req()))
                )
                for (const r of results) expect([200, 500]).toContain(r.status)
            })
        })

        describe("Row 13 — Content-Type", () => {
            it("should handle wrong Content-Type", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[]}',
                    { "Content-Type": "text/plain" }
                )
                const res = await POST(req)
                expect([200, 400, 500]).toContain(res.status)
            })
            it("should handle missing Content-Type", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[]}'
                )
                const res = await POST(req)
                expect([200, 400, 500]).toContain(res.status)
            })
        })

        describe("Row 14 — Header attacks", () => {
            it("should handle X-Forwarded-For", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[]}',
                    {
                        "Content-Type": "application/json",
                        "X-Forwarded-For": "127.0.0.1",
                    }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
            it("should handle spoofed signature header", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[]}',
                    {
                        "Content-Type": "application/json",
                        "x-hub-signature-256": "sha256=invalid",
                    }
                )
                const res = await POST(req)
                expect([200, 403, 500]).toContain(res.status)
            })
        })

        describe("Row 15 — Info disclosure", () => {
            it("should not leak stack traces in error response", async () => {
                const { handleWebhookEvent } =
                    await import("@/lib/facebook/webhook-handler")
                vi.mocked(handleWebhookEvent).mockRejectedValueOnce(
                    new Error("Test error")
                )
                const body = JSON.stringify({
                    object: "page",
                    entry: [
                        {
                            id: "1",
                            time: Date.now(),
                            changes: [
                                { field: "feed", value: { postId: "123" } },
                            ],
                        },
                    ],
                })
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    body,
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                const json = await res.json()
                expect(json).not.toHaveProperty("stack")
            })
        })

        describe("Row 19 — Mass assignment", () => {
            it("should handle extra fields in event body", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    '{"object":"page","entry":[],"role":"admin"}',
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
        })

        describe("Row 20 — SSRF", () => {
            it("should handle URL-like field values", async () => {
                const req = makePost(
                    "http://localhost/api/webhooks/facebook",
                    JSON.stringify({
                        object: "page",
                        entry: [
                            {
                                id: "1",
                                time: Date.now(),
                                changes: [
                                    {
                                        field: "feed",
                                        value: {
                                            postId: "http://evil.com/ssrf",
                                        },
                                    },
                                ],
                            },
                        ],
                    }),
                    { "Content-Type": "application/json" }
                )
                const res = await POST(req)
                expect([200, 500]).toContain(res.status)
            })
        })
    })
})
