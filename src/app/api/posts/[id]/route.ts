import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getPublicationQueue } from "@/lib/queue/publication-queue"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("PostsIdApi")

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

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
            "status",
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

        const queue = getPublicationQueue()
        const existing = await queue.getScheduledPost(session.user.id, id)
        if (!existing) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            )
        }

        const isDraft = existing.status === "draft"
        if (!isDraft && existing.status !== "pending") {
            return NextResponse.json(
                { error: "Only pending or draft posts can be updated" },
                { status: 400 }
            )
        }

        const content = body.content as string | undefined
        const scheduledTime = body.scheduledTime as number | undefined
        const newStatus = body.status as string | undefined
        const platforms = body.platforms as string[] | undefined

        if (content !== undefined) {
            if (typeof content !== "string") {
                return NextResponse.json(
                    { error: "content must be a string" },
                    { status: 400 }
                )
            }
            if (content.length > 100000) {
                return NextResponse.json(
                    { error: "content exceeds maximum length" },
                    { status: 400 }
                )
            }
        }

        if (scheduledTime !== undefined) {
            if (typeof scheduledTime !== "number") {
                return NextResponse.json(
                    { error: "scheduledTime must be a number" },
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
        }

        if (newStatus !== undefined) {
            const validStatuses = ["draft", "pending"]
            if (!validStatuses.includes(newStatus)) {
                return NextResponse.json(
                    { error: "status must be 'draft' or 'pending'" },
                    { status: 400 }
                )
            }
        }

        if (platforms !== undefined) {
            if (!Array.isArray(platforms)) {
                return NextResponse.json(
                    { error: "platforms must be an array" },
                    { status: 400 }
                )
            }
        }

        logger.info("Updating scheduled post", {
            userId: session.user.id,
            postId: id,
            updates: {
                content: !!content,
                scheduledTime: !!scheduledTime,
                newStatus: !!newStatus,
            },
        })

        // Update via Supabase directly (PublicationQueue doesn't have an update method)
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const updates: Record<string, unknown> = {
            updated_at: new Date(),
        }
        if (content !== undefined) updates.content = content
        if (scheduledTime !== undefined)
            updates.scheduled_time = new Date(scheduledTime)
        if (newStatus !== undefined) updates.status = newStatus

        const { error: updateError } = await supabase
            .from("scheduled_posts")
            .update(updates)
            .eq("id", id)
            .eq("user_id", session.user.id)

        if (updateError) {
            throw new Error(`Database error: ${updateError.message}`)
        }

        const updated = await queue.getScheduledPost(session.user.id, id)

        return NextResponse.json({ post: updated })
    } catch (error) {
        logger.error("Failed to update scheduled post", {
            error: error instanceof Error ? error.message : String(error),
        })
        return NextResponse.json(
            { error: "Failed to update scheduled post" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        const queue = getPublicationQueue()
        const existing = await queue.getScheduledPost(session.user.id, id)
        if (!existing) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            )
        }

        await queue.deleteScheduledPost(session.user.id, id)

        logger.info("Scheduled post deleted", {
            userId: session.user.id,
            postId: id,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        logger.error("Failed to delete scheduled post", {
            error: error instanceof Error ? error.message : String(error),
        })
        return NextResponse.json(
            { error: "Failed to delete scheduled post" },
            { status: 500 }
        )
    }
}
