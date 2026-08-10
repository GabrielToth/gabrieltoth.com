import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("CloneJobsAPI")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data, error } = await supabase
            .from("clone_jobs")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("CloneJobs GET error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const body = await request.json()
        if (!body.source_channel_url) {
            return NextResponse.json({ success: false, error: "MISSING_URL" }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data, error } = await supabase
            .from("clone_jobs")
            .insert({
                user_id: session.user.id,
                source_channel_url: body.source_channel_url,
                target_platforms: body.target_platforms || ["tiktok"],
                target_group_id: body.target_group_id || null,
                categories: body.categories || ["video", "short", "live"],
                schedule_type: body.schedule_type || "daily",
                schedule_value: body.schedule_value || 1,
                status: "draft",
                auto_update: body.auto_update || false,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("CloneJobs POST error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
