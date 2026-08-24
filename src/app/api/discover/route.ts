import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("DiscoverAPI")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { searchParams } = new URL(request.url)
        const slug = searchParams.get("slug")
        const targetUserId = searchParams.get("userId")

        let query = supabase
            .from("social_networks")
            .select(
                "user_id, platform, platform_username, display_name, profile_image_url, platform_user_id"
            )
            .eq("status", "connected")

        if (targetUserId) {
            query = query.eq("user_id", targetUserId)
        } else if (slug) {
            const { data: profileMatch } = await supabase
                .from("profiles")
                .select("id")
                .eq("username", slug)
                .single()

            if (profileMatch) {
                query = query.eq("user_id", profileMatch.id)
            } else {
                return NextResponse.json(
                    { success: false, error: "Streamer not found" },
                    { status: 404 }
                )
            }
        }

        const { data: users, error } = await query

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        const liveStatuses: Record<
            string,
            {
                userId: string
                platforms: Record<
                    string,
                    {
                        username: string
                        displayName: string
                        profileImageUrl: string | null
                        isLive: boolean
                        platformUserId: string
                    }
                >
            }
        > = {}

        for (const row of users) {
            const uid = row.user_id
            if (!liveStatuses[uid]) {
                liveStatuses[uid] = { userId: uid, platforms: {} }
            }
            liveStatuses[uid].platforms[row.platform] = {
                username: row.platform_username,
                displayName: row.display_name || row.platform_username,
                profileImageUrl: row.profile_image_url,
                isLive: false,
                platformUserId: row.platform_user_id || "",
            }
        }

        const userIds = Object.keys(liveStatuses)

        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", userIds)

        const profileMap = new Map((profiles || []).map(p => [p.id, p]))

        const result: Array<{
            userId: string
            username: string
            displayName: string
            avatarUrl: string | null
            defaultPlatform: string
            platforms: Array<{
                platform: string
                username: string
                displayName: string
                profileImageUrl: string | null
                isLive: boolean
                embedUrl?: string
            }>
        }> = []

        for (const uid of userIds) {
            const profile = profileMap.get(uid)
            const entry = liveStatuses[uid]
            const platformList = Object.entries(entry.platforms).map(
                ([platform, info]) => ({
                    platform,
                    username: info.username,
                    displayName: info.displayName,
                    profileImageUrl: info.profileImageUrl,
                    isLive: info.isLive,
                    embedUrl:
                        platform === "twitch"
                            ? `https://player.twitch.tv/?channel=${info.username}&parent=gabrieltoth.com&autoplay=true`
                            : platform === "youtube"
                              ? `https://www.youtube.com/embed/live_stream?channel=${info.username}&autoplay=1`
                              : undefined,
                })
            )

            result.push({
                userId: uid,
                username: profile?.username || uid,
                displayName:
                    profile?.display_name ||
                    platformList[0]?.displayName ||
                    uid,
                avatarUrl: profile?.avatar_url || null,
                defaultPlatform: platformList[0]?.platform || "",
                platforms: platformList,
            })
        }

        if (slug || targetUserId) {
            return NextResponse.json({ success: true, data: result[0] || null })
        }

        return NextResponse.json({ success: true, data: result })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Discover API error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
