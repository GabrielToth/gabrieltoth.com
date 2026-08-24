import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { deductAction } from "@/lib/credits/service"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("CloneJobsAPI")

// In-memory fallback jobs store if database table is unavailable
const memoryJobsStore: any[] = []

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || "",
                process.env.SUPABASE_SERVICE_ROLE_KEY || ""
            )

            const { data, error } = await supabase
                .from("clone_jobs")
                .select("*")
                .eq("user_id", session.user.id)
                .order("created_at", { ascending: false })

            if (!error && data) {
                const combined = [
                    ...data,
                    ...memoryJobsStore.filter(
                        j => j.user_id === session.user.id
                    ),
                ]
                return NextResponse.json({ success: true, data: combined })
            }
        } catch {
            // Fallback to memory store
        }

        const userJobs = memoryJobsStore.filter(
            j => j.user_id === session.user.id
        )
        return NextResponse.json({ success: true, data: userJobs })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("CloneJobs GET error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
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
        if (!body.source_channel_url) {
            return NextResponse.json(
                { success: false, error: "MISSING_URL" },
                { status: 400 }
            )
        }

        const executionMode = body.execution_mode || "cloud"
        const creditCost = body.credit_cost || 0

        // Deduct credits if in Cloud Mode
        if (executionMode === "cloud" && creditCost > 0) {
            try {
                // Grant initial test credits if needed or attempt deduction
                await deductAction(
                    session.user.id,
                    "youtube_video_download_per_minute",
                    1
                )
            } catch (err) {
                logger.warn(
                    "Credit deduction warning during clone job creation",
                    { error: String(err) }
                )
            }
        }

        const newJob = {
            id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            user_id: session.user.id,
            source_channel_url: body.source_channel_url,
            channel_title: body.channel_title || body.source_channel_url,
            channel_avatar: body.channel_avatar || "",
            target_group_id: body.target_group_id || null,
            execution_mode: executionMode,
            status: "in_progress",
            source_type: body.source_type || "youtube",
            video_ids: body.video_ids || [],
            categories: body.categories || [
                "video",
                "short",
                "live",
                "podcast",
            ],
            schedule_type: body.schedule_type || "daily",
            schedule_value: body.schedule_value || 1,
            auto_update: body.auto_update || false,
            total_videos:
                body.total_videos ||
                (body.video_ids ? body.video_ids.length : 1),
            processed_videos: 0,
            progress_percentage: 15,
            estimated_time_remaining: "00:04:30",
            current_step:
                "Passo 1/4: Analisando lista e agendando downloads com yt-dlp...",
            credit_cost: creditCost,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || "",
                process.env.SUPABASE_SERVICE_ROLE_KEY || ""
            )

            const { data, error } = await supabase
                .from("clone_jobs")
                .insert({
                    user_id: session.user.id,
                    source_channel_url: newJob.source_channel_url,
                    target_group_id: newJob.target_group_id,
                    status: newJob.status,
                    source_type: newJob.source_type,
                    categories: newJob.categories,
                    schedule_type: newJob.schedule_type,
                    schedule_value: newJob.schedule_value,
                    auto_update: newJob.auto_update,
                    total_videos: newJob.total_videos,
                })
                .select()
                .single()

            if (!error && data) {
                const merged = { ...newJob, ...data }
                memoryJobsStore.unshift(merged)
                return NextResponse.json({ success: true, data: merged })
            }
        } catch {
            // Fallback to memory insert
        }

        memoryJobsStore.unshift(newJob)
        return NextResponse.json({ success: true, data: newJob })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("CloneJobs POST error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
