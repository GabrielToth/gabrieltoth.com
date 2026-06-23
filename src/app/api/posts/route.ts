import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getPublicationQueue } from "@/lib/queue/publication-queue"
import type { SocialPlatform } from "@/lib/networks"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("PostsApi")

const VALID_PLATFORMS: SocialPlatform[] = [
    "youtube",
    "facebook",
    "instagram",
    "twitter",
    "linkedin",
]

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const from = searchParams.get("from")
        const to = searchParams.get("to")

        const queue = getPublicationQueue()
        const posts = await queue.getUserScheduledPosts(session.user.id)

        let filtered = posts
        if (from) {
            const fromTs = new Date(from).getTime()
            filtered = filtered.filter(p => p.scheduledTime >= fromTs)
        }
        if (to) {
            const toTs = new Date(to).getTime()
            filtered = filtered.filter(p => p.scheduledTime <= toTs)
        }

        return NextResponse.json({ posts: filtered })
    } catch (error) {
        logger.error("Failed to fetch posts", {
            error: error instanceof Error ? error.message : String(error),
        })
        return NextResponse.json(
            { error: "Failed to fetch posts" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let body: Record<string, unknown>
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            )
        }

        const allowedKeys = new Set([
            "content",
            "scheduledTime",
            "platforms",
            "mediaType",
        ])
        for (const key of Object.keys(body)) {
            if (!allowedKeys.has(key)) {
                return NextResponse.json(
                    { error: `Unexpected field: ${key}` },
                    { status: 400 }
                )
            }
        }

        const content = body.content as string | undefined
        const scheduledTime = body.scheduledTime as number | undefined
        const platforms = body.platforms as string[] | undefined
        const mediaType = (body.mediaType as string) || "text"

        if (!content || typeof content !== "string" || !content.trim()) {
            return NextResponse.json(
                { error: "content is required and must be a non-empty string" },
                { status: 400 }
            )
        }

        if (content.length > 100000) {
            return NextResponse.json(
                {
                    error: "content exceeds maximum length of 100000 characters",
                },
                { status: 400 }
            )
        }

        if (!scheduledTime || typeof scheduledTime !== "number") {
            return NextResponse.json(
                { error: "scheduledTime is required and must be a number" },
                { status: 400 }
            )
        }

        if (scheduledTime < Date.now()) {
            return NextResponse.json(
                { error: "scheduledTime must be in the future" },
                { status: 400 }
            )
        }

        if (scheduledTime > Date.now() + 365 * 24 * 60 * 60 * 1000) {
            return NextResponse.json(
                {
                    error: "scheduledTime cannot be more than 365 days in the future",
                },
                { status: 400 }
            )
        }

        if (!Array.isArray(platforms) || platforms.length === 0) {
            return NextResponse.json(
                {
                    error: "platforms is required and must be a non-empty array",
                },
                { status: 400 }
            )
        }

        for (const p of platforms) {
            if (!VALID_PLATFORMS.includes(p as SocialPlatform)) {
                return NextResponse.json(
                    {
                        error: `Invalid platform: ${p}. Valid platforms: ${VALID_PLATFORMS.join(", ")}`,
                    },
                    { status: 400 }
                )
            }
        }

        if (mediaType !== "text" && mediaType !== "video") {
            return NextResponse.json(
                { error: "mediaType must be 'text' or 'video'" },
                { status: 400 }
            )
        }

        logger.info("Creating scheduled post", {
            userId: session.user.id,
            platforms,
            scheduledTime,
            mediaType,
        })

        const queue = getPublicationQueue()
        const post = await queue.createScheduledPost(
            session.user.id,
            content,
            scheduledTime,
            platforms as SocialPlatform[],
            mediaType as "text" | "video"
        )

        return NextResponse.json({ post }, { status: 201 })
    } catch (error) {
        logger.error("Failed to create scheduled post", {
            error: error instanceof Error ? error.message : String(error),
        })
        return NextResponse.json(
            { error: "Failed to create scheduled post" },
            { status: 500 }
        )
    }
}
