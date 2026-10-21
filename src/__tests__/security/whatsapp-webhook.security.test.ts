import crypto from "crypto"
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { NextRequest } from "next/server"

/**
 * WhatsApp webhook security tests.
 *
 * The POST handler moves money (Monero tx verification), so it MUST reject
 * any request without a valid X-Hub-Signature-256 HMAC. These tests lock in
 * that behavior to prevent regressions to the old "process unsigned" logic.
 */

const APP_SECRET = "test-whatsapp-app-secret"

function sign(body: string): string {
    return (
        "sha256=" +
        crypto.createHmac("sha256", APP_SECRET).update(body).digest("hex")
    )
}

function makePost(body: unknown, headers: Record<string, string> = {}) {
    const bodyStr = typeof body === "string" ? body : JSON.stringify(body)
    const hasSig = "x-hub-signature-256" in headers
    return new NextRequest("http://localhost/api/whatsapp/webhook", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(hasSig ? {} : { "x-hub-signature-256": sign(bodyStr) }),
            ...headers,
        },
        body: bodyStr,
    })
}

describe("WhatsApp webhook — signature enforcement", () => {
    beforeEach(() => {
        vi.stubEnv("WHATSAPP_APP_SECRET", APP_SECRET)
    })
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it("rejects POST with no signature (403)", async () => {
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const req = new NextRequest("http://localhost/api/whatsapp/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entry: [] }),
        })
        const res = await POST(req)
        expect(res.status).toBe(403)
    })

    it("rejects POST with wrong signature (403)", async () => {
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const res = await POST(
            makePost(
                { entry: [] },
                { "x-hub-signature-256": "sha256=deadbeef" }
            )
        )
        expect(res.status).toBe(403)
    })

    it("rejects POST with malformed signature (403)", async () => {
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const res = await POST(
            makePost({ entry: [] }, { "x-hub-signature-256": "garbage" })
        )
        expect(res.status).toBe(403)
    })

    it("rejects when app secret is not configured (403, fail-closed)", async () => {
        vi.stubEnv("WHATSAPP_APP_SECRET", "")
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const res = await POST(makePost({ entry: [] }))
        expect(res.status).toBe(403)
    })

    it("accepts POST with a valid signature (200)", async () => {
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const res = await POST(makePost({ entry: [] }))
        expect(res.status).toBe(200)
    })

    it("does not leak the app secret in responses", async () => {
        const { POST } = await import("@/app/api/whatsapp/webhook/route")
        const res = await POST(
            makePost({ entry: [] }, { "x-hub-signature-256": "sha256=bad" })
        )
        const text = await res.text()
        expect(text).not.toContain(APP_SECRET)
    })
})

describe("WhatsApp webhook — GET verification handshake", () => {
    beforeEach(() => {
        vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "verify-me")
    })
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it("returns challenge on correct verify token", async () => {
        const { GET } = await import("@/app/api/whatsapp/webhook/route")
        const req = new NextRequest(
            "http://localhost/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=challenge123"
        )
        const res = await GET(req)
        expect(res.status).toBe(200)
        expect(await res.text()).toBe("challenge123")
    })

    it("returns 403 on wrong verify token", async () => {
        const { GET } = await import("@/app/api/whatsapp/webhook/route")
        const req = new NextRequest(
            "http://localhost/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=x"
        )
        const res = await GET(req)
        expect(res.status).toBe(403)
    })
})
