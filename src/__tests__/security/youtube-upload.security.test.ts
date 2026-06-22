/**
 * Attack Matrix: POST /api/youtube/upload
 *
 * Applicable rows: 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19
 *
 * SKIP:
 *  Row 2 (HTTP method): GET handler would be pointless (no form rendering needed)
 *  Row 12 (Race conditions): File uploads are idempotent per video; handled by YouTube API
 *  Row 14 (HTTP header): Headers are consumed by Next.js, no injection surface
 *  Row 16 (Business logic): Pricing is server-calculated, user cannot influence cost
 *  Row 18 (Path traversal): No file path parameters
 *  Row 20 (SSRF): No URL parameters
 *  Row 21 (Timing): No password comparison on this endpoint
 */

import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { POST } from "@/app/api/youtube/upload/route"

// ── Hoisted mocks ──
const mockUploadVideo = vi.hoisted(() => vi.fn())
const mockValidateCsrf = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ valid: true, csrfToken: "test-token" })
)
const mockRegenerateCsrf = vi.hoisted(() => vi.fn().mockReturnValue("new-token"))
const mockAddCsrf = vi.hoisted(
    () =>
        vi.fn((res: Response) => {
            res.headers.set("X-CSRF-Token", "new-token")
            return res
        })
)
const mockCreateCsrfError = vi.hoisted(
    () =>
        vi.fn().mockReturnValue(
            new Response(JSON.stringify({ error: "Invalid CSRF token" }), {
                status: 403,
                headers: { "content-type": "application/json" },
            })
        )
)

vi.mock("@/lib/posting/adapters/youtube", () => ({
    uploadVideo: mockUploadVideo,
}))

vi.mock("@/lib/middleware/api-csrf-middleware", () => ({
    validateCsrfFromRequest: mockValidateCsrf,
    regenerateCsrfToken: mockRegenerateCsrf,
    addCsrfTokenToResponse: mockAddCsrf,
    createCsrfErrorResponse: mockCreateCsrfError,
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

// ── Helpers ──
function makeFormData(overrides?: {
    csrfToken?: string
    file?: File
    title?: string
    description?: string
    privacyStatus?: string
    tags?: string
    categoryId?: string
}): FormData {
    const fd = new FormData()
    fd.append("csrfToken", overrides?.csrfToken ?? "test-token")
    fd.append(
        "file",
        overrides?.file ??
            new File(["fake-video-content"], "test.mp4", { type: "video/mp4" })
    )
    fd.append("title", overrides?.title ?? "My Test Video")
    fd.append("description", overrides?.description ?? "A test video description")
    fd.append("privacyStatus", overrides?.privacyStatus ?? "unlisted")
    if (overrides?.tags) fd.append("tags", overrides.tags)
    if (overrides?.categoryId) fd.append("categoryId", overrides.categoryId)
    return fd
}

function makeRequest(formData: FormData, userId = "user-123"): NextRequest {
    const req = new NextRequest("http://localhost:3000/api/youtube/upload", {
        method: "POST",
    })
    Object.defineProperty(req, "formData", {
        value: vi.fn().mockResolvedValue(formData),
        writable: true,
    })
    req.headers.set("x-user-id", userId)
    return req
}

async function responseToJson(res: Response): Promise<Record<string, unknown>> {
    return JSON.parse(await res.text()) as Record<string, unknown>
}



describe("POST /api/youtube/upload — Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUploadVideo.mockResolvedValue({
            success: true,
            videoId: "abc123",
            url: "https://youtube.com/watch?v=abc123",
        })
        mockValidateCsrf.mockResolvedValue({
            valid: true,
            csrfToken: "test-token",
        })
        mockRegenerateCsrf.mockReturnValue("new-token")
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ── Row 1: Auth bypass ──
    describe("Row 1 — Auth bypass", () => {
        it("rejects missing x-user-id header", async () => {
            const fd = makeFormData()
            const req = new NextRequest(
                "http://localhost:3000/api/youtube/upload",
                { method: "POST" }
            )
            Object.defineProperty(req, "formData", {
                value: vi.fn().mockResolvedValue(fd),
                writable: true,
            })
            const res = await POST(req)
            expect(res.status).toBe(401)
        })

        it("rejects empty x-user-id header", async () => {
            const fd = makeFormData()
            const req = makeRequest(fd, "")
            const res = await POST(req)
            expect(res.status).toBe(401)
        })
    })

    // ── Row 3: Type attacks ──
    describe("Row 3 — Type attacks", () => {
        it("rejects non-File file field (string)", async () => {
            const fd = makeFormData({ file: "not-a-file" as unknown as File })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects non-File file field (number)", async () => {
            const fd = makeFormData({ file: "12345" as unknown as File })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects non-File file field (null string)", async () => {
            const fd = makeFormData({ file: "null" as unknown as File })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("accepts number-as-string for title", async () => {
            const fd = makeFormData({ title: "12345" })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(400)
            expect(res.status).not.toBe(500)
        })

        it("accepts object-as-string for title (JSON)", async () => {
            const fd = makeFormData({ title: JSON.stringify({ malicious: true }) })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(400)
            expect(res.status).not.toBe(500)
        })
    })

    // ── Row 4: Value attacks ──
    describe("Row 4 — Value attacks", () => {
        it("rejects empty file (0 bytes)", async () => {
            const emptyFile = new File([], "empty.mp4", { type: "video/mp4" })
            const fd = makeFormData({ file: emptyFile })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects oversized file (>500MB)", async () => {
            const bigFile = new File(["x"], "big.mp4", { type: "video/mp4" })
            Object.defineProperty(bigFile, "size", { value: 501 * 1024 * 1024 + 1 })
            const fd = makeFormData({ file: bigFile })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(413)
        })

        it("rejects empty title", async () => {
            const fd = makeFormData({ title: "" })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects whitespace-only title", async () => {
            const fd = makeFormData({ title: "   " })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects title exceeding 100 chars", async () => {
            const fd = makeFormData({ title: "x".repeat(101) })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects empty description", async () => {
            const fd = makeFormData({ description: "" })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects description exceeding 5000 chars", async () => {
            const fd = makeFormData({ description: "x".repeat(5001) })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects invalid privacyStatus", async () => {
            const fd = makeFormData({ privacyStatus: "invalid" })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects tags field >500 chars", async () => {
            const fd = makeFormData({ tags: "x".repeat(501) })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })
    })

    // ── Row 5: Structure attacks ──
    describe("Row 5 — Structure attacks", () => {
        it("rejects missing file field", async () => {
            const fd = makeFormData()
            fd.delete("file")
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects missing title", async () => {
            const fd = makeFormData()
            fd.delete("title")
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects missing description", async () => {
            const fd = makeFormData()
            fd.delete("description")
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects empty body", async () => {
            const fd = new FormData()
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects extra fields", async () => {
            const fd = makeFormData()
            fd.append("isAdmin", "true")
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects multiple extra fields", async () => {
            const fd = makeFormData()
            fd.append("role", "admin")
            fd.append("balance", "999999")
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })
    })

    // ── Row 6: Prototype pollution ──
    describe("Row 6 — Prototype pollution", () => {
        it("rejects __proto__ field", async () => {
            const fd = makeFormData()
            fd.append("__proto__", '{"isAdmin":true}')
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects constructor[prototype] field", async () => {
            const fd = makeFormData()
            fd.append("constructor[prototype]", '{"isAdmin":true}')
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })
    })

    // ── Row 7: Injection ──
    describe("Row 7 — Injection attacks", () => {
        it("handles SQL injection in title", async () => {
            const fd = makeFormData({
                title: "'; DROP TABLE profiles; --"
            })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(500)
        })

        it("handles XSS in title", async () => {
            const fd = makeFormData({
                title: "<script>alert('xss')</script>"
            })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(500)
        })

        it("handles XSS in description", async () => {
            const fd = makeFormData({
                description: "<img src=x onerror=alert(1)>"
            })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(500)
        })
    })

    // ── Row 8: Unicode / encoding ──
    describe("Row 8 — Unicode and encoding", () => {
        it("handles emoji in title", async () => {
            const fd = makeFormData({ title: "🎉 My Video 😊" })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(400)
            expect(res.status).not.toBe(500)
        })

        it("handles null byte in title", async () => {
            const fd = makeFormData({ title: "test\u0000video" })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(500)
        })

        it("handles control characters in title", async () => {
            const fd = makeFormData({ title: "test\n\r\tvideo" })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(500)
        })

        it("handles right-to-left override in title", async () => {
            const fd = makeFormData({ title: "test\u202Evideo.mp4" })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(500)
        })

        it("handles unicode normalization in title", async () => {
            const fd = makeFormData({
                title: "Café ñoño \u00e9 \u0065\u0301"
            })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(500)
        })
    })

    // ── Row 9: Size attacks ──
    describe("Row 9 — Size attacks", () => {
        it("accepts title at boundary (100 chars)", async () => {
            const fd = makeFormData({ title: "x".repeat(100) })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(400)
            expect(res.status).not.toBe(500)
        })

        it("rejects title >100 chars", async () => {
            const fd = makeFormData({ title: "x".repeat(101) })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("accepts description at boundary (5000 chars)", async () => {
            const fd = makeFormData({ description: "x".repeat(5000) })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).not.toBe(400)
            expect(res.status).not.toBe(500)
        })

        it("rejects tag with >100 chars", async () => {
            const fd = makeFormData({ tags: "x".repeat(101) })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })

        it("rejects more than 30 tags", async () => {
            const fd = makeFormData({
                tags: Array.from({ length: 31 }, (_, i) => `tag${i}`).join(",")
            })
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })
    })

    // ── Row 10: CSRF ──
    describe("Row 10 — CSRF validation", () => {
        it("rejects expired CSRF token", async () => {
            mockValidateCsrf.mockResolvedValue({
                valid: false,
                csrfToken: null,
            })
            const fd = makeFormData()
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(403)
        })

        it("rejects missing CSRF token", async () => {
            mockValidateCsrf.mockResolvedValue({
                valid: false,
                csrfToken: null,
            })
            const fd = makeFormData()
            fd.delete("csrfToken")
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(403)
        })
    })

    // ── Row 13: Content-Type ──
    describe("Row 13 — Content-Type errors", () => {
        it("handles missing Content-Type", async () => {
            const fd = makeFormData()
            const req = new NextRequest(
                "http://localhost:3000/api/youtube/upload",
                { method: "POST" }
            )
            Object.defineProperty(req, "formData", {
                value: vi.fn().mockResolvedValue(fd),
                writable: true,
            })
            req.headers.set("x-user-id", "user-123")
            const res = await POST(req)
            expect(res.status).not.toBe(500)
        })
    })

    // ── Row 15: Info disclosure ──
    describe("Row 15 — Info disclosure", () => {
        it("does not expose stack traces in error responses", async () => {
            mockUploadVideo.mockRejectedValue(new Error("Internal failure"))
            const fd = makeFormData()
            const req = makeRequest(fd)
            const res = await POST(req)
            const body = await responseToJson(res)
            const bodyStr = JSON.stringify(body)
            expect(bodyStr).not.toContain("Error:")
            expect(bodyStr).not.toContain("at ")
            expect(bodyStr).not.toContain("stack")
        })

        it("does not show internal paths in error", async () => {
            const fd = makeFormData({ file: "not-a-file" as unknown as File })
            const req = makeRequest(fd)
            const res = await POST(req)
            const body = await responseToJson(res)
            const bodyStr = JSON.stringify(body)
            expect(bodyStr).not.toContain("src/")
            expect(bodyStr).not.toContain("node_modules")
        })

        it("returns error message from YouTube API failure", async () => {
            mockUploadVideo.mockResolvedValue({
                success: false,
                error: "YouTube API quota exceeded",
            })
            const fd = makeFormData()
            const req = makeRequest(fd)
            const res = await POST(req)
            const body = await responseToJson(res)
            expect(body.error).toBe("YouTube API quota exceeded")
        })
    })

    // ── Row 17: IDOR ──
    describe("Row 17 — IDOR", () => {
        it("allows any userId to be sent (server should validate ownership)", async () => {
            const fd = makeFormData()
            const req = makeRequest(fd, "different-user-id")
            const res = await POST(req)
            expect(res.status).not.toBe(401)
        })
    })

    // ── Row 19: Mass assignment ──
    describe("Row 19 — Mass assignment", () => {
        it("rejects extra fields (isAdmin, role, balance)", async () => {
            const fd = makeFormData()
            fd.append("isAdmin", "true")
            fd.append("role", "admin")
            fd.append("balance", "999999")
            const req = makeRequest(fd)
            const res = await POST(req)
            expect(res.status).toBe(400)
        })
    })
})
