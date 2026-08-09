import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("CloneJobByIdAPI")

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await context.params
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const body = await request.json()
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (body.video_ids) update.video_ids = body.video_ids
        if (body.categories) update.categories = body.categories
        if (body.schedule_type) update.schedule_type = body.schedule_type
        if (body.schedule_value !== undefined) update.schedule_value = body.schedule_value
        if (body.status) update.status = body.status
        if (body.auto_update !== undefined) update.auto_update = body.auto_update
        if (body.total_videos !== undefined) update.total_videos = body.total_videos

        const { error } = await supabase
            .from("clone_jobs")
            .update(update)
            .eq("id", id)
            .eq("user_id", session.user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("CloneJob PATCH error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await context.params
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error } = await supabase
            .from("clone_jobs")
            .delete()
            .eq("id", id)
            .eq("user_id", session.user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("CloneJob DELETE error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
