import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => {
    const mockQueryOne = vi.fn()
    return {
        db: { queryOne: mockQueryOne },
    }
})

import { db } from "@/lib/db"
import { getSessionUser, isAdminUser } from "./session"

function mockRequest(
    cookie?: string
): globalThis.Request {
    return {
        cookies: {
            get: () =>
                cookie ? { value: cookie } : undefined,
        },
    } as any
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe("getSessionUser", () => {
    it("returns null when no session cookie", async () => {
        const result = await getSessionUser(mockRequest())
        expect(result).toBeNull()
    })

    it("returns null when session not found", async () => {
        vi.mocked(db.queryOne).mockResolvedValue(null)
        const result = await getSessionUser(mockRequest("bad-token"))
        expect(result).toBeNull()
    })

    it("returns null when session expired", async () => {
        vi.mocked(db.queryOne).mockResolvedValue({
            user_id: "user-1",
            expires_at: new Date("2020-01-01"),
        })
        const result = await getSessionUser(mockRequest("expired-token"))
        expect(result).toBeNull()
    })

    it("returns user data for valid session", async () => {
        vi.mocked(db.queryOne)
            .mockResolvedValueOnce({
                user_id: "user-1",
                expires_at: new Date("2099-01-01"),
            })
            .mockResolvedValueOnce({
                id: "user-1",
                google_email: "user@test.com",
                google_name: "Test User",
            })

        const result = await getSessionUser(mockRequest("valid-token"))
        expect(result).not.toBeNull()
        expect(result!.id).toBe("user-1")
        expect(result!.email).toBe("user@test.com")
    })
})

describe("isAdminUser", () => {
    beforeEach(() => {
        delete process.env.CREDIT_ADMIN_IDS
    })

    it("returns false when env not set", () => {
        expect(isAdminUser("any-user")).toBe(false)
    })

    it("returns true for whitelisted user", () => {
        process.env.CREDIT_ADMIN_IDS = "admin-1,admin-2"
        expect(isAdminUser("admin-1")).toBe(true)
        expect(isAdminUser("admin-2")).toBe(true)
    })

    it("returns false for non-whitelisted user", () => {
        process.env.CREDIT_ADMIN_IDS = "admin-1,admin-2"
        expect(isAdminUser("some-other-user")).toBe(false)
    })

    it("handles single admin id", () => {
        process.env.CREDIT_ADMIN_IDS = "only-admin"
        expect(isAdminUser("only-admin")).toBe(true)
        expect(isAdminUser("other")).toBe(false)
    })
})
