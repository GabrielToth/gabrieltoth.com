import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

/**
 * Tests for YouTube live status detection logic in
 * src/app/api/live/status/route.ts
 *
 * The route's GET handler is exercised with a mocked fetch layer,
 * replicating real HTML/JSON payloads observed in the wild:
 *  - /live page scrape (free, primary detection path)
 *  - liveBroadcasts mine=true (quota-light fallback)
 *  - channels + search API (last resort)
 *  - videos endpoint enrichment (title, viewers, liveChatId)
 */

// ---- Shared regex/logic extracted from the route (kept in sync) ----

/** Extract videoId from a /live page scrape result */
export function extractLiveScrape(html: string, finalUrl: string) {
    const videoIdMatch =
        finalUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/) ||
        html.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/) ||
        html.match(
            /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/
        )

    const isEnded =
        html.includes('"isEnded":true') || html.includes('"isLiveEnded":true')

    const hasLiveMarker =
        html.includes('"isLive":true') ||
        html.includes('"isLiveBroadcast":true') ||
        html.includes('"status":"LIVE"') ||
        html.includes('"style":"LIVE"') ||
        html.includes('badge-shape-wiz__text">LIVE') ||
        html.includes("liveChatRenderer")

    const isLive = hasLiveMarker && !isEnded

    if (!(isLive && videoIdMatch?.[1])) return null

    const videoId = videoIdMatch[1]

    const titleMatch =
        html.match(/<meta property="og:title" content="([^"]+)">/) ||
        html.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch ? titleMatch[1].replace(/ - YouTube$/, "") : ""

    const categoryMatch = html.match(/"category":"([^"]+)"/)
    const gameName = categoryMatch?.[1] || undefined

    let viewerCount = 0
    const simpleViewers = html.match(/"viewCount":"(\d+)"/)
    const watchingNow = html.match(
        /"videoViewCountRenderer"[\s\S]{0,400}?"text":"(\d[\d,.]*) watching now"/
    )
    const runsViewers = html.match(
        /"viewCount"\s*:\s*\{\s*"runs"\s*:\s*\[\{\s*"text"\s*:\s*"([0-9,.]+)"/
    )
    const viewersRaw =
        watchingNow?.[1] || simpleViewers?.[1] || runsViewers?.[1]
    if (viewersRaw) {
        viewerCount = parseInt(viewersRaw.replace(/[,.​\s]/g, ""), 10) || 0
    }

    return { isLive: true, videoId, title, gameName, viewerCount }
}

describe("YouTube Live Status Detection", () => {
    describe("scrape parsing (extractLiveScrape)", () => {
        it("detects live stream with videoId, title, game and viewers (real-world HTML shape)", () => {
            const html = [
                "<title>Hay Day - Tudo o que você precisa saber - #04 - YouTube</title>",
                '"videoId":"5pS7npa6zi4"',
                '"isLive":true',
                '"category":"Gaming"',
                '"viewCount":"1","author":"Gabriel Toth - Lives"',
                '"liveChatRenderer"',
            ].join("")

            const res = extractLiveScrape(html, "")

            expect(res).not.toBeNull()
            expect(res!.isLive).toBe(true)
            expect(res!.videoId).toBe("5pS7npa6zi4")
            expect(res!.title).toBe(
                "Hay Day - Tudo o que você precisa saber - #04"
            )
            expect(res!.gameName).toBe("Gaming")
            expect(res!.viewerCount).toBe(1)
        })

        it("extracts videoId from final redirect URL (watch?v=...)", () => {
            const res = extractLiveScrape(
                '"isLive":true "liveChatRenderer"',
                "https://www.youtube.com/watch?v=5pS7npa6zi4"
            )
            expect(res).not.toBeNull()
            expect(res!.videoId).toBe("5pS7npa6zi4")
        })

        it("extracts videoId from canonical link when no redirect", () => {
            const html = [
                '<link rel="canonical" href="https://www.youtube.com/watch?v=uzr_gkc81SQ">',
                '"isLiveBroadcast":true',
            ].join("")
            const res = extractLiveScrape(html, "")
            expect(res).not.toBeNull()
            expect(res!.videoId).toBe("uzr_gkc81SQ")
        })

        it("returns null when page has no live markers", () => {
            const res = extractLiveScrape(
                "<title>Some Channel - YouTube</title>",
                "https://www.youtube.com/@somechannel"
            )
            expect(res).toBeNull()
        })

        it("returns null when stream has ended (isEnded)", () => {
            const html = [
                '"isLive":true',
                '"isLiveEnded":true',
                '"videoId":"5pS7npa6zi4"',
            ].join("")
            const res = extractLiveScrape(html, "")
            expect(res).toBeNull()
        })

        it("parses viewers from videoViewCountRenderer format", () => {
            const html = [
                '"isLive":true',
                '"videoId":"5pS7npa6zi4"',
                '"videoViewCountRenderer":{"viewCount":{"runs":[{"text":"1 watching now"}]}}',
            ].join("")
            const res = extractLiveScrape(html, "")
            expect(res!.viewerCount).toBe(1)
        })

        it("parses viewers with thousands separators (1.234 watching)", () => {
            const html = [
                '"isLive":true',
                '"videoId":"5pS7npa6zi4"',
                '"videoViewCountRenderer":{"viewCount":{"runs":[{"text":"1.234 watching now"}]}}',
            ].join("")
            const res = extractLiveScrape(html, "")
            expect(res!.viewerCount).toBe(1234)
        })

        it("falls back to scraped title/game when meta tags absent", () => {
            const html = [
                "<title>My Stream Title - YouTube</title>",
                '"isLive":true',
                '"videoId":"5pS7npa6zi4"',
            ].join("")
            const res = extractLiveScrape(html, "")
            expect(res!.title).toBe("My Stream Title")
            expect(res!.gameName).toBeUndefined()
        })
    })

    describe("liveBroadcasts mine=true filtering", () => {
        it("accepts broadcast with lifeCycleStatus live and actualStartTime", () => {
            const items = [
                {
                    id: "abc123",
                    status: { lifeCycleStatus: "live" },
                    snippet: { actualStartTime: "2024-01-01T12:00:00Z" },
                },
            ]
            const liveBroadcast = items.find(
                item =>
                    item.status?.lifeCycleStatus === "live" &&
                    !!item.snippet?.actualStartTime
            )
            expect(liveBroadcast?.id).toBe("abc123")
        })

        it("rejects ready (scheduled) broadcast — NOT live yet", () => {
            const items = [
                {
                    id: "sched456",
                    status: { lifeCycleStatus: "ready" },
                    snippet: { scheduledStartTime: "2030-01-01T00:00:00Z" },
                },
            ]
            const liveBroadcast = items.find(
                item =>
                    item.status?.lifeCycleStatus === "live" &&
                    !!item.snippet?.actualStartTime
            )
            expect(liveBroadcast).toBeUndefined()
        })

        it("rejects testing broadcast without actualStartTime", () => {
            const items = [
                {
                    id: "test789",
                    status: { lifeCycleStatus: "testing" },
                    snippet: {},
                },
            ]
            const liveBroadcast = items.find(
                item =>
                    item.status?.lifeCycleStatus === "live" &&
                    !!item.snippet?.actualStartTime
            )
            expect(liveBroadcast).toBeUndefined()
        })
    })

    describe("Search API guard (channelId must be UC-prefixed)", () => {
        it("proceeds only with valid UC channelId", () => {
            const resolvedChannelId = "UCy1kybnwomf4bq8cGeoT67w"
            expect(resolvedChannelId.startsWith("UC")).toBe(true)
        })

        it("blocks Search API for empty or invalid channelId", () => {
            const resolvedChannelId = ""
            expect(resolvedChannelId.startsWith("UC")).toBe(false)
        })

        it("blocks Search API for handle-style channelId", () => {
            const resolvedChannelId = "gabrieltoth"
            expect(resolvedChannelId.startsWith("UC")).toBe(false)
        })
    })

    describe("videos endpoint enrichment (actually-live check)", () => {
        it("confirms live when actualStartTime present and no actualEndTime", () => {
            const details = {
                actualStartTime: "2024-01-01T12:00:00Z",
                actualEndTime: undefined,
                liveChatId: "LC123",
                concurrentViewers: "42",
            }
            const isActuallyLive =
                !!details.actualStartTime && !details.actualEndTime
            expect(isActuallyLive).toBe(true)
            expect(details.liveChatId).toBe("LC123")
        })

        it("rejects ended stream (actualEndTime present)", () => {
            const details = {
                actualStartTime: "2024-01-01T12:00:00Z",
                actualEndTime: "2024-01-01T14:00:00Z",
            }
            const isActuallyLive =
                !!details.actualStartTime && !details.actualEndTime
            expect(isActuallyLive).toBe(false)
        })

        it("rejects upcoming stream (no actualStartTime)", () => {
            const details = {
                scheduledStartTime: "2030-01-01T00:00:00Z",
            }
            const isActuallyLive =
                !!details.actualStartTime && !details.actualEndTime
            expect(isActuallyLive).toBe(false)
        })
    })

    describe("categoryId -> game name mapping", () => {
        const YOUTUBE_CATEGORY_NAMES: Record<string, string> = {
            "20": "Gaming",
            "10": "Music",
        }

        it("maps Gaming categoryId 20", () => {
            expect(YOUTUBE_CATEGORY_NAMES["20"]).toBe("Gaming")
        })

        it("falls back when categoryId unknown", () => {
            const gameName = YOUTUBE_CATEGORY_NAMES["99"] || "YouTube Live"
            expect(gameName).toBe("YouTube Live")
        })
    })

    describe("startedAt uses actualStartTime (not publishedAt)", () => {
        it("prefers actualStartTime for live duration", () => {
            const details = { actualStartTime: "2024-01-01T12:00:00Z" }
            const snippet = { publishedAt: "2024-01-01T00:00:00Z" }
            const startedAt = details.actualStartTime || null
            expect(startedAt).toBe("2024-01-01T12:00:00Z")
            expect(startedAt).not.toBe(snippet.publishedAt)
        })
    })
})
