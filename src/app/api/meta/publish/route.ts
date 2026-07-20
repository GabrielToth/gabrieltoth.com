import { getServerSession } from "@/lib/auth/get-server-session"
import { getAdminClient } from "@/lib/supabase/server"
import { createLogger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("MetaPublishApi")

const ALLOWED_EMAILS = new Set([
    "gabrieltothgoncalves@gmail.com",
    "csgoblackbelt@gmail.com",
])

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabase = getAdminClient()

        const { data: user } = await supabase
            .from("users")
            .select("email")
            .eq("id", session.user.id)
            .single()

        if (!user?.email || !ALLOWED_EMAILS.has(user.email)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const taskId = searchParams.get("id")
        const status = searchParams.get("status")

        let query = supabase
            .from("meta_publish_tasks")
            .select("*")
            .eq("created_by", user.email)
            .order("created_at", { ascending: false })
            .limit(50)

        if (taskId) {
            query = query.eq("id", taskId)
        }
        if (status) {
            query = query.eq("status", status)
        }

        const { data: tasks, error } = await query

        if (error) {
            logger.error("Failed to fetch meta tasks", { error: error.message })
            return NextResponse.json(
                { error: "Failed to fetch tasks" },
                { status: 500 }
            )
        }

        return NextResponse.json({ tasks })
    } catch (error) {
        logger.error("Unexpected error fetching meta tasks", {
            error: error instanceof Error ? error.message : String(error),
        })
        return NextResponse.json(
            { error: "Internal server error" },
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

        const supabase = getAdminClient()

        const { data: user } = await supabase
            .from("users")
            .select("email")
            .eq("id", session.user.id)
            .single()

        if (!user?.email || !ALLOWED_EMAILS.has(user.email)) {
            logger.warn("Unauthorized user attempted to create meta task", {
                userId: session.user.id,
                email: user?.email,
            })
            return NextResponse.json(
                { error: "Forbidden: you are not authorized to use this feature" },
                { status: 403 }
            )
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

        const taskType = body.taskType as string
        if (!taskType || !["video", "post", "story"].includes(taskType)) {
            return NextResponse.json(
                { error: "taskType must be 'video', 'post', or 'story'" },
                { status: 400 }
            )
        }

        const videoSource = body.videoSource as string
        if (videoSource && !["smb", "upload", "local"].includes(videoSource)) {
            return NextResponse.json(
                { error: "videoSource must be 'smb', 'upload', or 'local'" },
                { status: 400 }
            )
        }

        if (videoSource === "smb" && !body.videoPath) {
            return NextResponse.json(
                { error: "videoPath is required when videoSource is 'smb'" },
                { status: 400 }
            )
        }

        if (taskType === "video" && !videoSource) {
            return NextResponse.json(
                { error: "videoSource is required for video tasks" },
                { status: 400 }
            )
        }

        const payload = body.payload as Record<string, unknown> | undefined
        if (!payload || typeof payload !== "object") {
            return NextResponse.json(
                { error: "payload must be a non-empty object" },
                { status: 400 }
            )
        }

        const platforms = payload.platforms as string[] | undefined
        if (!Array.isArray(platforms) || platforms.length === 0) {
            return NextResponse.json(
                { error: "payload.platforms must be a non-empty array" },
                { status: 400 }
            )
        }

        for (const p of platforms) {
            if (!["facebook", "instagram"].includes(p)) {
                return NextResponse.json(
                    {
                        error: `Invalid platform '${p}' for meta publish. Only facebook and instagram are supported.`,
                    },
                    { status: 400 }
                )
            }
        }

        const { data: task, error } = await supabase
            .from("meta_publish_tasks")
            .insert({
                created_by: user.email,
                task_type: taskType,
                video_source: videoSource || null,
                video_path: body.videoPath || null,
                video_original_name: body.videoOriginalName || null,
                payload,
                status: videoSource === "upload" ? "uploading" : "pending",
            })
            .select()
            .single()

        if (error) {
            logger.error("Failed to create meta publish task", {
                error: error.message,
            })
            return NextResponse.json(
                { error: "Failed to create publish task" },
                { status: 500 }
            )
        }

        logger.info("Meta publish task created", {
            taskId: task.id,
            createdBy: user.email,
            taskType,
            videoSource,
        })

        return NextResponse.json({ task }, { status: 201 })
    } catch (error) {
        logger.error("Unexpected error in meta publish API", {
            error: error instanceof Error ? error.message : String(error),
        })
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
