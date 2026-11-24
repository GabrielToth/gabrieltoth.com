/**
 * Security Tests for POST /api/webhooks/meta/data-deletion — Attack Matrix
 *
 * Attack matrix: 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 19
 *
 * SKIP:
 *   10 (rate limiting) — Meta callback is signature-authenticated, not session-limited
 *   11 (CSRF) — signed_request HMAC is the authenticator
 *   12 (race) — deletion is idempotent token removal
 *   16 (business logic) — no credit or balance operations
 *   17 (IDOR) — user id comes only from a verified signed payload
 *   18 (path traversal) — no filesystem paths
 *   20 (SSRF) — no outbound URL from the request body
 *   21 (timing) — signature compare uses timingSafeEqual
 */

import crypto from "crypto"
import { POST } from "@/app/api/webhooks/meta/data-deletion/route"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

vi.mock("@/lib/facebook/deletion-service", () => ({
    processMetaUserDataDeletion: vi.fn().mockResolvedValue({
        confirmationCode: "abc123confirmation",
        statusUrl:
            "https://www.gabrieltoth.com/privacy-policy?deletion_code=abc123confirmation",
        deletedCount: 1,
    }),
}))

const APP_SECRET = "test-meta-app-secret"

function sign(payload: Record<string, unknown>, secret = APP_SECRET): string {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
    const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url")
    return `${sig}.${encoded}`
}

function makePost(
    body: string,
    headers: Record<string, string> = {
        "Content-Type": "application/json",
    }
): NextRequest {
    return new NextRequest(
        "http://localhost/api/webhooks/meta/data-deletion",
        {
            method: "POST",
            headers,
            body,
        }
    )
}

describe("Meta data deletion callback — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.FACEBOOK_APP_SECRET = APP_SECRET
    })

    afterEach(() => {
        vi.clearAllMocks()
        delete process.env.FACEBOOK_APP_SECRET
        delete process.env.INSTAGRAM_APP_SECRET
    })

    describe("Row 1 — Auth bypass", () => {
        it("rejects a signature signed with the wrong secret", async () => {
            const signed = sign({ user_id: "123", algorithm: "HMAC-SHA256" }, "other")
            const res = await POST(
                makePost(JSON.stringify({ signed_request: signed }))
            )
            expect(res.status).toBe(403)
        })

        it("returns 500 when no app secret is configured", async () => {
            delete process.env.FACEBOOK_APP_SECRET
            delete process.env.INSTAGRAM_APP_SECRET
            const signed = sign({ user_id: "123", algorithm: "HMAC-SHA256" })
            const res = await POST(
                makePost(JSON.stringify({ signed_request: signed }))
            )
            expect(res.status).toBe(500)
        })
    })

    describe("Row 2 — Method confusion", () => {
        it("exports POST and does not export GET", async () => {
            const route = await import(
                "@/app/api/webhooks/meta/data-deletion/route"
            )
            expect("POST" in route).toBe(true)
            expect("GET" in route).toBe(false)
        })
    })

    describe("Row 3 — Type attacks", () => {
        it("rejects a numeric signed_request", async () => {
            const res = await POST(makePost(JSON.stringify({ signed_request: 1 })))
            expect(res.status).toBe(400)
        })

        it("rejects a boolean signed_request", async () => {
            const res = await POST(
                makePost(JSON.stringify({ signed_request: true }))
            )
            expect(res.status).toBe(400)
        })

        it("rejects a null signed_request", async () => {
            const res = await POST(
                makePost(JSON.stringify({ signed_request: null }))
            )
            expect(res.status).toBe(400)
        })

        it("rejects an object signed_request", async () => {
            const res = await POST(
                makePost(JSON.stringify({ signed_request: { a: 1 } }))
            )
            expect(res.status).toBe(400)
        })
    })

    describe("Row 4 — Value attacks", () => {
        it("rejects an empty signed_request", async () => {
            const res = await POST(
                makePost(JSON.stringify({ signed_request: "" }))
            )
            expect(res.status).toBe(400)
        })

        it("rejects whitespace-only signed_request", async () => {
            const res = await POST(
                makePost(JSON.stringify({ signed_request: "   " }))
            )
            expect(res.status).toBe(403)
        })

        it("rejects a payload whose user_id is blank", async () => {
            const signed = sign({ user_id: "   ", algorithm: "HMAC-SHA256" })
            const res = await POST(
                makePost(JSON.stringify({ signed_request: signed }))
            )
            expect(res.status).toBe(400)
        })
    })

    describe("Row 5 — Structure attacks", () => {
        it("rejects an empty object body", async () => {
            const res = await POST(makePost("{}"))
            expect(res.status).toBe(400)
        })

        it("rejects an array body", async () => {
            const res = await POST(makePost("[]"))
            expect(res.status).toBe(400)
        })

        it("rejects invalid JSON", async () => {
            const res = await POST(makePost("{"))
            expect(res.status).toBe(400)
        })

        it("accepts a valid signed request and returns confirmation fields", async () => {
            const signed = sign({
                user_id: "998877",
                algorithm: "HMAC-SHA256",
            })
            const res = await POST(
                makePost(JSON.stringify({ signed_request: signed, extra: true }))
            )
            expect(res.status).toBe(200)
            const body = await res.json()
            expect(body.confirmation_code).toBe("abc123confirmation")
            expect(body.url).toContain("deletion_code=")
        })
    })

    describe("Row 6 — Prototype pollution", () => {
        it("does not treat __proto__ as a valid signature", async () => {
            const res = await POST(
                makePost(
                    JSON.stringify({
                        signed_request: "a.b",
                        __proto__: { admin: true },
                    })
                )
            )
            expect(res.status).toBe(403)
        })
    })

    describe("Row 7 — Injection", () => {
        it("rejects SQL-looking unsigned payloads", async () => {
            const res = await POST(
                makePost(
                    JSON.stringify({
                        signed_request: "1' OR '1'='1.payload",
                    })
                )
            )
            expect(res.status).toBe(403)
        })
    })

    describe("Row 8 — Unicode", () => {
        it("rejects a signed request containing a null byte outside the signature", async () => {
            const res = await POST(
                makePost(JSON.stringify({ signed_request: "abc\u0000.def" }))
            )
            expect(res.status).toBe(403)
        })
    })

    describe("Row 9 — Size attacks", () => {
        it("rejects an oversized signed_request", async () => {
            const res = await POST(
                makePost(JSON.stringify({ signed_request: "a".repeat(9000) }))
            )
            expect(res.status).toBe(413)
        })
    })

    describe("Row 13 — Content-Type", () => {
        it("rejects text/plain", async () => {
            const res = await POST(
                makePost("signed_request=abc", { "Content-Type": "text/plain" })
            )
            expect(res.status).toBe(415)
        })

        it("accepts application/x-www-form-urlencoded", async () => {
            const signed = sign({ user_id: "42", algorithm: "HMAC-SHA256" })
            const res = await POST(
                makePost(`signed_request=${encodeURIComponent(signed)}`, {
                    "Content-Type": "application/x-www-form-urlencoded",
                })
            )
            expect(res.status).toBe(200)
        })
    })

    describe("Row 14 — HTTP header", () => {
        it("does not trust X-Forwarded-User as authentication", async () => {
            const res = await POST(
                makePost("{}", {
                    "Content-Type": "application/json",
                    "X-Forwarded-User": "1",
                })
            )
            expect(res.status).toBe(400)
        })
    })

    describe("Row 15 — Info disclosure", () => {
        it("does not echo the app secret on failure", async () => {
            const res = await POST(
                makePost(JSON.stringify({ signed_request: "bad.payload" }))
            )
            const text = await res.text()
            expect(text).not.toContain(APP_SECRET)
            expect(text).not.toContain("stack")
        })
    })

    describe("Row 19 — Mass assignment", () => {
        it("ignores extra fields that try to set confirmation_code", async () => {
            const signed = sign({ user_id: "7", algorithm: "HMAC-SHA256" })
            const res = await POST(
                makePost(
                    JSON.stringify({
                        signed_request: signed,
                        confirmation_code: "attacker",
                        deletedCount: 999,
                    })
                )
            )
            const body = await res.json()
            expect(body.confirmation_code).toBe("abc123confirmation")
            expect(body.deletedCount).toBeUndefined()
        })
    })
})
