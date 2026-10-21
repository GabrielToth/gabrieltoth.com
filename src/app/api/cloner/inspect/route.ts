/**
 * POST /api/cloner/inspect
 * Inspects a YouTube channel URL or handle (e.g. @Maple-Circuit or https://www.youtube.com/@Maple-Circuit)
 * Returns channel metadata and categorized content (Videos, Shorts, Lives, Podcasts) with estimated credit costs.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { isUnofficialScrapingAllowed } from "@/lib/compliance/scraping-gate"
import { createLogger } from "@/lib/logger"
import { deductAction, getBalance } from "@/lib/credits/service"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ClonerInspectAPI")

export interface InspectVideoItem {
    id: string
    title: string
    thumbnailUrl: string
    durationSeconds: number
    durationFormatted: string
    category: "video" | "short" | "live" | "podcast"
    publishedAt: string
    viewCount?: number
}

export interface InspectChannelResult {
    channelId: string
    title: string
    handle: string
    avatarUrl: string
    description: string
    subscriberCountFormatted: string
    totalVideosCount: number
    categories: {
        videos: InspectVideoItem[]
        shorts: InspectVideoItem[]
        lives: InspectVideoItem[]
        podcasts: InspectVideoItem[]
    }
    lookupCreditCost: number
}

function parseDurationSeconds(duration: string): number {
    if (!duration) return 180
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 180
    const hours = parseInt(match[1] || "0", 10)
    const minutes = parseInt(match[2] || "0", 10)
    const seconds = parseInt(match[3] || "0", 10)
    return hours * 3600 + minutes * 60 + seconds
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }
    return `${m}:${s.toString().padStart(2, "0")}`
}

async function resolveYouTubeChannel(
    urlOrHandle: string,
    customApiKey?: string
): Promise<InspectChannelResult> {
    const cleanInput = urlOrHandle.trim()
    let handle = cleanInput

    if (cleanInput.includes("youtube.com/")) {
        const handleMatch = cleanInput.match(/youtube\.com\/@([\w.-]+)/)
        const channelMatch = cleanInput.match(
            /youtube\.com\/channel\/([\w.-]+)/
        )
        if (handleMatch) {
            handle = `@${handleMatch[1]}`
        } else if (channelMatch) {
            handle = channelMatch[1]
        }
    } else if (!handle.startsWith("@") && !handle.startsWith("UC")) {
        handle = `@${handle}`
    }

    const apiKey = customApiKey || process.env.YOUTUBE_API_KEY
    if (apiKey) {
        try {
            const cleanHandle = handle.replace(/^@/, "")
            const searchRes = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${apiKey}`
            )
            if (searchRes.ok) {
                const searchData = await searchRes.json()
                const channelId = searchData.items?.[0]?.id?.channelId
                if (channelId) {
                    const channelRes = await fetch(
                        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`
                    )
                    if (channelRes.ok) {
                        const channelData = await channelRes.json()
                        const ch = channelData.items?.[0]
                        if (ch) {
                            const uploadsPlaylistId =
                                ch.contentDetails?.relatedPlaylists?.uploads ||
                                ""
                            const playlistRes = await fetch(
                                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`
                            )
                            let videoItems: InspectVideoItem[] = []
                            if (playlistRes.ok) {
                                const plData = await playlistRes.json()
                                const videoIds = (plData.items || [])
                                    .map(
                                        (i: {
                                            contentDetails?: {
                                                videoId?: string
                                            }
                                        }) => i.contentDetails?.videoId
                                    )
                                    .filter(Boolean)
                                    .join(",")
                                if (videoIds) {
                                    const vRes = await fetch(
                                        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`
                                    )
                                    if (vRes.ok) {
                                        const vData = await vRes.json()
                                        videoItems = (vData.items || []).map(
                                            (v: {
                                                id: string
                                                contentDetails?: {
                                                    duration?: string
                                                }
                                                snippet?: {
                                                    title?: string
                                                    publishedAt?: string
                                                    liveBroadcastContent?: string
                                                    thumbnails?: {
                                                        medium?: {
                                                            url?: string
                                                        }
                                                        high?: { url?: string }
                                                        default?: {
                                                            url?: string
                                                        }
                                                    }
                                                }
                                                statistics?: {
                                                    viewCount?: string
                                                }
                                            }) => {
                                                const durationSec =
                                                    parseDurationSeconds(
                                                        v.contentDetails
                                                            ?.duration || ""
                                                    )
                                                const title =
                                                    v.snippet?.title || ""
                                                const isShort =
                                                    durationSec <= 60 ||
                                                    title.match(/#shorts/i)
                                                const isLive =
                                                    v.snippet
                                                        ?.liveBroadcastContent ===
                                                        "live" ||
                                                    v.snippet
                                                        ?.liveBroadcastContent ===
                                                        "upcoming"
                                                let cat:
                                                    | "video"
                                                    | "short"
                                                    | "live"
                                                    | "podcast" = "video"
                                                if (isLive) cat = "live"
                                                else if (isShort) cat = "short"

                                                return {
                                                    id: v.id,
                                                    title,
                                                    thumbnailUrl:
                                                        v.snippet?.thumbnails
                                                            ?.medium?.url ||
                                                        v.snippet?.thumbnails
                                                            ?.default?.url ||
                                                        "",
                                                    durationSeconds:
                                                        durationSec,
                                                    durationFormatted:
                                                        formatDuration(
                                                            durationSec
                                                        ),
                                                    category: cat,
                                                    publishedAt:
                                                        v.snippet
                                                            ?.publishedAt || "",
                                                    viewCount: parseInt(
                                                        v.statistics
                                                            ?.viewCount || "0",
                                                        10
                                                    ),
                                                }
                                            }
                                        )
                                    }
                                }
                            }

                            const videos = videoItems.filter(
                                v => v.category === "video"
                            )
                            const shorts = videoItems.filter(
                                v => v.category === "short"
                            )
                            const lives = videoItems.filter(
                                v => v.category === "live"
                            )
                            const podcasts = videoItems.filter(
                                v => v.category === "podcast"
                            )

                            return {
                                channelId: ch.id,
                                title: ch.snippet?.title || handle,
                                handle: `@${cleanHandle}`,
                                avatarUrl:
                                    ch.snippet?.thumbnails?.high?.url ||
                                    ch.snippet?.thumbnails?.medium?.url ||
                                    "",
                                description: ch.snippet?.description || "",
                                subscriberCountFormatted: parseInt(
                                    ch.statistics?.subscriberCount || "0",
                                    10
                                ).toLocaleString(),
                                totalVideosCount: parseInt(
                                    ch.statistics?.videoCount ||
                                        `${videoItems.length}`,
                                    10
                                ),
                                categories: { videos, shorts, lives, podcasts },
                                lookupCreditCost: 10,
                            }
                        }
                    }
                }
            }
        } catch (err) {
            logger.warn(
                "YouTube API inspection failed, using HTML scraper fallback",
                { error: String(err) }
            )
        }
    }

    // Scraping Fallback for Channel Inspection
    //
    // COMPLIANCE: gated behind ALLOW_UNOFFICIAL_SCRAPING (default OFF). Under
    // the public CNPJ entity we do not scrape YouTube HTML. When disabled we
    // return whatever the official API produced (empty categories if it failed)
    // and never bill the user.
    //
    // HONEST METADATA ONLY: if the YouTube API is unavailable, scrape the
    // channel page og:* tags for real title/avatar/description. We do NOT
    // fabricate sample videos — returning mock video lists while charging
    // lookup credits would bill users for fake data (legal/compliance risk).
    // Video categories are returned empty; the UI shows the real API as
    // required to populate them. This fallback costs the user 0 credits.
    try {
        if (!isUnofficialScrapingAllowed()) {
            throw new Error(
                "Scraping disabled (official-API-only mode) — skipping HTML fallback"
            )
        }
        const cleanHandle = handle.replace(/^@/, "")
        const targetUrl = `https://www.youtube.com/@${cleanHandle}`
        const htmlRes = await fetch(targetUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        })

        if (!htmlRes.ok) {
            throw new Error(`Channel page returned HTTP ${htmlRes.status}`)
        }

        const html = await htmlRes.text()
        const titleMatch = html.match(
            /<meta property="og:title" content="([^"]+)">/
        )
        const descMatch = html.match(
            /<meta property="og:description" content="([^"]+)">/
        )
        const imageMatch = html.match(
            /<meta property="og:image" content="([^"]+)">/
        )
        const channelIdMatch = html.match(/"channelId":"(UC[\w-]+)"/)

        // Real channel must be discoverable — otherwise this is not a
        // fallback, it is fabrication.
        if (!titleMatch && !channelIdMatch) {
            throw new Error("Channel not found via page metadata")
        }

        const title = titleMatch ? titleMatch[1] : `@${cleanHandle}`
        const avatarUrl = imageMatch ? imageMatch[1] : ""
        const description = descMatch ? descMatch[1] : ""
        const channelId = channelIdMatch
            ? channelIdMatch[1]
            : `UC_${cleanHandle}`

        return {
            channelId,
            title,
            handle: `@${cleanHandle}`,
            avatarUrl,
            description,
            subscriberCountFormatted: "",
            totalVideosCount: 0,
            // No fabricated videos. UI must communicate that video lists
            // require the YouTube API (own key or working cloud quota).
            categories: {
                videos: [] as InspectVideoItem[],
                shorts: [] as InspectVideoItem[],
                lives: [] as InspectVideoItem[],
                podcasts: [] as InspectVideoItem[],
            },
            // Scraping metadata costs the user nothing.
            lookupCreditCost: 0,
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Inspect fallback failed", err)
        throw new Error("Could not inspect channel")
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const urlOrHandle = body.url || body.handle
        const mode = body.mode || "cloud"
        const customApiKey = body.customApiKey?.trim()

        if (!urlOrHandle) {
            return NextResponse.json(
                { success: false, error: "MISSING_URL" },
                { status: 400 }
            )
        }

        // Operational credit cost for Cloud Mode analysis (if not using own Google API Key).
        // IMPORTANT: we check the balance up-front but only DEDUCT after a
        // successful API-backed inspection. The scraping fallback returns
        // lookupCreditCost = 0 and must never cost the user anything.
        let lookupCost = 0
        if (mode === "cloud" && !customApiKey) {
            lookupCost = 10
            const currentBal = await getBalance(session.user.id)
            if (currentBal.balance < lookupCost) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Créditos insuficientes para análise em Cloud Mode. Necessário: ${lookupCost} Cr.`,
                    },
                    { status: 402 }
                )
            }
        }

        const result = await resolveYouTubeChannel(urlOrHandle, customApiKey)

        if (result.lookupCreditCost > 0) {
            // Real API data returned — charge now (after, not before, success)
            await deductAction(session.user.id, "youtube_metadata", 1)
        }
        result.lookupCreditCost = result.lookupCreditCost || lookupCost
        return NextResponse.json({ success: true, data: result })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Cloner inspect error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
