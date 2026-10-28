import { afterEach, describe, expect, it, vi } from "vitest"
import {
    resolveChannelsForToken,
    type ByoPlatform,
} from "@/lib/byo/channel-resolver"

/**
 * BYO channel resolver tests.
 *
 * All network calls are mocked — we assert the normalization per platform and
 * the fail-soft error mapping WITHOUT ever leaking the token.
 */

function mockFetchOnce(payload: unknown, status = 200) {
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
            ok: status >= 200 && status < 300,
            status,
            text: async () => JSON.stringify(payload),
        }))
    )
}

describe("resolveChannelsForToken", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it("normalizes YouTube channels", async () => {
        mockFetchOnce({
            items: [
                {
                    id: "UC123",
                    snippet: {
                        title: "Meu Canal",
                        customUrl: "@my-channel",
                        thumbnails: { default: { url: "https://img/yt.png" } },
                    },
                    statistics: { subscriberCount: "1234" },
                },
            ],
        })
        const res = await resolveChannelsForToken({
            platform: "youtube",
            accessToken: "yt-token",
        })
        expect(res.ok).toBe(true)
        expect(res.channels).toHaveLength(1)
        expect(res.channels[0]).toMatchObject({
            id: "UC123",
            name: "Meu Canal",
            avatarUrl: "https://img/yt.png",
        })
    })

    it("normalizes Twitch users", async () => {
        mockFetchOnce({
            data: [
                {
                    id: "t1",
                    display_name: "Gabriel",
                    login: "gabriel",
                    profile_image_url: "https://img/tw.png",
                },
            ],
        })
        const res = await resolveChannelsForToken({
            platform: "twitch",
            accessToken: "tw-token",
            clientId: "client-1",
        })
        expect(res.ok).toBe(true)
        expect(res.channels[0]).toMatchObject({
            id: "t1",
            name: "Gabriel",
            detail: "@gabriel",
        })
    })

    it("requires a Client-Id for Twitch", async () => {
        const res = await resolveChannelsForToken({
            platform: "twitch",
            accessToken: "tw-token",
        })
        expect(res.ok).toBe(false)
        expect(res.error).toBe("CLIENT_ID_REQUIRED")
    })

    it("normalizes Facebook pages and keeps page token in meta", async () => {
        mockFetchOnce({
            data: [
                {
                    id: "pg1",
                    name: "Minha Página",
                    access_token: "page-token",
                    followers_count: 99,
                    picture: { data: { url: "https://img/fb.png" } },
                },
            ],
        })
        const res = await resolveChannelsForToken({
            platform: "facebook",
            accessToken: "fb-token",
        })
        expect(res.ok).toBe(true)
        expect(res.channels[0].meta).toMatchObject({
            pageAccessToken: "page-token",
        })
    })

    it("only returns Instagram business accounts linked to a page", async () => {
        mockFetchOnce({
            data: [
                {
                    id: "pg1",
                    name: "Page",
                    instagram_business_account: {
                        id: "ig1",
                        username: "gabriel",
                        followers_count: 55,
                    },
                },
                { id: "pg2", name: "No IG page" },
            ],
        })
        const res = await resolveChannelsForToken({
            platform: "instagram",
            accessToken: "ig-token",
        })
        expect(res.ok).toBe(true)
        expect(res.channels).toHaveLength(1)
        expect(res.channels[0]).toMatchObject({ id: "ig1", name: "@gabriel" })
    })

    it("treats missing Instagram business account as empty (ok, no error)", async () => {
        mockFetchOnce({ data: [{ id: "pg1", name: "Page" }] })
        const res = await resolveChannelsForToken({
            platform: "instagram",
            accessToken: "ig-token",
        })
        expect(res.ok).toBe(true)
        expect(res.channels).toEqual([])
    })

    it("maps 401 to INVALID_TOKEN without leaking the token", async () => {
        mockFetchOnce({ error: "bad" }, 401)
        const res = await resolveChannelsForToken({
            platform: "youtube",
            accessToken: "super-secret-token",
        })
        expect(res.ok).toBe(false)
        expect(res.error).toBe("INVALID_TOKEN")
        expect(JSON.stringify(res)).not.toContain("super-secret-token")
    })

    it("maps 429 to RATE_LIMITED", async () => {
        mockFetchOnce({}, 429)
        const res = await resolveChannelsForToken({
            platform: "twitter",
            accessToken: "x-token",
        })
        expect(res.ok).toBe(false)
        expect(res.error).toBe("RATE_LIMITED")
    })

    it("normalizes Kwai handles and tokens", async () => {
        const res = await resolveChannelsForToken({
            platform: "kwai",
            accessToken: "@gabrieltoth",
        })
        expect(res.ok).toBe(true)
        expect(res.channels).toHaveLength(1)
        expect(res.channels[0]).toMatchObject({
            id: "gabrieltoth",
            name: "@gabrieltoth",
        })

        const resUrl = await resolveChannelsForToken({
            platform: "kwai",
            accessToken: "https://kwai.com/@creator123",
        })
        expect(resUrl.ok).toBe(true)
        expect(resUrl.channels[0]).toMatchObject({
            id: "creator123",
            name: "@creator123",
        })
    })

    it("rejects unsupported platforms", async () => {
        const res = await resolveChannelsForToken({
            platform: "invalid-platform" as ByoPlatform,
            accessToken: "token",
        })
        expect(res.ok).toBe(false)
        expect(res.error).toBe("UNSUPPORTED_PLATFORM")
    })

    it("handles network abort as PLATFORM_ERROR", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new Error("network down")
            })
        )
        const res = await resolveChannelsForToken({
            platform: "kick",
            accessToken: "kick-token",
        })
        expect(res.ok).toBe(false)
        expect(res.error).toBe("PLATFORM_ERROR")
    })
})
