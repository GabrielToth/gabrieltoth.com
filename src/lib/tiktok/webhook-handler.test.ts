import { beforeEach, describe, expect, it, vi } from "vitest"

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/server", () => ({
    getAdminClient: () => ({ from: mockFrom }),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

import { handleTikTokWebhookEvent } from "./webhook-handler"

interface QueryResult {
    data?: unknown
    error?: { message: string } | null
}

/**
 * Builds a chainable query stub. `await` resolves to the configured result,
 * matching the Supabase builder, which is thenable.
 */
function query(result: QueryResult) {
    const builder: Record<string, unknown> = {}
    const chain = () => builder
    for (const method of ["select", "delete", "eq", "in"]) {
        builder[method] = vi.fn(chain)
    }
    builder.then = (
        resolve: (value: QueryResult) => unknown,
        reject: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(resolve, reject)
    return builder
}

function authorizationRemoved(openId: string) {
    return {
        event: "authorization.removed" as const,
        create_time: 1700000000,
        content: JSON.stringify({
            user_open_id: openId,
            app_id: "app-1",
            removed_at: "2026-01-01T00:00:00Z",
        }),
    }
}

describe("handleTikTokWebhookEvent — authorization.removed", () => {
    beforeEach(() => {
        mockFrom.mockReset()
    })

    it("deletes the token and the linked account for the revoked open id", async () => {
        const lookups = [
            query({ data: [{ user_id: "user-1" }], error: null }),
            query({ error: null }),
            query({ error: null }),
        ]
        mockFrom.mockImplementation(() => lookups.shift())

        const result = await handleTikTokWebhookEvent(
            authorizationRemoved("open-123")
        )

        expect(result.handled).toBe(1)
        expect(result.errors).toBe(0)

        expect(mockFrom).toHaveBeenNthCalledWith(1, "social_networks")
        expect(lookups[0]).toBeUndefined()

        const tokenQuery = mockFrom.mock.results[1].value
        expect(mockFrom).toHaveBeenNthCalledWith(2, "oauth_tokens")
        expect(tokenQuery.delete).toHaveBeenCalled()
        expect(tokenQuery.eq).toHaveBeenCalledWith("platform", "tiktok")
        expect(tokenQuery.in).toHaveBeenCalledWith("user_id", ["user-1"])

        const linkQuery = mockFrom.mock.results[2].value
        expect(mockFrom).toHaveBeenNthCalledWith(3, "social_networks")
        expect(linkQuery.delete).toHaveBeenCalled()
        expect(linkQuery.eq).toHaveBeenCalledWith(
            "platform_user_id",
            "open-123"
        )
    })

    it("still removes the link when no user is found", async () => {
        mockFrom.mockImplementation(() => query({ data: [], error: null }))

        const result = await handleTikTokWebhookEvent(
            authorizationRemoved("open-unknown")
        )

        expect(result.handled).toBe(1)
        expect(result.errors).toBe(0)
        expect(mockFrom).toHaveBeenCalledTimes(2)
        expect(mockFrom).not.toHaveBeenCalledWith("oauth_tokens")
    })

    it("reports an error when the lookup fails", async () => {
        mockFrom.mockImplementation(() =>
            query({ data: null, error: { message: "db down" } })
        )

        const result = await handleTikTokWebhookEvent(
            authorizationRemoved("open-123")
        )

        expect(result.handled).toBe(0)
        expect(result.errors).toBe(1)
        expect(result.details[0]).toContain("db down")
    })

    it("does nothing when the event has no open id", async () => {
        const result = await handleTikTokWebhookEvent(authorizationRemoved(""))

        expect(result.handled).toBe(1)
        expect(result.errors).toBe(0)
        expect(mockFrom).not.toHaveBeenCalled()
    })
})
