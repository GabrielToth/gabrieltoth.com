import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("CloneFetchVideosAPI")

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await context.params
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: job } = await supabase
            .from("clone_jobs")
            .select("*")
            .eq("id", id)
            .eq("user_id", session.user.id)
            .single()

        if (!job) {
            return NextResponse.json(
                { success: false, error: "NOT_FOUND" },
                { status: 404 }
            )
        }

        const channelUrl = job.source_channel_url
        let channelId = ""

        const handleMatch = channelUrl.match(/youtube\.com\/@(\w+)/)
        const channelMatch = channelUrl.match(/youtube\.com\/channel\/(\w+)/)
        const urlMatch = channelUrl.match(/youtube\.com\/(\w+)/)

        if (handleMatch) {
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handleMatch[1]}&key=${process.env.YOUTUBE_API_KEY}`
            )
            const data = await res.json()
            channelId = data.items?.[0]?.id?.channelId || ""
        } else if (channelMatch) {
            channelId = channelMatch[1]
        }

        if (!channelId) {
            return NextResponse.json(
                { success: false, error: "Could not resolve channel" },
                { status: 400 }
            )
        }

        const allVideos: any[] = []
        let pageToken = ""

        do {
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video${pageToken ? `&pageToken=${pageToken}` : ""}&key=${process.env.YOUTUBE_API_KEY}`
            )
            const data = await res.json()
            if (data.items) allVideos.push(...data.items)
            pageToken = data.nextPageToken || ""
        } while (pageToken && allVideos.length < 500)

        const videos = allVideos.map((item: any) => {
            const title = item.snippet?.title || ""
            const isShort =
                title.match(/#shorts/i) ||
                (item.snippet?.tags || []).includes("Shorts")
            const isLive =
                item.snippet?.liveBroadcastContent === "upcoming" ||
                item.snippet?.liveBroadcastContent === "live"
            let category: string
            if (isLive) category = "live"
            else if (isShort) category = "short"
            else category = "video"

            return {
                videoId: item.id?.videoId || "",
                title: item.snippet?.title || "",
                description: item.snippet?.description || "",
                thumbnails: item.snippet?.thumbnails || {},
                publishedAt: item.snippet?.publishedAt || "",
                channelTitle: item.snippet?.channelTitle || "",
                category,
            }
        })

        const categories = job.categories || ["video", "short", "live"]
        const filtered = videos.filter((v: any) =>
            categories.includes(v.category)
        )
        const videoIds = filtered.map((v: any) => v.videoId)

        await supabase
            .from("clone_jobs")
            .update({
                video_ids: videoIds,
                total_videos: videoIds.length,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)

        return NextResponse.json({
            success: true,
            data: {
                videos: filtered,
                total: filtered.length,
                channelId,
            },
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("CloneFetchVideos error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
