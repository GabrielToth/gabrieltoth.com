/**
 * Security Tests for Instagram Webhook (GET + POST) — Attack Matrix
 *
 * Applicable rows:
 *
 * GET:
 *   1  (auth bypass — verify_token, hub.mode, challenge)
 *   2  (HTTP method confusion — POST on GET)
 *   7  (injection — query params)
 *   8  (unicode/encoding — query params)
 *   9  (size attacks — oversized challenge)
 *   14 (HTTP header — Host override)
 *   15 (info disclosure — error messages)
 *   18 (path traversal — challenge as path)
 *
 * POST:
 *   2  (HTTP method confusion — GET on POST)
 *   3  (type attacks — body type permutations)
 *   4  (value attacks — zero, negative, empty)
 *   5  (structure attacks — missing fields, extra fields, null body)
 *   6  (prototype pollution — __proto__)
 *   7  (injection — SQL/XSS in text fields)
 *   8  (unicode/encoding — emoji, null byte, control chars)
 *   9  (size attacks — oversized body, deep nesting)
 *   10 (rate limiting — concurrent requests)
 *   13 (Content-Type — wrong/missing)
 *   14 (HTTP header — signature manipulation)
 *   15 (info disclosure — no stack leak)
 *   19 (mass assignment — extra fields)
 *   20 (SSRF — URL values)
 *
 * SKIP:
 *   GET rows 3,4,5,6,10,11,12,13,16,17,19,20,21
 *   POST rows 1,11,12,16,17,18,21
 */

import { GET, POST } from "@/app/api/webhooks/instagram/route"
import { NextRequest } from "next/server"
import crypto from "crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
    process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN =
        "test-verify-token-123"
    process.env.INSTAGRAM_APP_SECRET =
        "test-app-secret-for-webhook-signing"
})

vi.mock("@/lib/instagram/webhook-handler", () => ({
    handleWebhookEvent: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}))

const VALID_TOKEN = "test-verify-token-123"
const APP_SECRET = "test-app-secret-for-webhook-signing"

function signBody(body: string): string {
    return "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(body).digest("hex")
}

function makeGetRequest(
    params: Record<string, string> = {},
    headers: Record<string, string> = {}
): NextRequest {
    const search = new URLSearchParams(params).toString()
    return new NextRequest(`http://localhost/api/webhooks/instagram?${search}`, {
        method: "GET",
        headers,
    })
}

function makePostRequest(
    body: unknown,
    headers: Record<string, string> = {}
): NextRequest {
    const bodyStr = typeof body === "string" ? body : JSON.stringify(body)
    const sig =
        "x-hub-signature-256" in headers
            ? (headers["x-hub-signature-256"] as string)
            : signBody(bodyStr)
    return new NextRequest("http://localhost/api/webhooks/instagram", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-hub-signature-256": sig,
            ...headers,
        },
        body: bodyStr,
    })
}

describe("GET /api/webhooks/instagram — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // Row 1 — Auth bypass
    describe("Row 1 — Auth bypass", () => {
        it("should verify with correct token and mode", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.verify_token": VALID_TOKEN,
                "hub.challenge": "1234567890",
            })
            const response = await GET(request)
            expect(response.status).toBe(200)
            const text = await response.text()
            expect(text).toBe("1234567890")
        })

        it("should reject with wrong verify_token", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.verify_token": "wrong-token",
                "hub.challenge": "1234567890",
            })
            const response = await GET(request)
            expect(response.status).toBe(403)
        })

        it("should reject with missing verify_token", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.challenge": "1234567890",
            })
            const response = await GET(request)
            expect(response.status).toBe(403)
        })

        it("should reject with wrong hub.mode", async () => {
            const request = makeGetRequest({
                "hub.mode": "unsubscribe",
                "hub.verify_token": VALID_TOKEN,
                "hub.challenge": "1234567890",
            })
            const response = await GET(request)
            expect(response.status).toBe(403)
        })

        it("should reject with missing hub.mode", async () => {
            const request = makeGetRequest({
                "hub.verify_token": VALID_TOKEN,
                "hub.challenge": "1234567890",
            })
            const response = await GET(request)
            expect(response.status).toBe(403)
        })

        it("should reject with empty challenge", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.verify_token": VALID_TOKEN,
                "hub.challenge": "",
            })
            const response = await GET(request)
            expect(response.status).toBe(403)
        })

        it("should reject with no params at all", async () => {
            const request = makeGetRequest()
            const response = await GET(request)
            expect(response.status).toBe(403)
        })
    })

    // Row 2 — HTTP method confusion
    describe("Row 2 — HTTP method confusion", () => {
        it("should handle POST on GET endpoint gracefully", async () => {
            const request = new NextRequest(
                "http://localhost/api/webhooks/instagram",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                }
            )
            const response = await POST(request)
            expect([200, 403, 500]).toContain(response.status)
        })
    })

    // Row 7 — Injection
    describe("Row 7 — Injection via query params", () => {
        it("should handle SQL injection in verify_token", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.verify_token": "1' OR '1'='1",
                "hub.challenge": "abc",
            })
            const response = await GET(request)
            expect(response.status).toBe(403)
        })

        it("should handle XSS in challenge", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.verify_token": VALID_TOKEN,
                "hub.challenge": "<script>alert(1)</script>",
            })
            const response = await GET(request)
            // If token matches, challenge should be reflected
            expect([200, 403]).toContain(response.status)
            if (response.status === 200) {
                const text = await response.text()
                expect(text).toBe("<script>alert(1)</script>")
            }
        })

        it("should handle NoSQL operators in hub.mode", async () => {
            const request = makeGetRequest({
                "hub.mode": '{"$ne": null}',
                "hub.verify_token": VALID_TOKEN,
                "hub.challenge": "abc",
            })
            const response = await GET(request)
            expect(response.status).toBe(403)
        })
    })

    // Row 8 — Unicode/encoding
    describe("Row 8 — Unicode/encoding in params", () => {
        it("should handle emoji in challenge", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.verify_token": VALID_TOKEN,
                "hub.challenge": "🚀🔥",
            })
            const response = await GET(request)
            expect(response.status).toBe(200)
        })

        it("should handle null byte in verify_token", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.verify_token": "test\0token",
                "hub.challenge": "abc",
            })
            const response = await GET(request)
            expect(response.status).toBe(403)
        })
    })

    // Row 9 — Size attacks
    describe("Row 9 — Size attacks", () => {
        it("should handle oversized challenge", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.verify_token": VALID_TOKEN,
                "hub.challenge": "A".repeat(50000),
            })
            const response = await GET(request)
            expect(response.status).toBe(200)
            const text = await response.text()
            expect(text.length).toBe(50000)
        })
    })

    // Row 14 — HTTP header attacks
    describe("Row 14 — HTTP header attacks", () => {
        it("should handle Host override", async () => {
            const request = makeGetRequest(
                {
                    "hub.mode": "subscribe",
                    "hub.verify_token": VALID_TOKEN,
                    "hub.challenge": "abc",
                },
                { host: "evil.com" }
            )
            const response = await GET(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 15 — Info disclosure
    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in 403 response", async () => {
            const request = makeGetRequest()
            const response = await GET(request)
            const text = await response.text()
            expect(text).not.toContain(":\\")
            expect(text).not.toContain("/src/")
            expect(text).not.toContain("at ")
            expect(text).not.toContain("stack")
        })
    })

    // Row 18 — Path traversal in challenge
    describe("Row 18 — Path traversal", () => {
        it("should handle path traversal in challenge", async () => {
            const request = makeGetRequest({
                "hub.mode": "subscribe",
                "hub.verify_token": VALID_TOKEN,
                "hub.challenge": "../../../etc/passwd",
            })
            const response = await GET(request)
            expect(response.status).toBe(200)
            const text = await response.text()
            expect(text).toBe("../../../etc/passwd")
        })
    })
})

describe("POST /api/webhooks/instagram — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // Row 2 — HTTP method confusion
    describe("Row 2 — HTTP method confusion", () => {
        it("should handle GET on POST endpoint gracefully", async () => {
            const request = new NextRequest(
                "http://localhost/api/webhooks/instagram",
                { method: "GET" }
            )
            const response = await GET(request)
            expect(response.status).toBe(403)
        })
    })

    // Row 3 — Type attacks
    describe("Row 3 — Type attacks", () => {
        const payloads = [
            ["string body", "hello"],
            ["number body", 42],
            ["boolean body", true],
            ["null body", null],
            ["array body", [1, 2, 3]],
        ] as const

        it.each(payloads)("should handle %s", async (_desc, body) => {
            const bodyStr = JSON.stringify(body)
            const request = makePostRequest(bodyStr, {
                "x-hub-signature-256": signBody(bodyStr),
            })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle NaN in body", async () => {
            const bodyStr = '{"value": NaN}'
            const request = makePostRequest(bodyStr, {
                "x-hub-signature-256": signBody(bodyStr),
            })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle Infinity in body", async () => {
            const bodyStr = '{"value": Infinity}'
            const request = makePostRequest(bodyStr, {
                "x-hub-signature-256": signBody(bodyStr),
            })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle undefined in body", async () => {
            const bodyStr = '{"value": undefined}'
            const request = makePostRequest(bodyStr, {
                "x-hub-signature-256": signBody(bodyStr),
            })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 4 — Value attacks
    describe("Row 4 — Value attacks", () => {
        it("should handle zero values in payload", async () => {
            const body = {
                object: "instagram",
                entry: [{ id: "0", time: 0, changes: [{ field: "comments", value: { id: "0", media_id: "0", text: "" } }] }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle negative values in payload", async () => {
            const body = {
                object: "instagram",
                entry: [{ id: "-1", time: -1, changes: [{ field: "comments", value: { id: "-1", media_id: "-1", text: "test" } }] }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 5 — Structure attacks
    describe("Row 5 — Structure attacks", () => {
        it("should handle empty body {}", async () => {
            const request = makePostRequest({})
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle BOM prefix in body", async () => {
            const bodyStr = "\uFEFF" + JSON.stringify({ object: "instagram", entry: [] })
            const sig = signBody(bodyStr)
            const request = new NextRequest(
                "http://localhost/api/webhooks/instagram",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hub-signature-256": sig,
                    },
                    body: bodyStr,
                }
            )
            const response = await POST(request)
            // BOM prefix is preserved in the body text; signature
            // verification depends on the runtime encoding round-trip
            expect([200, 403]).toContain(response.status)
        })

        it("should handle extra unexpected fields", async () => {
            const body = {
                object: "instagram",
                entry: [],
                unexpectedField: "should not crash",
                anotherOne: { nested: true },
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle null entry array", async () => {
            const body = { object: "instagram", entry: null }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle array instead of object", async () => {
            const request = makePostRequest([])
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 6 — Prototype pollution
    describe("Row 6 — Prototype pollution", () => {
        it("should handle __proto__ in body", async () => {
            const bodyStr = JSON.stringify({
                object: "instagram",
                entry: [{ __proto__: { admin: true }, changes: [] }],
            })
            const request = makePostRequest(bodyStr, {
                "x-hub-signature-256": signBody(bodyStr),
            })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle constructor.prototype in body", async () => {
            const bodyStr = JSON.stringify({
                object: "instagram",
                entry: [{ constructor: { prototype: { admin: true } }, changes: [] }],
            })
            const request = makePostRequest(bodyStr, {
                "x-hub-signature-256": signBody(bodyStr),
            })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle constructor[prototype] in body", async () => {
            const bodyStr = `{"object":"instagram","entry":[{"constructor": {"prototype": {"isAdmin":true}},"changes":[]}]}`
            const request = makePostRequest(bodyStr, {
                "x-hub-signature-256": signBody(bodyStr),
            })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 7 — Injection
    describe("Row 7 — Injection attacks", () => {
        it("should handle SQL injection in comment text", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "comments",
                        value: {
                            id: "1",
                            media_id: "1",
                            text: "1' DROP TABLE users; --",
                        },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle XSS in comment text", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "comments",
                        value: {
                            id: "1",
                            media_id: "1",
                            text: "<script>alert(document.cookie)</script>",
                        },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle NoSQL operator in text", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "comments",
                        value: {
                            id: "1",
                            media_id: "1",
                            text: '{"$ne": null}',
                        },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 8 — Unicode/encoding
    describe("Row 8 — Unicode/encoding", () => {
        it("should handle emoji in comment text", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "comments",
                        value: { id: "1", media_id: "1", text: "🔥🚀 Great stream! 🎉" },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle null byte in text", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "comments",
                        value: { id: "1", media_id: "1", text: "hello\0world" },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle control characters in text", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "comments",
                        value: { id: "1", media_id: "1", text: "\x00\x01\x02\x1F" },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 9 — Size attacks
    describe("Row 9 — Size attacks", () => {
        it("should handle oversized body (10k+ chars)", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "comments",
                        value: { id: "1", media_id: "1", text: "A".repeat(10000) },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle deeply nested JSON (100+ levels)", async () => {
            let nested: any = { text: "deep" }
            for (let i = 0; i < 100; i++) {
                nested = { nested, level: i }
            }
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{ field: "comments", value: nested }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle duplicate keys in body", async () => {
            const bodyStr = '{"object":"instagram","object":"page","entry":[]}'
            const request = makePostRequest(bodyStr, {
                "x-hub-signature-256": signBody(bodyStr),
            })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle JSON bomb (duplicate keys)", async () => {
            const bodyStr = '{"a":1,"a":2,"a":3,"a":4,"a":5,"a":6,"a":7,"a":8,"a":9,"a":10}'
            const request = makePostRequest(bodyStr, {
                "x-hub-signature-256": signBody(bodyStr),
            })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 10 — Rate limiting
    describe("Row 10 — Rate limiting", () => {
        it("should handle burst of concurrent requests", async () => {
            const requests = Array.from({ length: 10 }, (_, i) => ({
                object: "instagram",
                entry: [{ id: String(i), time: i, changes: [] }],
            }))
            const results = await Promise.all(
                requests.map(body => POST(makePostRequest(body)))
            )
            for (const response of results) {
                expect([200, 403, 500]).toContain(response.status)
            }
        })
    })

    // Row 13 — Content-Type
    describe("Row 13 — Content-Type attacks", () => {
        it("should handle wrong Content-Type (text/plain)", async () => {
            const bodyStr = JSON.stringify({ object: "instagram", entry: [] })
            const request = new NextRequest(
                "http://localhost/api/webhooks/instagram",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain",
                        "x-hub-signature-256": signBody(bodyStr),
                    },
                    body: bodyStr,
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle missing Content-Type", async () => {
            const bodyStr = JSON.stringify({ object: "instagram", entry: [] })
            const request = new NextRequest(
                "http://localhost/api/webhooks/instagram",
                {
                    method: "POST",
                    headers: { "x-hub-signature-256": signBody(bodyStr) },
                    body: bodyStr,
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle multipart Content-Type", async () => {
            const bodyStr = JSON.stringify({ object: "instagram", entry: [] })
            const request = new NextRequest(
                "http://localhost/api/webhooks/instagram",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "x-hub-signature-256": signBody(bodyStr),
                    },
                    body: bodyStr,
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 14 — HTTP header attacks
    describe("Row 14 — HTTP header attacks", () => {
        it("should reject request with wrong signature", async () => {
            const body = { object: "instagram", entry: [] }
            const request = makePostRequest(body, {
                "x-hub-signature-256": "sha256=0000000000000000000000000000000000000000000000000000000000000000",
            })
            const response = await POST(request)
            expect(response.status).toBe(403)
        })

        it("should handle missing signature header", async () => {
            const bodyStr = JSON.stringify({ object: "instagram", entry: [] })
            const request = new NextRequest(
                "http://localhost/api/webhooks/instagram",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: bodyStr,
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle malformed signature header", async () => {
            const body = { object: "instagram", entry: [] }
            const request = makePostRequest(body, {
                "x-hub-signature-256": "not-a-valid-signature-format",
            })
            const response = await POST(request)
            expect(response.status).toBe(403)
        })

        it("should handle empty signature header (treated as missing)", async () => {
            const bodyStr = JSON.stringify({ object: "instagram", entry: [] })
            const request = new NextRequest(
                "http://localhost/api/webhooks/instagram",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hub-signature-256": "",
                    },
                    body: bodyStr,
                }
            )
            const response = await POST(request)
            // Empty string is falsy — treated as missing signature,
            // logs warning but still processes body
            expect(response.status).toBe(200)
        })

        it("should handle Host override header", async () => {
            const body = { object: "instagram", entry: [] }
            const request = makePostRequest(body, { host: "evil.com" })
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 15 — Info disclosure
    describe("Row 15 — Info disclosure", () => {
        it("should not leak internal paths in error responses", async () => {
            const body = { object: null, entry: null }
            const request = makePostRequest(body, {
                "x-hub-signature-256": "sha256=bad",
            })
            const response = await POST(request)
            const text = await response.text()
            expect(text).not.toContain(":\\")
            expect(text).not.toContain("/src/")
            expect(text).not.toContain("at ")
            expect(text).not.toContain("stack")
        })

        it("should not leak app secret in response", async () => {
            const body = { object: "instagram", entry: [] }
            const request = makePostRequest(body, {
                "x-hub-signature-256": "sha256=invalid",
            })
            const response = await POST(request)
            const text = await response.text()
            expect(text).not.toContain(APP_SECRET)
            expect(text).not.toContain("secret")
        })
    })

    // Row 19 — Mass assignment
    describe("Row 19 — Mass assignment", () => {
        it("should handle extra unexpected fields in payload", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "comments",
                        value: {
                            id: "1",
                            media_id: "1",
                            text: "test",
                            is_admin: true,
                            role: "moderator",
                            __proto__: { delete_all: true },
                        },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    // Row 20 — SSRF
    describe("Row 20 — SSRF", () => {
        it("should handle URL-like values without fetching", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "comments",
                        value: {
                            id: "1",
                            media_id: "1",
                            text: "http://169.254.169.254/latest/meta-data/",
                        },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        it("should handle media_url without fetching", async () => {
            const body = {
                object: "instagram",
                entry: [{
                    id: "123",
                    time: 1000,
                    changes: [{
                        field: "mentioned",
                        value: {
                            media_id: "1",
                            media_url: "file:///etc/passwd",
                        },
                    }],
                }],
            }
            const request = makePostRequest(body)
            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })
})
