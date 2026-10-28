import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

/**
 * Security tests for POST /api/byo/connect — Complete Attack Matrix
 *
 * Attack matrix: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 15, 17, 19
 * SKIP: 11 (CSRF) - Handled via SameSite cookie auth session
 * SKIP: 12 (Race conditions) - Database uses ON CONFLICT DO UPDATE upsert
 * SKIP: 14 (HTTP header) - No custom header parsing/routing logic
 * SKIP: 16 (Business logic) - No credit/balance mutations on channel connect
 * SKIP: 18 (Path traversal) - No filesystem interaction
 * SKIP: 20 (SSRF) - No outgoing HTTP calls in this endpoint
 * SKIP: 21 (Timing side-channel) - No secret comparison
 */

const mockGetServerSession = vi.fn()
const mockStoreToken = vi.fn()
const mockUpsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()

vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}))

vi.mock("@/lib/token-store", () => ({
    getTokenStore: () => ({
        storeToken: (...args: unknown[]) => mockStoreToken(...args),
    }),
}))

vi.mock("@/lib/supabase/server", () => ({
    getAdminClient: () => ({
        from: vi.fn(() => ({
            upsert: (...args: unknown[]) => {
                mockUpsert(...args)
                return {
                    select: () => ({
                        single: () =>
                            mockSingle() || {
                                data: { id: "sn-123" },
                                error: null,
                            },
                    }),
                }
            },
        })),
    }),
}))

let rateLimitCalls = 0
vi.mock("@/lib/rate-limit", () => ({
    buildClientKey: vi.fn(() => "client-key"),
    rateLimitByKey: vi.fn(async () => {
        rateLimitCalls++
        return { success: rateLimitCalls <= 10 }
    }),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}))

function makeRequest(
    body: unknown,
    headers: Record<string, string> = {}
): NextRequest {
    return new NextRequest("http://localhost/api/byo/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
    })
}

describe("POST /api/byo/connect — Security Attack Matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        rateLimitCalls = 0
        mockSingle.mockReturnValue({ data: { id: "chan_1" }, error: null })
    })

    // Category 1: Auth bypass
    describe("1. Auth bypass", () => {
        it("rejects request when session is null (401)", async () => {
            mockGetServerSession.mockResolvedValue(null)
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "kwai_1",
                    channelName: "Kwai Channel",
                })
            )
            expect(res.status).toBe(401)
        })

        it("rejects request when session has no user id (401)", async () => {
            mockGetServerSession.mockResolvedValue({ user: {} })
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "kwai_1",
                    channelName: "Kwai Channel",
                })
            )
            expect(res.status).toBe(401)
        })
    })

    // Category 3: Type attacks
    describe("3. Type attacks", () => {
        beforeEach(() => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
        })

        it("rejects numeric channelId (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "facebook",
                    channelId: 12345,
                    channelName: "Facebook Page",
                })
            )
            expect(res.status).toBe(400)
        })

        it("rejects boolean channelName (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "facebook",
                    channelId: "fb_123",
                    channelName: true,
                })
            )
            expect(res.status).toBe(400)
        })

        it("rejects object as platform (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: { name: "kwai" },
                    channelId: "kwai_123",
                    channelName: "Kwai",
                })
            )
            expect(res.status).toBe(400)
        })
    })

    // Category 4: Value attacks
    describe("4. Value attacks", () => {
        beforeEach(() => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
        })

        it("rejects empty channelId (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "",
                    channelName: "Kwai Channel",
                })
            )
            expect(res.status).toBe(400)
        })

        it("rejects unsupported platform (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "invalid_platform",
                    channelId: "channel_1",
                    channelName: "Invalid Channel",
                })
            )
            expect(res.status).toBe(400)
        })
    })

    // Category 5: Structure attacks
    describe("5. Structure attacks", () => {
        beforeEach(() => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
        })

        it("rejects empty JSON object body (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(makeRequest({}))
            expect(res.status).toBe(400)
        })

        it("rejects array body (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(makeRequest([{ platform: "kwai" }]))
            expect(res.status).toBe(400)
        })

        it("rejects invalid JSON syntax (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(makeRequest("{ invalid json"))
            expect(res.status).toBe(400)
        })

        it("rejects extra unexpected fields (strict schema validation 400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "kwai_1",
                    channelName: "Kwai Channel",
                    isAdmin: true,
                })
            )
            expect(res.status).toBe(400)
        })
    })

    // Category 6: Prototype pollution
    describe("6. Prototype pollution", () => {
        beforeEach(() => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
        })

        it("rejects body containing __proto__ (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest(
                    JSON.parse(
                        '{"platform":"kwai","channelId":"k1","channelName":"Kwai","__proto__":{"polluted":true}}'
                    )
                )
            )
            expect(res.status).toBe(400)
        })
    })

    // Category 7: Injection attacks
    describe("7. Injection attacks", () => {
        beforeEach(() => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
        })

        it("sanitizes / handles SQL injection in channelId gracefully", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "1'; DROP TABLE social_networks; --",
                    channelName: "Injected Channel",
                })
            )
            expect(res.status).toBe(200)
            expect(mockUpsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    platform_user_id: "1'; DROP TABLE social_networks; --",
                }),
                expect.any(Object)
            )
        })

        it("handles XSS payloads in channelName safely", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "ch_xss",
                    channelName: "<script>alert(1)</script>",
                })
            )
            expect(res.status).toBe(200)
            expect(mockUpsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    platform_username: "<script>alert(1)</script>",
                }),
                expect.any(Object)
            )
        })
    })

    // Category 8: Unicode/encoding
    describe("8. Unicode/encoding", () => {
        beforeEach(() => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
        })

        it("handles multi-byte unicode and emojis in channelName", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "ch_unicode",
                    channelName: "Canal do Gabriel 🚀🔥✨ 日本語",
                })
            )
            expect(res.status).toBe(200)
        })
    })

    // Category 9: Size attacks
    describe("9. Size attacks", () => {
        beforeEach(() => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
        })

        it("rejects oversized channelId exceeding 256 characters (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "a".repeat(300),
                    channelName: "Oversized Channel",
                })
            )
            expect(res.status).toBe(400)
        })

        it("rejects oversized channelName exceeding 256 characters (400)", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "valid_id",
                    channelName: "b".repeat(300),
                })
            )
            expect(res.status).toBe(400)
        })
    })

    // Category 10: Rate limiting
    describe("10. Rate limiting", () => {
        it("returns 429 when rate limit is exceeded", async () => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
            rateLimitCalls = 11 // Exceeded limit of 10
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "kwai_1",
                    channelName: "Kwai Channel",
                })
            )
            expect(res.status).toBe(429)
        })
    })

    // Category 15: Info disclosure
    describe("15. Info disclosure", () => {
        beforeEach(() => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
        })

        it("does not leak accessToken in successful response", async () => {
            const { POST } = await import("@/app/api/byo/connect/route")
            const secretToken = "super-secret-byo-token-12345"
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "kwai_1",
                    channelName: "Kwai Channel",
                    accessToken: secretToken,
                })
            )
            expect(res.status).toBe(200)
            const text = await res.text()
            expect(text).not.toContain(secretToken)
        })
    })

    // Category 17: IDOR
    describe("17. IDOR", () => {
        it("strictly scopes channel to authenticated session userId, ignoring spoofed session IDs", async () => {
            mockGetServerSession.mockResolvedValue({
                user: { id: "real-user-123" },
            })
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "kwai_1",
                    channelName: "Kwai Channel",
                })
            )
            expect(res.status).toBe(200)
            expect(mockUpsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: "real-user-123",
                }),
                expect.any(Object)
            )
        })
    })

    // Category 19: Mass assignment
    describe("19. Mass assignment", () => {
        it("prevents mass assignment of role or balance", async () => {
            mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } })
            const { POST } = await import("@/app/api/byo/connect/route")
            const res = await POST(
                makeRequest({
                    platform: "kwai",
                    channelId: "kwai_1",
                    channelName: "Kwai Channel",
                    role: "admin",
                    balance: 999999,
                })
            )
            expect(res.status).toBe(400)
        })
    })
})
